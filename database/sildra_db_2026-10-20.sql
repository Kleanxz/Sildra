--
-- PostgreSQL database dump
--

\restrict fVF5OsrMwKOTbtvfxnjHBR9H3oewhoa5LkgfJ4eSVUhAwGHU2MAT6Ggfc0O389n

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.6 (Debian 18.6-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_turn; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_turn (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    ticket_id uuid,
    conversation_id uuid,
    kind character varying NOT NULL,
    provider_alias character varying NOT NULL,
    model_alias character varying NOT NULL,
    policy_version character varying NOT NULL,
    confidence numeric,
    latency_ms integer,
    tokens_in integer,
    tokens_out integer,
    cost_usd numeric,
    outcome character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE ai_turn; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_turn IS 'sin chain-of-thought, sin prompt completo';


--
-- Name: COLUMN ai_turn.kind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_turn.kind IS 'summary|classification|draft_response|next_steps';


--
-- Name: COLUMN ai_turn.outcome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_turn.outcome IS 'proposed|accepted|edited|rejected|abstained|failed';


--
-- Name: app_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_user (
    id uuid NOT NULL,
    tenant_id uuid,
    name character varying(120) NOT NULL,
    email character varying(254) NOT NULL,
    role character varying(40) DEFAULT 'User'::character varying NOT NULL,
    password_hash text NOT NULL,
    status character varying(40) DEFAULT 'Disponible'::character varying NOT NULL,
    skills jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    queue_id uuid,
    skill_id uuid,
    assignee_ref character varying,
    from_ref character varying,
    to_ref character varying,
    reason character varying,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone
);


--
-- Name: branch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN branch.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.branch.status IS 'active|inactive';


--
-- Name: call_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_session (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    conversation_id uuid,
    asterisk_channel character varying,
    asterisk_bridge character varying,
    ucm_ref character varying,
    codec character varying,
    state character varying DEFAULT 'offered'::character varying NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    connected_at timestamp with time zone,
    ended_at timestamp with time zone,
    duration_sec integer
);


--
-- Name: TABLE call_session; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.call_session IS 'SIN columna de audio/blob (ADR-005)';


--
-- Name: COLUMN call_session.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.call_session.id IS 'es también call_id (UUIDv7)';


--
-- Name: COLUMN call_session.state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.call_session.state IS 'offered|ringing|connected|consent_pending|active|handoff_pending|transferred|completed|failed';


--
-- Name: consent_record; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consent_record (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    conversation_id uuid,
    call_session_id uuid,
    purpose character varying NOT NULL,
    policy_version character varying NOT NULL,
    decision character varying NOT NULL,
    captured_at timestamp with time zone DEFAULT now() NOT NULL,
    actor_ref character varying,
    evidence_ref character varying,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone
);


--
-- Name: COLUMN consent_record.call_session_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_record.call_session_id IS 'FK diferida a call_session (H3)';


--
-- Name: COLUMN consent_record.purpose; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_record.purpose IS 'ej. transcription';


--
-- Name: COLUMN consent_record.decision; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_record.decision IS 'granted|denied|revoked';


--
-- Name: conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    branch_id uuid,
    channel character varying NOT NULL,
    requester_ref character varying,
    verification_state character varying DEFAULT 'unverified'::character varying NOT NULL,
    verification_ref character varying,
    status character varying DEFAULT 'open'::character varying NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN conversation.channel; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation.channel IS 'call|sms|email|chat|note|manual';


--
-- Name: COLUMN conversation.requester_ref; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation.requester_ref IS 'referencia opaca al solicitante';


--
-- Name: COLUMN conversation.verification_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation.verification_state IS 'unverified|verified|failed';


--
-- Name: COLUMN conversation.verification_ref; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation.verification_ref IS 'prueba opaca, sin secreto';


--
-- Name: COLUMN conversation.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation.status IS 'open|closed|abandoned';


--
-- Name: external_ticket_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_ticket_link (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying NOT NULL,
    external_id character varying NOT NULL,
    sync_state character varying DEFAULT 'pending'::character varying NOT NULL,
    sync_cursor character varying,
    last_synced_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN external_ticket_link.provider; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.external_ticket_link.provider IS 'spiceworks';


--
-- Name: COLUMN external_ticket_link.sync_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.external_ticket_link.sync_state IS 'pending|synced|error|disabled';


--
-- Name: handoff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.handoff (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying NOT NULL,
    queue_ref character varying,
    extension_ref character varying,
    status character varying DEFAULT 'requested'::character varying NOT NULL,
    reason character varying,
    callback_owner_ref character varying,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    accepted_at timestamp with time zone,
    completed_at timestamp with time zone,
    failed_at timestamp with time zone,
    failure_reason character varying
);


--
-- Name: COLUMN handoff.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.handoff.status IS 'requested|accepted|completed|failed';


--
-- Name: inbox_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inbox_message (
    id uuid NOT NULL,
    consumer character varying NOT NULL,
    event_id uuid NOT NULL,
    event_type character varying NOT NULL,
    tenant_id uuid NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    status character varying DEFAULT 'received'::character varying NOT NULL,
    last_error text
);


--
-- Name: COLUMN inbox_message.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inbox_message.status IS 'received|processed|failed';


--
-- Name: interaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interaction (
    id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    type character varying NOT NULL,
    sequence integer NOT NULL,
    speaker character varying,
    text_redacted text,
    text_ciphertext bytea,
    source_ref character varying,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN interaction.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interaction.type IS 'call|sms|email|chat|note|system';


--
-- Name: COLUMN interaction.speaker; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interaction.speaker IS 'customer|agent|system|bot';


--
-- Name: COLUMN interaction.text_redacted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interaction.text_redacted IS 'texto mínimo redactado';


--
-- Name: COLUMN interaction.text_ciphertext; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interaction.text_ciphertext IS 'reservado; sin uso hasta aprobar política';


--
-- Name: knowledge_article; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_article (
    id uuid NOT NULL,
    owner_scope character varying NOT NULL,
    tenant_id uuid,
    product_code character varying,
    module_code character varying,
    language character varying DEFAULT 'es'::character varying NOT NULL,
    audience character varying,
    workflow_state character varying DEFAULT 'draft'::character varying NOT NULL,
    current_version_id uuid,
    owner_ref character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN knowledge_article.owner_scope; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_article.owner_scope IS 'global|tenant';


--
-- Name: COLUMN knowledge_article.tenant_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_article.tenant_id IS 'null si es global';


--
-- Name: COLUMN knowledge_article.workflow_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_article.workflow_state IS 'draft|in_review|approved|published|retired';


--
-- Name: COLUMN knowledge_article.current_version_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_article.current_version_id IS 'FK diferida a knowledge_version';


--
-- Name: knowledge_chunk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_chunk (
    id uuid NOT NULL,
    version_id uuid NOT NULL,
    ordinal integer NOT NULL,
    text_allowed text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    citation_locator character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN knowledge_chunk.text_allowed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_chunk.text_allowed IS 'texto tras sanitización';


--
-- Name: knowledge_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_version (
    id uuid NOT NULL,
    article_id uuid NOT NULL,
    version_number integer NOT NULL,
    content_md text NOT NULL,
    content_checksum character varying NOT NULL,
    source_refs jsonb DEFAULT '[]'::jsonb NOT NULL,
    valid_from timestamp with time zone,
    valid_to timestamp with time zone,
    author_ref character varying NOT NULL,
    reviewer_ref character varying,
    publisher_ref character varying,
    sanitization_state character varying DEFAULT 'pending'::character varying NOT NULL,
    is_immutable boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone
);


--
-- Name: COLUMN knowledge_version.sanitization_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.knowledge_version.sanitization_state IS 'pending|clean|flagged';


--
-- Name: notification_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_request (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    ticket_id uuid,
    conversation_id uuid,
    channel character varying NOT NULL,
    template_code character varying NOT NULL,
    template_version integer NOT NULL,
    locale character varying DEFAULT 'es-DO'::character varying NOT NULL,
    recipient_ref character varying NOT NULL,
    variables jsonb DEFAULT '{}'::jsonb NOT NULL,
    consent_ref uuid,
    dedupe_key character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    expires_at timestamp with time zone,
    correlation_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN notification_request.channel; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_request.channel IS 'email|sms|whatsapp|in_app';


--
-- Name: COLUMN notification_request.consent_ref; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_request.consent_ref IS 'FK diferida a consent_record';


--
-- Name: COLUMN notification_request.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_request.status IS 'pending|queued|sent|delivered|failed|expired';


--
-- Name: outbox_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outbox_message (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    event_type character varying NOT NULL,
    schema_version integer DEFAULT 1 NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    correlation_id uuid NOT NULL,
    causation_id uuid,
    payload jsonb NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    lease_until timestamp with time zone,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN outbox_message.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.outbox_message.id IS 'es también el eventId (UUIDv7)';


--
-- Name: COLUMN outbox_message.event_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.outbox_message.event_type IS 'ej. support.ticket.created.v1';


--
-- Name: COLUMN outbox_message.payload; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.outbox_message.payload IS 'envelope + payload mínimo';


--
-- Name: COLUMN outbox_message.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.outbox_message.status IS 'pending|publishing|published|failed|quarantined';


--
-- Name: priority_matrix; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.priority_matrix (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    version integer NOT NULL,
    name character varying NOT NULL,
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    effective_from timestamp with time zone NOT NULL,
    effective_to timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN priority_matrix.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.priority_matrix.status IS 'draft|active|retired';


--
-- Name: priority_matrix_cell; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.priority_matrix_cell (
    id uuid NOT NULL,
    matrix_id uuid NOT NULL,
    impact character varying NOT NULL,
    urgency character varying NOT NULL,
    priority character varying NOT NULL
);


--
-- Name: COLUMN priority_matrix_cell.impact; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.priority_matrix_cell.impact IS 'low|medium|high|critical';


--
-- Name: COLUMN priority_matrix_cell.urgency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.priority_matrix_cell.urgency IS 'low|medium|high|critical';


--
-- Name: COLUMN priority_matrix_cell.priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.priority_matrix_cell.priority IS 'p1|p2|p3|p4';


--
-- Name: priority_override; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.priority_override (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    old_priority character varying NOT NULL,
    new_priority character varying NOT NULL,
    reason_code character varying NOT NULL,
    reason_text text NOT NULL,
    approver_ref character varying NOT NULL,
    actor_ref character varying NOT NULL,
    matrix_version integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.queue (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    is_fallback boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN queue.is_fallback; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.queue.is_fallback IS 'cola de rescate si no hay owner';


--
-- Name: retrieval_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retrieval_evidence (
    id uuid NOT NULL,
    ai_turn_id uuid NOT NULL,
    article_id uuid NOT NULL,
    version_id uuid NOT NULL,
    chunk_id uuid,
    rank integer NOT NULL,
    score numeric,
    citation_locator character varying,
    presented boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: skill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sla_clock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sla_clock (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    kind character varying NOT NULL,
    target_at timestamp with time zone NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    paused_at timestamp with time zone,
    resumed_at timestamp with time zone,
    breach_at timestamp with time zone,
    pause_reason character varying,
    timezone_snapshot character varying NOT NULL,
    calendar_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: COLUMN sla_clock.kind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sla_clock.kind IS 'first_response|resolution';


--
-- Name: sla_policy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sla_policy (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    version integer NOT NULL,
    name character varying NOT NULL,
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    timezone character varying DEFAULT 'America/Santo_Domingo'::character varying NOT NULL,
    calendar_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN sla_policy.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sla_policy.status IS 'draft|active|retired';


--
-- Name: sla_target; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sla_target (
    id uuid NOT NULL,
    sla_policy_id uuid NOT NULL,
    priority character varying NOT NULL,
    first_response_min integer NOT NULL,
    resolution_min integer NOT NULL
);


--
-- Name: COLUMN sla_target.priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sla_target.priority IS 'p1|p2|p3|p4';


--
-- Name: taxonomy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxonomy (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    version integer NOT NULL,
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN taxonomy.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.taxonomy.status IS 'draft|active|retired';


--
-- Name: taxonomy_category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxonomy_category (
    id uuid NOT NULL,
    taxonomy_id uuid NOT NULL,
    parent_id uuid,
    code character varying NOT NULL,
    name character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN tenant.organization_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant.organization_id IS 'viene de Keycloak';


--
-- Name: COLUMN tenant.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant.status IS 'active|suspended|disabled';


--
-- Name: ticket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket (
    id uuid NOT NULL,
    display_number character varying NOT NULL,
    tenant_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    branch_id uuid,
    conversation_id uuid,
    requester_ref character varying,
    subject character varying NOT NULL,
    description text,
    taxonomy_id uuid,
    category_id uuid,
    impact character varying,
    urgency character varying,
    priority character varying,
    priority_matrix_id uuid,
    sla_policy_id uuid,
    sla_policy_version integer,
    status character varying DEFAULT 'new'::character varying NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    created_by_ref character varying NOT NULL,
    updated_by_ref character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    closed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancel_reason character varying,
    resolution_notes text DEFAULT ''::text NOT NULL,
    requester_phone character varying(40) DEFAULT ''::character varying NOT NULL
);


--
-- Name: COLUMN ticket.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket.id IS 'UUIDv7 generado en app';


--
-- Name: COLUMN ticket.display_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket.display_number IS 'SUP-YYYY-NNNNNN';


--
-- Name: COLUMN ticket.impact; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket.impact IS 'low|medium|high|critical';


--
-- Name: COLUMN ticket.urgency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket.urgency IS 'low|medium|high|critical';


--
-- Name: COLUMN ticket.priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket.priority IS 'p1|p2|p3|p4';


--
-- Name: COLUMN ticket.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket.status IS 'new|triaged|assigned|in_progress|waiting_customer|waiting_vendor|resolved|closed|reopened|cancelled';


--
-- Name: COLUMN ticket.row_version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket.row_version IS 'optimistic concurrency';


--
-- Name: ticket_chat_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_chat_message (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    author_id uuid,
    author_name character varying(120) NOT NULL,
    author_role character varying(40) NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ticket_chat_message_message_check CHECK (((length(btrim(message)) >= 1) AND (length(btrim(message)) <= 4000)))
);


--
-- Name: ticket_number_counter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_number_counter (
    tenant_id uuid NOT NULL,
    prefix character varying DEFAULT 'SUP'::character varying NOT NULL,
    year integer NOT NULL,
    last_value bigint DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ticket_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_timeline (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    type character varying NOT NULL,
    actor_ref character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    correlation_id uuid NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN ticket_timeline.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ticket_timeline.type IS 'created|classified|priority_changed|assigned|status_changed|escalated|resolved|reopened|cancelled|override|note|sla_breached';


--
-- Name: tool_execution; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tool_execution (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    ai_turn_id uuid,
    tool_code character varying NOT NULL,
    tool_version character varying NOT NULL,
    params_redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
    params_hash character varying,
    result_hash character varying,
    result_status character varying NOT NULL,
    latency_ms integer,
    policy_version character varying NOT NULL,
    actor_ref character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN tool_execution.result_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tool_execution.result_status IS 'ok|empty|denied|error|timeout';


--
-- Data for Name: ai_turn; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_turn (id, tenant_id, ticket_id, conversation_id, kind, provider_alias, model_alias, policy_version, confidence, latency_ms, tokens_in, tokens_out, cost_usd, outcome, created_at) FROM stdin;
\.


--
-- Data for Name: app_user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_user (id, tenant_id, name, email, role, password_hash, status, skills, created_at, updated_at) FROM stdin;
47c77206-7b9e-4a62-bd18-0dbe03ac4897	0d88d844-09a5-459e-a83c-89b1ca606228	Nelson Mejia	nelson.mejia.agent@sildra.invalid	Agent	disabled-profile	Disponible	[]	2026-10-20 01:22:29.67+00	2026-10-20 01:22:29.67+00
5caa812a-b7d3-4862-b45b-47ab2d468ac1	0d88d844-09a5-459e-a83c-89b1ca606228	Sebastian Ubri	sebastian.ubri.agent@sildra.invalid	Agent	disabled-profile	Disponible	[]	2026-10-20 01:22:29.67+00	2026-10-20 01:22:29.67+00
9867940a-1a53-42fb-a4fc-071ce8941b97	0d88d844-09a5-459e-a83c-89b1ca606228	Nelson Mejia	mejia0503diaz@gmail.com	User	pbkdf2-sha256$210000$e2ClTP1O6gbtcDFfyRs3Cw==$PoKXRhl48zolR5dkZ+gWOtciVprzkTkfXmo2IAG60Dk=	Disponible	[]	2026-10-20 10:34:57.597881+00	2026-10-20 10:34:57.597881+00
4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	0d88d844-09a5-459e-a83c-89b1ca606228	Jarol Ortiz	ojarol411@gmail.com	Agent	pbkdf2-sha256$210000$ymrvr3IPTrrYs6gJpwxrwA==$RpBHL870peHn3KGRcrGp7zzNDQFngbRoqn1HC8D+Bq8=	Disponible	[]	2026-10-20 01:05:45.296034+00	2026-10-20 10:59:54.892005+00
e78bd373-85dc-4e61-8f11-29bcc9f1477b	0d88d844-09a5-459e-a83c-89b1ca606228	Gabriel	encarnacionbaezchristopher65@gmail.com	Agent	pbkdf2-sha256$210000$fyffZ8EoVeCvXfZk6YKvzQ==$aMz+gTdmY28oUbLGUarok0VQQlnVmIaSvBRPwr8GFgE=	Disponible	[]	2026-10-20 10:51:04.753402+00	2026-10-20 11:38:18.448895+00
977287c7-3787-434b-9108-c6157fad0347	\N	Administrador	ortizjarolestiven@gmail.com	Admin	pbkdf2-sha256$210000$flHk9DwsxCtdBFp3OolZ3w==$slLw10rLZbHjn3IK+SeNoYBMTW2MvjaUmPg5nYdgaMs=	Disponible	[]	2026-10-20 01:19:02.76622+00	2026-10-20 11:41:02.937147+00
\.


--
-- Data for Name: assignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment (id, ticket_id, tenant_id, queue_id, skill_id, assignee_ref, from_ref, to_ref, reason, assigned_at, ended_at) FROM stdin;
a85039ae-b000-4cd8-ad5a-b0b04fab63aa	352b0a35-68ce-4bf6-8943-69a858a08f52	0d88d844-09a5-459e-a83c-89b1ca606228	\N	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	2026-10-20 01:43:47.581462+00	2026-10-20 01:44:07.975524+00
c6bd7822-0db5-44f1-91dd-faecbdd029e8	352b0a35-68ce-4bf6-8943-69a858a08f52	0d88d844-09a5-459e-a83c-89b1ca606228	\N	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	2026-10-20 01:44:07.975524+00	2026-10-20 10:14:27.534945+00
324563d3-deb8-417f-bec3-3d93fe320125	352b0a35-68ce-4bf6-8943-69a858a08f52	0d88d844-09a5-459e-a83c-89b1ca606228	\N	\N	5c570348-1aa6-4888-b670-3210c9e6f501	\N	5c570348-1aa6-4888-b670-3210c9e6f501	\N	2026-10-20 10:14:27.534945+00	2026-10-20 10:18:22.537598+00
46a372ea-29dd-451e-b058-44020071a1d7	881b1c7c-c184-4209-8811-2ecc05c81c8a	0d88d844-09a5-459e-a83c-89b1ca606228	\N	\N	5c570348-1aa6-4888-b670-3210c9e6f501	\N	5c570348-1aa6-4888-b670-3210c9e6f501	\N	2026-10-20 10:15:02.213965+00	2026-10-20 10:59:33.89622+00
4df2b9a9-4abf-4b75-972e-e1edfe326c53	352b0a35-68ce-4bf6-8943-69a858a08f52	0d88d844-09a5-459e-a83c-89b1ca606228	\N	\N	5c570348-1aa6-4888-b670-3210c9e6f501	\N	5c570348-1aa6-4888-b670-3210c9e6f501	\N	2026-10-20 10:18:22.537598+00	2026-10-20 10:59:33.89622+00
3d5359b4-71e0-4b79-84ee-163522026ac8	4e7b1ff1-8b20-4fbd-9787-1922846d4647	0d88d844-09a5-459e-a83c-89b1ca606228	\N	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	2026-10-20 11:05:05.23382+00	\N
e26d41f9-b4ca-4394-8c65-bf30db739519	cbb4b3e0-dfa2-4f28-af22-d14ec83cc90f	0d88d844-09a5-459e-a83c-89b1ca606228	\N	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	2026-10-20 11:11:07.080405+00	\N
25994c23-96ba-4e6d-a013-e303217d42c7	b37c4f56-cbff-441e-a3fa-70aa3342df7c	0d88d844-09a5-459e-a83c-89b1ca606228	\N	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	2026-10-20 11:11:10.924267+00	\N
b670e0d6-7f54-41c8-bd1c-00db4509daa1	e447ddd2-657b-49b5-9c17-d1327a268a03	0d88d844-09a5-459e-a83c-89b1ca606228	\N	\N	e78bd373-85dc-4e61-8f11-29bcc9f1477b	\N	e78bd373-85dc-4e61-8f11-29bcc9f1477b	\N	2026-10-20 11:38:31.913759+00	\N
\.


--
-- Data for Name: branch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branch (id, tenant_id, code, name, status, created_at, updated_at) FROM stdin;
8a4ac392-2131-4c15-92d8-01144b1510cd	0d88d844-09a5-459e-a83c-89b1ca606228	BR-8A4AC39221	Sede principal	active	2026-10-20 01:03:10.759748+00	2026-10-20 01:03:10.759748+00
\.


--
-- Data for Name: call_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.call_session (id, tenant_id, conversation_id, asterisk_channel, asterisk_bridge, ucm_ref, codec, state, started_at, connected_at, ended_at, duration_sec) FROM stdin;
\.


--
-- Data for Name: consent_record; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consent_record (id, tenant_id, conversation_id, call_session_id, purpose, policy_version, decision, captured_at, actor_ref, evidence_ref, expires_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation (id, tenant_id, organization_id, branch_id, channel, requester_ref, verification_state, verification_ref, status, started_at, ended_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: external_ticket_link; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_ticket_link (id, ticket_id, tenant_id, provider, external_id, sync_state, sync_cursor, last_synced_at, last_error, created_at) FROM stdin;
\.


--
-- Data for Name: handoff; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.handoff (id, ticket_id, tenant_id, provider, queue_ref, extension_ref, status, reason, callback_owner_ref, requested_at, accepted_at, completed_at, failed_at, failure_reason) FROM stdin;
\.


--
-- Data for Name: inbox_message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inbox_message (id, consumer, event_id, event_type, tenant_id, received_at, processed_at, status, last_error) FROM stdin;
\.


--
-- Data for Name: interaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interaction (id, conversation_id, tenant_id, type, sequence, speaker, text_redacted, text_ciphertext, source_ref, occurred_at, created_at) FROM stdin;
\.


--
-- Data for Name: knowledge_article; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.knowledge_article (id, owner_scope, tenant_id, product_code, module_code, language, audience, workflow_state, current_version_id, owner_ref, created_at, updated_at) FROM stdin;
399f9274-6811-46dd-a664-e1304c0261c2	tenant	0d88d844-09a5-459e-a83c-89b1ca606228	sildra-support	resoluciones	es	support	pending_review	eb95549a-45f3-44f9-9463-378e90f1950a	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	2026-10-20 11:07:24.857098+00	2026-10-20 11:07:24.857098+00
09b03e0a-5e12-4e09-8f3a-0d2be1b16a65	tenant	0d88d844-09a5-459e-a83c-89b1ca606228	sildra-support	resoluciones	es	support	pending_review	9165fb09-4103-4df7-829a-4b11d508d56a	e78bd373-85dc-4e61-8f11-29bcc9f1477b	2026-10-20 11:39:59.530739+00	2026-10-20 11:39:59.530739+00
\.


--
-- Data for Name: knowledge_chunk; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.knowledge_chunk (id, version_id, ordinal, text_allowed, metadata, citation_locator, created_at) FROM stdin;
\.


--
-- Data for Name: knowledge_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.knowledge_version (id, article_id, version_number, content_md, content_checksum, source_refs, valid_from, valid_to, author_ref, reviewer_ref, publisher_ref, sanitization_state, is_immutable, created_at, published_at) FROM stdin;
eb95549a-45f3-44f9-9463-378e90f1950a	399f9274-6811-46dd-a664-e1304c0261c2	1	# Solución del ticket SUP-2026-000004\n\nAsunto: La impresora no impresorea\n\n## Procedimiento aplicado\n\nLe di al boton de encender	0162524d1518e7964a262291932e7f113fb893ec9d42aeb7b523f447c3dd1759	[]	\N	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	\N	\N	sanitized	f	2026-10-20 11:07:24.857098+00	\N
9165fb09-4103-4df7-829a-4b11d508d56a	09b03e0a-5e12-4e09-8f3a-0d2be1b16a65	1	# Solución del ticket SUP-2026-000006\n\nAsunto: no me abre el safari en mi hp\n\n## Procedimiento aplicado\n\nsafari solo es de mac	8dc49b5527ad2481d1d309085a82e0d229f7fc2a9b195a60736448d585dd1f0d	[]	\N	\N	e78bd373-85dc-4e61-8f11-29bcc9f1477b	\N	\N	sanitized	f	2026-10-20 11:39:59.530739+00	\N
\.


--
-- Data for Name: notification_request; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_request (id, tenant_id, ticket_id, conversation_id, channel, template_code, template_version, locale, recipient_ref, variables, consent_ref, dedupe_key, status, attempts, expires_at, correlation_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: outbox_message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.outbox_message (id, tenant_id, event_type, schema_version, occurred_at, correlation_id, causation_id, payload, status, attempts, lease_until, next_attempt_at, published_at, last_error, created_at) FROM stdin;
\.


--
-- Data for Name: priority_matrix; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.priority_matrix (id, tenant_id, version, name, status, effective_from, effective_to, created_at) FROM stdin;
\.


--
-- Data for Name: priority_matrix_cell; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.priority_matrix_cell (id, matrix_id, impact, urgency, priority) FROM stdin;
\.


--
-- Data for Name: priority_override; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.priority_override (id, ticket_id, tenant_id, old_priority, new_priority, reason_code, reason_text, approver_ref, actor_ref, matrix_version, created_at) FROM stdin;
\.


--
-- Data for Name: queue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.queue (id, tenant_id, code, name, is_fallback, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: retrieval_evidence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.retrieval_evidence (id, ai_turn_id, article_id, version_id, chunk_id, rank, score, citation_locator, presented, created_at) FROM stdin;
\.


--
-- Data for Name: skill; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skill (id, tenant_id, code, name, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: sla_clock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sla_clock (id, ticket_id, tenant_id, kind, target_at, started_at, paused_at, resumed_at, breach_at, pause_reason, timezone_snapshot, calendar_snapshot) FROM stdin;
e150c552-f2ba-4a63-965f-465451a644d7	881b1c7c-c184-4209-8811-2ecc05c81c8a	0d88d844-09a5-459e-a83c-89b1ca606228	resolution	2026-10-21 10:15:02.213965+00	2026-10-20 10:13:29.998111+00	\N	\N	\N	\N	America/Santo_Domingo	{}
a7f0f94e-cb3b-4a4e-b6cf-f0e7e2fb3d10	352b0a35-68ce-4bf6-8943-69a858a08f52	0d88d844-09a5-459e-a83c-89b1ca606228	resolution	2026-10-20 18:18:22.537598+00	2026-10-20 01:06:43.049701+00	\N	\N	\N	\N	America/Santo_Domingo	{}
5514a841-a9dc-4413-a258-835a90632232	4e7b1ff1-8b20-4fbd-9787-1922846d4647	0d88d844-09a5-459e-a83c-89b1ca606228	resolution	2026-10-21 11:05:05.23382+00	2026-10-20 11:02:10.971366+00	\N	\N	\N	\N	America/Santo_Domingo	{}
42b8c354-f7cb-4e4a-b3e4-e052d404f0a5	cbb4b3e0-dfa2-4f28-af22-d14ec83cc90f	0d88d844-09a5-459e-a83c-89b1ca606228	resolution	2026-10-20 15:11:07.080405+00	2026-10-20 11:10:39.41932+00	\N	\N	\N	\N	America/Santo_Domingo	{}
4299fde0-bf46-414a-b7c4-0cd32abdd2b4	b37c4f56-cbff-441e-a3fa-70aa3342df7c	0d88d844-09a5-459e-a83c-89b1ca606228	resolution	2026-10-20 15:11:10.924267+00	2026-10-20 10:49:25.618993+00	\N	\N	\N	\N	America/Santo_Domingo	{}
181570b9-8fa9-450a-bbf8-ce7b6fec261f	e447ddd2-657b-49b5-9c17-d1327a268a03	0d88d844-09a5-459e-a83c-89b1ca606228	resolution	2026-10-20 19:38:31.913759+00	2026-10-20 11:37:41.168671+00	\N	\N	\N	\N	America/Santo_Domingo	{}
\.


--
-- Data for Name: sla_policy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sla_policy (id, tenant_id, version, name, status, timezone, calendar_json, created_at) FROM stdin;
\.


--
-- Data for Name: sla_target; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sla_target (id, sla_policy_id, priority, first_response_min, resolution_min) FROM stdin;
\.


--
-- Data for Name: taxonomy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.taxonomy (id, tenant_id, version, status, created_at) FROM stdin;
\.


--
-- Data for Name: taxonomy_category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.taxonomy_category (id, taxonomy_id, parent_id, code, name, is_active) FROM stdin;
\.


--
-- Data for Name: tenant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant (id, organization_id, code, name, status, created_at, updated_at) FROM stdin;
0d88d844-09a5-459e-a83c-89b1ca606228	325695d4-52b1-405a-ac13-64a3c763cae5	TEN-0D88D84409	Sildra Support	active	2026-10-20 01:03:10.759748+00	2026-10-20 01:03:10.759748+00
\.


--
-- Data for Name: ticket; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket (id, display_number, tenant_id, organization_id, branch_id, conversation_id, requester_ref, subject, description, taxonomy_id, category_id, impact, urgency, priority, priority_matrix_id, sla_policy_id, sla_policy_version, status, row_version, created_by_ref, updated_by_ref, created_at, updated_at, resolved_at, closed_at, cancelled_at, cancel_reason, resolution_notes, requester_phone) FROM stdin;
881b1c7c-c184-4209-8811-2ecc05c81c8a	SUP-2026-000002	0d88d844-09a5-459e-a83c-89b1ca606228	325695d4-52b1-405a-ac13-64a3c763cae5	8a4ac392-2131-4c15-92d8-01144b1510cd	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	no me abre el safari en mi hp	no se	\N	\N	medium	medium	p3	\N	\N	\N	new	2	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	977287c7-3787-434b-9108-c6157fad0347	2026-10-20 10:13:29.998111+00	2026-10-20 10:15:02.213965+00	\N	\N	\N	\N		
352b0a35-68ce-4bf6-8943-69a858a08f52	SUP-2026-000001	0d88d844-09a5-459e-a83c-89b1ca606228	325695d4-52b1-405a-ac13-64a3c763cae5	8a4ac392-2131-4c15-92d8-01144b1510cd	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	mi impresora no enciende	no prende	\N	\N	high	high	p2	\N	\N	\N	new	5	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	977287c7-3787-434b-9108-c6157fad0347	2026-10-20 01:06:43.049701+00	2026-10-20 10:18:22.537598+00	\N	\N	\N	\N		
4e7b1ff1-8b20-4fbd-9787-1922846d4647	SUP-2026-000004	0d88d844-09a5-459e-a83c-89b1ca606228	325695d4-52b1-405a-ac13-64a3c763cae5	8a4ac392-2131-4c15-92d8-01144b1510cd	\N	e78bd373-85dc-4e61-8f11-29bcc9f1477b	La impresora no impresorea	Quise imprimir un documento y la impresora presenta pila de errores	\N	\N	medium	medium	p3	\N	\N	\N	resolved	3	e78bd373-85dc-4e61-8f11-29bcc9f1477b	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	2026-10-20 11:02:10.971366+00	2026-10-20 11:07:24.857098+00	2026-10-20 11:07:24.857098+00	\N	\N	\N	Le di al boton de encender	
cbb4b3e0-dfa2-4f28-af22-d14ec83cc90f	SUP-2026-000005	0d88d844-09a5-459e-a83c-89b1ca606228	325695d4-52b1-405a-ac13-64a3c763cae5	8a4ac392-2131-4c15-92d8-01144b1510cd	\N	e78bd373-85dc-4e61-8f11-29bcc9f1477b	papel atascado	nececito ayuda rapido	\N	\N	critical	critical	p1	\N	\N	\N	new	2	e78bd373-85dc-4e61-8f11-29bcc9f1477b	977287c7-3787-434b-9108-c6157fad0347	2026-10-20 11:10:39.41932+00	2026-10-20 11:11:07.080405+00	\N	\N	\N	\N		
b37c4f56-cbff-441e-a3fa-70aa3342df7c	SUP-2026-000003	0d88d844-09a5-459e-a83c-89b1ca606228	325695d4-52b1-405a-ac13-64a3c763cae5	8a4ac392-2131-4c15-92d8-01144b1510cd	\N	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	no me abre el safari en mi dell	si urjente	\N	\N	critical	critical	p1	\N	\N	\N	new	2	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	977287c7-3787-434b-9108-c6157fad0347	2026-10-20 10:49:25.618993+00	2026-10-20 11:11:10.924267+00	\N	\N	\N	\N		
e447ddd2-657b-49b5-9c17-d1327a268a03	SUP-2026-000006	0d88d844-09a5-459e-a83c-89b1ca606228	325695d4-52b1-405a-ac13-64a3c763cae5	8a4ac392-2131-4c15-92d8-01144b1510cd	\N	977287c7-3787-434b-9108-c6157fad0347	no me abre el safari en mi hp	no se que pasa	\N	\N	high	high	p2	\N	\N	\N	resolved	3	977287c7-3787-434b-9108-c6157fad0347	e78bd373-85dc-4e61-8f11-29bcc9f1477b	2026-10-20 11:37:41.168671+00	2026-10-20 11:39:59.530739+00	2026-10-20 11:39:59.530739+00	\N	\N	\N	safari solo es de mac	809 777 9089
\.


--
-- Data for Name: ticket_chat_message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_chat_message (id, ticket_id, tenant_id, author_id, author_name, author_role, message, created_at) FROM stdin;
\.


--
-- Data for Name: ticket_number_counter; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_number_counter (tenant_id, prefix, year, last_value, updated_at) FROM stdin;
0d88d844-09a5-459e-a83c-89b1ca606228	SUP	2026	6	2026-10-20 11:37:41.166259+00
\.


--
-- Data for Name: ticket_timeline; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_timeline (id, ticket_id, tenant_id, type, actor_ref, metadata, correlation_id, occurred_at) FROM stdin;
a06d7206-bfde-4059-bc07-3fe655e6310e	352b0a35-68ce-4bf6-8943-69a858a08f52	0d88d844-09a5-459e-a83c-89b1ca606228	created	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	{"queue": "Aplicaciones", "channel": "Correo", "category": "Software"}	37afdea9-35e0-43e8-b0e5-b0aa5c3bdfdc	2026-10-20 01:06:43.047107+00
268e760a-68b1-4308-b053-1781e34495de	352b0a35-68ce-4bf6-8943-69a858a08f52	0d88d844-09a5-459e-a83c-89b1ca606228	status_changed	977287c7-3787-434b-9108-c6157fad0347	{"queue": "Aplicaciones", "status": "new", "priority": "p2"}	3c935b46-260d-4309-8b64-56899a3a6fe7	2026-10-20 01:43:47.582053+00
ca6e992a-514e-445a-ad7c-238dc30031e8	352b0a35-68ce-4bf6-8943-69a858a08f52	0d88d844-09a5-459e-a83c-89b1ca606228	status_changed	977287c7-3787-434b-9108-c6157fad0347	{"queue": "Aplicaciones", "status": "resolved", "priority": "p2"}	69876276-71bd-4b5b-bf2b-4ec366161ad5	2026-10-20 01:44:07.977788+00
1316b6da-d771-4023-adbf-7bf10a8eba5e	881b1c7c-c184-4209-8811-2ecc05c81c8a	0d88d844-09a5-459e-a83c-89b1ca606228	created	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	{"queue": "Aplicaciones", "channel": "Portal", "category": "Software"}	109caae1-e0a0-4610-9e74-79b569ffdda5	2026-10-20 10:13:29.995154+00
870ebc27-91b2-49fa-82e2-b5694ce7a496	352b0a35-68ce-4bf6-8943-69a858a08f52	0d88d844-09a5-459e-a83c-89b1ca606228	status_changed	977287c7-3787-434b-9108-c6157fad0347	{"queue": "Aplicaciones", "status": "resolved", "priority": "p2"}	4b82b92e-4113-47c9-82be-edba0657c0ef	2026-10-20 10:14:27.53587+00
db1a7f79-0422-4573-8729-b39c1a7a0174	881b1c7c-c184-4209-8811-2ecc05c81c8a	0d88d844-09a5-459e-a83c-89b1ca606228	status_changed	977287c7-3787-434b-9108-c6157fad0347	{"queue": "Aplicaciones", "status": "new", "priority": "p3"}	4dbd780b-4aae-42f6-9464-3c6584f27e0b	2026-10-20 10:15:02.214524+00
f554ce88-08bc-46e1-83f7-87cab6f59481	352b0a35-68ce-4bf6-8943-69a858a08f52	0d88d844-09a5-459e-a83c-89b1ca606228	status_changed	977287c7-3787-434b-9108-c6157fad0347	{"queue": "Aplicaciones", "status": "new", "priority": "p2"}	3b3b8503-41cb-48ca-a27b-61fe6d636b6e	2026-10-20 10:18:22.537229+00
11569b9e-bbec-451e-9138-6d28a6b30041	b37c4f56-cbff-441e-a3fa-70aa3342df7c	0d88d844-09a5-459e-a83c-89b1ca606228	created	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	{"queue": "Aplicaciones", "channel": "Portal", "category": "Software"}	2f6de875-7ad9-4cb7-a45a-4f59e97a163b	2026-10-20 10:49:25.617174+00
c7e7340e-7703-41e4-a85e-004e265b46d3	4e7b1ff1-8b20-4fbd-9787-1922846d4647	0d88d844-09a5-459e-a83c-89b1ca606228	created	e78bd373-85dc-4e61-8f11-29bcc9f1477b	{"queue": "Soporte técnico", "channel": "Correo", "category": "Hardware"}	38f95fab-d508-41f6-95d6-3674baa8ffc4	2026-10-20 11:02:10.968829+00
cf335988-ff75-4d84-8510-9be60fba9f9f	4e7b1ff1-8b20-4fbd-9787-1922846d4647	0d88d844-09a5-459e-a83c-89b1ca606228	status_changed	977287c7-3787-434b-9108-c6157fad0347	{"queue": "Soporte técnico", "status": "new", "priority": "p3"}	887b65f4-d99b-4008-8154-7f12db90980c	2026-10-20 11:05:05.233867+00
0e849d24-d609-43bc-8677-2cab0675bbc1	4e7b1ff1-8b20-4fbd-9787-1922846d4647	0d88d844-09a5-459e-a83c-89b1ca606228	resolved	4d29adb9-307e-4ef2-92e4-6fc7d9dc7fcf	{"resolutionNotes": "Le di al boton de encender"}	c558ebc5-18b9-4226-b888-fd6e7ab3187d	2026-10-20 11:07:24.85721+00
31b7ca07-46a6-497a-9e12-fa205eecbd43	cbb4b3e0-dfa2-4f28-af22-d14ec83cc90f	0d88d844-09a5-459e-a83c-89b1ca606228	created	e78bd373-85dc-4e61-8f11-29bcc9f1477b	{"queue": "Aplicaciones", "channel": "Correo", "category": "Software"}	56c3a9bb-7e01-4c07-b754-574de7617899	2026-10-20 11:10:39.418021+00
38e19076-5a44-4512-bcef-bf53fe77f982	cbb4b3e0-dfa2-4f28-af22-d14ec83cc90f	0d88d844-09a5-459e-a83c-89b1ca606228	status_changed	977287c7-3787-434b-9108-c6157fad0347	{"queue": "Aplicaciones", "status": "new", "priority": "p1"}	cb402dcf-bb70-4a42-869a-9ec9dab2b954	2026-10-20 11:11:07.079904+00
5c7039c3-c51f-4916-9707-2b181e0f416b	b37c4f56-cbff-441e-a3fa-70aa3342df7c	0d88d844-09a5-459e-a83c-89b1ca606228	status_changed	977287c7-3787-434b-9108-c6157fad0347	{"queue": "Aplicaciones", "status": "new", "priority": "p1"}	773825fa-6197-4fd9-a387-e4cf6d321114	2026-10-20 11:11:10.924845+00
e995bcd5-a3ef-4aa9-91b2-640a453ca379	e447ddd2-657b-49b5-9c17-d1327a268a03	0d88d844-09a5-459e-a83c-89b1ca606228	created	977287c7-3787-434b-9108-c6157fad0347	{"queue": "Aplicaciones", "channel": "Correo", "category": "Software"}	cc6c49f9-bfa3-400b-915d-b05af20cb9c6	2026-10-20 11:37:41.166259+00
37758998-25e4-44dc-968e-b457c0c857fd	e447ddd2-657b-49b5-9c17-d1327a268a03	0d88d844-09a5-459e-a83c-89b1ca606228	status_changed	977287c7-3787-434b-9108-c6157fad0347	{"queue": "Aplicaciones", "status": "new", "priority": "p2"}	67ab9002-f41c-48fa-b2f0-791f483b2777	2026-10-20 11:38:31.915914+00
73276390-cfb0-454a-9e9d-0ab2da7613b7	e447ddd2-657b-49b5-9c17-d1327a268a03	0d88d844-09a5-459e-a83c-89b1ca606228	resolved	e78bd373-85dc-4e61-8f11-29bcc9f1477b	{"resolutionNotes": "safari solo es de mac"}	18ad306a-0690-4190-8726-b39fddfdfa35	2026-10-20 11:39:59.531479+00
\.


--
-- Data for Name: tool_execution; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tool_execution (id, tenant_id, ai_turn_id, tool_code, tool_version, params_redacted, params_hash, result_hash, result_status, latency_ms, policy_version, actor_ref, created_at) FROM stdin;
\.


--
-- Name: ai_turn ai_turn_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_turn
    ADD CONSTRAINT ai_turn_pkey PRIMARY KEY (id);


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);


--
-- Name: assignment assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_pkey PRIMARY KEY (id);


--
-- Name: branch branch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_pkey PRIMARY KEY (id);


--
-- Name: call_session call_session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_session
    ADD CONSTRAINT call_session_pkey PRIMARY KEY (id);


--
-- Name: consent_record consent_record_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_record
    ADD CONSTRAINT consent_record_pkey PRIMARY KEY (id);


--
-- Name: conversation conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_pkey PRIMARY KEY (id);


--
-- Name: external_ticket_link external_ticket_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_ticket_link
    ADD CONSTRAINT external_ticket_link_pkey PRIMARY KEY (id);


--
-- Name: handoff handoff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handoff
    ADD CONSTRAINT handoff_pkey PRIMARY KEY (id);


--
-- Name: inbox_message inbox_message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbox_message
    ADD CONSTRAINT inbox_message_pkey PRIMARY KEY (id);


--
-- Name: interaction interaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction
    ADD CONSTRAINT interaction_pkey PRIMARY KEY (id);


--
-- Name: knowledge_article knowledge_article_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_article
    ADD CONSTRAINT knowledge_article_pkey PRIMARY KEY (id);


--
-- Name: knowledge_chunk knowledge_chunk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunk
    ADD CONSTRAINT knowledge_chunk_pkey PRIMARY KEY (id);


--
-- Name: knowledge_version knowledge_version_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_version
    ADD CONSTRAINT knowledge_version_pkey PRIMARY KEY (id);


--
-- Name: notification_request notification_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_request
    ADD CONSTRAINT notification_request_pkey PRIMARY KEY (id);


--
-- Name: outbox_message outbox_message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbox_message
    ADD CONSTRAINT outbox_message_pkey PRIMARY KEY (id);


--
-- Name: priority_matrix_cell priority_matrix_cell_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.priority_matrix_cell
    ADD CONSTRAINT priority_matrix_cell_pkey PRIMARY KEY (id);


--
-- Name: priority_matrix priority_matrix_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.priority_matrix
    ADD CONSTRAINT priority_matrix_pkey PRIMARY KEY (id);


--
-- Name: priority_override priority_override_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.priority_override
    ADD CONSTRAINT priority_override_pkey PRIMARY KEY (id);


--
-- Name: queue queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_pkey PRIMARY KEY (id);


--
-- Name: retrieval_evidence retrieval_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_evidence
    ADD CONSTRAINT retrieval_evidence_pkey PRIMARY KEY (id);


--
-- Name: skill skill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT skill_pkey PRIMARY KEY (id);


--
-- Name: sla_clock sla_clock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_clock
    ADD CONSTRAINT sla_clock_pkey PRIMARY KEY (id);


--
-- Name: sla_policy sla_policy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_policy
    ADD CONSTRAINT sla_policy_pkey PRIMARY KEY (id);


--
-- Name: sla_target sla_target_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_target
    ADD CONSTRAINT sla_target_pkey PRIMARY KEY (id);


--
-- Name: taxonomy_category taxonomy_category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_category
    ADD CONSTRAINT taxonomy_category_pkey PRIMARY KEY (id);


--
-- Name: taxonomy taxonomy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy
    ADD CONSTRAINT taxonomy_pkey PRIMARY KEY (id);


--
-- Name: tenant tenant_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_code_key UNIQUE (code);


--
-- Name: tenant tenant_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_organization_id_key UNIQUE (organization_id);


--
-- Name: tenant tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_pkey PRIMARY KEY (id);


--
-- Name: ticket_chat_message ticket_chat_message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_chat_message
    ADD CONSTRAINT ticket_chat_message_pkey PRIMARY KEY (id);


--
-- Name: ticket_number_counter ticket_number_counter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_number_counter
    ADD CONSTRAINT ticket_number_counter_pkey PRIMARY KEY (tenant_id);


--
-- Name: ticket ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_pkey PRIMARY KEY (id);


--
-- Name: ticket_timeline ticket_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_timeline
    ADD CONSTRAINT ticket_timeline_pkey PRIMARY KEY (id);


--
-- Name: tool_execution tool_execution_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_execution
    ADD CONSTRAINT tool_execution_pkey PRIMARY KEY (id);


--
-- Name: branch_tenant_id_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX branch_tenant_id_code_idx ON public.branch USING btree (tenant_id, code);


--
-- Name: external_ticket_link_provider_external_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX external_ticket_link_provider_external_id_idx ON public.external_ticket_link USING btree (provider, external_id);


--
-- Name: inbox_message_consumer_event_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX inbox_message_consumer_event_id_idx ON public.inbox_message USING btree (consumer, event_id);


--
-- Name: interaction_conversation_id_sequence_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX interaction_conversation_id_sequence_idx ON public.interaction USING btree (conversation_id, sequence);


--
-- Name: ix_ticket_chat_message_ticket_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ticket_chat_message_ticket_created ON public.ticket_chat_message USING btree (ticket_id, created_at, id);


--
-- Name: ix_ticket_requester_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ticket_requester_ref ON public.ticket USING btree (requester_ref);


--
-- Name: knowledge_chunk_version_id_ordinal_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX knowledge_chunk_version_id_ordinal_idx ON public.knowledge_chunk USING btree (version_id, ordinal);


--
-- Name: knowledge_version_article_id_version_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX knowledge_version_article_id_version_number_idx ON public.knowledge_version USING btree (article_id, version_number);


--
-- Name: notification_request_tenant_id_dedupe_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX notification_request_tenant_id_dedupe_key_idx ON public.notification_request USING btree (tenant_id, dedupe_key);


--
-- Name: priority_matrix_cell_matrix_id_impact_urgency_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX priority_matrix_cell_matrix_id_impact_urgency_idx ON public.priority_matrix_cell USING btree (matrix_id, impact, urgency);


--
-- Name: priority_matrix_tenant_id_version_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX priority_matrix_tenant_id_version_idx ON public.priority_matrix USING btree (tenant_id, version);


--
-- Name: queue_tenant_id_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX queue_tenant_id_code_idx ON public.queue USING btree (tenant_id, code);


--
-- Name: skill_tenant_id_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX skill_tenant_id_code_idx ON public.skill USING btree (tenant_id, code);


--
-- Name: sla_clock_ticket_id_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sla_clock_ticket_id_kind_idx ON public.sla_clock USING btree (ticket_id, kind);


--
-- Name: sla_policy_tenant_id_version_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sla_policy_tenant_id_version_idx ON public.sla_policy USING btree (tenant_id, version);


--
-- Name: sla_target_sla_policy_id_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sla_target_sla_policy_id_priority_idx ON public.sla_target USING btree (sla_policy_id, priority);


--
-- Name: taxonomy_category_taxonomy_id_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX taxonomy_category_taxonomy_id_code_idx ON public.taxonomy_category USING btree (taxonomy_id, code);


--
-- Name: taxonomy_tenant_id_version_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX taxonomy_tenant_id_version_idx ON public.taxonomy USING btree (tenant_id, version);


--
-- Name: ticket_tenant_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_tenant_id_created_at_idx ON public.ticket USING btree (tenant_id, created_at);


--
-- Name: ticket_tenant_id_display_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ticket_tenant_id_display_number_idx ON public.ticket USING btree (tenant_id, display_number);


--
-- Name: ticket_tenant_id_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_tenant_id_priority_idx ON public.ticket USING btree (tenant_id, priority);


--
-- Name: ticket_tenant_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_tenant_id_status_idx ON public.ticket USING btree (tenant_id, status);


--
-- Name: ux_app_user_email_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_app_user_email_lower ON public.app_user USING btree (lower((email)::text));


--
-- Name: ai_turn ai_turn_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_turn
    ADD CONSTRAINT ai_turn_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id);


--
-- Name: ai_turn ai_turn_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_turn
    ADD CONSTRAINT ai_turn_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: ai_turn ai_turn_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_turn
    ADD CONSTRAINT ai_turn_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id);


--
-- Name: app_user app_user_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id) ON DELETE RESTRICT;


--
-- Name: assignment assignment_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.queue(id);


--
-- Name: assignment assignment_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill(id);


--
-- Name: assignment assignment_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: assignment assignment_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id);


--
-- Name: branch branch_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: call_session call_session_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_session
    ADD CONSTRAINT call_session_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id);


--
-- Name: call_session call_session_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_session
    ADD CONSTRAINT call_session_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: consent_record consent_record_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_record
    ADD CONSTRAINT consent_record_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id);


--
-- Name: consent_record consent_record_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_record
    ADD CONSTRAINT consent_record_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: conversation conversation_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id);


--
-- Name: conversation conversation_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: external_ticket_link external_ticket_link_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_ticket_link
    ADD CONSTRAINT external_ticket_link_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: external_ticket_link external_ticket_link_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_ticket_link
    ADD CONSTRAINT external_ticket_link_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id);


--
-- Name: handoff handoff_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handoff
    ADD CONSTRAINT handoff_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: handoff handoff_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handoff
    ADD CONSTRAINT handoff_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id);


--
-- Name: inbox_message inbox_message_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbox_message
    ADD CONSTRAINT inbox_message_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: interaction interaction_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction
    ADD CONSTRAINT interaction_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id);


--
-- Name: interaction interaction_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction
    ADD CONSTRAINT interaction_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: knowledge_article knowledge_article_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_article
    ADD CONSTRAINT knowledge_article_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: knowledge_chunk knowledge_chunk_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunk
    ADD CONSTRAINT knowledge_chunk_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.knowledge_version(id);


--
-- Name: knowledge_version knowledge_version_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_version
    ADD CONSTRAINT knowledge_version_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.knowledge_article(id);


--
-- Name: notification_request notification_request_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_request
    ADD CONSTRAINT notification_request_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id);


--
-- Name: notification_request notification_request_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_request
    ADD CONSTRAINT notification_request_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: notification_request notification_request_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_request
    ADD CONSTRAINT notification_request_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id);


--
-- Name: outbox_message outbox_message_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbox_message
    ADD CONSTRAINT outbox_message_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: priority_matrix_cell priority_matrix_cell_matrix_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.priority_matrix_cell
    ADD CONSTRAINT priority_matrix_cell_matrix_id_fkey FOREIGN KEY (matrix_id) REFERENCES public.priority_matrix(id);


--
-- Name: priority_matrix priority_matrix_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.priority_matrix
    ADD CONSTRAINT priority_matrix_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: priority_override priority_override_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.priority_override
    ADD CONSTRAINT priority_override_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: priority_override priority_override_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.priority_override
    ADD CONSTRAINT priority_override_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id);


--
-- Name: queue queue_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: retrieval_evidence retrieval_evidence_ai_turn_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_evidence
    ADD CONSTRAINT retrieval_evidence_ai_turn_id_fkey FOREIGN KEY (ai_turn_id) REFERENCES public.ai_turn(id);


--
-- Name: retrieval_evidence retrieval_evidence_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_evidence
    ADD CONSTRAINT retrieval_evidence_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.knowledge_article(id);


--
-- Name: retrieval_evidence retrieval_evidence_chunk_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_evidence
    ADD CONSTRAINT retrieval_evidence_chunk_id_fkey FOREIGN KEY (chunk_id) REFERENCES public.knowledge_chunk(id);


--
-- Name: retrieval_evidence retrieval_evidence_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retrieval_evidence
    ADD CONSTRAINT retrieval_evidence_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.knowledge_version(id);


--
-- Name: skill skill_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT skill_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: sla_clock sla_clock_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_clock
    ADD CONSTRAINT sla_clock_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: sla_clock sla_clock_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_clock
    ADD CONSTRAINT sla_clock_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id);


--
-- Name: sla_policy sla_policy_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_policy
    ADD CONSTRAINT sla_policy_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: sla_target sla_target_sla_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_target
    ADD CONSTRAINT sla_target_sla_policy_id_fkey FOREIGN KEY (sla_policy_id) REFERENCES public.sla_policy(id);


--
-- Name: taxonomy_category taxonomy_category_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_category
    ADD CONSTRAINT taxonomy_category_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.taxonomy_category(id);


--
-- Name: taxonomy_category taxonomy_category_taxonomy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_category
    ADD CONSTRAINT taxonomy_category_taxonomy_id_fkey FOREIGN KEY (taxonomy_id) REFERENCES public.taxonomy(id);


--
-- Name: taxonomy taxonomy_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy
    ADD CONSTRAINT taxonomy_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: ticket ticket_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id);


--
-- Name: ticket ticket_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.taxonomy_category(id);


--
-- Name: ticket_chat_message ticket_chat_message_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_chat_message
    ADD CONSTRAINT ticket_chat_message_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.app_user(id) ON DELETE SET NULL;


--
-- Name: ticket_chat_message ticket_chat_message_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_chat_message
    ADD CONSTRAINT ticket_chat_message_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id) ON DELETE CASCADE;


--
-- Name: ticket ticket_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id);


--
-- Name: ticket_number_counter ticket_number_counter_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_number_counter
    ADD CONSTRAINT ticket_number_counter_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: ticket ticket_priority_matrix_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_priority_matrix_id_fkey FOREIGN KEY (priority_matrix_id) REFERENCES public.priority_matrix(id);


--
-- Name: ticket ticket_sla_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_sla_policy_id_fkey FOREIGN KEY (sla_policy_id) REFERENCES public.sla_policy(id);


--
-- Name: ticket ticket_taxonomy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_taxonomy_id_fkey FOREIGN KEY (taxonomy_id) REFERENCES public.taxonomy(id);


--
-- Name: ticket ticket_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: ticket_timeline ticket_timeline_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_timeline
    ADD CONSTRAINT ticket_timeline_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- Name: ticket_timeline ticket_timeline_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_timeline
    ADD CONSTRAINT ticket_timeline_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id);


--
-- Name: tool_execution tool_execution_ai_turn_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_execution
    ADD CONSTRAINT tool_execution_ai_turn_id_fkey FOREIGN KEY (ai_turn_id) REFERENCES public.ai_turn(id);


--
-- Name: tool_execution tool_execution_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_execution
    ADD CONSTRAINT tool_execution_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- PostgreSQL database dump complete
--

\unrestrict fVF5OsrMwKOTbtvfxnjHBR9H3oewhoa5LkgfJ4eSVUhAwGHU2MAT6Ggfc0O389n

