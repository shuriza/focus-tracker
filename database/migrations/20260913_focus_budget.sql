-- Fokus Kerja v1.3.0: tambahkan anggaran fokus harian.
-- Jalankan migrasi ini terlebih dahulu, lalu deploy kode aplikasi.
BEGIN;

CREATE TABLE IF NOT EXISTS public.focus_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_budget_minutes INTEGER NOT NULL CHECK (daily_budget_minutes BETWEEN 15 AND 1440),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS focus_settings_user_id_idx ON public.focus_settings (user_id);

ALTER TABLE public.focus_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own focus settings" ON public.focus_settings;
DROP POLICY IF EXISTS "Users can insert their own focus settings" ON public.focus_settings;
DROP POLICY IF EXISTS "Users can update their own focus settings" ON public.focus_settings;
DROP POLICY IF EXISTS "Users can delete their own focus settings" ON public.focus_settings;

CREATE POLICY "Users can view their own focus settings"
    ON public.focus_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus settings"
    ON public.focus_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus settings"
    ON public.focus_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus settings"
    ON public.focus_settings FOR DELETE
    USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_settings TO authenticated;

COMMIT;
