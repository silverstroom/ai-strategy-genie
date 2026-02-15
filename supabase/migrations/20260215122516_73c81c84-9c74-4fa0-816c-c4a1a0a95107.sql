
-- Create projects table to save generated strategies
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_sector TEXT NOT NULL,
  client_location TEXT,
  client_description TEXT,
  client_website TEXT,
  client_social_links TEXT,
  client_facebook TEXT,
  client_instagram TEXT,
  client_linkedin TEXT,
  client_youtube TEXT,
  client_tiktok TEXT,
  strategy_type TEXT NOT NULL DEFAULT 'social' CHECK (strategy_type IN ('social', 'seo', 'both')),
  category TEXT NOT NULL DEFAULT 'social' CHECK (category IN ('social', 'sito')),
  logo_url TEXT,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Since auth is simple (hardcoded user), allow all operations
CREATE POLICY "Anyone can read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Anyone can insert projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete projects" ON public.projects FOR DELETE USING (true);

-- Update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
