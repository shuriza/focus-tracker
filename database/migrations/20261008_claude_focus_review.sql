-- Fokus Kerja v1.4.0: Claude Focus Review dengan persetujuan tindakan.
-- Jalankan migrasi ini terlebih dahulu, lalu deploy kode aplikasi.
BEGIN;

CREATE TABLE IF NOT EXISTS public.focus_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    range_days INTEGER NOT NULL CHECK (range_days IN (7, 14, 30)),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    model TEXT NOT NULL,
    summary TEXT NOT NULL CHECK (length(trim(summary)) > 0),
    patterns JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(patterns) = 'array'),
    input_snapshot JSONB NOT NULL CHECK (jsonb_typeof(input_snapshot) = 'object'),
    input_tokens INTEGER NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
    output_tokens INTEGER NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
    consented_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT focus_reviews_period_check CHECK (period_start <= period_end),
    CONSTRAINT focus_reviews_id_user_unique UNIQUE (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.focus_review_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('set_domain_limit', 'set_daily_budget')),
    domain TEXT,
    proposed_minutes INTEGER NOT NULL,
    category TEXT,
    rationale TEXT NOT NULL CHECK (length(trim(rationale)) > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT focus_review_actions_review_user_fk
        FOREIGN KEY (review_id, user_id)
        REFERENCES public.focus_reviews(id, user_id)
        ON DELETE CASCADE,
    CONSTRAINT focus_review_actions_payload_check CHECK (
        (
            action_type = 'set_domain_limit'
            AND domain IS NOT NULL
            AND proposed_minutes BETWEEN 1 AND 1440
        )
        OR
        (
            action_type = 'set_daily_budget'
            AND domain IS NULL
            AND proposed_minutes BETWEEN 15 AND 1440
        )
    )
);

CREATE INDEX IF NOT EXISTS focus_reviews_user_created_idx
    ON public.focus_reviews (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS focus_review_actions_review_idx
    ON public.focus_review_actions (review_id, created_at);
CREATE INDEX IF NOT EXISTS focus_review_actions_user_status_idx
    ON public.focus_review_actions (user_id, status);

ALTER TABLE public.focus_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_review_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own focus reviews" ON public.focus_reviews;
DROP POLICY IF EXISTS "Users can insert their own focus reviews" ON public.focus_reviews;
DROP POLICY IF EXISTS "Users can delete their own focus reviews" ON public.focus_reviews;
DROP POLICY IF EXISTS "Users can view their own focus review actions" ON public.focus_review_actions;
DROP POLICY IF EXISTS "Users can insert their own focus review actions" ON public.focus_review_actions;
DROP POLICY IF EXISTS "Users can update their own focus review actions" ON public.focus_review_actions;
DROP POLICY IF EXISTS "Users can delete their own focus review actions" ON public.focus_review_actions;

CREATE POLICY "Users can view their own focus reviews"
    ON public.focus_reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus reviews"
    ON public.focus_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus reviews"
    ON public.focus_reviews FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own focus review actions"
    ON public.focus_review_actions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus review actions"
    ON public.focus_review_actions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus review actions"
    ON public.focus_review_actions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus review actions"
    ON public.focus_review_actions FOR DELETE
    USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.focus_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_review_actions TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_focus_review_action(p_action_id UUID)
RETURNS public.focus_review_actions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    action_row public.focus_review_actions%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
    END IF;

    SELECT *
    INTO action_row
    FROM public.focus_review_actions
    WHERE id = p_action_id
      AND user_id = auth.uid()
      AND status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Focus review action is not pending or does not exist'
            USING ERRCODE = 'P0001';
    END IF;

    IF action_row.action_type = 'set_domain_limit' THEN
        INSERT INTO public.rules (
            user_id,
            domain,
            time_limit_minutes,
            category,
            active,
            active_start_hour,
            active_end_hour
        )
        VALUES (
            action_row.user_id,
            action_row.domain,
            action_row.proposed_minutes,
            COALESCE(action_row.category, 'lainnya'),
            TRUE,
            NULL,
            NULL
        )
        ON CONFLICT (user_id, domain)
        DO UPDATE SET
            time_limit_minutes = EXCLUDED.time_limit_minutes,
            active = TRUE;
    ELSIF action_row.action_type = 'set_daily_budget' THEN
        INSERT INTO public.focus_settings (
            user_id,
            daily_budget_minutes,
            updated_at
        )
        VALUES (
            action_row.user_id,
            action_row.proposed_minutes,
            timezone('utc'::text, now())
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
            daily_budget_minutes = EXCLUDED.daily_budget_minutes,
            updated_at = EXCLUDED.updated_at;
    ELSE
        RAISE EXCEPTION 'Unsupported focus review action';
    END IF;

    UPDATE public.focus_review_actions
    SET status = 'applied',
        decided_at = timezone('utc'::text, now())
    WHERE id = action_row.id
    RETURNING * INTO action_row;

    RETURN action_row;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_focus_review_action(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_focus_review_action(UUID) TO authenticated;

COMMIT;
