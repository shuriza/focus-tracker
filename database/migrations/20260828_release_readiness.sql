BEGIN;

ALTER TABLE public.rules
    ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.extension_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    state TEXT NOT NULL DEFAULT 'connected' CHECK (state IN ('connected', 'error')),
    extension_version TEXT NOT NULL DEFAULT 'unknown',
    manifest_version TEXT NOT NULL DEFAULT '3',
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    pending_sync_count INTEGER NOT NULL DEFAULT 0 CHECK (pending_sync_count >= 0),
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS extension_status_user_id_idx ON public.extension_status (user_id);

ALTER TABLE public.extension_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own extension status" ON public.extension_status;
DROP POLICY IF EXISTS "Users can insert their own extension status" ON public.extension_status;
DROP POLICY IF EXISTS "Users can update their own extension status" ON public.extension_status;
DROP POLICY IF EXISTS "Users can delete their own extension status" ON public.extension_status;

CREATE POLICY "Users can view their own extension status"
    ON public.extension_status FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extension status"
    ON public.extension_status FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extension status"
    ON public.extension_status FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extension status"
    ON public.extension_status FOR DELETE
    USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.extension_status TO authenticated;

COMMIT;
