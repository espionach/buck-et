CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('general','bug','privacy')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (
  length(email) BETWEEN 3 AND 255
  AND length(message) BETWEEN 1 AND 5000
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Admins view support messages"
ON public.support_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins delete support messages"
ON public.support_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));