CREATE TABLE public.message_hints (
  message_id uuid PRIMARY KEY REFERENCES public.message_sender_links(message_id) ON DELETE CASCADE,
  gender text,
  region text,
  consented_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hint_gender_allowed CHECK (gender IS NULL OR gender IN ('man','woman','nonbinary')),
  CONSTRAINT hint_region_allowed CHECK (region IS NULL OR region IN ('antilles','europe','north_america','south_america','africa','asia','oceania')),
  CONSTRAINT hint_not_empty CHECK (gender IS NOT NULL OR region IS NOT NULL)
);
GRANT ALL ON public.message_hints TO service_role;
REVOKE ALL ON public.message_hints FROM PUBLIC, anon, authenticated;
ALTER TABLE public.message_hints ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.send_message_with_hints(_username text, _body text, _allow_reveal boolean DEFAULT false, _hint_consent boolean DEFAULT false, _hint_gender text DEFAULT NULL, _hint_region text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF (_hint_gender IS NOT NULL OR _hint_region IS NOT NULL) AND NOT coalesce(_hint_consent,false) THEN RAISE EXCEPTION 'HINT_CONSENT_REQUIRED'; END IF;
  IF _hint_gender IS NOT NULL AND _hint_gender NOT IN ('man','woman','nonbinary') THEN RAISE EXCEPTION 'BAD_HINT'; END IF;
  IF _hint_region IS NOT NULL AND _hint_region NOT IN ('antilles','europe','north_america','south_america','africa','asia','oceania') THEN RAISE EXCEPTION 'BAD_HINT'; END IF;
  _id := public.send_message(_username, _body, _allow_reveal);
  IF coalesce(_hint_consent,false) AND (_hint_gender IS NOT NULL OR _hint_region IS NOT NULL) THEN
    INSERT INTO public.message_hints(message_id,gender,region) VALUES (_id,_hint_gender,_hint_region);
  END IF;
  RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.send_message_with_hints(text,text,boolean,boolean,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_message_with_hints(text,text,boolean,boolean,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_message_hint_status(_message_id uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.messages WHERE id=_message_id AND recipient_id=auth.uid() AND status IN ('published','pending')) THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  SELECT (CASE WHEN gender IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN region IS NOT NULL THEN 1 ELSE 0 END) INTO _count FROM public.message_hints WHERE message_id=_message_id;
  RETURN coalesce(_count,0);
END $$;
REVOKE ALL ON FUNCTION public.get_message_hint_status(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_message_hint_status(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.read_paid_message_hints(_message_id uuid, _recipient_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.messages WHERE id=_message_id AND recipient_id=_recipient_id AND status IN ('published','pending')) THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  RETURN (SELECT jsonb_build_object('gender',gender,'region',region) FROM public.message_hints WHERE message_id=_message_id);
END $$;
REVOKE ALL ON FUNCTION public.read_paid_message_hints(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_paid_message_hints(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT jsonb_build_object(
  'profile', (SELECT to_jsonb(p) - 'id' FROM public.profiles p WHERE id = auth.uid()),
  'inbox_settings', (SELECT to_jsonb(s) - 'user_id' FROM public.inbox_settings s WHERE user_id = auth.uid()),
  'messages_received', coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.id,'body',m.body,'status',m.status,'archived',m.archived,'created_at',m.created_at)) FROM public.messages m WHERE m.recipient_id = auth.uid()),'[]'),
  'replies', coalesce((SELECT jsonb_agg(jsonb_build_object('message_id',r.message_id,'body',r.body,'created_at',r.created_at)) FROM public.message_replies r WHERE r.author_id = auth.uid()),'[]'),
  'messages_sent_count', (SELECT count(*) FROM public.message_sender_links WHERE sender_id = auth.uid()),
  'hints_shared', coalesce((SELECT jsonb_agg(jsonb_build_object('message_id',h.message_id,'gender',h.gender,'region',h.region,'consented_at',h.consented_at)) FROM public.message_hints h JOIN public.message_sender_links l ON l.message_id=h.message_id WHERE l.sender_id=auth.uid()),'[]'),
  'reports_filed', coalesce((SELECT jsonb_agg(jsonb_build_object('reason',reason,'status',status,'created_at',created_at)) FROM public.reports WHERE reporter_id = auth.uid()),'[]'),
  'exported_at', now()
)
$$;