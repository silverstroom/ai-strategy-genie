
CREATE TABLE public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  openai_api_key TEXT,
  google_ai_api_key TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Anyone can upsert settings (no auth in this app)
CREATE POLICY "Anyone can update app settings"
  ON public.app_settings FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can insert app settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (true);

-- Insert default row
INSERT INTO public.app_settings (id) VALUES ('default');
