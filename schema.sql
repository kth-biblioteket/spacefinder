--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: array_add_value(text[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.array_add_value(arr text[], p_val text) RETURNS text[]
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT CASE WHEN p_val = ANY(coalesce(arr, '{}'::text[]))
    THEN coalesce(arr, '{}'::text[])
    ELSE coalesce(arr, '{}'::text[]) || p_val END
$$;


--
-- Name: array_remove_value(text[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.array_remove_value(arr text[], p_val text) RETURNS text[]
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT coalesce(array_remove(coalesce(arr, '{}'::text[]), p_val), '{}'::text[])
$$;


--
-- Name: array_replace_dedupe(text[], text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.array_replace_dedupe(arr text[], p_old text, p_new text) RETURNS text[]
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  WITH mapped AS (
    SELECT CASE WHEN x = p_old THEN p_new ELSE x END AS v, o
    FROM unnest(coalesce(arr, '{}'::text[])) WITH ORDINALITY t(x, o)
  ), grouped AS (
    SELECT v, min(o) AS o FROM mapped GROUP BY v
  )
  SELECT coalesce((SELECT array_agg(v ORDER BY o) FROM grouped), '{}'::text[])
$$;


--
-- Name: filter_storage_column(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.filter_storage_column(p_category text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    WHEN p_category IN ('intent','noise','equipment','lokaltyp') THEN p_category
    WHEN p_category = 'facility' THEN 'facilities'
    ELSE NULL
  END
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: move_filter_option(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.move_filter_option(p_option_id uuid, p_new_category text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_old_category text;
  v_label text;
  v_from text;
  v_to text;
  v_key text;
  v_base text;
  i integer := 1;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT category, label, value_key
    INTO v_old_category, v_label, v_key
  FROM public.filter_options
  WHERE id = p_option_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown filter option: %', p_option_id;
  END IF;

  IF p_new_category IS NULL OR v_old_category = p_new_category THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.filter_categories
    WHERE key = p_new_category
      AND special_kind IS NULL
  ) THEN
    RAISE EXCEPTION 'Unknown or protected category: %', p_new_category;
  END IF;

  v_from := public.filter_storage_column(v_old_category);
  v_to := public.filter_storage_column(p_new_category);

  IF v_from IS NOT NULL AND v_to IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.spaces
       SET %1$I = public.array_add_value(%1$I, $1),
           %2$I = public.array_remove_value(%2$I, $1)
       WHERE $1 = ANY(%2$I)',
      v_to, v_from
    ) USING v_label;
  ELSIF v_from IS NOT NULL AND v_to IS NULL THEN
    EXECUTE format(
      'UPDATE public.spaces
       SET tags = jsonb_set(
             coalesce(tags, ''{}''::jsonb),
             ARRAY[$2::text],
             to_jsonb(public.array_add_value(
               ARRAY(SELECT jsonb_array_elements_text(coalesce(tags -> $2::text, ''[]''::jsonb))),
               $1::text
             )),
             true
           ),
           %1$I = public.array_remove_value(%1$I, $1)
       WHERE $1 = ANY(%1$I)',
      v_from
    ) USING v_label, p_new_category;
  ELSIF v_from IS NULL AND v_to IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.spaces
       SET %1$I = public.array_add_value(%1$I, $1),
           tags = CASE
             WHEN public.array_remove_value(
               ARRAY(SELECT jsonb_array_elements_text(coalesce(tags -> $2::text, ''[]''::jsonb))),
               $1::text
             ) = ''{}''::text[]
             THEN coalesce(tags, ''{}''::jsonb) - $2::text
             ELSE jsonb_set(
               coalesce(tags, ''{}''::jsonb),
               ARRAY[$2::text],
               to_jsonb(public.array_remove_value(
                 ARRAY(SELECT jsonb_array_elements_text(coalesce(tags -> $2::text, ''[]''::jsonb))),
                 $1::text
               )),
               true
             )
           END
       WHERE coalesce(tags -> $2::text, ''[]''::jsonb) @> jsonb_build_array($1::text)',
      v_to
    ) USING v_label, v_old_category;
  ELSE
    UPDATE public.spaces
    SET tags = CASE
      WHEN public.array_remove_value(
        ARRAY(SELECT jsonb_array_elements_text(coalesce(tags -> v_old_category, '[]'::jsonb))),
        v_label
      ) = '{}'::text[]
      THEN jsonb_set(
        coalesce(tags, '{}'::jsonb) - v_old_category,
        ARRAY[p_new_category],
        to_jsonb(public.array_add_value(
          ARRAY(SELECT jsonb_array_elements_text(coalesce(tags -> p_new_category, '[]'::jsonb))),
          v_label
        )),
        true
      )
      ELSE jsonb_set(
        jsonb_set(
          coalesce(tags, '{}'::jsonb),
          ARRAY[p_new_category],
          to_jsonb(public.array_add_value(
            ARRAY(SELECT jsonb_array_elements_text(coalesce(tags -> p_new_category, '[]'::jsonb))),
            v_label
          )),
          true
        ),
        ARRAY[v_old_category],
        to_jsonb(public.array_remove_value(
          ARRAY(SELECT jsonb_array_elements_text(coalesce(tags -> v_old_category, '[]'::jsonb))),
          v_label
        )),
        true
      )
    END
    WHERE coalesce(tags -> v_old_category, '[]'::jsonb) @> jsonb_build_array(v_label);
  END IF;

  v_base := coalesce(nullif(v_key, ''), public.slugify_filter_value(v_label));
  v_key := v_base;
  WHILE EXISTS (
    SELECT 1
    FROM public.filter_options
    WHERE category = p_new_category
      AND value_key = v_key
      AND id <> p_option_id
  ) LOOP
    i := i + 1;
    v_key := v_base || '_' || i;
  END LOOP;

  UPDATE public.filter_options
  SET category = p_new_category,
      value_key = v_key,
      sort_order = 999
  WHERE id = p_option_id;
END;
$_$;


--
-- Name: rename_filter_option(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rename_filter_option(p_category text, p_old_label text, p_new_label text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_col text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_old_label IS NULL OR p_new_label IS NULL OR p_old_label = p_new_label THEN
    RETURN;
  END IF;

  v_col := public.filter_storage_column(p_category);

  IF v_col IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.spaces SET %1$I = public.array_replace_dedupe(%1$I, $1, $2) WHERE $1 = ANY(%1$I)',
      v_col
    ) USING p_old_label, p_new_label;
  ELSE
    UPDATE public.spaces
    SET tags = jsonb_set(
      tags,
      ARRAY[p_category],
      to_jsonb(public.array_replace_dedupe(
        ARRAY(SELECT jsonb_array_elements_text(tags->p_category)),
        p_old_label, p_new_label))
    )
    WHERE tags ? p_category
      AND tags->p_category @> to_jsonb(p_old_label);
  END IF;
END;
$_$;


--
-- Name: set_filter_option_value_key(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_filter_option_value_key() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  base text;
  candidate text;
  i int := 1;
begin
  if new.value_key is null or btrim(new.value_key) = '' then
    base := public.slugify_filter_value(new.label);
    candidate := base;
    while exists (
      select 1 from public.filter_options
      where category = new.category
        and value_key = candidate
        and id is distinct from new.id
    ) loop
      i := i + 1;
      candidate := base || '_' || i;
    end loop;
    new.value_key := candidate;
  end if;
  return new;
end;
$$;


--
-- Name: slugify_filter_value(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.slugify_filter_value(p text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $_$
  select coalesce(
    nullif(
      regexp_replace(
        regexp_replace(
          lower(translate(coalesce(p, ''), 'åäöéèüÅÄÖÉÈÜ', 'aaoeeuaaoeeu')),
          '[^a-z0-9]+', '_', 'g'
        ),
        '^_+|_+$', '', 'g'
      ),
      ''
    ),
    'option'
  )
$_$;


--
-- Name: validate_space_kind(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_space_kind() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.space_kind IS NULL OR NEW.space_kind = '' THEN
    NEW.space_kind := 'study';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.filter_options fo
    JOIN public.filter_categories fc ON fc.key = fo.category
    WHERE fc.special_kind = 'space_kind' AND fo.value_key = NEW.space_kind
  ) THEN
    RAISE EXCEPTION 'Invalid space_kind: %', NEW.space_kind;
  END IF;
  RETURN NEW;
END $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id bigint NOT NULL,
    event_type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    session_id text,
    path text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analytics_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analytics_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analytics_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analytics_events_id_seq OWNED BY public.analytics_events.id;


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: filter_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.filter_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    title text NOT NULL,
    style text DEFAULT 'pills'::text NOT NULL,
    match_mode text DEFAULT 'all'::text NOT NULL,
    is_single_select boolean DEFAULT false NOT NULL,
    locked boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title_en text,
    special_kind text
);


--
-- Name: filter_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.filter_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category text NOT NULL,
    label text NOT NULL,
    icon_url text,
    default_icon text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    label_en text,
    value_key text,
    is_seed boolean DEFAULT false NOT NULL,
    hidden boolean DEFAULT false NOT NULL
);


--
-- Name: spaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text,
    description text DEFAULT ''::text NOT NULL,
    intent text[] DEFAULT '{}'::text[] NOT NULL,
    noise text[] DEFAULT '{}'::text[] NOT NULL,
    equipment text[] DEFAULT '{}'::text[] NOT NULL,
    facilities text[] DEFAULT '{}'::text[] NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    floor text,
    images text[] DEFAULT '{}'::text[] NOT NULL,
    map_url text,
    booking_url text,
    lokaltyp text[] DEFAULT '{}'::text[] NOT NULL,
    tags jsonb DEFAULT '{}'::jsonb NOT NULL,
    image_alts text[] DEFAULT '{}'::text[] NOT NULL,
    capacity integer,
    notice text,
    show_capacity_publicly boolean DEFAULT false NOT NULL,
    computers_url text,
    group_booking_url text,
    located_in text,
    name_en text,
    description_en text,
    notice_en text,
    located_in_en text,
    floor_en text,
    group_booking_url_en text,
    countmatters_sensor_id text,
    show_occupancy boolean DEFAULT true NOT NULL,
    booking_room_number integer,
    book_now_url text,
    book_now_url_en text,
    image_alts_en text[] DEFAULT '{}'::text[] NOT NULL,
    info text,
    info_en text,
    slug text,
    map_url_en text,
    booking_url_en text,
    space_kind text DEFAULT 'study'::text NOT NULL,
    computer_count integer,
    description_inline boolean DEFAULT false NOT NULL,
    informal_seat_count integer,
    hidden boolean DEFAULT false NOT NULL,
    group_booking_label text,
    group_booking_label_en text,
    CONSTRAINT spaces_slug_format_chk CHECK (((slug IS NULL) OR (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analytics_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events ALTER COLUMN id SET DEFAULT nextval('public.analytics_events_id_seq'::regclass);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: filter_categories filter_categories_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filter_categories
    ADD CONSTRAINT filter_categories_key_key UNIQUE (key);


--
-- Name: filter_categories filter_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filter_categories
    ADD CONSTRAINT filter_categories_pkey PRIMARY KEY (id);


--
-- Name: filter_options filter_options_category_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filter_options
    ADD CONSTRAINT filter_options_category_label_key UNIQUE (category, label);


--
-- Name: filter_options filter_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filter_options
    ADD CONSTRAINT filter_options_pkey PRIMARY KEY (id);


--
-- Name: spaces spaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: analytics_events_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_events_created_idx ON public.analytics_events USING btree (created_at DESC);


--
-- Name: analytics_events_type_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_events_type_created_idx ON public.analytics_events USING btree (event_type, created_at DESC);


--
-- Name: filter_options_category_value_key_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX filter_options_category_value_key_uidx ON public.filter_options USING btree (category, value_key);


--
-- Name: idx_spaces_hidden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spaces_hidden ON public.spaces USING btree (hidden);


--
-- Name: spaces_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX spaces_slug_unique ON public.spaces USING btree (slug) WHERE (slug IS NOT NULL);


--
-- Name: spaces_sort_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX spaces_sort_order_idx ON public.spaces USING btree (sort_order);


--
-- Name: spaces_space_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX spaces_space_kind_idx ON public.spaces USING btree (space_kind);


--
-- Name: filter_options filter_options_set_value_key; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER filter_options_set_value_key BEFORE INSERT ON public.filter_options FOR EACH ROW EXECUTE FUNCTION public.set_filter_option_value_key();


--
-- Name: filter_options set_filter_options_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_filter_options_updated_at BEFORE UPDATE ON public.filter_options FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: filter_categories set_updated_at_filter_categories; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_filter_categories BEFORE UPDATE ON public.filter_categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: spaces spaces_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER spaces_updated_at BEFORE UPDATE ON public.spaces FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: spaces validate_space_kind_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_space_kind_trg BEFORE INSERT OR UPDATE OF space_kind ON public.spaces FOR EACH ROW EXECUTE FUNCTION public.validate_space_kind();


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: app_settings Admins can delete app settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete app settings" ON public.app_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: filter_categories Admins can delete filter categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete filter categories" ON public.filter_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: filter_options Admins can delete filter options; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete filter options" ON public.filter_options FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: spaces Admins can delete spaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete spaces" ON public.spaces FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_settings Admins can insert app settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert app settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: filter_categories Admins can insert filter categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert filter categories" ON public.filter_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: filter_options Admins can insert filter options; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert filter options" ON public.filter_options FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: spaces Admins can insert spaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert spaces" ON public.spaces FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: analytics_events Admins can read analytics events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read analytics events" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_settings Admins can update app settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update app settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: filter_categories Admins can update filter categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update filter categories" ON public.filter_categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: filter_options Admins can update filter options; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update filter options" ON public.filter_options FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: spaces Admins can update spaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update spaces" ON public.spaces FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: analytics_events Anyone can insert analytics events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events FOR INSERT TO authenticated, anon WITH CHECK (((event_type IS NOT NULL) AND (length(event_type) > 0) AND (length(event_type) <= 100) AND ((path IS NULL) OR (length(path) <= 500))));


--
-- Name: app_settings App settings viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "App settings viewable by everyone" ON public.app_settings FOR SELECT USING (true);


--
-- Name: filter_categories Filter categories viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Filter categories viewable by everyone" ON public.filter_categories FOR SELECT USING (true);


--
-- Name: filter_options Filter options viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Filter options viewable by everyone" ON public.filter_options FOR SELECT USING (true);


--
-- Name: spaces Spaces are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Spaces are viewable by everyone" ON public.spaces FOR SELECT USING (true);


--
-- Name: user_roles Users can read own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: analytics_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: filter_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.filter_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: filter_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.filter_options ENABLE ROW LEVEL SECURITY;

--
-- Name: spaces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

