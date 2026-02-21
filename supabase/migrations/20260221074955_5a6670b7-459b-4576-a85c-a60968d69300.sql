
-- Table for shared file links (public access by share token)
CREATE TABLE public.shared_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  recipient_email TEXT NOT NULL,
  sender_user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create shares for their own files
CREATE POLICY "Users can insert own shares"
  ON public.shared_files FOR INSERT
  WITH CHECK (auth.uid() = sender_user_id);

-- Users can view their own shares
CREATE POLICY "Users can view own shares"
  ON public.shared_files FOR SELECT
  USING (auth.uid() = sender_user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete own shares"
  ON public.shared_files FOR DELETE
  USING (auth.uid() = sender_user_id);
