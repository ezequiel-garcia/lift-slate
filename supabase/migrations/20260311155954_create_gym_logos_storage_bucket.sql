-- Create public storage bucket for gym logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-logos', 'gym-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload gym logos
CREATE POLICY "Authenticated users can upload gym logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gym-logos');

-- Allow public read access to gym logos
CREATE POLICY "Public read access for gym logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gym-logos');
