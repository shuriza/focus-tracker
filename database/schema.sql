-- Focus Tracker — Supabase schema
-- Run in the Supabase SQL editor (or supabase db push).

CREATE TABLE IF NOT EXISTS public.rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    time_limit_minutes INTEGER NOT NULL CHECK (time_limit_minutes > 0),
    category TEXT DEFAULT 'lainnya',
    active_start_hour INTEGER,
    active_end_hour INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, domain)
);

CREATE TABLE IF NOT EXISTS public.daily_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, domain, date)
);

CREATE INDEX IF NOT EXISTS rules_user_id_idx ON public.rules (user_id);
CREATE INDEX IF NOT EXISTS daily_analytics_user_date_idx ON public.daily_analytics (user_id, date DESC);
CREATE INDEX IF NOT EXISTS daily_analytics_user_domain_idx ON public.daily_analytics (user_id, domain);

ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rules" ON public.rules;
DROP POLICY IF EXISTS "Users can insert their own rules" ON public.rules;
DROP POLICY IF EXISTS "Users can update their own rules" ON public.rules;
DROP POLICY IF EXISTS "Users can delete their own rules" ON public.rules;
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.daily_analytics;
DROP POLICY IF EXISTS "Users can insert/update their own analytics" ON public.daily_analytics;
DROP POLICY IF EXISTS "Users can update their own analytics" ON public.daily_analytics;

CREATE POLICY "Users can view their own rules"
    ON public.rules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rules"
    ON public.rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rules"
    ON public.rules FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rules"
    ON public.rules FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics"
    ON public.daily_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
    ON public.daily_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
    ON public.daily_analytics FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_daily_time(
    p_domain TEXT,
    p_seconds INTEGER,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_total INTEGER;
    uid UUID := auth.uid();
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_domain IS NULL OR length(trim(p_domain)) = 0 THEN
        RAISE EXCEPTION 'Domain is required';
    END IF;

    IF p_seconds IS NULL OR p_seconds <= 0 THEN
        RAISE EXCEPTION 'Seconds must be positive';
    END IF;

    INSERT INTO public.daily_analytics (user_id, domain, date, time_spent_seconds, updated_at)
    VALUES (uid, lower(trim(p_domain)), p_date, p_seconds, timezone('utc'::text, now()))
    ON CONFLICT (user_id, domain, date)
    DO UPDATE SET
        time_spent_seconds = public.daily_analytics.time_spent_seconds + EXCLUDED.time_spent_seconds,
        updated_at = timezone('utc'::text, now())
    RETURNING time_spent_seconds INTO new_total;

    RETURN new_total;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.daily_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_daily_time(TEXT, INTEGER, DATE) TO authenticated;

-- v2 migration for existing databases (idempotent)
ALTER TABLE public.rules ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'lainnya';
ALTER TABLE public.rules ADD COLUMN IF NOT EXISTS active_start_hour INTEGER;
ALTER TABLE public.rules ADD COLUMN IF NOT EXISTS active_end_hour INTEGER;
