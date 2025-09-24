--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

-- Started on 2025-07-26 18:17:33 UTC

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

DROP DATABASE IF EXISTS neondb;
--
-- TOC entry 8654 (class 1262 OID 16389)
-- Name: neondb; Type: DATABASE; Schema: -; Owner: neondb_owner
--

CREATE DATABASE neondb WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C.UTF-8';


ALTER DATABASE neondb OWNER TO neondb_owner;

\connect neondb

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16477)
-- Name: affiliate_clicks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.affiliate_clicks (
    id integer NOT NULL,
    offer_id integer,
    session_id character varying(255),
    user_agent text,
    ip_address character varying(45),
    referrer_url text,
    source_page character varying(255),
    clicked_at timestamp without time zone DEFAULT now(),
    conversion_tracked boolean DEFAULT false,
    metadata jsonb
);


ALTER TABLE public.affiliate_clicks OWNER TO neondb_owner;

--
-- TOC entry 215 (class 1259 OID 16476)
-- Name: affiliate_clicks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.affiliate_clicks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliate_clicks_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8656 (class 0 OID 0)
-- Dependencies: 215
-- Name: affiliate_clicks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.affiliate_clicks_id_seq OWNED BY public.affiliate_clicks.id;


--
-- TOC entry 609 (class 1259 OID 19394)
-- Name: affiliate_compliance_management; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.affiliate_compliance_management (
    id integer NOT NULL,
    network_name character varying(255) NOT NULL,
    network_type character varying(100) NOT NULL,
    network_id character varying(255),
    allowed_countries jsonb,
    restricted_countries jsonb,
    restricted_regions jsonb,
    legal_frameworks jsonb,
    required_disclosures jsonb,
    disclosure_templates jsonb,
    disclosure_position character varying(50),
    disclosure_languages jsonb,
    network_policies jsonb,
    commission_structure jsonb,
    cookie_duration integer,
    tracking_methods jsonb,
    compliance_checks jsonb,
    last_compliance_check timestamp without time zone,
    compliance_score numeric(3,2),
    violation_history jsonb,
    status character varying(50) DEFAULT 'active'::character varying,
    contract_start timestamp without time zone,
    contract_end timestamp without time zone,
    auto_renewal boolean DEFAULT false,
    total_clicks integer DEFAULT 0,
    total_conversions integer DEFAULT 0,
    total_revenue numeric(12,2) DEFAULT '0'::numeric,
    avg_epc numeric(8,4),
    account_manager character varying(255),
    support_email character varying(320),
    technical_contact jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.affiliate_compliance_management OWNER TO neondb_owner;

--
-- TOC entry 608 (class 1259 OID 19393)
-- Name: affiliate_compliance_management_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.affiliate_compliance_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliate_compliance_management_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8657 (class 0 OID 0)
-- Dependencies: 608
-- Name: affiliate_compliance_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.affiliate_compliance_management_id_seq OWNED BY public.affiliate_compliance_management.id;


--
-- TOC entry 218 (class 1259 OID 16488)
-- Name: affiliate_networks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.affiliate_networks (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    base_url text NOT NULL,
    tracking_params jsonb,
    cookie_settings jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.affiliate_networks OWNER TO neondb_owner;

--
-- TOC entry 217 (class 1259 OID 16487)
-- Name: affiliate_networks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.affiliate_networks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliate_networks_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8658 (class 0 OID 0)
-- Dependencies: 217
-- Name: affiliate_networks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.affiliate_networks_id_seq OWNED BY public.affiliate_networks.id;


--
-- TOC entry 220 (class 1259 OID 16502)
-- Name: affiliate_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.affiliate_offers (
    id integer NOT NULL,
    network_id integer,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    emotion character varying(50),
    target_url text NOT NULL,
    cta_text character varying(100),
    commission character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.affiliate_offers OWNER TO neondb_owner;

--
-- TOC entry 219 (class 1259 OID 16501)
-- Name: affiliate_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.affiliate_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliate_offers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8659 (class 0 OID 0)
-- Dependencies: 219
-- Name: affiliate_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.affiliate_offers_id_seq OWNED BY public.affiliate_offers.id;


--
-- TOC entry 623 (class 1259 OID 19538)
-- Name: affiliate_partners; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.affiliate_partners (
    id integer NOT NULL,
    partner_id character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    company character varying(255),
    partner_type character varying(50) NOT NULL,
    commission_rate real DEFAULT 0,
    custom_commissions jsonb,
    payout_method character varying(50) DEFAULT 'paypal'::character varying,
    payout_details jsonb,
    total_earnings numeric(15,2) DEFAULT '0'::numeric,
    pending_earnings numeric(15,2) DEFAULT '0'::numeric,
    paid_earnings numeric(15,2) DEFAULT '0'::numeric,
    total_sales integer DEFAULT 0,
    total_clicks integer DEFAULT 0,
    conversion_rate real DEFAULT 0,
    status character varying(20) DEFAULT 'pending'::character varying,
    tier character varying(20) DEFAULT 'standard'::character varying,
    allowed_products integer[],
    cookie_duration integer DEFAULT 30,
    phone character varying(50),
    website character varying(255),
    social_profiles jsonb,
    tax_info jsonb,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    verified_at timestamp without time zone,
    last_activity_at timestamp without time zone
);


ALTER TABLE public.affiliate_partners OWNER TO neondb_owner;

--
-- TOC entry 622 (class 1259 OID 19537)
-- Name: affiliate_partners_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.affiliate_partners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliate_partners_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8660 (class 0 OID 0)
-- Dependencies: 622
-- Name: affiliate_partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.affiliate_partners_id_seq OWNED BY public.affiliate_partners.id;


--
-- TOC entry 625 (class 1259 OID 19563)
-- Name: affiliate_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.affiliate_tracking (
    id integer NOT NULL,
    partner_id character varying(100) NOT NULL,
    order_id integer,
    product_id integer,
    click_id character varying(255) NOT NULL,
    session_id character varying(255),
    user_id character varying(255),
    campaign character varying(100),
    source character varying(100),
    medium character varying(100),
    content character varying(255),
    sale_amount numeric(10,2),
    commission_rate real,
    commission_amount numeric(10,2),
    commission_status character varying(20) DEFAULT 'pending'::character varying,
    clicked_at timestamp without time zone,
    converted_at timestamp without time zone,
    conversion_type character varying(50),
    ip_address character varying(45),
    user_agent text,
    country_code character varying(2),
    device_type character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.affiliate_tracking OWNER TO neondb_owner;

--
-- TOC entry 624 (class 1259 OID 19562)
-- Name: affiliate_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.affiliate_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliate_tracking_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8661 (class 0 OID 0)
-- Dependencies: 624
-- Name: affiliate_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.affiliate_tracking_id_seq OWNED BY public.affiliate_tracking.id;


--
-- TOC entry 677 (class 1259 OID 20007)
-- Name: agent_memories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.agent_memories (
    id integer NOT NULL,
    memory_id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    task_type character varying(100) NOT NULL,
    prompt text NOT NULL,
    response text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    embedding jsonb,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    quality_score real,
    usage_count integer DEFAULT 1 NOT NULL,
    last_used timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.agent_memories OWNER TO neondb_owner;

--
-- TOC entry 676 (class 1259 OID 20006)
-- Name: agent_memories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.agent_memories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_memories_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8662 (class 0 OID 0)
-- Dependencies: 676
-- Name: agent_memories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.agent_memories_id_seq OWNED BY public.agent_memories.id;


--
-- TOC entry 709 (class 1259 OID 20324)
-- Name: agent_rewards; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.agent_rewards (
    id integer NOT NULL,
    reward_id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id character varying(255) NOT NULL,
    prompt_version character varying(50),
    task_type character varying(100) NOT NULL,
    reward_score real NOT NULL,
    performance_score real NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    success_rate real DEFAULT 0 NOT NULL,
    recent_performance real DEFAULT 0 NOT NULL,
    weekly_performance real DEFAULT 0 NOT NULL,
    overall_performance real DEFAULT 0 NOT NULL,
    persona_performance jsonb DEFAULT '{}'::jsonb NOT NULL,
    device_performance jsonb DEFAULT '{}'::jsonb NOT NULL,
    geo_performance jsonb DEFAULT '{}'::jsonb NOT NULL,
    current_rank integer DEFAULT 100 NOT NULL,
    routing_weight real DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_training_run timestamp without time zone,
    training_data_count integer DEFAULT 0 NOT NULL,
    model_version character varying(50),
    last_updated timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.agent_rewards OWNER TO neondb_owner;

--
-- TOC entry 708 (class 1259 OID 20323)
-- Name: agent_rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.agent_rewards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_rewards_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8663 (class 0 OID 0)
-- Dependencies: 708
-- Name: agent_rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.agent_rewards_id_seq OWNED BY public.agent_rewards.id;


--
-- TOC entry 679 (class 1259 OID 20025)
-- Name: agent_usage_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.agent_usage_tracking (
    id integer NOT NULL,
    tracking_id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    user_id integer,
    project_id character varying(100),
    task_type character varying(100) NOT NULL,
    input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    total_cost real DEFAULT 0 NOT NULL,
    latency_ms integer NOT NULL,
    success boolean NOT NULL,
    executed_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.agent_usage_tracking OWNER TO neondb_owner;

--
-- TOC entry 678 (class 1259 OID 20024)
-- Name: agent_usage_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.agent_usage_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_usage_tracking_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8664 (class 0 OID 0)
-- Dependencies: 678
-- Name: agent_usage_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.agent_usage_tracking_id_seq OWNED BY public.agent_usage_tracking.id;


--
-- TOC entry 681 (class 1259 OID 20042)
-- Name: agentic_workflows; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.agentic_workflows (
    id integer NOT NULL,
    workflow_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    definition jsonb NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    trigger jsonb NOT NULL,
    input_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    output_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    max_execution_time integer DEFAULT 300 NOT NULL,
    retry_policy jsonb DEFAULT '{}'::jsonb NOT NULL,
    cost_budget real DEFAULT 0 NOT NULL,
    execution_count integer DEFAULT 0 NOT NULL,
    success_count integer DEFAULT 0 NOT NULL,
    average_duration integer DEFAULT 0 NOT NULL,
    average_cost real DEFAULT 0 NOT NULL,
    last_executed timestamp without time zone,
    created_by integer NOT NULL,
    version character varying(20) DEFAULT '1.0'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.agentic_workflows OWNER TO neondb_owner;

--
-- TOC entry 680 (class 1259 OID 20041)
-- Name: agentic_workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.agentic_workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agentic_workflows_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8665 (class 0 OID 0)
-- Dependencies: 680
-- Name: agentic_workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.agentic_workflows_id_seq OWNED BY public.agentic_workflows.id;


--
-- TOC entry 457 (class 1259 OID 18252)
-- Name: ai_ml_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_ml_analytics (
    id integer NOT NULL,
    date timestamp without time zone NOT NULL,
    vertical character varying(100),
    neuron_id character varying(255),
    model_type character varying(100),
    metrics jsonb NOT NULL,
    predictions integer DEFAULT 0,
    correct_predictions integer DEFAULT 0,
    accuracy numeric(5,4),
    revenue_impact numeric(10,2),
    user_impact integer DEFAULT 0,
    optimizations_applied integer DEFAULT 0,
    rules_triggered integer DEFAULT 0,
    experiments_running integer DEFAULT 0,
    data_quality numeric(5,4),
    system_health character varying(50) DEFAULT 'healthy'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_ml_analytics OWNER TO neondb_owner;

--
-- TOC entry 456 (class 1259 OID 18251)
-- Name: ai_ml_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ai_ml_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_ml_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8666 (class 0 OID 0)
-- Dependencies: 456
-- Name: ai_ml_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ai_ml_analytics_id_seq OWNED BY public.ai_ml_analytics.id;


--
-- TOC entry 459 (class 1259 OID 18269)
-- Name: ai_ml_audit_trail; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_ml_audit_trail (
    id integer NOT NULL,
    audit_id character varying(255) NOT NULL,
    action character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id character varying(255) NOT NULL,
    user_id character varying(255),
    session_id character varying(255),
    old_value jsonb,
    new_value jsonb,
    change_reason text,
    impact jsonb,
    is_automatic boolean DEFAULT false,
    learning_cycle_id character varying(255),
    metadata jsonb,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_ml_audit_trail OWNER TO neondb_owner;

--
-- TOC entry 458 (class 1259 OID 18268)
-- Name: ai_ml_audit_trail_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ai_ml_audit_trail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_ml_audit_trail_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8667 (class 0 OID 0)
-- Dependencies: 458
-- Name: ai_ml_audit_trail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ai_ml_audit_trail_id_seq OWNED BY public.ai_ml_audit_trail.id;


--
-- TOC entry 461 (class 1259 OID 18282)
-- Name: ai_ml_experiments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_ml_experiments (
    id integer NOT NULL,
    experiment_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(100) NOT NULL,
    vertical character varying(100),
    model_id character varying(255),
    hypothesis text,
    variants jsonb NOT NULL,
    traffic_allocation integer DEFAULT 100,
    status character varying(50) DEFAULT 'draft'::character varying,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    results jsonb,
    winner character varying(255),
    confidence numeric(5,4),
    significance numeric(5,4),
    created_by character varying(255),
    learning_cycle_id character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_ml_experiments OWNER TO neondb_owner;

--
-- TOC entry 460 (class 1259 OID 18281)
-- Name: ai_ml_experiments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ai_ml_experiments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_ml_experiments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8668 (class 0 OID 0)
-- Dependencies: 460
-- Name: ai_ml_experiments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ai_ml_experiments_id_seq OWNED BY public.ai_ml_experiments.id;


--
-- TOC entry 463 (class 1259 OID 18297)
-- Name: ai_ml_models; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_ml_models (
    id integer NOT NULL,
    model_id character varying(255) NOT NULL,
    model_type character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    version character varying(50) NOT NULL,
    weights jsonb NOT NULL,
    hyperparameters jsonb,
    architecture jsonb,
    training_data jsonb NOT NULL,
    performance jsonb NOT NULL,
    accuracy numeric(5,4),
    is_active boolean DEFAULT true,
    is_production boolean DEFAULT false,
    training_start_time timestamp without time zone,
    training_end_time timestamp without time zone,
    deployed_at timestamp without time zone,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_ml_models OWNER TO neondb_owner;

--
-- TOC entry 462 (class 1259 OID 18296)
-- Name: ai_ml_models_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ai_ml_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_ml_models_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8669 (class 0 OID 0)
-- Dependencies: 462
-- Name: ai_ml_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ai_ml_models_id_seq OWNED BY public.ai_ml_models.id;


--
-- TOC entry 433 (class 1259 OID 18091)
-- Name: ai_tools; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    "shortDescription" text,
    website text NOT NULL,
    logo text,
    "categoryId" integer NOT NULL,
    subcategories jsonb,
    "pricingModel" text NOT NULL,
    "priceFrom" numeric(10,2),
    "priceTo" numeric(10,2),
    "pricingDetails" jsonb,
    features jsonb,
    "useCase" jsonb,
    platforms jsonb,
    integrations jsonb,
    "apiAvailable" boolean DEFAULT false,
    rating numeric(3,2) DEFAULT '0'::numeric,
    "totalReviews" integer DEFAULT 0,
    "launchDate" timestamp without time zone,
    "lastUpdated" timestamp without time zone,
    "isActive" boolean DEFAULT true,
    "isFeatured" boolean DEFAULT false,
    "trustScore" integer DEFAULT 50,
    "metaTitle" text,
    "metaDescription" text,
    tags jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools OWNER TO neondb_owner;

--
-- TOC entry 435 (class 1259 OID 18109)
-- Name: ai_tools_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_analytics (
    id integer NOT NULL,
    "sessionId" text NOT NULL,
    event text NOT NULL,
    "toolId" integer,
    "categoryId" integer,
    "contentId" integer,
    "offerId" integer,
    "userArchetype" text,
    "deviceType" text,
    source text,
    data jsonb,
    value numeric(10,2),
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_analytics OWNER TO neondb_owner;

--
-- TOC entry 434 (class 1259 OID 18108)
-- Name: ai_tools_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_analytics ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_analytics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 437 (class 1259 OID 18118)
-- Name: ai_tools_archetypes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_archetypes (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    "primaryMotivation" text NOT NULL,
    "preferredFeatures" jsonb,
    "uiPreferences" jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_archetypes OWNER TO neondb_owner;

--
-- TOC entry 436 (class 1259 OID 18117)
-- Name: ai_tools_archetypes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_archetypes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_archetypes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 439 (class 1259 OID 18132)
-- Name: ai_tools_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    icon text,
    "parentId" integer,
    "sortOrder" integer DEFAULT 0,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_categories OWNER TO neondb_owner;

--
-- TOC entry 438 (class 1259 OID 18131)
-- Name: ai_tools_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_categories ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 441 (class 1259 OID 18145)
-- Name: ai_tools_comparisons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_comparisons (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    "toolIds" jsonb NOT NULL,
    criteria jsonb,
    "overallWinner" integer,
    "categoryWinners" jsonb,
    "metaTitle" text,
    "metaDescription" text,
    views integer DEFAULT 0,
    "isPublished" boolean DEFAULT true,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_comparisons OWNER TO neondb_owner;

--
-- TOC entry 440 (class 1259 OID 18144)
-- Name: ai_tools_comparisons_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_comparisons ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_comparisons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 443 (class 1259 OID 18159)
-- Name: ai_tools_content; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_content (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    type text NOT NULL,
    excerpt text,
    content text NOT NULL,
    "featuredImage" text,
    "relatedTools" jsonb,
    categories jsonb,
    tags jsonb,
    "metaTitle" text,
    "metaDescription" text,
    "focusKeyword" text,
    views integer DEFAULT 0,
    "avgTimeOnPage" integer DEFAULT 0,
    "bounceRate" numeric(5,2) DEFAULT '0'::numeric,
    status text DEFAULT 'draft'::text,
    "publishedAt" timestamp without time zone,
    "isAiGenerated" boolean DEFAULT false,
    "generationPrompt" text,
    "lastOptimized" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_content OWNER TO neondb_owner;

--
-- TOC entry 442 (class 1259 OID 18158)
-- Name: ai_tools_content_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_content ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_content_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 445 (class 1259 OID 18176)
-- Name: ai_tools_experiments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_experiments (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    variants jsonb NOT NULL,
    "targetArchetypes" jsonb,
    "targetPages" jsonb,
    status text DEFAULT 'draft'::text,
    "startDate" timestamp without time zone,
    "endDate" timestamp without time zone,
    "participantCount" integer DEFAULT 0,
    results jsonb,
    winner text,
    confidence numeric(5,2),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_experiments OWNER TO neondb_owner;

--
-- TOC entry 444 (class 1259 OID 18175)
-- Name: ai_tools_experiments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_experiments ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_experiments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 432 (class 1259 OID 18090)
-- Name: ai_tools_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 447 (class 1259 OID 18188)
-- Name: ai_tools_leads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_leads (
    id integer NOT NULL,
    email text NOT NULL,
    "sessionId" text NOT NULL,
    source text NOT NULL,
    "leadMagnet" text,
    archetype text,
    interests jsonb,
    experience text,
    "quizTaken" boolean DEFAULT false,
    "downloadsCount" integer DEFAULT 0,
    "emailsOpened" integer DEFAULT 0,
    "emailsClicked" integer DEFAULT 0,
    "isSubscribed" boolean DEFAULT true,
    "unsubscribedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_leads OWNER TO neondb_owner;

--
-- TOC entry 446 (class 1259 OID 18187)
-- Name: ai_tools_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_leads ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_leads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 449 (class 1259 OID 18203)
-- Name: ai_tools_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_offers (
    id integer NOT NULL,
    "toolId" integer NOT NULL,
    title text NOT NULL,
    description text,
    "offerType" text NOT NULL,
    "originalPrice" numeric(10,2),
    "offerPrice" numeric(10,2),
    "discountPercentage" integer,
    "affiliateUrl" text NOT NULL,
    "affiliateNetwork" text,
    commission numeric(5,2),
    "startDate" timestamp without time zone,
    "endDate" timestamp without time zone,
    "isActive" boolean DEFAULT true,
    "isLimitedTime" boolean DEFAULT false,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    revenue numeric(10,2) DEFAULT '0'::numeric,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_offers OWNER TO neondb_owner;

--
-- TOC entry 448 (class 1259 OID 18202)
-- Name: ai_tools_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_offers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_offers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 451 (class 1259 OID 18218)
-- Name: ai_tools_quiz_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_quiz_results (
    id integer NOT NULL,
    "quizId" integer NOT NULL,
    "sessionId" text NOT NULL,
    "userId" text,
    answers jsonb NOT NULL,
    "primaryArchetype" text NOT NULL,
    "secondaryArchetype" text,
    "recommendedCategories" jsonb,
    "recommendedTools" jsonb,
    "archetypeScores" jsonb,
    "categoryScores" jsonb,
    "completedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_quiz_results OWNER TO neondb_owner;

--
-- TOC entry 450 (class 1259 OID 18217)
-- Name: ai_tools_quiz_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_quiz_results ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_quiz_results_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 453 (class 1259 OID 18227)
-- Name: ai_tools_quizzes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_quizzes (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    questions jsonb NOT NULL,
    "archetypeWeights" jsonb,
    "categoryWeights" jsonb,
    "isActive" boolean DEFAULT true,
    "totalTaken" integer DEFAULT 0,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_quizzes OWNER TO neondb_owner;

--
-- TOC entry 452 (class 1259 OID 18226)
-- Name: ai_tools_quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_quizzes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_quizzes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 455 (class 1259 OID 18239)
-- Name: ai_tools_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_tools_reviews (
    id integer NOT NULL,
    "toolId" integer NOT NULL,
    "userId" text,
    "sessionId" text,
    rating integer NOT NULL,
    title text,
    content text,
    pros jsonb,
    cons jsonb,
    "userArchetype" text,
    "useCase" text,
    "experienceLevel" text,
    verified boolean DEFAULT false,
    helpful integer DEFAULT 0,
    unhelpful integer DEFAULT 0,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools_reviews OWNER TO neondb_owner;

--
-- TOC entry 454 (class 1259 OID 18238)
-- Name: ai_tools_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.ai_tools_reviews ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_tools_reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 16516)
-- Name: alert_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.alert_rules (
    id integer NOT NULL,
    rule_id character varying(100) NOT NULL,
    metric character varying(100) NOT NULL,
    threshold real NOT NULL,
    operator character varying(20) NOT NULL,
    severity character varying(20) NOT NULL,
    actions text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.alert_rules OWNER TO neondb_owner;

--
-- TOC entry 221 (class 1259 OID 16515)
-- Name: alert_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.alert_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alert_rules_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8670 (class 0 OID 0)
-- Dependencies: 221
-- Name: alert_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.alert_rules_id_seq OWNED BY public.alert_rules.id;


--
-- TOC entry 224 (class 1259 OID 16530)
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.analytics_events (
    id integer NOT NULL,
    event_id character varying(36) NOT NULL,
    session_id character varying(255) NOT NULL,
    global_user_id integer,
    device_fingerprint character varying(255),
    event_type character varying(100) NOT NULL,
    event_category character varying(100),
    event_action character varying(100),
    event_label character varying(255),
    event_value integer,
    page_slug character varying(255),
    page_title character varying(255),
    referrer_url text,
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(100),
    utm_term character varying(100),
    utm_content character varying(100),
    device_type character varying(50),
    browser_name character varying(50),
    browser_version character varying(50),
    operating_system character varying(50),
    screen_resolution character varying(50),
    language character varying(10),
    timezone character varying(50),
    ip_address character varying(45),
    country character varying(5),
    region character varying(100),
    city character varying(100),
    coordinates jsonb,
    custom_data jsonb,
    server_timestamp timestamp without time zone DEFAULT now(),
    client_timestamp timestamp without time zone,
    processing_delay integer,
    is_processed boolean DEFAULT false,
    batch_id character varying(36),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.analytics_events OWNER TO neondb_owner;

--
-- TOC entry 223 (class 1259 OID 16529)
-- Name: analytics_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.analytics_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_events_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8671 (class 0 OID 0)
-- Dependencies: 223
-- Name: analytics_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.analytics_events_id_seq OWNED BY public.analytics_events.id;


--
-- TOC entry 226 (class 1259 OID 16544)
-- Name: analytics_sync_status; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.analytics_sync_status (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    global_user_id integer,
    last_sync_at timestamp without time zone DEFAULT now(),
    last_client_event_id character varying(36),
    last_server_event_id character varying(36),
    pending_event_count integer DEFAULT 0,
    sync_version character varying(10) DEFAULT '1.0'::character varying,
    client_version character varying(20),
    device_fingerprint character varying(255),
    sync_errors jsonb,
    is_healthy boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.analytics_sync_status OWNER TO neondb_owner;

--
-- TOC entry 225 (class 1259 OID 16543)
-- Name: analytics_sync_status_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.analytics_sync_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_sync_status_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8672 (class 0 OID 0)
-- Dependencies: 225
-- Name: analytics_sync_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.analytics_sync_status_id_seq OWNED BY public.analytics_sync_status.id;


--
-- TOC entry 228 (class 1259 OID 16559)
-- Name: api_neuron_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_neuron_analytics (
    id integer NOT NULL,
    neuron_id character varying(100),
    date timestamp without time zone NOT NULL,
    request_count integer DEFAULT 0,
    successful_requests integer DEFAULT 0,
    failed_requests integer DEFAULT 0,
    average_response_time integer DEFAULT 0,
    p95_response_time integer DEFAULT 0,
    p99_response_time integer DEFAULT 0,
    total_data_processed integer DEFAULT 0,
    error_rate integer DEFAULT 0,
    uptime integer DEFAULT 0,
    cpu_usage_avg integer DEFAULT 0,
    memory_usage_avg integer DEFAULT 0,
    disk_usage_avg integer DEFAULT 0,
    network_bytes_in integer DEFAULT 0,
    network_bytes_out integer DEFAULT 0,
    custom_metrics jsonb,
    alerts jsonb,
    events jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.api_neuron_analytics OWNER TO neondb_owner;

--
-- TOC entry 227 (class 1259 OID 16558)
-- Name: api_neuron_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.api_neuron_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_neuron_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8673 (class 0 OID 0)
-- Dependencies: 227
-- Name: api_neuron_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.api_neuron_analytics_id_seq OWNED BY public.api_neuron_analytics.id;


--
-- TOC entry 230 (class 1259 OID 16584)
-- Name: api_neuron_commands; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_neuron_commands (
    id integer NOT NULL,
    command_id character varying(36) NOT NULL,
    neuron_id character varying(100),
    command_type character varying(100) NOT NULL,
    command_data jsonb NOT NULL,
    priority integer DEFAULT 1,
    status character varying(50) DEFAULT 'pending'::character varying,
    issued_by character varying(255) NOT NULL,
    issued_at timestamp without time zone DEFAULT now() NOT NULL,
    sent_at timestamp without time zone,
    acknowledged_at timestamp without time zone,
    completed_at timestamp without time zone,
    failed_at timestamp without time zone,
    timeout_at timestamp without time zone,
    response jsonb,
    error_message text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    metadata jsonb
);


ALTER TABLE public.api_neuron_commands OWNER TO neondb_owner;

--
-- TOC entry 229 (class 1259 OID 16583)
-- Name: api_neuron_commands_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.api_neuron_commands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_neuron_commands_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8674 (class 0 OID 0)
-- Dependencies: 229
-- Name: api_neuron_commands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.api_neuron_commands_id_seq OWNED BY public.api_neuron_commands.id;


--
-- TOC entry 232 (class 1259 OID 16600)
-- Name: api_neuron_heartbeats; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_neuron_heartbeats (
    id integer NOT NULL,
    neuron_id character varying(100),
    status character varying(50) NOT NULL,
    health_score integer NOT NULL,
    uptime integer NOT NULL,
    process_id character varying(100),
    host_info jsonb,
    system_metrics jsonb,
    application_metrics jsonb,
    dependency_status jsonb,
    error_log text,
    warnings_log jsonb,
    performance_metrics jsonb,
    config_version character varying(50),
    build_version character varying(100),
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_neuron_heartbeats OWNER TO neondb_owner;

--
-- TOC entry 231 (class 1259 OID 16599)
-- Name: api_neuron_heartbeats_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.api_neuron_heartbeats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_neuron_heartbeats_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8675 (class 0 OID 0)
-- Dependencies: 231
-- Name: api_neuron_heartbeats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.api_neuron_heartbeats_id_seq OWNED BY public.api_neuron_heartbeats.id;


--
-- TOC entry 234 (class 1259 OID 16610)
-- Name: api_only_neurons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_only_neurons (
    id integer NOT NULL,
    neuron_id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    language character varying(50) NOT NULL,
    version character varying(50) NOT NULL,
    base_url text,
    healthcheck_endpoint text NOT NULL,
    api_endpoints jsonb NOT NULL,
    authentication jsonb NOT NULL,
    capabilities jsonb NOT NULL,
    dependencies jsonb,
    resource_requirements jsonb,
    deployment_info jsonb,
    status character varying(50) DEFAULT 'inactive'::character varying,
    last_heartbeat timestamp without time zone,
    health_score integer DEFAULT 100,
    uptime integer DEFAULT 0,
    error_count integer DEFAULT 0,
    total_requests integer DEFAULT 0,
    successful_requests integer DEFAULT 0,
    average_response_time integer DEFAULT 0,
    last_error text,
    alert_thresholds jsonb,
    auto_restart_enabled boolean DEFAULT true,
    max_restart_attempts integer DEFAULT 3,
    current_restart_attempts integer DEFAULT 0,
    last_restart_attempt timestamp without time zone,
    registered_at timestamp without time zone DEFAULT now(),
    api_key character varying(255) NOT NULL,
    metadata jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.api_only_neurons OWNER TO neondb_owner;

--
-- TOC entry 233 (class 1259 OID 16609)
-- Name: api_only_neurons_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.api_only_neurons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_only_neurons_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8676 (class 0 OID 0)
-- Dependencies: 233
-- Name: api_only_neurons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.api_only_neurons_id_seq OWNED BY public.api_only_neurons.id;


--
-- TOC entry 755 (class 1259 OID 20844)
-- Name: auto_scaling_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.auto_scaling_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    region_id text NOT NULL,
    scaling_action text NOT NULL,
    trigger_metric text NOT NULL,
    trigger_value real NOT NULL,
    threshold_value real NOT NULL,
    instances_before integer NOT NULL,
    instances_after integer NOT NULL,
    scaling_duration_seconds integer DEFAULT 0 NOT NULL,
    cost_impact real DEFAULT 0 NOT NULL,
    performance_impact jsonb,
    prediction_accuracy real,
    rollback_triggered boolean DEFAULT false NOT NULL,
    automation_confidence real DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auto_scaling_events OWNER TO neondb_owner;

--
-- TOC entry 659 (class 1259 OID 19847)
-- Name: backups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.backups (
    id integer NOT NULL,
    backup_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    backup_type character varying(50) NOT NULL,
    scope character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    file_size integer,
    checksum character varying(128),
    file_path text,
    storage_location character varying(100) NOT NULL,
    retention_days integer DEFAULT 90 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_encrypted boolean DEFAULT true NOT NULL,
    encryption_key character varying(128),
    compression_ratio real,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.backups OWNER TO neondb_owner;

--
-- TOC entry 658 (class 1259 OID 19846)
-- Name: backups_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.backups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.backups_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8677 (class 0 OID 0)
-- Dependencies: 658
-- Name: backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.backups_id_seq OWNED BY public.backups.id;


--
-- TOC entry 236 (class 1259 OID 16635)
-- Name: behavior_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.behavior_events (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    event_data jsonb,
    page_slug character varying(255),
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    user_id character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.behavior_events OWNER TO neondb_owner;

--
-- TOC entry 235 (class 1259 OID 16634)
-- Name: behavior_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.behavior_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.behavior_events_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8678 (class 0 OID 0)
-- Dependencies: 235
-- Name: behavior_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.behavior_events_id_seq OWNED BY public.behavior_events.id;


--
-- TOC entry 581 (class 1259 OID 19184)
-- Name: codex_audits; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.codex_audits (
    id integer NOT NULL,
    audit_id character varying(255) NOT NULL,
    audit_type character varying(100) NOT NULL,
    scope character varying(255) NOT NULL,
    target_path character varying(500),
    status character varying(50) DEFAULT 'pending'::character varying,
    priority character varying(20) DEFAULT 'medium'::character varying,
    llm_provider character varying(100) DEFAULT 'openai'::character varying,
    model_used character varying(100),
    prompt_template text,
    issues_found integer DEFAULT 0,
    issues_resolved integer DEFAULT 0,
    audit_score real,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    execution_time integer,
    triggered_by character varying(100),
    audit_config jsonb,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.codex_audits OWNER TO neondb_owner;

--
-- TOC entry 580 (class 1259 OID 19183)
-- Name: codex_audits_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.codex_audits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.codex_audits_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8679 (class 0 OID 0)
-- Dependencies: 580
-- Name: codex_audits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.codex_audits_id_seq OWNED BY public.codex_audits.id;


--
-- TOC entry 583 (class 1259 OID 19203)
-- Name: codex_fixes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.codex_fixes (
    id integer NOT NULL,
    issue_id integer,
    fix_id character varying(255) NOT NULL,
    fix_type character varying(100) NOT NULL,
    fix_category character varying(100),
    file_path character varying(500) NOT NULL,
    original_code text,
    fixed_code text,
    diff_patch text,
    status character varying(50) DEFAULT 'pending'::character varying,
    apply_method character varying(100),
    requires_approval boolean DEFAULT true,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    rejected_by character varying(255),
    rejected_at timestamp without time zone,
    rejection_reason text,
    commit_hash character varying(100),
    branch_name character varying(255),
    pull_request_url character varying(500),
    can_rollback boolean DEFAULT true,
    rollback_data jsonb,
    rolled_back_at timestamp without time zone,
    tests_passed boolean,
    validation_results jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    applied_at timestamp without time zone
);


ALTER TABLE public.codex_fixes OWNER TO neondb_owner;

--
-- TOC entry 582 (class 1259 OID 19202)
-- Name: codex_fixes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.codex_fixes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.codex_fixes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8680 (class 0 OID 0)
-- Dependencies: 582
-- Name: codex_fixes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.codex_fixes_id_seq OWNED BY public.codex_fixes.id;


--
-- TOC entry 585 (class 1259 OID 19219)
-- Name: codex_issues; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.codex_issues (
    id integer NOT NULL,
    audit_id integer,
    issue_id character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    severity character varying(20) NOT NULL,
    type character varying(100) NOT NULL,
    file_path character varying(500),
    line_number integer,
    column_number integer,
    code_snippet text,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    recommendation text,
    status character varying(50) DEFAULT 'open'::character varying,
    resolution character varying(50),
    ai_confidence real,
    ai_reasoning text,
    proposed_fix text,
    fix_diff text,
    fix_applied boolean DEFAULT false,
    impact_score real,
    risk_level character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    resolved_at timestamp without time zone
);


ALTER TABLE public.codex_issues OWNER TO neondb_owner;

--
-- TOC entry 584 (class 1259 OID 19218)
-- Name: codex_issues_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.codex_issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.codex_issues_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8681 (class 0 OID 0)
-- Dependencies: 584
-- Name: codex_issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.codex_issues_id_seq OWNED BY public.codex_issues.id;


--
-- TOC entry 587 (class 1259 OID 19234)
-- Name: codex_learning; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.codex_learning (
    id integer NOT NULL,
    learning_id character varying(255) NOT NULL,
    pattern_type character varying(100) NOT NULL,
    pattern_data jsonb NOT NULL,
    category character varying(100) NOT NULL,
    subcategory character varying(100),
    neuron_scope character varying(100),
    occurrence_count integer DEFAULT 1,
    success_rate real,
    confidence real,
    prevention_rule jsonb,
    improvement_suggestion text,
    automation_opportunity text,
    impact_score real,
    priority_level character varying(20),
    is_active boolean DEFAULT true,
    last_seen timestamp without time zone DEFAULT now(),
    evolution_stage character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.codex_learning OWNER TO neondb_owner;

--
-- TOC entry 586 (class 1259 OID 19233)
-- Name: codex_learning_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.codex_learning_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.codex_learning_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8682 (class 0 OID 0)
-- Dependencies: 586
-- Name: codex_learning_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.codex_learning_id_seq OWNED BY public.codex_learning.id;


--
-- TOC entry 589 (class 1259 OID 19250)
-- Name: codex_reports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.codex_reports (
    id integer NOT NULL,
    report_id character varying(255) NOT NULL,
    report_type character varying(100) NOT NULL,
    period character varying(50),
    scope character varying(100),
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    report_data jsonb NOT NULL,
    summary jsonb,
    metrics jsonb,
    insights jsonb,
    recommendations jsonb,
    generated_by character varying(100),
    generation_time integer,
    status character varying(50) DEFAULT 'generated'::character varying,
    is_public boolean DEFAULT false,
    export_formats jsonb,
    distribution_list jsonb,
    last_distributed timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.codex_reports OWNER TO neondb_owner;

--
-- TOC entry 588 (class 1259 OID 19249)
-- Name: codex_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.codex_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.codex_reports_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8683 (class 0 OID 0)
-- Dependencies: 588
-- Name: codex_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.codex_reports_id_seq OWNED BY public.codex_reports.id;


--
-- TOC entry 591 (class 1259 OID 19265)
-- Name: codex_schedules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.codex_schedules (
    id integer NOT NULL,
    schedule_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    audit_types jsonb NOT NULL,
    cron_expression character varying(100),
    frequency character varying(50),
    next_run timestamp without time zone,
    last_run timestamp without time zone,
    scope jsonb,
    filters jsonb,
    llm_config jsonb,
    audit_config jsonb,
    auto_fix_enabled boolean DEFAULT false,
    max_auto_fixes integer DEFAULT 10,
    is_active boolean DEFAULT true,
    last_successful_run timestamp without time zone,
    consecutive_failures integer DEFAULT 0,
    health_status character varying(50) DEFAULT 'healthy'::character varying,
    notify_on_completion boolean DEFAULT false,
    notify_on_failure boolean DEFAULT true,
    notification_channels jsonb,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.codex_schedules OWNER TO neondb_owner;

--
-- TOC entry 590 (class 1259 OID 19264)
-- Name: codex_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.codex_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.codex_schedules_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8684 (class 0 OID 0)
-- Dependencies: 590
-- Name: codex_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.codex_schedules_id_seq OWNED BY public.codex_schedules.id;


--
-- TOC entry 611 (class 1259 OID 19410)
-- Name: compliance_audit_system; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.compliance_audit_system (
    id integer NOT NULL,
    audit_id character varying(100) NOT NULL,
    audit_type character varying(100) NOT NULL,
    vertical character varying(100),
    country character varying(10),
    date_range jsonb,
    audit_criteria jsonb,
    status character varying(50) DEFAULT 'scheduled'::character varying,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    executed_by character varying(255),
    automated_scan boolean DEFAULT true,
    overall_score numeric(3,2),
    critical_issues integer DEFAULT 0,
    high_issues integer DEFAULT 0,
    medium_issues integer DEFAULT 0,
    low_issues integer DEFAULT 0,
    audit_findings jsonb,
    non_compliance_items jsonb,
    recommended_actions jsonb,
    risk_assessment jsonb,
    previous_audit_id integer,
    improvement_score numeric(3,2),
    trend_analysis jsonb,
    remediation_plan jsonb,
    remediation_deadline timestamp without time zone,
    remediation_status character varying(50),
    follow_up_required boolean DEFAULT false,
    next_audit_date timestamp without time zone,
    report_generated boolean DEFAULT false,
    report_url text,
    report_format character varying(50),
    stakeholders_notified boolean DEFAULT false,
    audit_framework character varying(100),
    audit_standard character varying(100),
    certification_impact boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.compliance_audit_system OWNER TO neondb_owner;

--
-- TOC entry 610 (class 1259 OID 19409)
-- Name: compliance_audit_system_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.compliance_audit_system_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compliance_audit_system_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8685 (class 0 OID 0)
-- Dependencies: 610
-- Name: compliance_audit_system_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.compliance_audit_system_id_seq OWNED BY public.compliance_audit_system.id;


--
-- TOC entry 613 (class 1259 OID 19433)
-- Name: compliance_rbac_management; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.compliance_rbac_management (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    role_id character varying(100) NOT NULL,
    role_name character varying(255) NOT NULL,
    permissions jsonb,
    vertical_access jsonb,
    country_access jsonb,
    data_access jsonb,
    role_type character varying(50) NOT NULL,
    access_level character varying(50) NOT NULL,
    can_view_pii boolean DEFAULT false,
    can_export_data boolean DEFAULT false,
    can_delete_data boolean DEFAULT false,
    can_manage_consent boolean DEFAULT false,
    session_timeout integer DEFAULT 3600,
    ip_whitelist jsonb,
    require_mfa boolean DEFAULT true,
    last_login timestamp without time zone,
    failed_login_attempts integer DEFAULT 0,
    account_locked boolean DEFAULT false,
    is_delegated boolean DEFAULT false,
    delegated_by character varying(255),
    delegation_reason text,
    access_expires_at timestamp without time zone,
    access_log jsonb,
    actions_performed jsonb,
    data_accessed jsonb,
    compliance_training jsonb,
    status character varying(50) DEFAULT 'active'::character varying,
    granted_by character varying(255),
    granted_at timestamp without time zone DEFAULT now(),
    revoked_by character varying(255),
    revoked_at timestamp without time zone,
    revocation_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.compliance_rbac_management OWNER TO neondb_owner;

--
-- TOC entry 612 (class 1259 OID 19432)
-- Name: compliance_rbac_management_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.compliance_rbac_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compliance_rbac_management_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8686 (class 0 OID 0)
-- Dependencies: 612
-- Name: compliance_rbac_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.compliance_rbac_management_id_seq OWNED BY public.compliance_rbac_management.id;


--
-- TOC entry 477 (class 1259 OID 18405)
-- Name: config_ai_metadata; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.config_ai_metadata (
    id integer NOT NULL,
    config_id character varying(255) NOT NULL,
    prompt_snippets jsonb,
    rag_context jsonb,
    ai_assist_metadata jsonb,
    training_tags jsonb,
    training_examples jsonb,
    feedback_data jsonb,
    ai_generated_fields jsonb,
    confidence_scores jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.config_ai_metadata OWNER TO neondb_owner;

--
-- TOC entry 476 (class 1259 OID 18404)
-- Name: config_ai_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.config_ai_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.config_ai_metadata_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8687 (class 0 OID 0)
-- Dependencies: 476
-- Name: config_ai_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.config_ai_metadata_id_seq OWNED BY public.config_ai_metadata.id;


--
-- TOC entry 479 (class 1259 OID 18416)
-- Name: config_change_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.config_change_history (
    id integer NOT NULL,
    change_id uuid DEFAULT gen_random_uuid(),
    config_id character varying(255) NOT NULL,
    change_type character varying(50) NOT NULL,
    previous_version character varying(50),
    new_version character varying(50),
    previous_data jsonb,
    new_data jsonb,
    diff jsonb,
    reason text,
    rollback_id character varying(255),
    user_id character varying(255),
    username character varying(255),
    user_role character varying(100),
    source character varying(100) DEFAULT 'manual'::character varying,
    source_details jsonb,
    requires_approval boolean DEFAULT false,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    approval_notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.config_change_history OWNER TO neondb_owner;

--
-- TOC entry 478 (class 1259 OID 18415)
-- Name: config_change_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.config_change_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.config_change_history_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8688 (class 0 OID 0)
-- Dependencies: 478
-- Name: config_change_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.config_change_history_id_seq OWNED BY public.config_change_history.id;


--
-- TOC entry 481 (class 1259 OID 18429)
-- Name: config_federation_sync; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.config_federation_sync (
    id integer NOT NULL,
    sync_id uuid DEFAULT gen_random_uuid(),
    config_id character varying(255) NOT NULL,
    neuron_id character varying(255) NOT NULL,
    neuron_type character varying(100),
    neuron_version character varying(50),
    sync_type character varying(50) NOT NULL,
    sync_status character varying(50) DEFAULT 'pending'::character varying,
    config_version character varying(50),
    synced_data jsonb,
    overrides jsonb,
    conflicts jsonb,
    conflict_resolution character varying(50),
    sync_duration integer,
    retry_count integer DEFAULT 0,
    last_error text,
    sync_started_at timestamp without time zone DEFAULT now(),
    sync_completed_at timestamp without time zone,
    next_sync_at timestamp without time zone
);


ALTER TABLE public.config_federation_sync OWNER TO neondb_owner;

--
-- TOC entry 480 (class 1259 OID 18428)
-- Name: config_federation_sync_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.config_federation_sync_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.config_federation_sync_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8689 (class 0 OID 0)
-- Dependencies: 480
-- Name: config_federation_sync_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.config_federation_sync_id_seq OWNED BY public.config_federation_sync.id;


--
-- TOC entry 483 (class 1259 OID 18442)
-- Name: config_performance_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.config_performance_metrics (
    id integer NOT NULL,
    metric_id uuid DEFAULT gen_random_uuid(),
    config_id character varying(255) NOT NULL,
    load_time real,
    cache_hit_rate real,
    validation_time real,
    sync_time real,
    access_count integer DEFAULT 0,
    update_count integer DEFAULT 0,
    error_count integer DEFAULT 0,
    memory_usage integer,
    cpu_usage real,
    network_usage integer,
    environment character varying(50),
    user_agent character varying(255),
    region character varying(50),
    recorded_at timestamp without time zone DEFAULT now(),
    day_bucket character varying(10)
);


ALTER TABLE public.config_performance_metrics OWNER TO neondb_owner;

--
-- TOC entry 482 (class 1259 OID 18441)
-- Name: config_performance_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.config_performance_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.config_performance_metrics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8690 (class 0 OID 0)
-- Dependencies: 482
-- Name: config_performance_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.config_performance_metrics_id_seq OWNED BY public.config_performance_metrics.id;


--
-- TOC entry 485 (class 1259 OID 18456)
-- Name: config_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.config_permissions (
    id integer NOT NULL,
    config_id character varying(255) NOT NULL,
    user_id character varying(255),
    user_role character varying(100),
    team_id character varying(255),
    can_read boolean DEFAULT true,
    can_write boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    can_approve boolean DEFAULT false,
    can_rollback boolean DEFAULT false,
    allowed_environments jsonb DEFAULT '["development"]'::jsonb,
    allowed_verticals jsonb,
    allowed_locales jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.config_permissions OWNER TO neondb_owner;

--
-- TOC entry 484 (class 1259 OID 18455)
-- Name: config_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.config_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.config_permissions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8691 (class 0 OID 0)
-- Dependencies: 484
-- Name: config_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.config_permissions_id_seq OWNED BY public.config_permissions.id;


--
-- TOC entry 487 (class 1259 OID 18473)
-- Name: config_registry; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.config_registry (
    id integer NOT NULL,
    config_id character varying(255) NOT NULL,
    version character varying(50) NOT NULL,
    vertical character varying(100),
    locale character varying(10) DEFAULT 'en-US'::character varying,
    user_persona character varying(100),
    intent_cluster character varying(100),
    layout_type character varying(50) DEFAULT 'standard'::character varying,
    feature_flags jsonb DEFAULT '{}'::jsonb,
    ab_test_variant character varying(100),
    config_data jsonb NOT NULL,
    schema jsonb,
    title character varying(255) NOT NULL,
    description text,
    tags jsonb DEFAULT '[]'::jsonb,
    category character varying(100),
    is_active boolean DEFAULT true,
    is_locked boolean DEFAULT false,
    deprecated boolean DEFAULT false,
    author character varying(255),
    last_modified_by character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_deployed_at timestamp without time zone
);


ALTER TABLE public.config_registry OWNER TO neondb_owner;

--
-- TOC entry 486 (class 1259 OID 18472)
-- Name: config_registry_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.config_registry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.config_registry_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8692 (class 0 OID 0)
-- Dependencies: 486
-- Name: config_registry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.config_registry_id_seq OWNED BY public.config_registry.id;


--
-- TOC entry 489 (class 1259 OID 18493)
-- Name: config_snapshots; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.config_snapshots (
    id integer NOT NULL,
    snapshot_id character varying(255) NOT NULL,
    config_id character varying(255) NOT NULL,
    version character varying(50) NOT NULL,
    config_data jsonb NOT NULL,
    metadata jsonb,
    snapshot_type character varying(50) DEFAULT 'manual'::character varying,
    description text,
    is_valid boolean DEFAULT true,
    validation_errors jsonb,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone
);


ALTER TABLE public.config_snapshots OWNER TO neondb_owner;

--
-- TOC entry 488 (class 1259 OID 18492)
-- Name: config_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.config_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.config_snapshots_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8693 (class 0 OID 0)
-- Dependencies: 488
-- Name: config_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.config_snapshots_id_seq OWNED BY public.config_snapshots.id;


--
-- TOC entry 491 (class 1259 OID 18507)
-- Name: config_validation_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.config_validation_rules (
    id integer NOT NULL,
    rule_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100),
    rule_type character varying(50) NOT NULL,
    rule_definition jsonb NOT NULL,
    severity character varying(50) DEFAULT 'error'::character varying,
    applies_to jsonb,
    conditions jsonb,
    is_active boolean DEFAULT true,
    is_built_in boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.config_validation_rules OWNER TO neondb_owner;

--
-- TOC entry 490 (class 1259 OID 18506)
-- Name: config_validation_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.config_validation_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.config_validation_rules_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8694 (class 0 OID 0)
-- Dependencies: 490
-- Name: config_validation_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.config_validation_rules_id_seq OWNED BY public.config_validation_rules.id;


--
-- TOC entry 723 (class 1259 OID 20492)
-- Name: conflict_resolution_log; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conflict_resolution_log (
    id integer NOT NULL,
    log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id character varying(255) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id character varying(255) NOT NULL,
    conflict_type character varying(50) NOT NULL,
    conflict_description text,
    client_data jsonb NOT NULL,
    server_data jsonb NOT NULL,
    resolved_data jsonb,
    resolution_strategy character varying(50) NOT NULL,
    resolution_method character varying(50),
    resolution_status character varying(20) DEFAULT 'pending'::character varying,
    resolved_by character varying(255),
    resolved_at timestamp without time zone,
    data_loss boolean DEFAULT false,
    business_impact character varying(20) DEFAULT 'low'::character varying,
    affected_users integer DEFAULT 0,
    confidence real DEFAULT 0.5,
    feedback jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    conflict_detected_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.conflict_resolution_log OWNER TO neondb_owner;

--
-- TOC entry 722 (class 1259 OID 20491)
-- Name: conflict_resolution_log_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.conflict_resolution_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conflict_resolution_log_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8695 (class 0 OID 0)
-- Dependencies: 722
-- Name: conflict_resolution_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.conflict_resolution_log_id_seq OWNED BY public.conflict_resolution_log.id;


--
-- TOC entry 593 (class 1259 OID 19285)
-- Name: content_feed; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_feed (
    id integer NOT NULL,
    source_id integer,
    external_id character varying(255),
    content_type character varying(100) NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    content text,
    excerpt text,
    category character varying(100),
    tags jsonb,
    price numeric(10,2),
    original_price numeric(10,2),
    currency character varying(10),
    discount numeric(5,2),
    coupon_code character varying(100),
    affiliate_url text,
    merchant_name character varying(255),
    author character varying(255),
    published_at timestamp without time zone,
    image_url text,
    images jsonb,
    rating numeric(3,2),
    review_count integer,
    views integer DEFAULT 0,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    ctr numeric(5,4) DEFAULT '0'::numeric,
    conversion_rate numeric(5,4) DEFAULT '0'::numeric,
    quality_score numeric(3,2),
    status character varying(50) DEFAULT 'active'::character varying,
    is_manually_overridden boolean DEFAULT false,
    manual_priority integer,
    ai_enriched boolean DEFAULT false,
    ai_generated_content jsonb,
    ai_quality_flags jsonb,
    compliance_status character varying(50) DEFAULT 'pending'::character varying,
    moderation_flags jsonb,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    synced_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.content_feed OWNER TO neondb_owner;

--
-- TOC entry 595 (class 1259 OID 19306)
-- Name: content_feed_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_feed_analytics (
    id integer NOT NULL,
    content_id integer,
    date timestamp without time zone NOT NULL,
    metric character varying(100) NOT NULL,
    value numeric(15,4) NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.content_feed_analytics OWNER TO neondb_owner;

--
-- TOC entry 594 (class 1259 OID 19305)
-- Name: content_feed_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.content_feed_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_feed_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8696 (class 0 OID 0)
-- Dependencies: 594
-- Name: content_feed_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.content_feed_analytics_id_seq OWNED BY public.content_feed_analytics.id;


--
-- TOC entry 597 (class 1259 OID 19316)
-- Name: content_feed_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_feed_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    parent_id integer,
    description text,
    icon character varying(100),
    vertical_neuron character varying(100),
    content_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.content_feed_categories OWNER TO neondb_owner;

--
-- TOC entry 596 (class 1259 OID 19315)
-- Name: content_feed_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.content_feed_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_feed_categories_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8697 (class 0 OID 0)
-- Dependencies: 596
-- Name: content_feed_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.content_feed_categories_id_seq OWNED BY public.content_feed_categories.id;


--
-- TOC entry 592 (class 1259 OID 19284)
-- Name: content_feed_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.content_feed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_feed_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8698 (class 0 OID 0)
-- Dependencies: 592
-- Name: content_feed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.content_feed_id_seq OWNED BY public.content_feed.id;


--
-- TOC entry 599 (class 1259 OID 19331)
-- Name: content_feed_interactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_feed_interactions (
    id integer NOT NULL,
    content_id integer,
    session_id character varying(255),
    user_id character varying(255),
    interaction_type character varying(100) NOT NULL,
    metadata jsonb,
    revenue numeric(10,2),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.content_feed_interactions OWNER TO neondb_owner;

--
-- TOC entry 598 (class 1259 OID 19330)
-- Name: content_feed_interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.content_feed_interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_feed_interactions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8699 (class 0 OID 0)
-- Dependencies: 598
-- Name: content_feed_interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.content_feed_interactions_id_seq OWNED BY public.content_feed_interactions.id;


--
-- TOC entry 601 (class 1259 OID 19341)
-- Name: content_feed_notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_feed_notifications (
    id integer NOT NULL,
    content_id integer,
    source_id integer,
    notification_type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    message text,
    severity character varying(50) DEFAULT 'info'::character varying,
    is_read boolean DEFAULT false,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.content_feed_notifications OWNER TO neondb_owner;

--
-- TOC entry 600 (class 1259 OID 19340)
-- Name: content_feed_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.content_feed_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_feed_notifications_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8700 (class 0 OID 0)
-- Dependencies: 600
-- Name: content_feed_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.content_feed_notifications_id_seq OWNED BY public.content_feed_notifications.id;


--
-- TOC entry 603 (class 1259 OID 19353)
-- Name: content_feed_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_feed_rules (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    source_id integer,
    rule_type character varying(100) NOT NULL,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    applied_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.content_feed_rules OWNER TO neondb_owner;

--
-- TOC entry 602 (class 1259 OID 19352)
-- Name: content_feed_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.content_feed_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_feed_rules_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8701 (class 0 OID 0)
-- Dependencies: 602
-- Name: content_feed_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.content_feed_rules_id_seq OWNED BY public.content_feed_rules.id;


--
-- TOC entry 605 (class 1259 OID 19367)
-- Name: content_feed_sources; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_feed_sources (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    source_type character varying(100) NOT NULL,
    api_endpoint text,
    auth_config jsonb,
    refresh_interval integer DEFAULT 3600,
    is_active boolean DEFAULT true,
    last_sync_at timestamp without time zone,
    next_sync_at timestamp without time zone,
    settings jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.content_feed_sources OWNER TO neondb_owner;

--
-- TOC entry 604 (class 1259 OID 19366)
-- Name: content_feed_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.content_feed_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_feed_sources_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8702 (class 0 OID 0)
-- Dependencies: 604
-- Name: content_feed_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.content_feed_sources_id_seq OWNED BY public.content_feed_sources.id;


--
-- TOC entry 607 (class 1259 OID 19380)
-- Name: content_feed_sync_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_feed_sync_logs (
    id integer NOT NULL,
    source_id integer,
    sync_type character varying(100) NOT NULL,
    status character varying(50) NOT NULL,
    items_processed integer DEFAULT 0,
    items_added integer DEFAULT 0,
    items_updated integer DEFAULT 0,
    items_removed integer DEFAULT 0,
    errors jsonb,
    metadata jsonb,
    duration integer,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


ALTER TABLE public.content_feed_sync_logs OWNER TO neondb_owner;

--
-- TOC entry 606 (class 1259 OID 19379)
-- Name: content_feed_sync_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.content_feed_sync_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_feed_sync_logs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8703 (class 0 OID 0)
-- Dependencies: 606
-- Name: content_feed_sync_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.content_feed_sync_logs_id_seq OWNED BY public.content_feed_sync_logs.id;


--
-- TOC entry 465 (class 1259 OID 18312)
-- Name: content_optimization_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_optimization_logs (
    id integer NOT NULL,
    log_id character varying(255) NOT NULL,
    content_type character varying(100) NOT NULL,
    content_id character varying(255) NOT NULL,
    vertical character varying(100) NOT NULL,
    original_content jsonb,
    optimized_content jsonb NOT NULL,
    optimization_type character varying(100) NOT NULL,
    model_used character varying(255),
    rule_used character varying(255),
    confidence numeric(5,4),
    expected_improvement numeric(5,4),
    actual_improvement numeric(5,4),
    is_applied boolean DEFAULT false,
    applied_at timestamp without time zone,
    is_reverted boolean DEFAULT false,
    reverted_at timestamp without time zone,
    performance jsonb,
    learning_cycle_id character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.content_optimization_logs OWNER TO neondb_owner;

--
-- TOC entry 464 (class 1259 OID 18311)
-- Name: content_optimization_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.content_optimization_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_optimization_logs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8704 (class 0 OID 0)
-- Dependencies: 464
-- Name: content_optimization_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.content_optimization_logs_id_seq OWNED BY public.content_optimization_logs.id;


--
-- TOC entry 645 (class 1259 OID 19739)
-- Name: cta_ab_tests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cta_ab_tests (
    id integer NOT NULL,
    test_id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    variants jsonb NOT NULL,
    traffic_allocation jsonb,
    targeting_rules jsonb,
    hypothesis text,
    primary_metric character varying(100),
    secondary_metrics jsonb,
    minimum_sample_size integer DEFAULT 1000,
    significance_threshold real DEFAULT 0.05,
    status character varying(50) DEFAULT 'draft'::character varying,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    planned_duration integer,
    results jsonb,
    winning_variant character varying(50),
    confidence_level real,
    created_by character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cta_ab_tests OWNER TO neondb_owner;

--
-- TOC entry 644 (class 1259 OID 19738)
-- Name: cta_ab_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cta_ab_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cta_ab_tests_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8705 (class 0 OID 0)
-- Dependencies: 644
-- Name: cta_ab_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cta_ab_tests_id_seq OWNED BY public.cta_ab_tests.id;


--
-- TOC entry 647 (class 1259 OID 19755)
-- Name: cta_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cta_analytics (
    id integer NOT NULL,
    event_id character varying(100) NOT NULL,
    instance_id character varying(100) NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    event_type character varying(100) NOT NULL,
    event_data jsonb,
    dwell_time integer DEFAULT 0,
    interaction_depth integer DEFAULT 0,
    completion_rate real DEFAULT 0,
    render_time integer,
    frame_rate real,
    device_performance jsonb,
    entry_point character varying(255),
    exit_point character varying(255),
    conversion_action character varying(255),
    page_url text,
    referrer text,
    device_info jsonb,
    browser_info jsonb,
    geolocation jsonb,
    "timestamp" timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cta_analytics OWNER TO neondb_owner;

--
-- TOC entry 646 (class 1259 OID 19754)
-- Name: cta_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cta_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cta_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8706 (class 0 OID 0)
-- Dependencies: 646
-- Name: cta_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cta_analytics_id_seq OWNED BY public.cta_analytics.id;


--
-- TOC entry 649 (class 1259 OID 19771)
-- Name: cta_assets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cta_assets (
    id integer NOT NULL,
    asset_id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    format character varying(50) NOT NULL,
    category character varying(100),
    file_path text NOT NULL,
    file_size integer,
    dimensions jsonb,
    resolution jsonb,
    compression_level character varying(50),
    lod_levels jsonb,
    optimized_versions jsonb,
    tags jsonb,
    license character varying(100),
    attribution text,
    scan_status character varying(50) DEFAULT 'pending'::character varying,
    scan_results jsonb,
    compliance_flags jsonb,
    usage_count integer DEFAULT 0,
    last_used timestamp without time zone,
    is_active boolean DEFAULT true,
    is_public boolean DEFAULT false,
    uploaded_by character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cta_assets OWNER TO neondb_owner;

--
-- TOC entry 648 (class 1259 OID 19770)
-- Name: cta_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cta_assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cta_assets_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8707 (class 0 OID 0)
-- Dependencies: 648
-- Name: cta_assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cta_assets_id_seq OWNED BY public.cta_assets.id;


--
-- TOC entry 651 (class 1259 OID 19788)
-- Name: cta_compliance; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cta_compliance (
    id integer NOT NULL,
    compliance_id character varying(100) NOT NULL,
    instance_id character varying(100),
    template_id character varying(100),
    compliance_type character varying(100) NOT NULL,
    wcag_level character varying(10),
    accessibility_features jsonb,
    alternative_formats jsonb,
    data_collection jsonb,
    consent_required boolean DEFAULT false,
    consent_obtained boolean DEFAULT false,
    privacy_policy_ref text,
    asset_integrity jsonb,
    content_security_policy text,
    cross_origin_policy text,
    content_rating character varying(50),
    content_warnings jsonb,
    cultural_considerations jsonb,
    last_audit_date timestamp without time zone,
    audit_results jsonb,
    remedial_actions jsonb,
    compliance_status character varying(50) DEFAULT 'pending'::character varying,
    expiry_date timestamp without time zone,
    created_by character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cta_compliance OWNER TO neondb_owner;

--
-- TOC entry 650 (class 1259 OID 19787)
-- Name: cta_compliance_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cta_compliance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cta_compliance_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8708 (class 0 OID 0)
-- Dependencies: 650
-- Name: cta_compliance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cta_compliance_id_seq OWNED BY public.cta_compliance.id;


--
-- TOC entry 653 (class 1259 OID 19804)
-- Name: cta_instances; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cta_instances (
    id integer NOT NULL,
    instance_id character varying(100) NOT NULL,
    template_id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    custom_config jsonb,
    targeting_rules jsonb,
    personalization_data jsonb,
    context_rules jsonb,
    triggers jsonb,
    activation_conditions jsonb,
    display_rules jsonb,
    ab_test_id character varying(100),
    variant character varying(50) DEFAULT 'default'::character varying,
    integration_hooks jsonb,
    affiliate_data jsonb,
    status character varying(50) DEFAULT 'draft'::character varying,
    scheduled_start timestamp without time zone,
    scheduled_end timestamp without time zone,
    neuron_id character varying(100),
    federation_config jsonb,
    created_by character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cta_instances OWNER TO neondb_owner;

--
-- TOC entry 652 (class 1259 OID 19803)
-- Name: cta_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cta_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cta_instances_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8709 (class 0 OID 0)
-- Dependencies: 652
-- Name: cta_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cta_instances_id_seq OWNED BY public.cta_instances.id;


--
-- TOC entry 655 (class 1259 OID 19819)
-- Name: cta_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cta_templates (
    id integer NOT NULL,
    template_id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    config jsonb NOT NULL,
    assets jsonb,
    interactions jsonb,
    animations jsonb,
    physics jsonb,
    render_settings jsonb,
    device_compatibility jsonb,
    fallback_options jsonb,
    customizable_elements jsonb,
    branding_options jsonb,
    is_active boolean DEFAULT true,
    is_public boolean DEFAULT false,
    created_by character varying(100),
    version character varying(20) DEFAULT '1.0.0'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cta_templates OWNER TO neondb_owner;

--
-- TOC entry 654 (class 1259 OID 19818)
-- Name: cta_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cta_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cta_templates_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8710 (class 0 OID 0)
-- Dependencies: 654
-- Name: cta_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cta_templates_id_seq OWNED BY public.cta_templates.id;


--
-- TOC entry 657 (class 1259 OID 19835)
-- Name: cta_user_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cta_user_sessions (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    instance_id character varying(100) NOT NULL,
    user_id character varying(255),
    start_time timestamp without time zone DEFAULT now(),
    end_time timestamp without time zone,
    total_duration integer,
    device_capabilities jsonb,
    performance_metrics jsonb,
    browser_support jsonb,
    interactions jsonb,
    gesture_data jsonb,
    gaze_tracking jsonb,
    conversion_events jsonb,
    exit_reason character varying(100),
    user_feedback jsonb,
    page_context jsonb,
    user_segment character varying(100),
    personalization_applied jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cta_user_sessions OWNER TO neondb_owner;

--
-- TOC entry 656 (class 1259 OID 19834)
-- Name: cta_user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cta_user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cta_user_sessions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8711 (class 0 OID 0)
-- Dependencies: 656
-- Name: cta_user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cta_user_sessions_id_seq OWNED BY public.cta_user_sessions.id;


--
-- TOC entry 735 (class 1259 OID 20627)
-- Name: cultural_ab_tests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cultural_ab_tests (
    id integer NOT NULL,
    test_id character varying(100) NOT NULL,
    test_name text NOT NULL,
    target_countries jsonb NOT NULL,
    emotion_targets jsonb NOT NULL,
    variants jsonb NOT NULL,
    traffic_allocation jsonb DEFAULT '{"control": 50, "variant": 50}'::jsonb,
    status character varying(20) DEFAULT 'draft'::character varying,
    cultural_hypothesis text,
    expected_outcome text,
    metrics jsonb NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    min_sample_size integer DEFAULT 1000,
    confidence_level real DEFAULT 0.95,
    results jsonb,
    cultural_insights jsonb,
    winning_variant character varying(100),
    statistical_significance real,
    cultural_significance real,
    recommended_actions jsonb,
    created_by character varying(255),
    approved_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cultural_ab_tests OWNER TO neondb_owner;

--
-- TOC entry 734 (class 1259 OID 20626)
-- Name: cultural_ab_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cultural_ab_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cultural_ab_tests_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8712 (class 0 OID 0)
-- Dependencies: 734
-- Name: cultural_ab_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cultural_ab_tests_id_seq OWNED BY public.cultural_ab_tests.id;


--
-- TOC entry 737 (class 1259 OID 20644)
-- Name: cultural_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cultural_analytics (
    id integer NOT NULL,
    country_code character varying(3) NOT NULL,
    date character varying(10) NOT NULL,
    unique_visitors integer DEFAULT 0,
    total_sessions integer DEFAULT 0,
    average_session_duration integer DEFAULT 0,
    emotion_distribution jsonb NOT NULL,
    dominant_emotions jsonb NOT NULL,
    cultural_personalizations_applied integer DEFAULT 0,
    personalization_success_rate real DEFAULT 0,
    conversion_rate real DEFAULT 0,
    cultural_conversion_lift real DEFAULT 0,
    revenue_per_visitor real DEFAULT 0,
    cultural_revenue_impact real DEFAULT 0,
    top_performing_rules jsonb,
    cultural_insights jsonb,
    quality_score real DEFAULT 0.8,
    data_points integer DEFAULT 0,
    cultural_trends jsonb,
    seasonal_factors jsonb,
    local_events jsonb,
    competitor_analysis jsonb,
    recommended_actions jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cultural_analytics OWNER TO neondb_owner;

--
-- TOC entry 736 (class 1259 OID 20643)
-- Name: cultural_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cultural_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cultural_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8713 (class 0 OID 0)
-- Dependencies: 736
-- Name: cultural_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cultural_analytics_id_seq OWNED BY public.cultural_analytics.id;


--
-- TOC entry 739 (class 1259 OID 20666)
-- Name: cultural_feedback; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cultural_feedback (
    id integer NOT NULL,
    feedback_id character varying(100) NOT NULL,
    feedback_type character varying(50) NOT NULL,
    country_code character varying(3) NOT NULL,
    cultural_element_id character varying(100),
    element_type character varying(50),
    rating integer,
    feedback text NOT NULL,
    cultural_accuracy real,
    offensive_risk real DEFAULT 0,
    improvement_suggestions jsonb,
    cultural_context text,
    validation_status character varying(20) DEFAULT 'pending'::character varying,
    expert_validation jsonb,
    user_impact real,
    business_impact real,
    implementation_status character varying(20) DEFAULT 'pending'::character varying,
    submitted_by character varying(255),
    expert_reviewer character varying(255),
    review_notes text,
    priority integer DEFAULT 3,
    resolved boolean DEFAULT false,
    resolution text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cultural_feedback OWNER TO neondb_owner;

--
-- TOC entry 738 (class 1259 OID 20665)
-- Name: cultural_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cultural_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cultural_feedback_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8714 (class 0 OID 0)
-- Dependencies: 738
-- Name: cultural_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cultural_feedback_id_seq OWNED BY public.cultural_feedback.id;


--
-- TOC entry 741 (class 1259 OID 20684)
-- Name: cultural_mappings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cultural_mappings (
    id integer NOT NULL,
    country_code character varying(3) NOT NULL,
    country_name text NOT NULL,
    region character varying(100) NOT NULL,
    communication_style character varying(50) NOT NULL,
    color_psychology jsonb NOT NULL,
    trust_indicators jsonb NOT NULL,
    conversion_triggers jsonb NOT NULL,
    emotion_patterns jsonb NOT NULL,
    cultural_context jsonb,
    marketing_preferences jsonb,
    decision_making_style character varying(50),
    collectivism_score real DEFAULT 0.5,
    uncertainty_avoidance real DEFAULT 0.5,
    power_distance real DEFAULT 0.5,
    masculinity_index real DEFAULT 0.5,
    long_term_orientation real DEFAULT 0.5,
    indulgence_level real DEFAULT 0.5,
    is_active boolean DEFAULT true,
    data_quality integer DEFAULT 85,
    last_validated timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cultural_mappings OWNER TO neondb_owner;

--
-- TOC entry 740 (class 1259 OID 20683)
-- Name: cultural_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cultural_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cultural_mappings_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8715 (class 0 OID 0)
-- Dependencies: 740
-- Name: cultural_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cultural_mappings_id_seq OWNED BY public.cultural_mappings.id;


--
-- TOC entry 743 (class 1259 OID 20706)
-- Name: cultural_personalization_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cultural_personalization_rules (
    id integer NOT NULL,
    rule_id character varying(100) NOT NULL,
    rule_name text NOT NULL,
    target_countries jsonb NOT NULL,
    emotion_triggers jsonb NOT NULL,
    conditions jsonb NOT NULL,
    personalizations jsonb NOT NULL,
    priority integer DEFAULT 5,
    rule_type character varying(50) NOT NULL,
    cultural_reasoning text,
    expected_impact real DEFAULT 0.1,
    actual_impact real,
    confidence real DEFAULT 0.8,
    testing_phase character varying(50) DEFAULT 'production'::character varying,
    application_count integer DEFAULT 0,
    success_rate real,
    cultural_feedback jsonb,
    user_feedback jsonb,
    business_impact jsonb,
    is_active boolean DEFAULT true,
    last_applied timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cultural_personalization_rules OWNER TO neondb_owner;

--
-- TOC entry 742 (class 1259 OID 20705)
-- Name: cultural_personalization_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cultural_personalization_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cultural_personalization_rules_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8716 (class 0 OID 0)
-- Dependencies: 742
-- Name: cultural_personalization_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cultural_personalization_rules_id_seq OWNED BY public.cultural_personalization_rules.id;


--
-- TOC entry 541 (class 1259 OID 18902)
-- Name: deep_link_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.deep_link_analytics (
    id integer NOT NULL,
    session_id character varying(255),
    link_type character varying(50),
    source_url text,
    target_path character varying(500),
    campaign_source character varying(100),
    campaign_medium character varying(100),
    campaign_name character varying(100),
    referrer text,
    user_agent text,
    is_success boolean DEFAULT true,
    error_message text,
    conversion_value real,
    "timestamp" timestamp without time zone DEFAULT now(),
    metadata jsonb
);


ALTER TABLE public.deep_link_analytics OWNER TO neondb_owner;

--
-- TOC entry 540 (class 1259 OID 18901)
-- Name: deep_link_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.deep_link_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deep_link_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8717 (class 0 OID 0)
-- Dependencies: 540
-- Name: deep_link_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.deep_link_analytics_id_seq OWNED BY public.deep_link_analytics.id;


--
-- TOC entry 661 (class 1259 OID 19865)
-- Name: deployment_audit; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.deployment_audit (
    id integer NOT NULL,
    audit_id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource_type character varying(50) NOT NULL,
    resource_id character varying(100) NOT NULL,
    action character varying(50) NOT NULL,
    user_id integer,
    user_agent text,
    ip_address character varying(45),
    before jsonb,
    after jsonb,
    changes jsonb,
    reason text,
    outcome character varying(20) NOT NULL,
    duration integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.deployment_audit OWNER TO neondb_owner;

--
-- TOC entry 660 (class 1259 OID 19864)
-- Name: deployment_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.deployment_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deployment_audit_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8718 (class 0 OID 0)
-- Dependencies: 660
-- Name: deployment_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.deployment_audit_id_seq OWNED BY public.deployment_audit.id;


--
-- TOC entry 663 (class 1259 OID 19879)
-- Name: deployment_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.deployment_permissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(50) NOT NULL,
    permissions jsonb NOT NULL,
    environments jsonb DEFAULT '[]'::jsonb NOT NULL,
    resources jsonb DEFAULT '[]'::jsonb NOT NULL,
    restrictions jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp without time zone,
    granted_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.deployment_permissions OWNER TO neondb_owner;

--
-- TOC entry 662 (class 1259 OID 19878)
-- Name: deployment_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.deployment_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deployment_permissions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8719 (class 0 OID 0)
-- Dependencies: 662
-- Name: deployment_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.deployment_permissions_id_seq OWNED BY public.deployment_permissions.id;


--
-- TOC entry 665 (class 1259 OID 19895)
-- Name: deployment_steps; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.deployment_steps (
    id integer NOT NULL,
    deployment_id uuid NOT NULL,
    step_id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    step_type character varying(50) NOT NULL,
    "order" integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    command text,
    output text,
    error_output text,
    duration integer,
    retry_count integer DEFAULT 0 NOT NULL,
    max_retries integer DEFAULT 3 NOT NULL,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    dependencies jsonb DEFAULT '[]'::jsonb NOT NULL,
    rollback_command text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.deployment_steps OWNER TO neondb_owner;

--
-- TOC entry 664 (class 1259 OID 19894)
-- Name: deployment_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.deployment_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deployment_steps_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8720 (class 0 OID 0)
-- Dependencies: 664
-- Name: deployment_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.deployment_steps_id_seq OWNED BY public.deployment_steps.id;


--
-- TOC entry 667 (class 1259 OID 19910)
-- Name: deployments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.deployments (
    id integer NOT NULL,
    deployment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    environment character varying(50) NOT NULL,
    deployment_type character varying(50) NOT NULL,
    version character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    total_steps integer DEFAULT 0 NOT NULL,
    completed_steps integer DEFAULT 0 NOT NULL,
    failed_steps integer DEFAULT 0 NOT NULL,
    config jsonb NOT NULL,
    manifest jsonb NOT NULL,
    logs jsonb DEFAULT '[]'::jsonb NOT NULL,
    errors jsonb DEFAULT '[]'::jsonb NOT NULL,
    health_checks jsonb DEFAULT '[]'::jsonb NOT NULL,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    deployed_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    rollback_data jsonb,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.deployments OWNER TO neondb_owner;

--
-- TOC entry 666 (class 1259 OID 19909)
-- Name: deployments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.deployments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deployments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8721 (class 0 OID 0)
-- Dependencies: 666
-- Name: deployments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.deployments_id_seq OWNED BY public.deployments.id;


--
-- TOC entry 543 (class 1259 OID 18913)
-- Name: device_capabilities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.device_capabilities (
    id integer NOT NULL,
    session_id character varying(255),
    device_type character varying(50),
    operating_system character varying(50),
    os_version character varying(50),
    browser_engine character varying(50),
    screen_resolution character varying(50),
    color_depth integer,
    pixel_ratio real,
    touch_support boolean DEFAULT false,
    gpu_info jsonb,
    network_type character varying(20),
    battery_level real,
    memory_gb real,
    storage_gb real,
    supported_features jsonb,
    performance_metrics jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.device_capabilities OWNER TO neondb_owner;

--
-- TOC entry 542 (class 1259 OID 18912)
-- Name: device_capabilities_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.device_capabilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_capabilities_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8722 (class 0 OID 0)
-- Dependencies: 542
-- Name: device_capabilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.device_capabilities_id_seq OWNED BY public.device_capabilities.id;


--
-- TOC entry 238 (class 1259 OID 16646)
-- Name: device_fingerprints; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.device_fingerprints (
    id integer NOT NULL,
    fingerprint character varying(255) NOT NULL,
    global_user_id integer,
    device_info jsonb NOT NULL,
    browser_info jsonb NOT NULL,
    hardware_info jsonb,
    network_info jsonb,
    confidence_score integer DEFAULT 0,
    session_count integer DEFAULT 0,
    first_seen timestamp without time zone DEFAULT now(),
    last_seen timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.device_fingerprints OWNER TO neondb_owner;

--
-- TOC entry 237 (class 1259 OID 16645)
-- Name: device_fingerprints_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.device_fingerprints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_fingerprints_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8723 (class 0 OID 0)
-- Dependencies: 237
-- Name: device_fingerprints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.device_fingerprints_id_seq OWNED BY public.device_fingerprints.id;


--
-- TOC entry 725 (class 1259 OID 20512)
-- Name: device_sync_state; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.device_sync_state (
    id integer NOT NULL,
    state_id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id character varying(255) NOT NULL,
    device_fingerprint character varying(500),
    user_id integer,
    last_sync_at timestamp without time zone,
    last_successful_sync timestamp without time zone,
    next_scheduled_sync timestamp without time zone,
    total_sync_operations integer DEFAULT 0,
    successful_syncs integer DEFAULT 0,
    failed_syncs integer DEFAULT 0,
    pending_operations integer DEFAULT 0,
    device_capabilities jsonb DEFAULT '{}'::jsonb,
    supported_models jsonb DEFAULT '[]'::jsonb,
    sync_strategy character varying(50) DEFAULT 'smart'::character varying,
    sync_only_on_wifi boolean DEFAULT false,
    background_sync_enabled boolean DEFAULT true,
    is_currently_offline boolean DEFAULT false,
    last_online_at timestamp without time zone,
    offline_duration integer DEFAULT 0,
    local_data_version character varying(50),
    server_data_version character varying(50),
    data_freshness_score real DEFAULT 1,
    local_storage_usage integer DEFAULT 0,
    max_storage_limit integer DEFAULT 100000000,
    compression_enabled boolean DEFAULT true,
    encryption_enabled boolean DEFAULT true,
    last_sync_error text,
    error_count integer DEFAULT 0,
    last_error_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.device_sync_state OWNER TO neondb_owner;

--
-- TOC entry 724 (class 1259 OID 20511)
-- Name: device_sync_state_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.device_sync_state_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_sync_state_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8724 (class 0 OID 0)
-- Dependencies: 724
-- Name: device_sync_state_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.device_sync_state_id_seq OWNED BY public.device_sync_state.id;


--
-- TOC entry 627 (class 1259 OID 19577)
-- Name: digital_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.digital_products (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    title text NOT NULL,
    description text,
    long_description text,
    product_type character varying(50) NOT NULL,
    category character varying(100),
    tags text[],
    base_price numeric(10,2) NOT NULL,
    sale_price numeric(10,2),
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    price_by_country jsonb,
    featured_image text,
    gallery_images text[],
    preview_url text,
    demo_url text,
    video_url text,
    download_url text,
    access_type character varying(50) DEFAULT 'immediate'::character varying,
    drip_schedule jsonb,
    license_type character varying(50) DEFAULT 'single'::character varying,
    max_downloads integer DEFAULT '-1'::integer,
    expiration_days integer,
    meta_title text,
    meta_description text,
    keywords text[],
    upsell_products integer[],
    cross_sell_products integer[],
    bundle_products integer[],
    total_sales integer DEFAULT 0,
    total_revenue numeric(15,2) DEFAULT '0'::numeric,
    conversion_rate real DEFAULT 0,
    average_rating real DEFAULT 0,
    review_count integer DEFAULT 0,
    personalization_tags text[],
    target_archetypes text[],
    emotion_triggers jsonb,
    ai_optimized_title text,
    ai_optimized_description text,
    status character varying(20) DEFAULT 'draft'::character varying,
    is_digital boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    auto_optimize boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    published_at timestamp without time zone
);


ALTER TABLE public.digital_products OWNER TO neondb_owner;

--
-- TOC entry 626 (class 1259 OID 19576)
-- Name: digital_products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.digital_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.digital_products_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8725 (class 0 OID 0)
-- Dependencies: 626
-- Name: digital_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.digital_products_id_seq OWNED BY public.digital_products.id;


--
-- TOC entry 669 (class 1259 OID 19932)
-- Name: disaster_recovery_plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.disaster_recovery_plans (
    id integer NOT NULL,
    plan_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    plan_type character varying(50) NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    rto integer NOT NULL,
    rpo integer NOT NULL,
    steps jsonb NOT NULL,
    dependencies jsonb DEFAULT '[]'::jsonb NOT NULL,
    test_results jsonb DEFAULT '[]'::jsonb NOT NULL,
    last_tested timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.disaster_recovery_plans OWNER TO neondb_owner;

--
-- TOC entry 668 (class 1259 OID 19931)
-- Name: disaster_recovery_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.disaster_recovery_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.disaster_recovery_plans_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8726 (class 0 OID 0)
-- Dependencies: 668
-- Name: disaster_recovery_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.disaster_recovery_plans_id_seq OWNED BY public.disaster_recovery_plans.id;


--
-- TOC entry 756 (class 1259 OID 20857)
-- Name: disaster_recovery_scenarios; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.disaster_recovery_scenarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scenario_name text NOT NULL,
    scenario_type text NOT NULL,
    affected_regions jsonb NOT NULL,
    backup_regions jsonb NOT NULL,
    recovery_strategy jsonb NOT NULL,
    estimated_recovery_time integer DEFAULT 0 NOT NULL,
    data_recovery_method text NOT NULL,
    business_continuity_plan jsonb,
    last_tested timestamp without time zone,
    test_success_rate real DEFAULT 0 NOT NULL,
    identified_gaps jsonb,
    times_executed integer DEFAULT 0 NOT NULL,
    average_execution_time real DEFAULT 0 NOT NULL,
    success_rate real DEFAULT 0 NOT NULL,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.disaster_recovery_scenarios OWNER TO neondb_owner;

--
-- TOC entry 727 (class 1259 OID 20546)
-- Name: edge_ai_models; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.edge_ai_models (
    id integer NOT NULL,
    model_id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_name character varying(255) NOT NULL,
    model_type character varying(100) NOT NULL,
    model_version character varying(50) NOT NULL,
    model_config jsonb NOT NULL,
    input_schema jsonb NOT NULL,
    output_schema jsonb NOT NULL,
    deployment_target character varying(50) NOT NULL,
    model_format character varying(50) NOT NULL,
    model_url character varying(500),
    model_size integer,
    inference_time real,
    accuracy real,
    memory_usage integer,
    min_browser_version jsonb DEFAULT '{}'::jsonb,
    device_requirements jsonb DEFAULT '{}'::jsonb,
    fallback_strategy character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    last_trained timestamp without time zone,
    next_update timestamp without time zone,
    description text,
    tags jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.edge_ai_models OWNER TO neondb_owner;

--
-- TOC entry 726 (class 1259 OID 20545)
-- Name: edge_ai_models_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.edge_ai_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.edge_ai_models_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8727 (class 0 OID 0)
-- Dependencies: 726
-- Name: edge_ai_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.edge_ai_models_id_seq OWNED BY public.edge_ai_models.id;


--
-- TOC entry 407 (class 1259 OID 17874)
-- Name: education_ai_chat_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_ai_chat_sessions (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    chat_id character varying(255) NOT NULL,
    subject character varying(100),
    archetype character varying(100),
    conversation_history jsonb NOT NULL,
    total_messages integer DEFAULT 0,
    session_duration integer DEFAULT 0,
    questions_asked integer DEFAULT 0,
    answers_provided integer DEFAULT 0,
    helpful_rating real DEFAULT 0,
    topics_discussed jsonb,
    recommendations_given jsonb,
    is_active boolean DEFAULT true,
    last_interaction timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_ai_chat_sessions OWNER TO neondb_owner;

--
-- TOC entry 406 (class 1259 OID 17873)
-- Name: education_ai_chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_ai_chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_ai_chat_sessions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8728 (class 0 OID 0)
-- Dependencies: 406
-- Name: education_ai_chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_ai_chat_sessions_id_seq OWNED BY public.education_ai_chat_sessions.id;


--
-- TOC entry 409 (class 1259 OID 17894)
-- Name: education_archetypes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_archetypes (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    characteristics jsonb,
    emotion_mapping character varying(50),
    color_scheme jsonb,
    preferred_tools jsonb,
    learning_style character varying(50),
    goal_type character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_archetypes OWNER TO neondb_owner;

--
-- TOC entry 408 (class 1259 OID 17893)
-- Name: education_archetypes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_archetypes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_archetypes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8729 (class 0 OID 0)
-- Dependencies: 408
-- Name: education_archetypes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_archetypes_id_seq OWNED BY public.education_archetypes.id;


--
-- TOC entry 411 (class 1259 OID 17908)
-- Name: education_content; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_content (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    excerpt text,
    content text NOT NULL,
    category character varying(100),
    content_type character varying(50),
    target_archetype character varying(100),
    difficulty character varying(20),
    estimated_time integer DEFAULT 30,
    xp_reward integer DEFAULT 10,
    prerequisites jsonb,
    emotion_tone character varying(50),
    reading_time integer DEFAULT 5,
    seo_title character varying(255),
    seo_description text,
    tags jsonb,
    sources jsonb,
    is_generated boolean DEFAULT false,
    published_at timestamp without time zone,
    is_active boolean DEFAULT true,
    view_count integer DEFAULT 0,
    completion_rate real DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_content OWNER TO neondb_owner;

--
-- TOC entry 410 (class 1259 OID 17907)
-- Name: education_content_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_content_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8730 (class 0 OID 0)
-- Dependencies: 410
-- Name: education_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_content_id_seq OWNED BY public.education_content.id;


--
-- TOC entry 413 (class 1259 OID 17928)
-- Name: education_daily_quests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_daily_quests (
    id integer NOT NULL,
    date date NOT NULL,
    quest_type character varying(50),
    title character varying(255) NOT NULL,
    description text,
    requirements jsonb,
    xp_reward integer DEFAULT 20,
    badge_reward character varying(100),
    difficulty character varying(20),
    category character varying(100),
    target_archetype character varying(100),
    is_active boolean DEFAULT true,
    completion_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_daily_quests OWNER TO neondb_owner;

--
-- TOC entry 412 (class 1259 OID 17927)
-- Name: education_daily_quests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_daily_quests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_daily_quests_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8731 (class 0 OID 0)
-- Dependencies: 412
-- Name: education_daily_quests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_daily_quests_id_seq OWNED BY public.education_daily_quests.id;


--
-- TOC entry 415 (class 1259 OID 17941)
-- Name: education_gamification; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_gamification (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    total_xp integer DEFAULT 0,
    level integer DEFAULT 1,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_activity_date date,
    badges jsonb,
    achievements jsonb,
    leaderboard_position integer,
    friends_list jsonb,
    preferences jsonb,
    daily_goal integer DEFAULT 30,
    weekly_goal integer DEFAULT 300,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_gamification OWNER TO neondb_owner;

--
-- TOC entry 414 (class 1259 OID 17940)
-- Name: education_gamification_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_gamification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_gamification_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8732 (class 0 OID 0)
-- Dependencies: 414
-- Name: education_gamification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_gamification_id_seq OWNED BY public.education_gamification.id;


--
-- TOC entry 417 (class 1259 OID 17959)
-- Name: education_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_offers (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    provider character varying(100),
    category character varying(100),
    offer_type character varying(50),
    original_price real,
    sale_price real,
    discount_percent integer,
    affiliate_url text NOT NULL,
    tracking_url text,
    commission_rate real,
    target_archetype character varying(100),
    tags jsonb,
    thumbnail_url text,
    rating real DEFAULT 0,
    review_count integer DEFAULT 0,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    click_count integer DEFAULT 0,
    conversion_count integer DEFAULT 0,
    conversion_rate real DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_offers OWNER TO neondb_owner;

--
-- TOC entry 416 (class 1259 OID 17958)
-- Name: education_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_offers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8733 (class 0 OID 0)
-- Dependencies: 416
-- Name: education_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_offers_id_seq OWNED BY public.education_offers.id;


--
-- TOC entry 419 (class 1259 OID 17979)
-- Name: education_paths; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_paths (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    target_archetype character varying(100),
    difficulty character varying(20),
    estimated_hours integer DEFAULT 40,
    curriculum jsonb NOT NULL,
    prerequisites jsonb,
    outcomes jsonb,
    xp_total integer DEFAULT 500,
    certificate_template text,
    is_active boolean DEFAULT true,
    enrollment_count integer DEFAULT 0,
    completion_rate real DEFAULT 0,
    rating real DEFAULT 0,
    review_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_paths OWNER TO neondb_owner;

--
-- TOC entry 418 (class 1259 OID 17978)
-- Name: education_paths_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_paths_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_paths_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8734 (class 0 OID 0)
-- Dependencies: 418
-- Name: education_paths_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_paths_id_seq OWNED BY public.education_paths.id;


--
-- TOC entry 421 (class 1259 OID 17999)
-- Name: education_progress; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_progress (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    path_id integer,
    content_id integer,
    quiz_id integer,
    status character varying(50) NOT NULL,
    progress_percentage real DEFAULT 0,
    time_spent integer DEFAULT 0,
    last_accessed timestamp without time zone DEFAULT now(),
    xp_earned integer DEFAULT 0,
    streak_days integer DEFAULT 0,
    completed_at timestamp without time zone,
    certificate_issued boolean DEFAULT false,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_progress OWNER TO neondb_owner;

--
-- TOC entry 420 (class 1259 OID 17998)
-- Name: education_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_progress_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8735 (class 0 OID 0)
-- Dependencies: 420
-- Name: education_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_progress_id_seq OWNED BY public.education_progress.id;


--
-- TOC entry 423 (class 1259 OID 18016)
-- Name: education_quest_completions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_quest_completions (
    id integer NOT NULL,
    quest_id integer,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    completed_at timestamp without time zone DEFAULT now(),
    xp_earned integer DEFAULT 0,
    badge_earned character varying(100),
    time_to_complete integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_quest_completions OWNER TO neondb_owner;

--
-- TOC entry 422 (class 1259 OID 18015)
-- Name: education_quest_completions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_quest_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_quest_completions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8736 (class 0 OID 0)
-- Dependencies: 422
-- Name: education_quest_completions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_quest_completions_id_seq OWNED BY public.education_quest_completions.id;


--
-- TOC entry 425 (class 1259 OID 18029)
-- Name: education_quiz_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_quiz_results (
    id integer NOT NULL,
    quiz_id integer,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    answers jsonb NOT NULL,
    score integer NOT NULL,
    percentage real NOT NULL,
    archetype_result character varying(100),
    recommendations jsonb,
    time_to_complete integer DEFAULT 0,
    exit_point character varying(50),
    action_taken character varying(100),
    xp_earned integer DEFAULT 0,
    is_passed boolean DEFAULT false,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_quiz_results OWNER TO neondb_owner;

--
-- TOC entry 424 (class 1259 OID 18028)
-- Name: education_quiz_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_quiz_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_quiz_results_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8737 (class 0 OID 0)
-- Dependencies: 424
-- Name: education_quiz_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_quiz_results_id_seq OWNED BY public.education_quiz_results.id;


--
-- TOC entry 427 (class 1259 OID 18042)
-- Name: education_quizzes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_quizzes (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    quiz_type character varying(50),
    questions jsonb NOT NULL,
    scoring_logic jsonb NOT NULL,
    result_mappings jsonb NOT NULL,
    estimated_time integer DEFAULT 300,
    xp_reward integer DEFAULT 25,
    retake_allowed boolean DEFAULT true,
    passing_score integer DEFAULT 70,
    is_active boolean DEFAULT true,
    completion_count integer DEFAULT 0,
    average_score real DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_quizzes OWNER TO neondb_owner;

--
-- TOC entry 426 (class 1259 OID 18041)
-- Name: education_quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_quizzes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8738 (class 0 OID 0)
-- Dependencies: 426
-- Name: education_quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_quizzes_id_seq OWNED BY public.education_quizzes.id;


--
-- TOC entry 429 (class 1259 OID 18062)
-- Name: education_tool_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_tool_sessions (
    id integer NOT NULL,
    tool_id integer,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    inputs jsonb NOT NULL,
    outputs jsonb NOT NULL,
    archetype character varying(100),
    time_spent integer DEFAULT 0,
    action_taken character varying(100),
    xp_earned integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_tool_sessions OWNER TO neondb_owner;

--
-- TOC entry 428 (class 1259 OID 18061)
-- Name: education_tool_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_tool_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_tool_sessions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8739 (class 0 OID 0)
-- Dependencies: 428
-- Name: education_tool_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_tool_sessions_id_seq OWNED BY public.education_tool_sessions.id;


--
-- TOC entry 431 (class 1259 OID 18074)
-- Name: education_tools; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.education_tools (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100),
    tool_type character varying(50),
    emotion_mapping character varying(50),
    input_fields jsonb,
    calculation_logic text,
    output_format jsonb,
    tracking_enabled boolean DEFAULT true,
    xp_reward integer DEFAULT 5,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.education_tools OWNER TO neondb_owner;

--
-- TOC entry 430 (class 1259 OID 18073)
-- Name: education_tools_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.education_tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_tools_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8740 (class 0 OID 0)
-- Dependencies: 430
-- Name: education_tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.education_tools_id_seq OWNED BY public.education_tools.id;


--
-- TOC entry 240 (class 1259 OID 16664)
-- Name: email_campaigns; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_campaigns (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    lead_magnet_id integer,
    email_sequence jsonb NOT NULL,
    trigger_type character varying(50) NOT NULL,
    trigger_config jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_campaigns OWNER TO neondb_owner;

--
-- TOC entry 239 (class 1259 OID 16663)
-- Name: email_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.email_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_campaigns_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8741 (class 0 OID 0)
-- Dependencies: 239
-- Name: email_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.email_campaigns_id_seq OWNED BY public.email_campaigns.id;


--
-- TOC entry 745 (class 1259 OID 20725)
-- Name: emotion_profiles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.emotion_profiles (
    id integer NOT NULL,
    emotion_id character varying(100) NOT NULL,
    emotion_name text NOT NULL,
    category character varying(50) NOT NULL,
    intensity real DEFAULT 0.5,
    cultural_variance real DEFAULT 0.3,
    universality real DEFAULT 0.7,
    behavioral_triggers jsonb NOT NULL,
    response_patterns jsonb NOT NULL,
    neural_signals jsonb,
    color_associations jsonb,
    contextual_modifiers jsonb,
    opposite_emotions jsonb,
    complementary_emotions jsonb,
    psychological_basis text,
    marketing_application jsonb,
    conversion_impact real DEFAULT 0.5,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.emotion_profiles OWNER TO neondb_owner;

--
-- TOC entry 744 (class 1259 OID 20724)
-- Name: emotion_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.emotion_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emotion_profiles_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8742 (class 0 OID 0)
-- Dependencies: 744
-- Name: emotion_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.emotion_profiles_id_seq OWNED BY public.emotion_profiles.id;


--
-- TOC entry 467 (class 1259 OID 18326)
-- Name: empire_brain_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.empire_brain_config (
    id integer NOT NULL,
    config_key character varying(255) NOT NULL,
    config_value jsonb NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    version character varying(50) DEFAULT '1.0'::character varying,
    updated_by character varying(255),
    last_applied timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.empire_brain_config OWNER TO neondb_owner;

--
-- TOC entry 466 (class 1259 OID 18325)
-- Name: empire_brain_config_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.empire_brain_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empire_brain_config_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8743 (class 0 OID 0)
-- Dependencies: 466
-- Name: empire_brain_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.empire_brain_config_id_seq OWNED BY public.empire_brain_config.id;


--
-- TOC entry 242 (class 1259 OID 16678)
-- Name: empire_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.empire_config (
    id integer NOT NULL,
    config_key character varying(255) NOT NULL,
    config_value jsonb NOT NULL,
    description text,
    category character varying(100),
    is_secret boolean DEFAULT false,
    version character varying(50) DEFAULT '1.0'::character varying,
    updated_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.empire_config OWNER TO neondb_owner;

--
-- TOC entry 241 (class 1259 OID 16677)
-- Name: empire_config_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.empire_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empire_config_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8744 (class 0 OID 0)
-- Dependencies: 241
-- Name: empire_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.empire_config_id_seq OWNED BY public.empire_config.id;


--
-- TOC entry 244 (class 1259 OID 16693)
-- Name: experiment_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.experiment_events (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    experiment_id integer,
    variant_id integer,
    event_type character varying(50) NOT NULL,
    event_value character varying(255),
    page_slug character varying(255),
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    user_id character varying(255),
    metadata jsonb
);


ALTER TABLE public.experiment_events OWNER TO neondb_owner;

--
-- TOC entry 243 (class 1259 OID 16692)
-- Name: experiment_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.experiment_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experiment_events_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8745 (class 0 OID 0)
-- Dependencies: 243
-- Name: experiment_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.experiment_events_id_seq OWNED BY public.experiment_events.id;


--
-- TOC entry 246 (class 1259 OID 16703)
-- Name: experiment_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.experiment_results (
    id integer NOT NULL,
    experiment_id integer,
    variant_id integer,
    date timestamp without time zone NOT NULL,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    bounces integer DEFAULT 0,
    unique_users integer DEFAULT 0,
    conversion_rate character varying(10),
    click_through_rate character varying(10),
    bounce_rate character varying(10),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.experiment_results OWNER TO neondb_owner;

--
-- TOC entry 245 (class 1259 OID 16702)
-- Name: experiment_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.experiment_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experiment_results_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8746 (class 0 OID 0)
-- Dependencies: 245
-- Name: experiment_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.experiment_results_id_seq OWNED BY public.experiment_results.id;


--
-- TOC entry 248 (class 1259 OID 16717)
-- Name: experiment_variants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.experiment_variants (
    id integer NOT NULL,
    experiment_id integer,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    traffic_percentage integer NOT NULL,
    configuration jsonb NOT NULL,
    is_control boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.experiment_variants OWNER TO neondb_owner;

--
-- TOC entry 247 (class 1259 OID 16716)
-- Name: experiment_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.experiment_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experiment_variants_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8747 (class 0 OID 0)
-- Dependencies: 247
-- Name: experiment_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.experiment_variants_id_seq OWNED BY public.experiment_variants.id;


--
-- TOC entry 250 (class 1259 OID 16730)
-- Name: experiments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.experiments (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    target_entity character varying(255) NOT NULL,
    traffic_allocation integer DEFAULT 100,
    status character varying(20) DEFAULT 'draft'::character varying,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    created_by character varying(255),
    metadata jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.experiments OWNER TO neondb_owner;

--
-- TOC entry 249 (class 1259 OID 16729)
-- Name: experiments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.experiments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experiments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8748 (class 0 OID 0)
-- Dependencies: 249
-- Name: experiments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.experiments_id_seq OWNED BY public.experiments.id;


--
-- TOC entry 671 (class 1259 OID 19951)
-- Name: export_archives; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.export_archives (
    id integer NOT NULL,
    archive_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    export_type character varying(50) NOT NULL,
    version character varying(50) NOT NULL,
    file_size integer NOT NULL,
    checksum character varying(128) NOT NULL,
    file_path text NOT NULL,
    manifest jsonb NOT NULL,
    exported_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.export_archives OWNER TO neondb_owner;

--
-- TOC entry 670 (class 1259 OID 19950)
-- Name: export_archives_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.export_archives_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.export_archives_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8749 (class 0 OID 0)
-- Dependencies: 670
-- Name: export_archives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.export_archives_id_seq OWNED BY public.export_archives.id;


--
-- TOC entry 757 (class 1259 OID 20872)
-- Name: failover_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.failover_events (
    id text NOT NULL,
    event_type text NOT NULL,
    trigger_reason text NOT NULL,
    from_region text NOT NULL,
    to_region text NOT NULL,
    affected_users integer DEFAULT 0 NOT NULL,
    affected_requests integer DEFAULT 0 NOT NULL,
    recovery_time_seconds integer DEFAULT 0 NOT NULL,
    downtime_seconds integer DEFAULT 0 NOT NULL,
    data_consistency_check boolean DEFAULT false NOT NULL,
    rollback_available boolean DEFAULT false NOT NULL,
    impact_assessment jsonb NOT NULL,
    automated_actions jsonb NOT NULL,
    manual_interventions jsonb,
    lessons_learned text,
    resolution_status text DEFAULT 'resolved'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone
);


ALTER TABLE public.failover_events OWNER TO neondb_owner;

--
-- TOC entry 252 (class 1259 OID 16746)
-- Name: federation_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.federation_events (
    id integer NOT NULL,
    neuron_id character varying(100),
    event_type character varying(100) NOT NULL,
    event_data jsonb,
    initiated_by character varying(255),
    success boolean DEFAULT true,
    error_message text,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.federation_events OWNER TO neondb_owner;

--
-- TOC entry 251 (class 1259 OID 16745)
-- Name: federation_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.federation_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.federation_events_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8750 (class 0 OID 0)
-- Dependencies: 251
-- Name: federation_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.federation_events_id_seq OWNED BY public.federation_events.id;


--
-- TOC entry 695 (class 1259 OID 20192)
-- Name: federation_memory_sync; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.federation_memory_sync (
    id integer NOT NULL,
    sync_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_neuron character varying(100) NOT NULL,
    target_neuron character varying(100) NOT NULL,
    sync_type character varying(50) NOT NULL,
    nodes_synced jsonb DEFAULT '[]'::jsonb NOT NULL,
    edges_synced jsonb DEFAULT '[]'::jsonb NOT NULL,
    sync_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    success_count integer DEFAULT 0 NOT NULL,
    failure_count integer DEFAULT 0 NOT NULL,
    errors jsonb DEFAULT '[]'::jsonb NOT NULL,
    start_time timestamp without time zone DEFAULT now() NOT NULL,
    end_time timestamp without time zone,
    total_time integer,
    triggered_by character varying(100) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.federation_memory_sync OWNER TO neondb_owner;

--
-- TOC entry 694 (class 1259 OID 20191)
-- Name: federation_memory_sync_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.federation_memory_sync_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.federation_memory_sync_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8751 (class 0 OID 0)
-- Dependencies: 694
-- Name: federation_memory_sync_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.federation_memory_sync_id_seq OWNED BY public.federation_memory_sync.id;


--
-- TOC entry 711 (class 1259 OID 20351)
-- Name: federation_rlhf_sync; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.federation_rlhf_sync (
    id integer NOT NULL,
    sync_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_neuron character varying(255) NOT NULL,
    target_neurons jsonb DEFAULT '[]'::jsonb NOT NULL,
    sync_type character varying(50) NOT NULL,
    sync_data jsonb NOT NULL,
    data_type character varying(50) NOT NULL,
    data_size integer NOT NULL,
    data_quality real DEFAULT 0.5 NOT NULL,
    validation_results jsonb DEFAULT '{}'::jsonb NOT NULL,
    conflict_resolution jsonb DEFAULT '{}'::jsonb NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    processed_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    error_details text,
    federation_version character varying(50),
    consensus_score real,
    priority_level character varying(20) DEFAULT 'normal'::character varying,
    initiated_at timestamp without time zone DEFAULT now() NOT NULL,
    processed_at timestamp without time zone,
    completed_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.federation_rlhf_sync OWNER TO neondb_owner;

--
-- TOC entry 710 (class 1259 OID 20350)
-- Name: federation_rlhf_sync_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.federation_rlhf_sync_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.federation_rlhf_sync_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8752 (class 0 OID 0)
-- Dependencies: 710
-- Name: federation_rlhf_sync_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.federation_rlhf_sync_id_seq OWNED BY public.federation_rlhf_sync.id;


--
-- TOC entry 683 (class 1259 OID 20068)
-- Name: federation_tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.federation_tasks (
    id integer NOT NULL,
    task_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_neuron character varying(100) NOT NULL,
    target_neuron character varying(100),
    task_type character varying(100) NOT NULL,
    priority character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    payload jsonb NOT NULL,
    result jsonb,
    assigned_agent uuid,
    max_retries integer DEFAULT 3 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    cost_budget real DEFAULT 0 NOT NULL,
    cost_used real DEFAULT 0 NOT NULL,
    scheduled_at timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.federation_tasks OWNER TO neondb_owner;

--
-- TOC entry 682 (class 1259 OID 20067)
-- Name: federation_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.federation_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.federation_tasks_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8753 (class 0 OID 0)
-- Dependencies: 682
-- Name: federation_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.federation_tasks_id_seq OWNED BY public.federation_tasks.id;


--
-- TOC entry 367 (class 1259 OID 17567)
-- Name: finance_ai_chat_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_ai_chat_sessions (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    chat_session_id character varying(255) NOT NULL,
    persona character varying(100),
    context jsonb,
    messages jsonb NOT NULL,
    topics jsonb,
    recommendations jsonb,
    product_suggestions jsonb,
    satisfaction_rating integer,
    resolved_query boolean DEFAULT false,
    follow_up_scheduled boolean DEFAULT false,
    total_messages integer DEFAULT 0,
    session_duration integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_ai_chat_sessions OWNER TO neondb_owner;

--
-- TOC entry 366 (class 1259 OID 17566)
-- Name: finance_ai_chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_ai_chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_ai_chat_sessions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8754 (class 0 OID 0)
-- Dependencies: 366
-- Name: finance_ai_chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_ai_chat_sessions_id_seq OWNED BY public.finance_ai_chat_sessions.id;


--
-- TOC entry 369 (class 1259 OID 17584)
-- Name: finance_calculator_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_calculator_results (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    calculator_type character varying(100) NOT NULL,
    inputs jsonb NOT NULL,
    results jsonb NOT NULL,
    recommendations jsonb,
    action_items jsonb,
    shareable_link character varying(255),
    bookmarked boolean DEFAULT false,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_calculator_results OWNER TO neondb_owner;

--
-- TOC entry 368 (class 1259 OID 17583)
-- Name: finance_calculator_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_calculator_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_calculator_results_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8755 (class 0 OID 0)
-- Dependencies: 368
-- Name: finance_calculator_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_calculator_results_id_seq OWNED BY public.finance_calculator_results.id;


--
-- TOC entry 371 (class 1259 OID 17596)
-- Name: finance_content; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_content (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    meta_description text,
    category character varying(100) NOT NULL,
    subcategory character varying(100),
    target_personas jsonb NOT NULL,
    emotion_tone character varying(50) DEFAULT 'optimistic'::character varying,
    content_type character varying(50) DEFAULT 'article'::character varying,
    content text NOT NULL,
    reading_time integer,
    difficulty character varying(50) DEFAULT 'beginner'::character varying,
    key_takeaways jsonb,
    action_items jsonb,
    related_products jsonb,
    seo_keywords jsonb,
    last_updated timestamp without time zone DEFAULT now(),
    author_credentials character varying(255),
    fact_check_date timestamp without time zone,
    view_count integer DEFAULT 0,
    engagement_score numeric(5,2) DEFAULT 0.00,
    is_published boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_content OWNER TO neondb_owner;

--
-- TOC entry 370 (class 1259 OID 17595)
-- Name: finance_content_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_content_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8756 (class 0 OID 0)
-- Dependencies: 370
-- Name: finance_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_content_id_seq OWNED BY public.finance_content.id;


--
-- TOC entry 373 (class 1259 OID 17617)
-- Name: finance_gamification; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_gamification (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    current_level integer DEFAULT 1,
    total_xp integer DEFAULT 0,
    streak_days integer DEFAULT 0,
    last_activity_date timestamp without time zone DEFAULT now(),
    completed_challenges jsonb,
    earned_badges jsonb,
    current_quests jsonb,
    lifetime_stats jsonb,
    weekly_goals jsonb,
    monthly_goals jsonb,
    preferences jsonb,
    leaderboard_score integer DEFAULT 0,
    is_public_profile boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_gamification OWNER TO neondb_owner;

--
-- TOC entry 372 (class 1259 OID 17616)
-- Name: finance_gamification_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_gamification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_gamification_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8757 (class 0 OID 0)
-- Dependencies: 372
-- Name: finance_gamification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_gamification_id_seq OWNED BY public.finance_gamification.id;


--
-- TOC entry 375 (class 1259 OID 17634)
-- Name: finance_lead_magnets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_lead_magnets (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    magnet_type character varying(100) NOT NULL,
    magnet_title character varying(255) NOT NULL,
    user_email character varying(255),
    user_first_name character varying(100),
    user_persona character varying(100),
    downloaded_at timestamp without time zone DEFAULT now(),
    download_source character varying(100),
    follow_up_sequence character varying(100),
    conversion_tracked boolean DEFAULT false,
    email_opt_in boolean DEFAULT true,
    sms_opt_in boolean DEFAULT false,
    preferences jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_lead_magnets OWNER TO neondb_owner;

--
-- TOC entry 374 (class 1259 OID 17633)
-- Name: finance_lead_magnets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_lead_magnets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_lead_magnets_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8758 (class 0 OID 0)
-- Dependencies: 374
-- Name: finance_lead_magnets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_lead_magnets_id_seq OWNED BY public.finance_lead_magnets.id;


--
-- TOC entry 377 (class 1259 OID 17648)
-- Name: finance_performance_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_performance_metrics (
    id integer NOT NULL,
    metric_date timestamp without time zone DEFAULT now(),
    total_sessions integer DEFAULT 0,
    unique_users integer DEFAULT 0,
    quiz_completions integer DEFAULT 0,
    calculator_usage integer DEFAULT 0,
    content_views integer DEFAULT 0,
    ai_chat_sessions integer DEFAULT 0,
    lead_magnet_downloads integer DEFAULT 0,
    affiliate_clicks integer DEFAULT 0,
    average_session_duration integer DEFAULT 0,
    bounce_rate numeric(5,2) DEFAULT 0.00,
    conversion_rate numeric(5,2) DEFAULT 0.00,
    engagement_score numeric(5,2) DEFAULT 0.00,
    content_performance jsonb,
    product_performance jsonb,
    persona_breakdown jsonb,
    top_performing_content jsonb,
    optimization_suggestions jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_performance_metrics OWNER TO neondb_owner;

--
-- TOC entry 376 (class 1259 OID 17647)
-- Name: finance_performance_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_performance_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_performance_metrics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8759 (class 0 OID 0)
-- Dependencies: 376
-- Name: finance_performance_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_performance_metrics_id_seq OWNED BY public.finance_performance_metrics.id;


--
-- TOC entry 379 (class 1259 OID 17671)
-- Name: finance_product_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_product_offers (
    id integer NOT NULL,
    product_type character varying(100) NOT NULL,
    provider_name character varying(255) NOT NULL,
    product_name character varying(255) NOT NULL,
    description text NOT NULL,
    key_features jsonb NOT NULL,
    target_personas jsonb NOT NULL,
    apr numeric(5,2),
    interest_rate numeric(5,2),
    fees jsonb,
    minimum_amount numeric(12,2),
    maximum_amount numeric(12,2),
    eligibility_requirements jsonb,
    affiliate_url text NOT NULL,
    cta_text character varying(100) DEFAULT 'Learn More'::character varying,
    trust_score integer DEFAULT 85,
    priority integer DEFAULT 1,
    is_active boolean DEFAULT true,
    disclaimers jsonb,
    promotional_offer text,
    expiration_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_product_offers OWNER TO neondb_owner;

--
-- TOC entry 378 (class 1259 OID 17670)
-- Name: finance_product_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_product_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_product_offers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8760 (class 0 OID 0)
-- Dependencies: 378
-- Name: finance_product_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_product_offers_id_seq OWNED BY public.finance_product_offers.id;


--
-- TOC entry 381 (class 1259 OID 17686)
-- Name: finance_profiles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_profiles (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    persona character varying(100) NOT NULL,
    goals jsonb NOT NULL,
    risk_tolerance character varying(50) DEFAULT 'moderate'::character varying,
    current_income numeric(12,2),
    current_savings numeric(12,2),
    current_debt numeric(12,2),
    age integer,
    dependents integer DEFAULT 0,
    financial_experience character varying(50) DEFAULT 'beginner'::character varying,
    preferred_products jsonb,
    last_quiz_score integer,
    engagement_level character varying(50) DEFAULT 'low'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_profiles OWNER TO neondb_owner;

--
-- TOC entry 380 (class 1259 OID 17685)
-- Name: finance_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_profiles_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8761 (class 0 OID 0)
-- Dependencies: 380
-- Name: finance_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_profiles_id_seq OWNED BY public.finance_profiles.id;


--
-- TOC entry 383 (class 1259 OID 17701)
-- Name: finance_quiz_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_quiz_results (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    quiz_type character varying(100) NOT NULL,
    answers jsonb NOT NULL,
    calculated_persona character varying(100) NOT NULL,
    score integer NOT NULL,
    recommendations jsonb NOT NULL,
    product_matches jsonb,
    completion_time integer,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_quiz_results OWNER TO neondb_owner;

--
-- TOC entry 382 (class 1259 OID 17700)
-- Name: finance_quiz_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_quiz_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_quiz_results_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8762 (class 0 OID 0)
-- Dependencies: 382
-- Name: finance_quiz_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_quiz_results_id_seq OWNED BY public.finance_quiz_results.id;


--
-- TOC entry 565 (class 1259 OID 19059)
-- Name: funnel_ab_tests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_ab_tests (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    funnel_id integer,
    test_type character varying(50) DEFAULT 'ab'::character varying,
    variants jsonb NOT NULL,
    traffic_split jsonb NOT NULL,
    target_audience jsonb,
    start_conditions jsonb,
    stop_conditions jsonb,
    status character varying(50) DEFAULT 'draft'::character varying,
    winning_variant character varying(100),
    confidence real,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    metadata jsonb
);


ALTER TABLE public.funnel_ab_tests OWNER TO neondb_owner;

--
-- TOC entry 564 (class 1259 OID 19058)
-- Name: funnel_ab_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.funnel_ab_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funnel_ab_tests_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8763 (class 0 OID 0)
-- Dependencies: 564
-- Name: funnel_ab_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.funnel_ab_tests_id_seq OWNED BY public.funnel_ab_tests.id;


--
-- TOC entry 567 (class 1259 OID 19072)
-- Name: funnel_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_analytics (
    id integer NOT NULL,
    funnel_id integer,
    block_id integer,
    date timestamp without time zone NOT NULL,
    period character varying(20) DEFAULT 'daily'::character varying,
    views integer DEFAULT 0,
    interactions integer DEFAULT 0,
    completions integer DEFAULT 0,
    conversions integer DEFAULT 0,
    abandons integer DEFAULT 0,
    average_time_spent real DEFAULT 0,
    bounce_rate real DEFAULT 0,
    conversion_rate real DEFAULT 0,
    engagement_score real DEFAULT 0,
    revenue real DEFAULT 0,
    avg_order_value real DEFAULT 0,
    ltv real DEFAULT 0,
    variant character varying(100),
    test_confidence real,
    segment character varying(100),
    demographic_data jsonb,
    metadata jsonb
);


ALTER TABLE public.funnel_analytics OWNER TO neondb_owner;

--
-- TOC entry 566 (class 1259 OID 19071)
-- Name: funnel_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.funnel_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funnel_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8764 (class 0 OID 0)
-- Dependencies: 566
-- Name: funnel_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.funnel_analytics_id_seq OWNED BY public.funnel_analytics.id;


--
-- TOC entry 569 (class 1259 OID 19094)
-- Name: funnel_blocks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_blocks (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    slug character varying(255) NOT NULL,
    category character varying(100),
    config jsonb NOT NULL,
    content jsonb NOT NULL,
    styling jsonb,
    entry_conditions jsonb,
    exit_conditions jsonb,
    personalization_rules jsonb,
    tracking_events jsonb,
    is_reusable boolean DEFAULT true,
    is_active boolean DEFAULT true,
    tags jsonb DEFAULT '[]'::jsonb,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.funnel_blocks OWNER TO neondb_owner;

--
-- TOC entry 568 (class 1259 OID 19093)
-- Name: funnel_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.funnel_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funnel_blocks_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8765 (class 0 OID 0)
-- Dependencies: 568
-- Name: funnel_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.funnel_blocks_id_seq OWNED BY public.funnel_blocks.id;


--
-- TOC entry 253 (class 1259 OID 16756)
-- Name: funnel_blueprints; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_blueprints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    vertical text NOT NULL,
    type text NOT NULL,
    description text,
    config jsonb NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.funnel_blueprints OWNER TO neondb_owner;

--
-- TOC entry 571 (class 1259 OID 19110)
-- Name: funnel_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_events (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    funnel_session_id integer,
    event_type character varying(100) NOT NULL,
    block_id integer,
    block_type character varying(100),
    event_data jsonb,
    user_input jsonb,
    "timestamp" timestamp without time zone DEFAULT now(),
    time_on_block integer,
    scroll_depth real,
    click_position jsonb,
    emotion_detected character varying(50),
    intent_score real,
    engagement_level character varying(50),
    metadata jsonb
);


ALTER TABLE public.funnel_events OWNER TO neondb_owner;

--
-- TOC entry 570 (class 1259 OID 19109)
-- Name: funnel_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.funnel_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funnel_events_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8766 (class 0 OID 0)
-- Dependencies: 570
-- Name: funnel_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.funnel_events_id_seq OWNED BY public.funnel_events.id;


--
-- TOC entry 254 (class 1259 OID 16768)
-- Name: funnel_experiments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_experiments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    blueprint_id uuid NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    experiment_type text DEFAULT 'ab_test'::text NOT NULL,
    variants jsonb NOT NULL,
    targeting jsonb,
    success_metrics jsonb,
    results jsonb,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.funnel_experiments OWNER TO neondb_owner;

--
-- TOC entry 255 (class 1259 OID 16780)
-- Name: funnel_instances; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_instances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blueprint_id uuid NOT NULL,
    session_id text NOT NULL,
    user_id text,
    variant_id text,
    entry_point text NOT NULL,
    current_block text,
    status text DEFAULT 'active'::text NOT NULL,
    personalization_data jsonb,
    analytics_data jsonb,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    last_activity timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.funnel_instances OWNER TO neondb_owner;

--
-- TOC entry 573 (class 1259 OID 19120)
-- Name: funnel_integrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_integrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    endpoint character varying(500),
    credentials jsonb,
    config jsonb,
    event_mapping jsonb,
    data_mapping jsonb,
    is_active boolean DEFAULT true,
    last_sync timestamp without time zone,
    error_count integer DEFAULT 0,
    last_error text,
    rate_limit_config jsonb,
    retry_config jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    metadata jsonb
);


ALTER TABLE public.funnel_integrations OWNER TO neondb_owner;

--
-- TOC entry 572 (class 1259 OID 19119)
-- Name: funnel_integrations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.funnel_integrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funnel_integrations_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8767 (class 0 OID 0)
-- Dependencies: 572
-- Name: funnel_integrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.funnel_integrations_id_seq OWNED BY public.funnel_integrations.id;


--
-- TOC entry 256 (class 1259 OID 16791)
-- Name: funnel_lifecycle_integrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_lifecycle_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blueprint_id uuid NOT NULL,
    integration_type text NOT NULL,
    trigger_conditions jsonb NOT NULL,
    action_config jsonb NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    performance_stats jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.funnel_lifecycle_integrations OWNER TO neondb_owner;

--
-- TOC entry 257 (class 1259 OID 16802)
-- Name: funnel_optimizations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_optimizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blueprint_id uuid NOT NULL,
    optimization_type text NOT NULL,
    category text NOT NULL,
    current_config jsonb NOT NULL,
    suggested_config jsonb NOT NULL,
    reasoning text NOT NULL,
    confidence_score numeric(5,4),
    expected_impact jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    implementation_date timestamp with time zone,
    results jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.funnel_optimizations OWNER TO neondb_owner;

--
-- TOC entry 575 (class 1259 OID 19133)
-- Name: funnel_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    slug character varying(255) NOT NULL,
    category character varying(100),
    is_public boolean DEFAULT false,
    is_active boolean DEFAULT true,
    version character varying(50) DEFAULT '1.0.0'::character varying,
    blocks jsonb NOT NULL,
    flow_logic jsonb NOT NULL,
    trigger_rules jsonb,
    personalization_rules jsonb,
    ai_optimization_settings jsonb,
    ml_model_config jsonb,
    conversion_goals jsonb,
    testing_config jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    metadata jsonb,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.funnel_templates OWNER TO neondb_owner;

--
-- TOC entry 574 (class 1259 OID 19132)
-- Name: funnel_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.funnel_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funnel_templates_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8768 (class 0 OID 0)
-- Dependencies: 574
-- Name: funnel_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.funnel_templates_id_seq OWNED BY public.funnel_templates.id;


--
-- TOC entry 577 (class 1259 OID 19150)
-- Name: funnel_triggers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funnel_triggers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    funnel_id integer,
    trigger_type character varying(100) NOT NULL,
    conditions jsonb NOT NULL,
    action character varying(100) NOT NULL,
    action_config jsonb,
    audience_rules jsonb,
    timing_rules jsonb,
    frequency_rules jsonb,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 100,
    trigger_count integer DEFAULT 0,
    success_rate real DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    metadata jsonb
);


ALTER TABLE public.funnel_triggers OWNER TO neondb_owner;

--
-- TOC entry 576 (class 1259 OID 19149)
-- Name: funnel_triggers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.funnel_triggers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funnel_triggers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8769 (class 0 OID 0)
-- Dependencies: 576
-- Name: funnel_triggers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.funnel_triggers_id_seq OWNED BY public.funnel_triggers.id;


--
-- TOC entry 615 (class 1259 OID 19455)
-- Name: geo_restriction_management; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.geo_restriction_management (
    id integer NOT NULL,
    rule_id character varying(100) NOT NULL,
    rule_name character varying(255) NOT NULL,
    rule_type character varying(50) NOT NULL,
    target_countries jsonb,
    target_regions jsonb,
    excluded_countries jsonb,
    excluded_regions jsonb,
    content_types jsonb,
    verticals jsonb,
    affiliate_networks jsonb,
    offer_categories jsonb,
    conditions jsonb,
    actions jsonb,
    fallback_content jsonb,
    redirect_url text,
    legal_basis character varying(255),
    compliance_framework character varying(100),
    regulatory_requirement text,
    status character varying(50) DEFAULT 'active'::character varying,
    priority integer DEFAULT 100,
    effective_date timestamp without time zone,
    expiration_date timestamp without time zone,
    applications_count integer DEFAULT 0,
    blocked_requests integer DEFAULT 0,
    allowed_requests integer DEFAULT 0,
    last_triggered timestamp without time zone,
    test_mode boolean DEFAULT false,
    test_results jsonb,
    validation_status character varying(50),
    created_by character varying(255),
    last_modified_by character varying(255),
    change_reason text,
    approval_required boolean DEFAULT false,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.geo_restriction_management OWNER TO neondb_owner;

--
-- TOC entry 614 (class 1259 OID 19454)
-- Name: geo_restriction_management_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.geo_restriction_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.geo_restriction_management_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8770 (class 0 OID 0)
-- Dependencies: 614
-- Name: geo_restriction_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.geo_restriction_management_id_seq OWNED BY public.geo_restriction_management.id;


--
-- TOC entry 617 (class 1259 OID 19475)
-- Name: global_consent_management; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.global_consent_management (
    id integer NOT NULL,
    user_id character varying(255),
    session_id character varying(255),
    fingerprint character varying(255),
    ip_address character varying(45),
    user_agent text,
    country character varying(10) NOT NULL,
    region character varying(100),
    detected_region character varying(100),
    legal_framework character varying(50) NOT NULL,
    language_code character varying(10) DEFAULT 'en'::character varying,
    cookies_consent character varying(20) DEFAULT 'pending'::character varying,
    analytics_consent character varying(20) DEFAULT 'pending'::character varying,
    personalization_consent character varying(20) DEFAULT 'pending'::character varying,
    marketing_consent character varying(20) DEFAULT 'pending'::character varying,
    affiliate_consent character varying(20) DEFAULT 'pending'::character varying,
    email_consent character varying(20) DEFAULT 'pending'::character varying,
    push_consent character varying(20) DEFAULT 'pending'::character varying,
    sms_consent character varying(20) DEFAULT 'pending'::character varying,
    consent_details jsonb,
    consent_method character varying(50),
    consent_version character varying(20) NOT NULL,
    legal_basis character varying(100),
    consent_evidence jsonb,
    withdrawal_reason text,
    consent_granted_at timestamp without time zone,
    consent_withdrawn_at timestamp without time zone,
    last_updated_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone,
    is_active boolean DEFAULT true,
    requires_reconfirmation boolean DEFAULT false,
    is_minor boolean DEFAULT false,
    parental_consent_required boolean DEFAULT false,
    audit_trail jsonb,
    synced_with_external_systems jsonb,
    compliance_score numeric(3,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.global_consent_management OWNER TO neondb_owner;

--
-- TOC entry 616 (class 1259 OID 19474)
-- Name: global_consent_management_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.global_consent_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.global_consent_management_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8771 (class 0 OID 0)
-- Dependencies: 616
-- Name: global_consent_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.global_consent_management_id_seq OWNED BY public.global_consent_management.id;


--
-- TOC entry 758 (class 1259 OID 20887)
-- Name: global_performance_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.global_performance_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    metric_type text NOT NULL,
    global_uptime_percentage real DEFAULT 100 NOT NULL,
    average_response_time real DEFAULT 0 NOT NULL,
    p95_response_time real DEFAULT 0 NOT NULL,
    p99_response_time real DEFAULT 0 NOT NULL,
    total_requests integer DEFAULT 0 NOT NULL,
    successful_requests integer DEFAULT 0 NOT NULL,
    failed_requests integer DEFAULT 0 NOT NULL,
    peak_concurrent_users integer DEFAULT 0 NOT NULL,
    regions_active integer DEFAULT 0 NOT NULL,
    cross_region_requests integer DEFAULT 0 NOT NULL,
    geographic_efficiency real DEFAULT 0 NOT NULL,
    revenue_impact real DEFAULT 0 NOT NULL,
    conversion_rate real DEFAULT 0 NOT NULL,
    user_satisfaction_avg real DEFAULT 0 NOT NULL,
    sla_compliance_percentage real DEFAULT 100 NOT NULL,
    predicted_growth_rate real DEFAULT 0 NOT NULL,
    capacity_utilization real DEFAULT 0 NOT NULL,
    optimization_opportunities jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.global_performance_metrics OWNER TO neondb_owner;

--
-- TOC entry 259 (class 1259 OID 16814)
-- Name: global_user_profiles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.global_user_profiles (
    id integer NOT NULL,
    uuid character varying(36) NOT NULL,
    email character varying(255),
    phone character varying(20),
    first_name character varying(100),
    last_name character varying(100),
    merged_from_sessions jsonb,
    total_sessions integer DEFAULT 0,
    total_page_views integer DEFAULT 0,
    total_interactions integer DEFAULT 0,
    total_time_on_site integer DEFAULT 0,
    first_visit timestamp without time zone,
    last_visit timestamp without time zone,
    preferred_device_type character varying(50),
    preferred_browser character varying(50),
    preferred_os character varying(50),
    location_data jsonb,
    preferences jsonb,
    segments jsonb,
    tags jsonb,
    custom_attributes jsonb,
    lifetime_value integer DEFAULT 0,
    conversion_count integer DEFAULT 0,
    lead_quality_score integer DEFAULT 0,
    engagement_score integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.global_user_profiles OWNER TO neondb_owner;

--
-- TOC entry 258 (class 1259 OID 16813)
-- Name: global_user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.global_user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.global_user_profiles_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8772 (class 0 OID 0)
-- Dependencies: 258
-- Name: global_user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.global_user_profiles_id_seq OWNED BY public.global_user_profiles.id;


--
-- TOC entry 493 (class 1259 OID 18523)
-- Name: graph_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.graph_analytics (
    id integer NOT NULL,
    node_id integer,
    edge_id integer,
    metric_type character varying(50) NOT NULL,
    value real NOT NULL,
    aggregation_type character varying(20) DEFAULT 'sum'::character varying,
    timeframe character varying(20) NOT NULL,
    date timestamp without time zone NOT NULL,
    neuron_id character varying(100),
    vertical character varying(50),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.graph_analytics OWNER TO neondb_owner;

--
-- TOC entry 492 (class 1259 OID 18522)
-- Name: graph_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.graph_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.graph_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8773 (class 0 OID 0)
-- Dependencies: 492
-- Name: graph_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.graph_analytics_id_seq OWNED BY public.graph_analytics.id;


--
-- TOC entry 495 (class 1259 OID 18534)
-- Name: graph_audit_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.graph_audit_results (
    id integer NOT NULL,
    audit_type character varying(50) NOT NULL,
    node_id integer,
    edge_id integer,
    severity character varying(20) NOT NULL,
    issue text NOT NULL,
    recommendation text,
    auto_fix_available boolean DEFAULT false,
    is_resolved boolean DEFAULT false,
    resolved_by character varying(50),
    resolved_at timestamp without time zone,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.graph_audit_results OWNER TO neondb_owner;

--
-- TOC entry 494 (class 1259 OID 18533)
-- Name: graph_audit_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.graph_audit_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.graph_audit_results_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8774 (class 0 OID 0)
-- Dependencies: 494
-- Name: graph_audit_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.graph_audit_results_id_seq OWNED BY public.graph_audit_results.id;


--
-- TOC entry 345 (class 1259 OID 17407)
-- Name: health_archetypes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_archetypes (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    characteristics jsonb,
    emotion_mapping character varying(50),
    color_scheme jsonb,
    preferred_tools jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_archetypes OWNER TO neondb_owner;

--
-- TOC entry 344 (class 1259 OID 17406)
-- Name: health_archetypes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_archetypes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_archetypes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8775 (class 0 OID 0)
-- Dependencies: 344
-- Name: health_archetypes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_archetypes_id_seq OWNED BY public.health_archetypes.id;


--
-- TOC entry 347 (class 1259 OID 17421)
-- Name: health_content; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_content (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    excerpt text,
    content text NOT NULL,
    category character varying(100),
    content_type character varying(50),
    target_archetype character varying(100),
    emotion_tone character varying(50),
    reading_time integer DEFAULT 5,
    seo_title character varying(255),
    seo_description text,
    tags jsonb,
    sources jsonb,
    is_generated boolean DEFAULT false,
    published_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_content OWNER TO neondb_owner;

--
-- TOC entry 346 (class 1259 OID 17420)
-- Name: health_content_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_content_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8776 (class 0 OID 0)
-- Dependencies: 346
-- Name: health_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_content_id_seq OWNED BY public.health_content.id;


--
-- TOC entry 349 (class 1259 OID 17437)
-- Name: health_content_performance; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_content_performance (
    id integer NOT NULL,
    content_id integer,
    date date NOT NULL,
    views integer DEFAULT 0,
    unique_views integer DEFAULT 0,
    average_time_on_page integer DEFAULT 0,
    bounce_rate real DEFAULT 0,
    cta_clicks integer DEFAULT 0,
    lead_captures integer DEFAULT 0,
    social_shares integer DEFAULT 0,
    archetype character varying(100),
    traffic_source character varying(100),
    device_type character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_content_performance OWNER TO neondb_owner;

--
-- TOC entry 348 (class 1259 OID 17436)
-- Name: health_content_performance_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_content_performance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_content_performance_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8777 (class 0 OID 0)
-- Dependencies: 348
-- Name: health_content_performance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_content_performance_id_seq OWNED BY public.health_content_performance.id;


--
-- TOC entry 351 (class 1259 OID 17452)
-- Name: health_daily_quests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_daily_quests (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    xp_reward integer DEFAULT 10,
    difficulty_level character varying(20) DEFAULT 'easy'::character varying,
    completion_criteria jsonb,
    is_daily boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_daily_quests OWNER TO neondb_owner;

--
-- TOC entry 350 (class 1259 OID 17451)
-- Name: health_daily_quests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_daily_quests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_daily_quests_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8778 (class 0 OID 0)
-- Dependencies: 350
-- Name: health_daily_quests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_daily_quests_id_seq OWNED BY public.health_daily_quests.id;


--
-- TOC entry 353 (class 1259 OID 17469)
-- Name: health_gamification; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_gamification (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    current_level integer DEFAULT 1,
    total_xp integer DEFAULT 0,
    streak_days integer DEFAULT 0,
    last_activity date,
    achieved_badges jsonb,
    current_quests jsonb,
    wellness_points integer DEFAULT 0,
    preferences jsonb,
    share_settings jsonb,
    leaderboard_opt_in boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_gamification OWNER TO neondb_owner;

--
-- TOC entry 352 (class 1259 OID 17468)
-- Name: health_gamification_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_gamification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_gamification_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8779 (class 0 OID 0)
-- Dependencies: 352
-- Name: health_gamification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_gamification_id_seq OWNED BY public.health_gamification.id;


--
-- TOC entry 355 (class 1259 OID 17485)
-- Name: health_lead_magnets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_lead_magnets (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    magnet_type character varying(50),
    category character varying(100),
    target_archetype character varying(100),
    delivery_method character varying(50),
    file_url text,
    email_sequence jsonb,
    download_count integer DEFAULT 0,
    conversion_rate real DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_lead_magnets OWNER TO neondb_owner;

--
-- TOC entry 354 (class 1259 OID 17484)
-- Name: health_lead_magnets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_lead_magnets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_lead_magnets_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8780 (class 0 OID 0)
-- Dependencies: 354
-- Name: health_lead_magnets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_lead_magnets_id_seq OWNED BY public.health_lead_magnets.id;


--
-- TOC entry 357 (class 1259 OID 17501)
-- Name: health_quest_completions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_quest_completions (
    id integer NOT NULL,
    quest_id integer,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    completed_at timestamp without time zone DEFAULT now(),
    completion_data jsonb,
    xp_earned integer DEFAULT 0,
    streak_contribution boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_quest_completions OWNER TO neondb_owner;

--
-- TOC entry 356 (class 1259 OID 17500)
-- Name: health_quest_completions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_quest_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_quest_completions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8781 (class 0 OID 0)
-- Dependencies: 356
-- Name: health_quest_completions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_quest_completions_id_seq OWNED BY public.health_quest_completions.id;


--
-- TOC entry 359 (class 1259 OID 17514)
-- Name: health_quiz_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_quiz_results (
    id integer NOT NULL,
    quiz_id integer,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    answers jsonb NOT NULL,
    score integer NOT NULL,
    archetype_result character varying(100),
    confidence_score real DEFAULT 0.8,
    recommendations jsonb,
    time_to_complete integer DEFAULT 0,
    exit_point character varying(50),
    action_taken character varying(100),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_quiz_results OWNER TO neondb_owner;

--
-- TOC entry 358 (class 1259 OID 17513)
-- Name: health_quiz_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_quiz_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_quiz_results_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8782 (class 0 OID 0)
-- Dependencies: 358
-- Name: health_quiz_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_quiz_results_id_seq OWNED BY public.health_quiz_results.id;


--
-- TOC entry 361 (class 1259 OID 17526)
-- Name: health_quizzes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_quizzes (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    questions jsonb NOT NULL,
    scoring_logic jsonb NOT NULL,
    result_mappings jsonb NOT NULL,
    estimated_time integer DEFAULT 300,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_quizzes OWNER TO neondb_owner;

--
-- TOC entry 360 (class 1259 OID 17525)
-- Name: health_quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_quizzes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8783 (class 0 OID 0)
-- Dependencies: 360
-- Name: health_quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_quizzes_id_seq OWNED BY public.health_quizzes.id;


--
-- TOC entry 363 (class 1259 OID 17541)
-- Name: health_tool_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_tool_sessions (
    id integer NOT NULL,
    tool_id integer,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    inputs jsonb NOT NULL,
    outputs jsonb NOT NULL,
    archetype character varying(100),
    time_spent integer DEFAULT 0,
    action_taken character varying(100),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_tool_sessions OWNER TO neondb_owner;

--
-- TOC entry 362 (class 1259 OID 17540)
-- Name: health_tool_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_tool_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_tool_sessions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8784 (class 0 OID 0)
-- Dependencies: 362
-- Name: health_tool_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_tool_sessions_id_seq OWNED BY public.health_tool_sessions.id;


--
-- TOC entry 365 (class 1259 OID 17552)
-- Name: health_tools; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_tools (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100),
    emotion_mapping character varying(50),
    input_fields jsonb,
    calculation_logic text,
    output_format jsonb,
    tracking_enabled boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_tools OWNER TO neondb_owner;

--
-- TOC entry 364 (class 1259 OID 17551)
-- Name: health_tools_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_tools_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8785 (class 0 OID 0)
-- Dependencies: 364
-- Name: health_tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_tools_id_seq OWNED BY public.health_tools.id;


--
-- TOC entry 673 (class 1259 OID 19966)
-- Name: import_operations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.import_operations (
    id integer NOT NULL,
    operation_id uuid DEFAULT gen_random_uuid() NOT NULL,
    archive_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    import_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    total_items integer DEFAULT 0 NOT NULL,
    processed_items integer DEFAULT 0 NOT NULL,
    failed_items integer DEFAULT 0 NOT NULL,
    import_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    logs jsonb DEFAULT '[]'::jsonb NOT NULL,
    errors jsonb DEFAULT '[]'::jsonb NOT NULL,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    imported_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    rollback_data jsonb,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.import_operations OWNER TO neondb_owner;

--
-- TOC entry 672 (class 1259 OID 19965)
-- Name: import_operations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.import_operations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.import_operations_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8786 (class 0 OID 0)
-- Dependencies: 672
-- Name: import_operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.import_operations_id_seq OWNED BY public.import_operations.id;


--
-- TOC entry 697 (class 1259 OID 20212)
-- Name: knowledge_graph_versions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.knowledge_graph_versions (
    id integer NOT NULL,
    version_id uuid DEFAULT gen_random_uuid() NOT NULL,
    node_id uuid NOT NULL,
    change_type character varying(50) NOT NULL,
    previous_data jsonb,
    new_data jsonb NOT NULL,
    diff jsonb NOT NULL,
    change_reason text,
    change_source character varying(100) NOT NULL,
    approval_status character varying(20) DEFAULT 'pending'::character varying,
    changed_by integer NOT NULL,
    approved_by integer,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    approved_at timestamp without time zone,
    effective_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.knowledge_graph_versions OWNER TO neondb_owner;

--
-- TOC entry 696 (class 1259 OID 20211)
-- Name: knowledge_graph_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.knowledge_graph_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knowledge_graph_versions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8787 (class 0 OID 0)
-- Dependencies: 696
-- Name: knowledge_graph_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.knowledge_graph_versions_id_seq OWNED BY public.knowledge_graph_versions.id;


--
-- TOC entry 315 (class 1259 OID 17191)
-- Name: languages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.languages (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    native_name character varying(100) NOT NULL,
    direction character varying(3) DEFAULT 'ltr'::character varying,
    region character varying(10),
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    fallback_language character varying(10) DEFAULT 'en'::character varying,
    completeness integer DEFAULT 0,
    auto_translate boolean DEFAULT true,
    custom_settings jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.languages OWNER TO neondb_owner;

--
-- TOC entry 314 (class 1259 OID 17190)
-- Name: languages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.languages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.languages_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8788 (class 0 OID 0)
-- Dependencies: 314
-- Name: languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.languages_id_seq OWNED BY public.languages.id;


--
-- TOC entry 748 (class 1259 OID 20757)
-- Name: layout_ab_tests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.layout_ab_tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    template_id uuid NOT NULL,
    variations json NOT NULL,
    traffic_split json NOT NULL,
    target_metric character varying(100) NOT NULL,
    hypothesis text,
    start_date timestamp without time zone DEFAULT now(),
    end_date timestamp without time zone,
    status character varying(50) DEFAULT 'draft'::character varying,
    participants integer DEFAULT 0,
    results json,
    winner_variation character varying(100),
    confidence_level numeric(3,2),
    significance_threshold numeric(3,2) DEFAULT 0.95,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.layout_ab_tests OWNER TO neondb_owner;

--
-- TOC entry 749 (class 1259 OID 20771)
-- Name: layout_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.layout_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instance_id uuid NOT NULL,
    template_id uuid NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    page_views integer DEFAULT 0,
    time_on_page integer DEFAULT 0,
    interactions json,
    conversions json,
    elements_engagement json,
    load_time numeric(5,2),
    error_count integer DEFAULT 0,
    bounce_rate numeric(3,2),
    conversion_rate numeric(5,4),
    satisfaction_score numeric(3,2),
    "timestamp" timestamp without time zone DEFAULT now(),
    device_type character varying(50),
    browser_info json,
    location_data json
);


ALTER TABLE public.layout_analytics OWNER TO neondb_owner;

--
-- TOC entry 750 (class 1259 OID 20783)
-- Name: layout_instances; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.layout_instances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    user_id character varying(255),
    session_id character varying(255) NOT NULL,
    device_type character varying(50) NOT NULL,
    screen_size json,
    elements json NOT NULL,
    personalizations json,
    applied_rules json,
    ab_test_segment character varying(50),
    generated_at timestamp without time zone DEFAULT now(),
    last_mutated timestamp without time zone,
    is_active boolean DEFAULT true,
    confidence_score numeric(3,2) DEFAULT 0.50,
    conversion_goal character varying(255),
    metadata json
);


ALTER TABLE public.layout_instances OWNER TO neondb_owner;

--
-- TOC entry 751 (class 1259 OID 20794)
-- Name: layout_mutations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.layout_mutations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instance_id uuid NOT NULL,
    element_id character varying(255) NOT NULL,
    mutation_type character varying(50) NOT NULL,
    mutation_data json NOT NULL,
    trigger_type character varying(50),
    trigger_data json,
    applied_at timestamp without time zone DEFAULT now(),
    success boolean DEFAULT true,
    error_message text,
    performance_impact numeric(5,2),
    reverted boolean DEFAULT false,
    reverted_at timestamp without time zone
);


ALTER TABLE public.layout_mutations OWNER TO neondb_owner;

--
-- TOC entry 752 (class 1259 OID 20805)
-- Name: layout_personalization; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.layout_personalization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    rule_type character varying(50) NOT NULL,
    conditions json NOT NULL,
    mutations json NOT NULL,
    priority integer DEFAULT 100,
    is_active boolean DEFAULT true,
    effectiveness_score numeric(3,2),
    application_count integer DEFAULT 0,
    conversion_lift numeric(5,4),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_applied timestamp without time zone,
    created_by character varying(255),
    tags json
);


ALTER TABLE public.layout_personalization OWNER TO neondb_owner;

--
-- TOC entry 753 (class 1259 OID 20818)
-- Name: layout_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.layout_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    elements json NOT NULL,
    default_rules json,
    metadata json,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by character varying(255),
    version character varying(50) DEFAULT '1.0.0'::character varying
);


ALTER TABLE public.layout_templates OWNER TO neondb_owner;

--
-- TOC entry 261 (class 1259 OID 16840)
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_activities (
    id integer NOT NULL,
    lead_capture_id integer,
    activity_type character varying(50) NOT NULL,
    activity_data jsonb,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    session_id character varying(255),
    page_slug character varying(255),
    metadata jsonb
);


ALTER TABLE public.lead_activities OWNER TO neondb_owner;

--
-- TOC entry 260 (class 1259 OID 16839)
-- Name: lead_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.lead_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_activities_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8789 (class 0 OID 0)
-- Dependencies: 260
-- Name: lead_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.lead_activities_id_seq OWNED BY public.lead_activities.id;


--
-- TOC entry 263 (class 1259 OID 16850)
-- Name: lead_captures; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_captures (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    lead_form_id integer,
    lead_magnet_id integer,
    email character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(20),
    additional_data jsonb,
    source character varying(100),
    user_agent text,
    ip_address character varying(45),
    referrer_url text,
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(100),
    utm_term character varying(100),
    utm_content character varying(100),
    is_verified boolean DEFAULT false,
    is_delivered boolean DEFAULT false,
    delivered_at timestamp without time zone,
    unsubscribed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lead_captures OWNER TO neondb_owner;

--
-- TOC entry 262 (class 1259 OID 16849)
-- Name: lead_captures_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.lead_captures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_captures_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8790 (class 0 OID 0)
-- Dependencies: 262
-- Name: lead_captures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.lead_captures_id_seq OWNED BY public.lead_captures.id;


--
-- TOC entry 265 (class 1259 OID 16863)
-- Name: lead_experiments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_experiments (
    id integer NOT NULL,
    experiment_id integer,
    lead_form_id integer,
    variant_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lead_experiments OWNER TO neondb_owner;

--
-- TOC entry 264 (class 1259 OID 16862)
-- Name: lead_experiments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.lead_experiments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_experiments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8791 (class 0 OID 0)
-- Dependencies: 264
-- Name: lead_experiments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.lead_experiments_id_seq OWNED BY public.lead_experiments.id;


--
-- TOC entry 267 (class 1259 OID 16872)
-- Name: lead_form_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_form_assignments (
    id integer NOT NULL,
    lead_form_id integer,
    page_slug character varying(255),
    "position" character varying(50) NOT NULL,
    priority integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lead_form_assignments OWNER TO neondb_owner;

--
-- TOC entry 266 (class 1259 OID 16871)
-- Name: lead_form_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.lead_form_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_form_assignments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8792 (class 0 OID 0)
-- Dependencies: 266
-- Name: lead_form_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.lead_form_assignments_id_seq OWNED BY public.lead_form_assignments.id;


--
-- TOC entry 269 (class 1259 OID 16882)
-- Name: lead_forms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_forms (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    lead_magnet_id integer,
    form_type character varying(50) NOT NULL,
    trigger_config jsonb,
    form_fields jsonb NOT NULL,
    styling jsonb,
    emotion character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lead_forms OWNER TO neondb_owner;

--
-- TOC entry 268 (class 1259 OID 16881)
-- Name: lead_forms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.lead_forms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_forms_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8793 (class 0 OID 0)
-- Dependencies: 268
-- Name: lead_forms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.lead_forms_id_seq OWNED BY public.lead_forms.id;


--
-- TOC entry 271 (class 1259 OID 16896)
-- Name: lead_magnets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_magnets (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    delivery_method character varying(50) NOT NULL,
    delivery_url text,
    delivery_config jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lead_magnets OWNER TO neondb_owner;

--
-- TOC entry 270 (class 1259 OID 16895)
-- Name: lead_magnets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.lead_magnets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_magnets_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8794 (class 0 OID 0)
-- Dependencies: 270
-- Name: lead_magnets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.lead_magnets_id_seq OWNED BY public.lead_magnets.id;


--
-- TOC entry 469 (class 1259 OID 18341)
-- Name: learning_cycles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.learning_cycles (
    id integer NOT NULL,
    cycle_id character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    data_processed jsonb NOT NULL,
    discoveries jsonb NOT NULL,
    models_updated jsonb,
    rules_generated integer DEFAULT 0,
    performance jsonb,
    error_message text,
    triggered_by character varying(255),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.learning_cycles OWNER TO neondb_owner;

--
-- TOC entry 468 (class 1259 OID 18340)
-- Name: learning_cycles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.learning_cycles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learning_cycles_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8795 (class 0 OID 0)
-- Dependencies: 468
-- Name: learning_cycles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.learning_cycles_id_seq OWNED BY public.learning_cycles.id;


--
-- TOC entry 685 (class 1259 OID 20088)
-- Name: llm_agents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.llm_agents (
    id integer NOT NULL,
    agent_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    provider character varying(100) NOT NULL,
    model character varying(255) NOT NULL,
    api_endpoint text NOT NULL,
    api_key text,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    capabilities jsonb NOT NULL,
    cost_per_token real DEFAULT 0 NOT NULL,
    rate_limit integer DEFAULT 0 NOT NULL,
    max_tokens integer DEFAULT 4096 NOT NULL,
    latency_ms integer DEFAULT 0 NOT NULL,
    success_rate real DEFAULT 1 NOT NULL,
    quota_daily integer DEFAULT 0 NOT NULL,
    quota_used integer DEFAULT 0 NOT NULL,
    last_used timestamp without time zone,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.llm_agents OWNER TO neondb_owner;

--
-- TOC entry 684 (class 1259 OID 20087)
-- Name: llm_agents_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.llm_agents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.llm_agents_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8796 (class 0 OID 0)
-- Dependencies: 684
-- Name: llm_agents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.llm_agents_id_seq OWNED BY public.llm_agents.id;


--
-- TOC entry 273 (class 1259 OID 16910)
-- Name: llm_insights; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.llm_insights (
    id integer NOT NULL,
    insight_id character varying(36) NOT NULL,
    llm_provider character varying(100) NOT NULL,
    llm_model character varying(100) NOT NULL,
    insight_type character varying(100) NOT NULL,
    analysis_scope character varying(100),
    target_entity character varying(255),
    prompt text NOT NULL,
    response text NOT NULL,
    insights jsonb NOT NULL,
    suggestions jsonb,
    confidence integer,
    data_references jsonb,
    token_usage jsonb,
    processing_time integer,
    status character varying(50) DEFAULT 'generated'::character varying,
    implemented_change_ids jsonb,
    reviewed_by character varying(255),
    reviewed_at timestamp without time zone,
    review_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.llm_insights OWNER TO neondb_owner;

--
-- TOC entry 272 (class 1259 OID 16909)
-- Name: llm_insights_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.llm_insights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.llm_insights_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8797 (class 0 OID 0)
-- Dependencies: 272
-- Name: llm_insights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.llm_insights_id_seq OWNED BY public.llm_insights.id;


--
-- TOC entry 275 (class 1259 OID 16924)
-- Name: llm_scheduling; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.llm_scheduling (
    id integer NOT NULL,
    schedule_name character varying(255) NOT NULL,
    frequency character varying(50) NOT NULL,
    analysis_type character varying(100) NOT NULL,
    scope character varying(100),
    trigger_conditions jsonb,
    llm_config jsonb NOT NULL,
    is_active boolean DEFAULT true,
    last_run_at timestamp without time zone,
    next_run_at timestamp without time zone,
    run_count integer DEFAULT 0,
    success_count integer DEFAULT 0,
    failure_count integer DEFAULT 0,
    average_execution_time integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.llm_scheduling OWNER TO neondb_owner;

--
-- TOC entry 274 (class 1259 OID 16923)
-- Name: llm_scheduling_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.llm_scheduling_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.llm_scheduling_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8798 (class 0 OID 0)
-- Dependencies: 274
-- Name: llm_scheduling_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.llm_scheduling_id_seq OWNED BY public.llm_scheduling.id;


--
-- TOC entry 759 (class 1259 OID 20914)
-- Name: load_balancing_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.load_balancing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    effectiveness_score real DEFAULT 0 NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.load_balancing_rules OWNER TO neondb_owner;

--
-- TOC entry 317 (class 1259 OID 17210)
-- Name: localization_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.localization_analytics (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    language_code character varying(10) NOT NULL,
    event_type character varying(100) NOT NULL,
    content_type character varying(100),
    content_id character varying(255),
    key_path character varying(500),
    fallback_used boolean DEFAULT false,
    translation_quality integer,
    user_feedback jsonb,
    metadata jsonb,
    "timestamp" timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.localization_analytics OWNER TO neondb_owner;

--
-- TOC entry 316 (class 1259 OID 17209)
-- Name: localization_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.localization_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.localization_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8799 (class 0 OID 0)
-- Dependencies: 316
-- Name: localization_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.localization_analytics_id_seq OWNED BY public.localization_analytics.id;


--
-- TOC entry 319 (class 1259 OID 17222)
-- Name: localized_content_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.localized_content_assignments (
    id integer NOT NULL,
    content_type character varying(100) NOT NULL,
    content_id character varying(255) NOT NULL,
    language_code character varying(10),
    translation_keys jsonb NOT NULL,
    custom_translations jsonb,
    seo_settings jsonb,
    routing_settings jsonb,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.localized_content_assignments OWNER TO neondb_owner;

--
-- TOC entry 318 (class 1259 OID 17221)
-- Name: localized_content_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.localized_content_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.localized_content_assignments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8800 (class 0 OID 0)
-- Dependencies: 318
-- Name: localized_content_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.localized_content_assignments_id_seq OWNED BY public.localized_content_assignments.id;


--
-- TOC entry 699 (class 1259 OID 20228)
-- Name: memory_edges; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.memory_edges (
    id integer NOT NULL,
    edge_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_node_id uuid NOT NULL,
    target_node_id uuid NOT NULL,
    relationship_type character varying(100) NOT NULL,
    strength real DEFAULT 0.5 NOT NULL,
    direction character varying(20) DEFAULT 'bidirectional'::character varying NOT NULL,
    context text,
    evidence jsonb DEFAULT '[]'::jsonb NOT NULL,
    confidence real DEFAULT 0.5 NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_verified timestamp without time zone,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.memory_edges OWNER TO neondb_owner;

--
-- TOC entry 698 (class 1259 OID 20227)
-- Name: memory_edges_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.memory_edges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.memory_edges_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8801 (class 0 OID 0)
-- Dependencies: 698
-- Name: memory_edges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.memory_edges_id_seq OWNED BY public.memory_edges.id;


--
-- TOC entry 701 (class 1259 OID 20247)
-- Name: memory_nodes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.memory_nodes (
    id integer NOT NULL,
    node_id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(255) NOT NULL,
    title character varying(500) NOT NULL,
    content text NOT NULL,
    summary text,
    node_type character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    embedding jsonb,
    embedding_model character varying(100) DEFAULT 'text-embedding-ada-002'::character varying,
    keywords jsonb DEFAULT '[]'::jsonb NOT NULL,
    entities jsonb DEFAULT '[]'::jsonb NOT NULL,
    user_archetype character varying(100),
    conversion_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    last_used timestamp without time zone,
    quality_score real DEFAULT 0.5 NOT NULL,
    confidence_score real DEFAULT 0.5 NOT NULL,
    verification_status character varying(20) DEFAULT 'unverified'::character varying,
    source_type character varying(100) NOT NULL,
    source_id character varying(255),
    parent_node_id uuid,
    version character varying(20) DEFAULT '1.0'::character varying NOT NULL,
    content_timestamp timestamp without time zone,
    expires_at timestamp without time zone,
    last_updated timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.memory_nodes OWNER TO neondb_owner;

--
-- TOC entry 700 (class 1259 OID 20246)
-- Name: memory_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.memory_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.memory_nodes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8802 (class 0 OID 0)
-- Dependencies: 700
-- Name: memory_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.memory_nodes_id_seq OWNED BY public.memory_nodes.id;


--
-- TOC entry 703 (class 1259 OID 20275)
-- Name: memory_search_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.memory_search_sessions (
    id integer NOT NULL,
    session_id uuid DEFAULT gen_random_uuid() NOT NULL,
    query text NOT NULL,
    search_type character varying(50) NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    results_returned integer NOT NULL,
    top_result_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    search_time integer NOT NULL,
    user_id integer,
    user_archetype character varying(100),
    clicked_results jsonb DEFAULT '[]'::jsonb NOT NULL,
    satisfaction_score real,
    context_type character varying(100),
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.memory_search_sessions OWNER TO neondb_owner;

--
-- TOC entry 702 (class 1259 OID 20274)
-- Name: memory_search_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.memory_search_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.memory_search_sessions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8803 (class 0 OID 0)
-- Dependencies: 702
-- Name: memory_search_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.memory_search_sessions_id_seq OWNED BY public.memory_search_sessions.id;


--
-- TOC entry 705 (class 1259 OID 20292)
-- Name: memory_usage_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.memory_usage_analytics (
    id integer NOT NULL,
    analytics_id uuid DEFAULT gen_random_uuid() NOT NULL,
    node_id uuid NOT NULL,
    usage_type character varying(100) NOT NULL,
    context_id character varying(255),
    retrieval_time integer,
    relevance_score real,
    user_engagement jsonb DEFAULT '{}'::jsonb NOT NULL,
    conversion_impact real,
    quality_feedback real,
    user_id integer,
    session_id character varying(255),
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.memory_usage_analytics OWNER TO neondb_owner;

--
-- TOC entry 704 (class 1259 OID 20291)
-- Name: memory_usage_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.memory_usage_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.memory_usage_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8804 (class 0 OID 0)
-- Dependencies: 704
-- Name: memory_usage_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.memory_usage_analytics_id_seq OWNED BY public.memory_usage_analytics.id;


--
-- TOC entry 277 (class 1259 OID 16941)
-- Name: ml_models; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ml_models (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    version character varying(50) NOT NULL,
    type character varying(100) NOT NULL,
    algorithm character varying(100) NOT NULL,
    purpose text NOT NULL,
    features jsonb NOT NULL,
    hyperparameters jsonb,
    performance jsonb,
    training_data jsonb,
    model_path text,
    is_active boolean DEFAULT true,
    is_production boolean DEFAULT false,
    trained_at timestamp without time zone,
    deployed_at timestamp without time zone,
    last_used_at timestamp without time zone,
    usage_count integer DEFAULT 0,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ml_models OWNER TO neondb_owner;

--
-- TOC entry 276 (class 1259 OID 16940)
-- Name: ml_models_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ml_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ml_models_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8805 (class 0 OID 0)
-- Dependencies: 276
-- Name: ml_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ml_models_id_seq OWNED BY public.ml_models.id;


--
-- TOC entry 279 (class 1259 OID 16957)
-- Name: ml_predictions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ml_predictions (
    id integer NOT NULL,
    prediction_id character varying(36) NOT NULL,
    model_id integer,
    input_features jsonb NOT NULL,
    prediction jsonb NOT NULL,
    confidence integer NOT NULL,
    actual_outcome jsonb,
    source_entity character varying(255),
    source_type character varying(100),
    orchestration_run_id character varying(255),
    was_implemented boolean DEFAULT false,
    implemented_at timestamp without time zone,
    feedback_received boolean DEFAULT false,
    feedback_data jsonb,
    is_correct boolean,
    prediction_accuracy integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ml_predictions OWNER TO neondb_owner;

--
-- TOC entry 278 (class 1259 OID 16956)
-- Name: ml_predictions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ml_predictions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ml_predictions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8806 (class 0 OID 0)
-- Dependencies: 278
-- Name: ml_predictions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ml_predictions_id_seq OWNED BY public.ml_predictions.id;


--
-- TOC entry 281 (class 1259 OID 16972)
-- Name: ml_training_data; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ml_training_data (
    id integer NOT NULL,
    dataset_name character varying(255) NOT NULL,
    model_type character varying(100) NOT NULL,
    features jsonb NOT NULL,
    labels jsonb NOT NULL,
    source_entity character varying(255),
    source_type character varying(100),
    performance_metrics jsonb,
    context_data jsonb,
    is_validated boolean DEFAULT false,
    is_outlier boolean DEFAULT false,
    confidence_score integer DEFAULT 100,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ml_training_data OWNER TO neondb_owner;

--
-- TOC entry 280 (class 1259 OID 16971)
-- Name: ml_training_data_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ml_training_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ml_training_data_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8807 (class 0 OID 0)
-- Dependencies: 280
-- Name: ml_training_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ml_training_data_id_seq OWNED BY public.ml_training_data.id;


--
-- TOC entry 545 (class 1259 OID 18925)
-- Name: mobile_app_configs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.mobile_app_configs (
    id integer NOT NULL,
    platform character varying(50) NOT NULL,
    app_version character varying(50) NOT NULL,
    build_number integer NOT NULL,
    manifest_config jsonb NOT NULL,
    native_plugins jsonb,
    permissions jsonb,
    store_listing_data jsonb,
    security_config jsonb,
    performance_config jsonb,
    compliance_settings jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.mobile_app_configs OWNER TO neondb_owner;

--
-- TOC entry 544 (class 1259 OID 18924)
-- Name: mobile_app_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.mobile_app_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mobile_app_configs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8808 (class 0 OID 0)
-- Dependencies: 544
-- Name: mobile_app_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mobile_app_configs_id_seq OWNED BY public.mobile_app_configs.id;


--
-- TOC entry 283 (class 1259 OID 16986)
-- Name: model_performance_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.model_performance_tracking (
    id integer NOT NULL,
    model_id integer,
    evaluation_date timestamp without time zone DEFAULT now(),
    evaluation_type character varying(50) NOT NULL,
    dataset_size integer,
    metrics jsonb NOT NULL,
    confusion_matrix jsonb,
    feature_importance jsonb,
    prediction_distribution jsonb,
    drift_detection jsonb,
    performance_change jsonb,
    is_production_ready boolean DEFAULT false,
    recommended_actions jsonb,
    evaluated_by character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.model_performance_tracking OWNER TO neondb_owner;

--
-- TOC entry 282 (class 1259 OID 16985)
-- Name: model_performance_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.model_performance_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.model_performance_tracking_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8809 (class 0 OID 0)
-- Dependencies: 282
-- Name: model_performance_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.model_performance_tracking_id_seq OWNED BY public.model_performance_tracking.id;


--
-- TOC entry 471 (class 1259 OID 18354)
-- Name: model_training_jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.model_training_jobs (
    id integer NOT NULL,
    job_id character varying(255) NOT NULL,
    model_id character varying(255) NOT NULL,
    model_type character varying(100) NOT NULL,
    status character varying(50) NOT NULL,
    progress integer DEFAULT 0,
    training_config jsonb NOT NULL,
    dataset_size integer,
    epochs integer,
    current_epoch integer DEFAULT 0,
    loss numeric(10,6),
    accuracy numeric(5,4),
    validation_loss numeric(10,6),
    validation_accuracy numeric(5,4),
    training_logs text,
    error_message text,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    estimated_completion_time timestamp without time zone,
    resources jsonb,
    learning_cycle_id character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.model_training_jobs OWNER TO neondb_owner;

--
-- TOC entry 470 (class 1259 OID 18353)
-- Name: model_training_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.model_training_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.model_training_jobs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8810 (class 0 OID 0)
-- Dependencies: 470
-- Name: model_training_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.model_training_jobs_id_seq OWNED BY public.model_training_jobs.id;


--
-- TOC entry 675 (class 1259 OID 19988)
-- Name: multi_region_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.multi_region_config (
    id integer NOT NULL,
    config_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    primary_region character varying(50) NOT NULL,
    regions jsonb NOT NULL,
    load_balancing jsonb DEFAULT '{}'::jsonb NOT NULL,
    failover_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    data_replication jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    health_check_url text,
    last_health_check timestamp without time zone,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.multi_region_config OWNER TO neondb_owner;

--
-- TOC entry 674 (class 1259 OID 19987)
-- Name: multi_region_config_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.multi_region_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.multi_region_config_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8811 (class 0 OID 0)
-- Dependencies: 674
-- Name: multi_region_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.multi_region_config_id_seq OWNED BY public.multi_region_config.id;


--
-- TOC entry 285 (class 1259 OID 16998)
-- Name: neuron_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.neuron_analytics (
    id integer NOT NULL,
    neuron_id character varying(100),
    date timestamp without time zone NOT NULL,
    page_views integer DEFAULT 0,
    unique_visitors integer DEFAULT 0,
    conversions integer DEFAULT 0,
    revenue character varying(20) DEFAULT '0'::character varying,
    uptime integer DEFAULT 0,
    error_count integer DEFAULT 0,
    average_response_time integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.neuron_analytics OWNER TO neondb_owner;

--
-- TOC entry 284 (class 1259 OID 16997)
-- Name: neuron_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.neuron_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.neuron_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8812 (class 0 OID 0)
-- Dependencies: 284
-- Name: neuron_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.neuron_analytics_id_seq OWNED BY public.neuron_analytics.id;


--
-- TOC entry 287 (class 1259 OID 17014)
-- Name: neuron_configs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.neuron_configs (
    id integer NOT NULL,
    neuron_id character varying(100),
    config_version character varying(50) NOT NULL,
    config_data jsonb NOT NULL,
    deployed_at timestamp without time zone,
    is_active boolean DEFAULT false,
    deployed_by character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.neuron_configs OWNER TO neondb_owner;

--
-- TOC entry 286 (class 1259 OID 17013)
-- Name: neuron_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.neuron_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.neuron_configs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8813 (class 0 OID 0)
-- Dependencies: 286
-- Name: neuron_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.neuron_configs_id_seq OWNED BY public.neuron_configs.id;


--
-- TOC entry 473 (class 1259 OID 18369)
-- Name: neuron_data_pipelines; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.neuron_data_pipelines (
    id integer NOT NULL,
    neuron_id character varying(255) NOT NULL,
    neuron_name character varying(255) NOT NULL,
    vertical character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    last_sync timestamp without time zone DEFAULT now(),
    sync_frequency integer DEFAULT 300,
    metrics_collected jsonb NOT NULL,
    health_score numeric(5,4) DEFAULT 1.0000,
    config_version character varying(100),
    is_active boolean DEFAULT true,
    error_count integer DEFAULT 0,
    last_error text,
    last_error_time timestamp without time zone,
    data_quality jsonb,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.neuron_data_pipelines OWNER TO neondb_owner;

--
-- TOC entry 472 (class 1259 OID 18368)
-- Name: neuron_data_pipelines_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.neuron_data_pipelines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.neuron_data_pipelines_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8814 (class 0 OID 0)
-- Dependencies: 472
-- Name: neuron_data_pipelines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.neuron_data_pipelines_id_seq OWNED BY public.neuron_data_pipelines.id;


--
-- TOC entry 509 (class 1259 OID 18627)
-- Name: neuron_offer_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.neuron_offer_assignments (
    id integer NOT NULL,
    neuron_id character varying(255) NOT NULL,
    offer_id integer,
    "position" character varying(100),
    context character varying(255),
    emotion_match character varying(50),
    intent_match real DEFAULT 0,
    is_active boolean DEFAULT true,
    auto_assigned boolean DEFAULT true,
    assigned_at timestamp without time zone DEFAULT now(),
    last_served timestamp without time zone,
    serve_count integer DEFAULT 0
);


ALTER TABLE public.neuron_offer_assignments OWNER TO neondb_owner;

--
-- TOC entry 508 (class 1259 OID 18626)
-- Name: neuron_offer_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.neuron_offer_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.neuron_offer_assignments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8815 (class 0 OID 0)
-- Dependencies: 508
-- Name: neuron_offer_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.neuron_offer_assignments_id_seq OWNED BY public.neuron_offer_assignments.id;


--
-- TOC entry 289 (class 1259 OID 17025)
-- Name: neuron_status_updates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.neuron_status_updates (
    id integer NOT NULL,
    neuron_id character varying(100),
    status character varying(50) NOT NULL,
    health_score integer,
    uptime integer,
    stats jsonb,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb
);


ALTER TABLE public.neuron_status_updates OWNER TO neondb_owner;

--
-- TOC entry 288 (class 1259 OID 17024)
-- Name: neuron_status_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.neuron_status_updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.neuron_status_updates_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8816 (class 0 OID 0)
-- Dependencies: 288
-- Name: neuron_status_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.neuron_status_updates_id_seq OWNED BY public.neuron_status_updates.id;


--
-- TOC entry 291 (class 1259 OID 17035)
-- Name: neurons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.neurons (
    id integer NOT NULL,
    neuron_id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    url text NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying,
    version character varying(50),
    supported_features jsonb,
    last_check_in timestamp without time zone,
    health_score integer DEFAULT 100,
    uptime integer DEFAULT 0,
    registered_at timestamp without time zone DEFAULT now(),
    api_key character varying(255) NOT NULL,
    metadata jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.neurons OWNER TO neondb_owner;

--
-- TOC entry 290 (class 1259 OID 17034)
-- Name: neurons_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.neurons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.neurons_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8817 (class 0 OID 0)
-- Dependencies: 290
-- Name: neurons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.neurons_id_seq OWNED BY public.neurons.id;


--
-- TOC entry 527 (class 1259 OID 18763)
-- Name: notification_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_analytics (
    id integer NOT NULL,
    template_id integer,
    trigger_id integer,
    campaign_id integer,
    queue_id integer,
    date timestamp without time zone NOT NULL,
    hour integer,
    channel character varying(50) NOT NULL,
    segment character varying(100),
    queued integer DEFAULT 0,
    sent integer DEFAULT 0,
    delivered integer DEFAULT 0,
    failed integer DEFAULT 0,
    bounced integer DEFAULT 0,
    opened integer DEFAULT 0,
    clicked integer DEFAULT 0,
    converted integer DEFAULT 0,
    unsubscribed integer DEFAULT 0,
    avg_delivery_time real,
    open_rate real,
    click_rate real,
    conversion_rate real,
    unsubscribe_rate real,
    cost_per_send real,
    total_cost real,
    spam_score real,
    reputation_score real,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notification_analytics OWNER TO neondb_owner;

--
-- TOC entry 526 (class 1259 OID 18762)
-- Name: notification_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notification_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8818 (class 0 OID 0)
-- Dependencies: 526
-- Name: notification_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notification_analytics_id_seq OWNED BY public.notification_analytics.id;


--
-- TOC entry 529 (class 1259 OID 18780)
-- Name: notification_campaigns; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_campaigns (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    target_audience jsonb,
    estimated_reach integer DEFAULT 0,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    primary_goal character varying(100),
    success_metrics jsonb,
    is_test_campaign boolean DEFAULT false,
    test_configuration jsonb,
    budget_limit real,
    send_limit integer,
    tags jsonb,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notification_campaigns OWNER TO neondb_owner;

--
-- TOC entry 528 (class 1259 OID 18779)
-- Name: notification_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notification_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_campaigns_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8819 (class 0 OID 0)
-- Dependencies: 528
-- Name: notification_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notification_campaigns_id_seq OWNED BY public.notification_campaigns.id;


--
-- TOC entry 531 (class 1259 OID 18796)
-- Name: notification_channels; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_channels (
    id integer NOT NULL,
    channel character varying(50) NOT NULL,
    provider character varying(100) NOT NULL,
    config jsonb NOT NULL,
    credentials jsonb,
    is_active boolean DEFAULT true,
    is_primary boolean DEFAULT false,
    priority integer DEFAULT 1,
    rate_limit integer DEFAULT 1000,
    daily_limit integer DEFAULT 10000,
    last_health_check timestamp without time zone,
    health_status character varying(20) DEFAULT 'healthy'::character varying,
    error_rate real DEFAULT 0,
    cost_per_send real DEFAULT 0,
    monthly_budget real,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notification_channels OWNER TO neondb_owner;

--
-- TOC entry 530 (class 1259 OID 18795)
-- Name: notification_channels_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notification_channels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_channels_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8820 (class 0 OID 0)
-- Dependencies: 530
-- Name: notification_channels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notification_channels_id_seq OWNED BY public.notification_channels.id;


--
-- TOC entry 533 (class 1259 OID 18817)
-- Name: notification_queue; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_queue (
    id integer NOT NULL,
    template_id integer,
    trigger_id integer,
    campaign_id integer,
    user_id character varying(255),
    session_id character varying(255),
    recipient_email character varying(255),
    recipient_phone character varying(50),
    recipient_push_token text,
    channel character varying(50) NOT NULL,
    subject text,
    content text NOT NULL,
    html_content text,
    personalization_data jsonb,
    rendered_at timestamp without time zone,
    priority character varying(20) DEFAULT 'normal'::character varying,
    scheduled_for timestamp without time zone DEFAULT now(),
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    status character varying(20) DEFAULT 'queued'::character varying,
    sent_at timestamp without time zone,
    delivered_at timestamp without time zone,
    failed_at timestamp without time zone,
    error_message text,
    provider_response jsonb,
    opened_at timestamp without time zone,
    clicked_at timestamp without time zone,
    converted_at timestamp without time zone,
    unsubscribed_at timestamp without time zone,
    delivery_time integer,
    engagement_score real,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notification_queue OWNER TO neondb_owner;

--
-- TOC entry 532 (class 1259 OID 18816)
-- Name: notification_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notification_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_queue_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8821 (class 0 OID 0)
-- Dependencies: 532
-- Name: notification_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notification_queue_id_seq OWNED BY public.notification_queue.id;


--
-- TOC entry 535 (class 1259 OID 18833)
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_templates (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    channel character varying(50) NOT NULL,
    type character varying(100) NOT NULL,
    subject text,
    body_template text NOT NULL,
    html_template text,
    variables jsonb,
    priority character varying(20) DEFAULT 'normal'::character varying,
    segment character varying(100),
    locale character varying(10) DEFAULT 'en'::character varying,
    personalization_rules jsonb,
    ai_optimized boolean DEFAULT false,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    testing_enabled boolean DEFAULT false,
    conversion_goal character varying(100),
    requires_consent boolean DEFAULT false,
    gdpr_compliant boolean DEFAULT true,
    tags jsonb,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notification_templates OWNER TO neondb_owner;

--
-- TOC entry 534 (class 1259 OID 18832)
-- Name: notification_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notification_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_templates_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8822 (class 0 OID 0)
-- Dependencies: 534
-- Name: notification_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notification_templates_id_seq OWNED BY public.notification_templates.id;


--
-- TOC entry 537 (class 1259 OID 18854)
-- Name: notification_triggers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_triggers (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    trigger_type character varying(50) NOT NULL,
    event_name character varying(100),
    conditions jsonb NOT NULL,
    delay integer DEFAULT 0,
    time_window jsonb,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    target_segments jsonb,
    exclude_segments jsonb,
    channel_priority jsonb NOT NULL,
    fallback_logic jsonb,
    max_sends_per_user integer DEFAULT 1,
    cooldown_period integer DEFAULT 1440,
    is_active boolean DEFAULT true,
    pause_after_failures integer DEFAULT 5,
    priority character varying(20) DEFAULT 'normal'::character varying,
    expected_volume integer DEFAULT 100,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notification_triggers OWNER TO neondb_owner;

--
-- TOC entry 536 (class 1259 OID 18853)
-- Name: notification_triggers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notification_triggers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_triggers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8823 (class 0 OID 0)
-- Dependencies: 536
-- Name: notification_triggers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notification_triggers_id_seq OWNED BY public.notification_triggers.id;


--
-- TOC entry 511 (class 1259 OID 18641)
-- Name: offer_ai_optimization_queue; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offer_ai_optimization_queue (
    id integer NOT NULL,
    task_type character varying(100) NOT NULL,
    priority integer DEFAULT 1,
    offer_id integer,
    neuron_id character varying(255),
    parameters jsonb,
    status character varying(50) DEFAULT 'pending'::character varying,
    result jsonb,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.offer_ai_optimization_queue OWNER TO neondb_owner;

--
-- TOC entry 510 (class 1259 OID 18640)
-- Name: offer_ai_optimization_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offer_ai_optimization_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offer_ai_optimization_queue_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8824 (class 0 OID 0)
-- Dependencies: 510
-- Name: offer_ai_optimization_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offer_ai_optimization_queue_id_seq OWNED BY public.offer_ai_optimization_queue.id;


--
-- TOC entry 513 (class 1259 OID 18653)
-- Name: offer_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offer_analytics (
    id integer NOT NULL,
    offer_id integer,
    session_id character varying(255),
    user_id character varying(255),
    neuron_id character varying(255),
    page_slug character varying(255),
    event_type character varying(50) NOT NULL,
    device_type character varying(50),
    geo_location character varying(100),
    user_agent text,
    referrer text,
    conversion_value real,
    metadata jsonb,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.offer_analytics OWNER TO neondb_owner;

--
-- TOC entry 512 (class 1259 OID 18652)
-- Name: offer_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offer_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offer_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8825 (class 0 OID 0)
-- Dependencies: 512
-- Name: offer_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offer_analytics_id_seq OWNED BY public.offer_analytics.id;


--
-- TOC entry 515 (class 1259 OID 18663)
-- Name: offer_compliance_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offer_compliance_rules (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    rule_type character varying(50) NOT NULL,
    conditions jsonb NOT NULL,
    action character varying(50) NOT NULL,
    severity character varying(20) DEFAULT 'medium'::character varying,
    is_active boolean DEFAULT true,
    violation_count integer DEFAULT 0,
    last_triggered timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.offer_compliance_rules OWNER TO neondb_owner;

--
-- TOC entry 514 (class 1259 OID 18662)
-- Name: offer_compliance_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offer_compliance_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offer_compliance_rules_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8826 (class 0 OID 0)
-- Dependencies: 514
-- Name: offer_compliance_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offer_compliance_rules_id_seq OWNED BY public.offer_compliance_rules.id;


--
-- TOC entry 517 (class 1259 OID 18676)
-- Name: offer_experiments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offer_experiments (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    target_metric character varying(50) NOT NULL,
    variants jsonb NOT NULL,
    traffic_split jsonb DEFAULT '{"control": 50, "variant": 50}'::jsonb,
    status character varying(50) DEFAULT 'draft'::character varying,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    results jsonb,
    winning_variant character varying(100),
    confidence real,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.offer_experiments OWNER TO neondb_owner;

--
-- TOC entry 516 (class 1259 OID 18675)
-- Name: offer_experiments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offer_experiments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offer_experiments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8827 (class 0 OID 0)
-- Dependencies: 516
-- Name: offer_experiments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offer_experiments_id_seq OWNED BY public.offer_experiments.id;


--
-- TOC entry 519 (class 1259 OID 18689)
-- Name: offer_feed; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offer_feed (
    id integer NOT NULL,
    offer_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id integer,
    title character varying(500) NOT NULL,
    slug character varying(200) NOT NULL,
    merchant character varying(255) NOT NULL,
    price real,
    old_price real,
    currency character varying(10) DEFAULT 'USD'::character varying,
    coupon_code character varying(100),
    discount_type character varying(50),
    discount_value real,
    valid_till timestamp without time zone,
    region character varying(100) DEFAULT 'global'::character varying,
    emotion character varying(50),
    category character varying(100) NOT NULL,
    tags jsonb,
    source_type character varying(50) NOT NULL,
    is_expired boolean DEFAULT false,
    click_tracking_url text NOT NULL,
    api_source character varying(100),
    commission_estimate real,
    meta jsonb,
    llm_summary text,
    intent_embedding jsonb,
    quality_score real DEFAULT 0,
    ctr real DEFAULT 0,
    conversion_rate real DEFAULT 0,
    last_click timestamp without time zone,
    click_count integer DEFAULT 0,
    revenue_generated real DEFAULT 0,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    priority integer DEFAULT 1,
    auto_generated boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    synced_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.offer_feed OWNER TO neondb_owner;

--
-- TOC entry 518 (class 1259 OID 18688)
-- Name: offer_feed_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offer_feed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offer_feed_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8828 (class 0 OID 0)
-- Dependencies: 518
-- Name: offer_feed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offer_feed_id_seq OWNED BY public.offer_feed.id;


--
-- TOC entry 521 (class 1259 OID 18718)
-- Name: offer_personalization_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offer_personalization_rules (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    priority integer DEFAULT 1,
    is_active boolean DEFAULT true,
    success_rate real DEFAULT 0,
    last_tested timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.offer_personalization_rules OWNER TO neondb_owner;

--
-- TOC entry 520 (class 1259 OID 18717)
-- Name: offer_personalization_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offer_personalization_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offer_personalization_rules_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8829 (class 0 OID 0)
-- Dependencies: 520
-- Name: offer_personalization_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offer_personalization_rules_id_seq OWNED BY public.offer_personalization_rules.id;


--
-- TOC entry 523 (class 1259 OID 18732)
-- Name: offer_sources; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offer_sources (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    description text,
    base_url text,
    api_config jsonb,
    scraping_config jsonb,
    credentials jsonb,
    is_active boolean DEFAULT true,
    last_sync timestamp without time zone,
    sync_frequency character varying(50) DEFAULT 'hourly'::character varying,
    error_count integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.offer_sources OWNER TO neondb_owner;

--
-- TOC entry 522 (class 1259 OID 18731)
-- Name: offer_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offer_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offer_sources_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8830 (class 0 OID 0)
-- Dependencies: 522
-- Name: offer_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offer_sources_id_seq OWNED BY public.offer_sources.id;


--
-- TOC entry 525 (class 1259 OID 18748)
-- Name: offer_sync_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offer_sync_history (
    id integer NOT NULL,
    source_id integer,
    batch_id uuid DEFAULT gen_random_uuid() NOT NULL,
    sync_type character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    offers_processed integer DEFAULT 0,
    offers_added integer DEFAULT 0,
    offers_updated integer DEFAULT 0,
    offers_removed integer DEFAULT 0,
    errors jsonb,
    metadata jsonb,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


ALTER TABLE public.offer_sync_history OWNER TO neondb_owner;

--
-- TOC entry 524 (class 1259 OID 18747)
-- Name: offer_sync_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offer_sync_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offer_sync_history_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8831 (class 0 OID 0)
-- Dependencies: 524
-- Name: offer_sync_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offer_sync_history_id_seq OWNED BY public.offer_sync_history.id;


--
-- TOC entry 729 (class 1259 OID 20565)
-- Name: offline_analytics_buffer; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offline_analytics_buffer (
    id integer NOT NULL,
    buffer_id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id character varying(255) NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id integer,
    event_type character varying(100) NOT NULL,
    event_data jsonb NOT NULL,
    event_timestamp timestamp without time zone NOT NULL,
    page_path character varying(500),
    user_agent text,
    referrer character varying(500),
    is_synced boolean DEFAULT false,
    synced_at timestamp without time zone,
    sync_attempts integer DEFAULT 0,
    consent_given boolean DEFAULT false,
    anonymized boolean DEFAULT false,
    can_be_deleted boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.offline_analytics_buffer OWNER TO neondb_owner;

--
-- TOC entry 728 (class 1259 OID 20564)
-- Name: offline_analytics_buffer_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offline_analytics_buffer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offline_analytics_buffer_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8832 (class 0 OID 0)
-- Dependencies: 728
-- Name: offline_analytics_buffer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offline_analytics_buffer_id_seq OWNED BY public.offline_analytics_buffer.id;


--
-- TOC entry 731 (class 1259 OID 20584)
-- Name: offline_content_cache; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offline_content_cache (
    id integer NOT NULL,
    cache_id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_type character varying(100) NOT NULL,
    content_id character varying(255) NOT NULL,
    content_url character varying(500),
    cached_content jsonb,
    content_hash character varying(64),
    content_size integer,
    mime_type character varying(100),
    cache_strategy character varying(50) DEFAULT 'smart'::character varying,
    priority integer DEFAULT 5,
    access_count integer DEFAULT 0,
    last_accessed timestamp without time zone,
    original_timestamp timestamp without time zone,
    cache_expires_at timestamp without time zone,
    server_version character varying(50),
    is_stale boolean DEFAULT false,
    device_id character varying(255),
    device_capabilities jsonb DEFAULT '{}'::jsonb,
    is_compressed boolean DEFAULT false,
    compression_ratio real,
    is_encrypted boolean DEFAULT false,
    encryption_key character varying(255),
    tags jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.offline_content_cache OWNER TO neondb_owner;

--
-- TOC entry 730 (class 1259 OID 20583)
-- Name: offline_content_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offline_content_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offline_content_cache_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8833 (class 0 OID 0)
-- Dependencies: 730
-- Name: offline_content_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offline_content_cache_id_seq OWNED BY public.offline_content_cache.id;


--
-- TOC entry 547 (class 1259 OID 18937)
-- Name: offline_queue; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offline_queue (
    id integer NOT NULL,
    session_id character varying(255),
    action character varying(100) NOT NULL,
    endpoint character varying(255),
    method character varying(10) DEFAULT 'POST'::character varying,
    data jsonb,
    status character varying(50) DEFAULT 'pending'::character varying,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    created_at timestamp without time zone DEFAULT now(),
    processed_at timestamp without time zone,
    metadata jsonb
);


ALTER TABLE public.offline_queue OWNER TO neondb_owner;

--
-- TOC entry 546 (class 1259 OID 18936)
-- Name: offline_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offline_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offline_queue_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8834 (class 0 OID 0)
-- Dependencies: 546
-- Name: offline_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offline_queue_id_seq OWNED BY public.offline_queue.id;


--
-- TOC entry 733 (class 1259 OID 20607)
-- Name: offline_sync_queue; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offline_sync_queue (
    id integer NOT NULL,
    queue_id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id character varying(255) NOT NULL,
    session_id character varying(255),
    user_id integer,
    operation_type character varying(50) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id character varying(255),
    payload jsonb NOT NULL,
    original_payload jsonb,
    conflicts jsonb DEFAULT '[]'::jsonb,
    sync_status character varying(20) DEFAULT 'pending'::character varying,
    sync_attempts integer DEFAULT 0 NOT NULL,
    last_sync_attempt timestamp without time zone,
    sync_completed_at timestamp without time zone,
    priority integer DEFAULT 5 NOT NULL,
    sequence_number integer NOT NULL,
    depends_on character varying(255),
    conflict_resolution_strategy character varying(50) DEFAULT 'last_write_wins'::character varying,
    server_version character varying(50),
    client_version character varying(50),
    last_error text,
    error_details jsonb,
    created_offline_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.offline_sync_queue OWNER TO neondb_owner;

--
-- TOC entry 732 (class 1259 OID 20606)
-- Name: offline_sync_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offline_sync_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offline_sync_queue_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8835 (class 0 OID 0)
-- Dependencies: 732
-- Name: offline_sync_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offline_sync_queue_id_seq OWNED BY public.offline_sync_queue.id;


--
-- TOC entry 293 (class 1259 OID 17053)
-- Name: orchestration_changes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orchestration_changes (
    id integer NOT NULL,
    change_id character varying(255) NOT NULL,
    orchestration_run_id character varying(255) NOT NULL,
    change_type character varying(100) NOT NULL,
    target_entity character varying(255) NOT NULL,
    action character varying(50) NOT NULL,
    before_state jsonb,
    after_state jsonb,
    reason text NOT NULL,
    ml_prediction_id character varying(36),
    confidence integer NOT NULL,
    expected_impact jsonb,
    actual_impact jsonb,
    status character varying(50) NOT NULL,
    applied_at timestamp without time zone,
    rolled_back_at timestamp without time zone,
    rollback_reason text,
    is_reversible boolean DEFAULT true,
    reverse_change_id character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.orchestration_changes OWNER TO neondb_owner;

--
-- TOC entry 292 (class 1259 OID 17052)
-- Name: orchestration_changes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orchestration_changes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orchestration_changes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8836 (class 0 OID 0)
-- Dependencies: 292
-- Name: orchestration_changes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orchestration_changes_id_seq OWNED BY public.orchestration_changes.id;


--
-- TOC entry 295 (class 1259 OID 17067)
-- Name: orchestration_runs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orchestration_runs (
    id integer NOT NULL,
    run_id character varying(255) NOT NULL,
    status character varying(50) NOT NULL,
    trigger_type character varying(50) NOT NULL,
    triggered_by character varying(255),
    orchestration_config jsonb NOT NULL,
    analytics_snapshot jsonb,
    models_used jsonb,
    changes_proposed jsonb,
    changes_applied jsonb,
    changes_rejected jsonb,
    approval_status character varying(50) DEFAULT 'auto_approved'::character varying,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    backup_id character varying(255),
    performance_metrics jsonb,
    ml_confidence integer,
    error_log text,
    execution_time integer,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.orchestration_runs OWNER TO neondb_owner;

--
-- TOC entry 294 (class 1259 OID 17066)
-- Name: orchestration_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orchestration_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orchestration_runs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8837 (class 0 OID 0)
-- Dependencies: 294
-- Name: orchestration_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orchestration_runs_id_seq OWNED BY public.orchestration_runs.id;


--
-- TOC entry 629 (class 1259 OID 19603)
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_number character varying(100) NOT NULL,
    session_id character varying(255),
    user_id character varying(255),
    email character varying(255) NOT NULL,
    customer_info jsonb,
    billing_address jsonb,
    items jsonb NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT '0'::numeric,
    discount_amount numeric(10,2) DEFAULT '0'::numeric,
    shipping_amount numeric(10,2) DEFAULT '0'::numeric,
    total numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    payment_method character varying(50),
    payment_provider character varying(50),
    transaction_id character varying(255),
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    fulfillment_status character varying(20) DEFAULT 'pending'::character varying,
    delivery_method character varying(50) DEFAULT 'digital'::character varying,
    download_links jsonb,
    access_keys jsonb,
    promo_code character varying(100),
    affiliate_id character varying(255),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(100),
    device_info jsonb,
    ip_address character varying(45),
    country_code character varying(2),
    conversion_source character varying(100),
    affiliate_commission numeric(10,2) DEFAULT '0'::numeric,
    partner_revenue jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    paid_at timestamp without time zone,
    delivered_at timestamp without time zone
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- TOC entry 628 (class 1259 OID 19602)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8838 (class 0 OID 0)
-- Dependencies: 628
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 297 (class 1259 OID 17081)
-- Name: page_affiliate_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.page_affiliate_assignments (
    id integer NOT NULL,
    page_slug character varying(255) NOT NULL,
    offer_id integer,
    "position" character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.page_affiliate_assignments OWNER TO neondb_owner;

--
-- TOC entry 296 (class 1259 OID 17080)
-- Name: page_affiliate_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.page_affiliate_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.page_affiliate_assignments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8839 (class 0 OID 0)
-- Dependencies: 296
-- Name: page_affiliate_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.page_affiliate_assignments_id_seq OWNED BY public.page_affiliate_assignments.id;


--
-- TOC entry 299 (class 1259 OID 17090)
-- Name: performance_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.performance_logs (
    id integer NOT NULL,
    level character varying(20) NOT NULL,
    component character varying(100) NOT NULL,
    message text NOT NULL,
    metadata text,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.performance_logs OWNER TO neondb_owner;

--
-- TOC entry 298 (class 1259 OID 17089)
-- Name: performance_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.performance_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.performance_logs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8840 (class 0 OID 0)
-- Dependencies: 298
-- Name: performance_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.performance_logs_id_seq OWNED BY public.performance_logs.id;


--
-- TOC entry 713 (class 1259 OID 20373)
-- Name: persona_evolution; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.persona_evolution (
    id integer NOT NULL,
    evolution_id uuid DEFAULT gen_random_uuid() NOT NULL,
    evolution_type character varying(50) NOT NULL,
    source_persona character varying(100),
    target_persona character varying(100),
    cluster_data jsonb,
    cluster_size integer,
    cluster_cohesion real,
    evolution_strength real NOT NULL,
    affected_users integer DEFAULT 0 NOT NULL,
    confidence_score real DEFAULT 0.5 NOT NULL,
    behavior_patterns jsonb DEFAULT '{}'::jsonb NOT NULL,
    demographic_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    performance_metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    validation_status character varying(20) DEFAULT 'pending'::character varying,
    validated_by integer,
    validation_notes text,
    is_implemented boolean DEFAULT false NOT NULL,
    implemented_at timestamp without time zone,
    rollback_plan jsonb,
    detected_at timestamp without time zone DEFAULT now() NOT NULL,
    processed_at timestamp without time zone,
    algorithm_version character varying(50),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.persona_evolution OWNER TO neondb_owner;

--
-- TOC entry 712 (class 1259 OID 20372)
-- Name: persona_evolution_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.persona_evolution_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.persona_evolution_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8841 (class 0 OID 0)
-- Dependencies: 712
-- Name: persona_evolution_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.persona_evolution_id_seq OWNED BY public.persona_evolution.id;


--
-- TOC entry 715 (class 1259 OID 20394)
-- Name: persona_profiles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.persona_profiles (
    id integer NOT NULL,
    profile_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer,
    session_id character varying(255),
    primary_persona character varying(100) NOT NULL,
    primary_score real NOT NULL,
    persona_scores jsonb NOT NULL,
    hybrid_personas jsonb DEFAULT '[]'::jsonb NOT NULL,
    traits jsonb DEFAULT '{}'::jsonb NOT NULL,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    interests jsonb DEFAULT '[]'::jsonb NOT NULL,
    persona_drift jsonb DEFAULT '[]'::jsonb NOT NULL,
    confidence_level real DEFAULT 0.5 NOT NULL,
    stability_score real DEFAULT 0.5 NOT NULL,
    quiz_results jsonb DEFAULT '[]'::jsonb NOT NULL,
    behavior_patterns jsonb DEFAULT '{}'::jsonb NOT NULL,
    engagement_history jsonb DEFAULT '{}'::jsonb NOT NULL,
    conversion_history jsonb DEFAULT '{}'::jsonb NOT NULL,
    ui_preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    content_preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    offer_preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    first_seen timestamp without time zone DEFAULT now() NOT NULL,
    last_active timestamp without time zone DEFAULT now() NOT NULL,
    last_updated timestamp without time zone DEFAULT now() NOT NULL,
    version character varying(20) DEFAULT '1.0'::character varying NOT NULL,
    data_quality real DEFAULT 0.5 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.persona_profiles OWNER TO neondb_owner;

--
-- TOC entry 714 (class 1259 OID 20393)
-- Name: persona_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.persona_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.persona_profiles_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8842 (class 0 OID 0)
-- Dependencies: 714
-- Name: persona_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.persona_profiles_id_seq OWNED BY public.persona_profiles.id;


--
-- TOC entry 717 (class 1259 OID 20426)
-- Name: persona_simulations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.persona_simulations (
    id integer NOT NULL,
    simulation_id uuid DEFAULT gen_random_uuid() NOT NULL,
    simulation_type character varying(50) NOT NULL,
    target_persona character varying(100) NOT NULL,
    persona_config jsonb NOT NULL,
    test_scenarios jsonb DEFAULT '[]'::jsonb NOT NULL,
    test_duration integer,
    sample_size integer,
    engagement_metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    conversion_metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    ui_metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    baseline_metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    improvement_ratio real,
    statistical_significance real,
    status character varying(20) DEFAULT 'planned'::character varying,
    is_active boolean DEFAULT false NOT NULL,
    user_feedback jsonb DEFAULT '[]'::jsonb NOT NULL,
    qualitative_notes text,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.persona_simulations OWNER TO neondb_owner;

--
-- TOC entry 716 (class 1259 OID 20425)
-- Name: persona_simulations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.persona_simulations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.persona_simulations_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8843 (class 0 OID 0)
-- Dependencies: 716
-- Name: persona_simulations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.persona_simulations_id_seq OWNED BY public.persona_simulations.id;


--
-- TOC entry 475 (class 1259 OID 18387)
-- Name: personalization_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.personalization_rules (
    id integer NOT NULL,
    rule_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    vertical character varying(100) NOT NULL,
    archetype character varying(100) NOT NULL,
    condition jsonb NOT NULL,
    action jsonb NOT NULL,
    confidence numeric(5,4) NOT NULL,
    impact numeric(5,4),
    priority integer DEFAULT 100,
    is_active boolean DEFAULT true,
    is_test_mode boolean DEFAULT false,
    test_results jsonb,
    applied_count integer DEFAULT 0,
    success_count integer DEFAULT 0,
    created_by character varying(255),
    learning_cycle_id character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.personalization_rules OWNER TO neondb_owner;

--
-- TOC entry 474 (class 1259 OID 18386)
-- Name: personalization_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.personalization_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personalization_rules_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8844 (class 0 OID 0)
-- Dependencies: 474
-- Name: personalization_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.personalization_rules_id_seq OWNED BY public.personalization_rules.id;


--
-- TOC entry 765 (class 1259 OID 20988)
-- Name: plugin_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plugin_analytics (
    id integer NOT NULL,
    plugin_id character varying(255) NOT NULL,
    instance_id character varying(255),
    neuron_id character varying(255),
    event_type character varying(100) NOT NULL,
    event_data jsonb NOT NULL,
    metrics jsonb NOT NULL,
    user_agent text,
    ip_address character varying(45),
    country character varying(2),
    region character varying(100),
    city character varying(100),
    timezone character varying(50),
    device_type character varying(50),
    operating_system character varying(50),
    browser_name character varying(50),
    browser_version character varying(50),
    screen_resolution character varying(20),
    session_id character varying(255),
    user_id character varying(255),
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    processed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plugin_analytics OWNER TO neondb_owner;

--
-- TOC entry 764 (class 1259 OID 20987)
-- Name: plugin_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.plugin_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plugin_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8845 (class 0 OID 0)
-- Dependencies: 764
-- Name: plugin_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.plugin_analytics_id_seq OWNED BY public.plugin_analytics.id;


--
-- TOC entry 767 (class 1259 OID 21000)
-- Name: plugin_dependencies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plugin_dependencies (
    id integer NOT NULL,
    plugin_id character varying(255) NOT NULL,
    dependency_type character varying(50) NOT NULL,
    dependency_name character varying(255) NOT NULL,
    dependency_version character varying(50),
    version_constraint character varying(100),
    is_optional boolean DEFAULT false,
    is_dev_dependency boolean DEFAULT false,
    status character varying(50) DEFAULT 'unknown'::character varying,
    installed_version character varying(50),
    last_checked timestamp without time zone,
    installation_path text,
    download_url text,
    license_type character varying(100),
    security_issues jsonb,
    alternative_packages jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plugin_dependencies OWNER TO neondb_owner;

--
-- TOC entry 766 (class 1259 OID 20999)
-- Name: plugin_dependencies_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.plugin_dependencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plugin_dependencies_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8846 (class 0 OID 0)
-- Dependencies: 766
-- Name: plugin_dependencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.plugin_dependencies_id_seq OWNED BY public.plugin_dependencies.id;


--
-- TOC entry 769 (class 1259 OID 21014)
-- Name: plugin_executions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plugin_executions (
    id integer NOT NULL,
    execution_id character varying(255) NOT NULL,
    plugin_id character varying(255) NOT NULL,
    instance_id character varying(255) NOT NULL,
    neuron_id character varying(255) NOT NULL,
    execution_type character varying(100) NOT NULL,
    function_name character varying(255) NOT NULL,
    endpoint character varying(500),
    method character varying(10),
    input jsonb,
    output jsonb,
    error text,
    stack_trace text,
    execution_time integer NOT NULL,
    memory_usage integer,
    cpu_time integer,
    status character varying(50) NOT NULL,
    priority integer DEFAULT 1,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    user_id character varying(255),
    session_id character varying(255),
    request_id character varying(255),
    correlation_id character varying(255),
    parent_execution_id character varying(255),
    tags jsonb,
    metadata jsonb,
    resources_accessed jsonb,
    cache_hit boolean DEFAULT false,
    cache_key character varying(500),
    billing_units numeric(10,4) DEFAULT 0.0000,
    started_at timestamp without time zone NOT NULL,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plugin_executions OWNER TO neondb_owner;

--
-- TOC entry 768 (class 1259 OID 21013)
-- Name: plugin_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.plugin_executions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plugin_executions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8847 (class 0 OID 0)
-- Dependencies: 768
-- Name: plugin_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.plugin_executions_id_seq OWNED BY public.plugin_executions.id;


--
-- TOC entry 771 (class 1259 OID 21031)
-- Name: plugin_instances; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plugin_instances (
    id integer NOT NULL,
    instance_id character varying(255) NOT NULL,
    plugin_id character varying(255) NOT NULL,
    neuron_id character varying(255) NOT NULL,
    neuron_type character varying(100) NOT NULL,
    version character varying(50) NOT NULL,
    configuration jsonb NOT NULL,
    status character varying(50) DEFAULT 'inactive'::character varying,
    health character varying(50) DEFAULT 'unknown'::character varying,
    last_health_check timestamp without time zone,
    health_details jsonb,
    usage_stats jsonb NOT NULL,
    performance_metrics jsonb,
    error_log jsonb,
    configuration_override jsonb,
    permissions_granted jsonb,
    resource_usage jsonb,
    billing_info jsonb,
    auto_update_enabled boolean DEFAULT true,
    last_update_check timestamp without time zone,
    update_available boolean DEFAULT false,
    available_version character varying(50),
    installation_method character varying(100),
    installation_source text,
    installed_by character varying(255),
    installation_notes text,
    customizations jsonb,
    backup_configuration jsonb,
    last_backup timestamp without time zone,
    maintenance_window jsonb,
    alert_settings jsonb,
    installed_at timestamp without time zone DEFAULT now(),
    last_updated timestamp without time zone DEFAULT now(),
    last_accessed timestamp without time zone,
    uninstalled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plugin_instances OWNER TO neondb_owner;

--
-- TOC entry 770 (class 1259 OID 21030)
-- Name: plugin_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.plugin_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plugin_instances_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8848 (class 0 OID 0)
-- Dependencies: 770
-- Name: plugin_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.plugin_instances_id_seq OWNED BY public.plugin_instances.id;


--
-- TOC entry 773 (class 1259 OID 21050)
-- Name: plugin_manifests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plugin_manifests (
    id integer NOT NULL,
    plugin_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    version character varying(50) NOT NULL,
    description text NOT NULL,
    author character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    type character varying(50) NOT NULL,
    entry_point character varying(500) NOT NULL,
    dependencies jsonb NOT NULL,
    permissions jsonb NOT NULL,
    configuration_schema jsonb NOT NULL,
    api_endpoints jsonb,
    hooks jsonb NOT NULL,
    compatibility jsonb NOT NULL,
    pricing jsonb,
    metadata jsonb NOT NULL,
    source_url text,
    documentation_url text,
    support_url text,
    license_type character varying(100) DEFAULT 'MIT'::character varying,
    minimum_system_requirements jsonb,
    tags jsonb,
    screenshots jsonb,
    changelog jsonb,
    security_scan jsonb,
    performance_metrics jsonb,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    download_count integer DEFAULT 0,
    rating numeric(3,2) DEFAULT 0.00,
    review_count integer DEFAULT 0,
    last_security_scan timestamp without time zone,
    approved_at timestamp without time zone,
    approved_by character varying(255),
    rejected_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plugin_manifests OWNER TO neondb_owner;

--
-- TOC entry 772 (class 1259 OID 21049)
-- Name: plugin_manifests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.plugin_manifests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plugin_manifests_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8849 (class 0 OID 0)
-- Dependencies: 772
-- Name: plugin_manifests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.plugin_manifests_id_seq OWNED BY public.plugin_manifests.id;


--
-- TOC entry 775 (class 1259 OID 21070)
-- Name: plugin_marketplace; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plugin_marketplace (
    id integer NOT NULL,
    marketplace_id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    base_url text NOT NULL,
    api_key text,
    api_secret text,
    auth_type character varying(50) NOT NULL,
    auth_config jsonb,
    sync_interval integer DEFAULT 3600,
    last_sync timestamp without time zone,
    sync_status character varying(50) DEFAULT 'pending'::character varying,
    sync_errors jsonb,
    plugin_count integer DEFAULT 0,
    featured_plugins jsonb,
    categories jsonb,
    supported_languages jsonb,
    average_rating numeric(3,2) DEFAULT 0.00,
    total_downloads integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_trusted boolean DEFAULT false,
    contact_email character varying(255),
    support_url text,
    terms_url text,
    privacy_url text,
    commission numeric(5,2) DEFAULT 0.00,
    payment_methods jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plugin_marketplace OWNER TO neondb_owner;

--
-- TOC entry 774 (class 1259 OID 21069)
-- Name: plugin_marketplace_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.plugin_marketplace_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plugin_marketplace_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8850 (class 0 OID 0)
-- Dependencies: 774
-- Name: plugin_marketplace_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.plugin_marketplace_id_seq OWNED BY public.plugin_marketplace.id;


--
-- TOC entry 777 (class 1259 OID 21091)
-- Name: plugin_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plugin_reviews (
    id integer NOT NULL,
    review_id character varying(255) NOT NULL,
    plugin_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    neuron_id character varying(255) NOT NULL,
    rating integer NOT NULL,
    title character varying(255),
    review text,
    pros jsonb,
    cons jsonb,
    use_cases jsonb,
    recommendation character varying(50),
    verified boolean DEFAULT false,
    helpful_votes integer DEFAULT 0,
    total_votes integer DEFAULT 0,
    plugin_version character varying(50) NOT NULL,
    usage_duration integer,
    performance_rating integer,
    documentation_rating integer,
    support_rating integer,
    value_rating integer,
    response_from_author text,
    response_date timestamp without time zone,
    is_featured boolean DEFAULT false,
    is_moderated boolean DEFAULT false,
    moderation_notes text,
    language character varying(10) DEFAULT 'en'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plugin_reviews OWNER TO neondb_owner;

--
-- TOC entry 776 (class 1259 OID 21090)
-- Name: plugin_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.plugin_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plugin_reviews_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8851 (class 0 OID 0)
-- Dependencies: 776
-- Name: plugin_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.plugin_reviews_id_seq OWNED BY public.plugin_reviews.id;


--
-- TOC entry 619 (class 1259 OID 19500)
-- Name: privacy_policy_management; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.privacy_policy_management (
    id integer NOT NULL,
    document_type character varying(100) NOT NULL,
    vertical character varying(100),
    country character varying(10),
    language character varying(10) DEFAULT 'en'::character varying,
    title character varying(500) NOT NULL,
    content text NOT NULL,
    html_content text,
    summary text,
    legal_frameworks jsonb,
    required_disclosures jsonb,
    affiliate_networks jsonb,
    ad_networks jsonb,
    version character varying(50) NOT NULL,
    previous_version_id integer,
    status character varying(50) DEFAULT 'draft'::character varying,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    is_auto_generated boolean DEFAULT false,
    generation_prompt text,
    ai_model character varying(100),
    generation_metadata jsonb,
    published_at timestamp without time zone,
    effective_date timestamp without time zone,
    expiration_date timestamp without time zone,
    notification_sent boolean DEFAULT false,
    notification_sent_at timestamp without time zone,
    views integer DEFAULT 0,
    acceptances integer DEFAULT 0,
    rejections integer DEFAULT 0,
    avg_read_time integer,
    bounce_rate numeric(5,4),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.privacy_policy_management OWNER TO neondb_owner;

--
-- TOC entry 618 (class 1259 OID 19499)
-- Name: privacy_policy_management_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.privacy_policy_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.privacy_policy_management_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8852 (class 0 OID 0)
-- Dependencies: 618
-- Name: privacy_policy_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.privacy_policy_management_id_seq OWNED BY public.privacy_policy_management.id;


--
-- TOC entry 631 (class 1259 OID 19624)
-- Name: product_licenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_licenses (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    user_id character varying(255),
    license_key character varying(255) NOT NULL,
    license_type character varying(50) NOT NULL,
    max_activations integer DEFAULT 1,
    current_activations integer DEFAULT 0,
    download_count integer DEFAULT 0,
    max_downloads integer DEFAULT '-1'::integer,
    status character varying(20) DEFAULT 'active'::character varying,
    expires_at timestamp without time zone,
    last_accessed_at timestamp without time zone,
    last_download_at timestamp without time zone,
    allowed_ips text[],
    device_fingerprints jsonb,
    suspicious_activity jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    activated_at timestamp without time zone
);


ALTER TABLE public.product_licenses OWNER TO neondb_owner;

--
-- TOC entry 630 (class 1259 OID 19623)
-- Name: product_licenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_licenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_licenses_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8853 (class 0 OID 0)
-- Dependencies: 630
-- Name: product_licenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_licenses_id_seq OWNED BY public.product_licenses.id;


--
-- TOC entry 633 (class 1259 OID 19642)
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_reviews (
    id integer NOT NULL,
    product_id integer NOT NULL,
    order_id integer,
    user_id character varying(255),
    email character varying(255),
    rating integer NOT NULL,
    title character varying(255),
    content text,
    pros text[],
    cons text[],
    is_verified_purchase boolean DEFAULT false,
    is_recommended boolean,
    helpful_votes integer DEFAULT 0,
    total_votes integer DEFAULT 0,
    status character varying(20) DEFAULT 'pending'::character varying,
    moderated_by character varying(255),
    moderation_notes text,
    sentiment_score real,
    key_phrases text[],
    ai_summary text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    moderated_at timestamp without time zone
);


ALTER TABLE public.product_reviews OWNER TO neondb_owner;

--
-- TOC entry 632 (class 1259 OID 19641)
-- Name: product_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_reviews_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8854 (class 0 OID 0)
-- Dependencies: 632
-- Name: product_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_reviews_id_seq OWNED BY public.product_reviews.id;


--
-- TOC entry 635 (class 1259 OID 19657)
-- Name: product_variants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    product_id integer NOT NULL,
    name character varying(255) NOT NULL,
    price numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    features jsonb,
    max_licenses integer DEFAULT 1,
    is_default boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_variants OWNER TO neondb_owner;

--
-- TOC entry 634 (class 1259 OID 19656)
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_variants_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8855 (class 0 OID 0)
-- Dependencies: 634
-- Name: product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_variants_id_seq OWNED BY public.product_variants.id;


--
-- TOC entry 779 (class 1259 OID 21110)
-- Name: profit_forecast_models; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.profit_forecast_models (
    id integer NOT NULL,
    model_id character varying(255) NOT NULL,
    model_name character varying(255) NOT NULL,
    model_type character varying(50) NOT NULL,
    forecast_horizon integer DEFAULT 90,
    historical_period integer DEFAULT 365,
    data_features text[],
    target_metrics text[],
    model_parameters jsonb NOT NULL,
    hyperparameters jsonb,
    accuracy real DEFAULT 0,
    mape real DEFAULT 100,
    rmse real DEFAULT 0,
    r2_score real DEFAULT 0,
    status character varying(50) DEFAULT 'training'::character varying,
    version character varying(50) DEFAULT '1.0'::character varying,
    is_default boolean DEFAULT false,
    last_trained_at timestamp without time zone,
    next_training_at timestamp without time zone,
    training_frequency character varying(50) DEFAULT 'weekly'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by character varying(255),
    metadata jsonb
);


ALTER TABLE public.profit_forecast_models OWNER TO neondb_owner;

--
-- TOC entry 778 (class 1259 OID 21109)
-- Name: profit_forecast_models_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.profit_forecast_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profit_forecast_models_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8856 (class 0 OID 0)
-- Dependencies: 778
-- Name: profit_forecast_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.profit_forecast_models_id_seq OWNED BY public.profit_forecast_models.id;


--
-- TOC entry 781 (class 1259 OID 21133)
-- Name: profit_forecasts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.profit_forecasts (
    id integer NOT NULL,
    forecast_id character varying(255) NOT NULL,
    model_id integer NOT NULL,
    model_version character varying(50) NOT NULL,
    forecast_type character varying(50) NOT NULL,
    scope jsonb,
    forecast_period jsonb NOT NULL,
    generated_at timestamp without time zone DEFAULT now(),
    predictions jsonb NOT NULL,
    confidence jsonb,
    seasonal_factors jsonb,
    trend_analysis jsonb,
    total_revenue_forecast numeric(15,2),
    partner_split_forecast numeric(15,2),
    net_profit_forecast numeric(15,2),
    risk_factors jsonb,
    scenario_analysis jsonb,
    volatility_metrics jsonb,
    actual_vs_predicted jsonb,
    accuracy_score real,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    metadata jsonb
);


ALTER TABLE public.profit_forecasts OWNER TO neondb_owner;

--
-- TOC entry 780 (class 1259 OID 21132)
-- Name: profit_forecasts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.profit_forecasts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profit_forecasts_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8857 (class 0 OID 0)
-- Dependencies: 780
-- Name: profit_forecasts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.profit_forecasts_id_seq OWNED BY public.profit_forecasts.id;


--
-- TOC entry 637 (class 1259 OID 19671)
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.promo_codes (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255),
    description text,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_order_amount numeric(10,2),
    max_discount_amount numeric(10,2),
    max_uses integer DEFAULT '-1'::integer,
    current_uses integer DEFAULT 0,
    max_uses_per_user integer DEFAULT 1,
    applicable_products integer[],
    excluded_products integer[],
    applicable_categories text[],
    valid_from timestamp without time zone,
    valid_until timestamp without time zone,
    target_countries character varying(2)[],
    target_user_segments text[],
    first_time_customers_only boolean DEFAULT false,
    is_active boolean DEFAULT true,
    is_public boolean DEFAULT true,
    auto_apply boolean DEFAULT false,
    total_savings numeric(15,2) DEFAULT '0'::numeric,
    conversion_rate real DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.promo_codes OWNER TO neondb_owner;

--
-- TOC entry 636 (class 1259 OID 19670)
-- Name: promo_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.promo_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_codes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8858 (class 0 OID 0)
-- Dependencies: 636
-- Name: promo_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.promo_codes_id_seq OWNED BY public.promo_codes.id;


--
-- TOC entry 707 (class 1259 OID 20307)
-- Name: prompt_optimizations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.prompt_optimizations (
    id integer NOT NULL,
    optimization_id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_prompt text NOT NULL,
    optimized_prompt text NOT NULL,
    injected_nodes jsonb DEFAULT '[]'::jsonb NOT NULL,
    injection_strategy character varying(100) NOT NULL,
    task_type character varying(100) NOT NULL,
    user_context jsonb DEFAULT '{}'::jsonb NOT NULL,
    session_id character varying(255),
    retrieval_score real,
    prompt_quality real,
    execution_time integer NOT NULL,
    tokens_added integer DEFAULT 0 NOT NULL,
    output_generated text,
    user_satisfaction real,
    conversion_result boolean,
    agent_id uuid,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.prompt_optimizations OWNER TO neondb_owner;

--
-- TOC entry 706 (class 1259 OID 20306)
-- Name: prompt_optimizations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.prompt_optimizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prompt_optimizations_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8859 (class 0 OID 0)
-- Dependencies: 706
-- Name: prompt_optimizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.prompt_optimizations_id_seq OWNED BY public.prompt_optimizations.id;


--
-- TOC entry 687 (class 1259 OID 20112)
-- Name: prompt_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.prompt_templates (
    id integer NOT NULL,
    template_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    template text NOT NULL,
    variables jsonb DEFAULT '{}'::jsonb NOT NULL,
    supported_agents jsonb DEFAULT '[]'::jsonb NOT NULL,
    average_tokens integer DEFAULT 0 NOT NULL,
    success_rate real DEFAULT 1 NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    last_used timestamp without time zone,
    created_by integer NOT NULL,
    version character varying(20) DEFAULT '1.0'::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.prompt_templates OWNER TO neondb_owner;

--
-- TOC entry 686 (class 1259 OID 20111)
-- Name: prompt_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.prompt_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prompt_templates_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8860 (class 0 OID 0)
-- Dependencies: 686
-- Name: prompt_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.prompt_templates_id_seq OWNED BY public.prompt_templates.id;


--
-- TOC entry 549 (class 1259 OID 18951)
-- Name: push_personalization; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.push_personalization (
    id integer NOT NULL,
    subscription_id integer,
    session_id character varying(255),
    user_archetype character varying(100),
    preferred_time character varying(20),
    timezone character varying(50),
    engagement_score real DEFAULT 0,
    click_through_rate real DEFAULT 0,
    unsubscribe_rate real DEFAULT 0,
    content_preferences jsonb,
    device_preferences jsonb,
    behavior_metrics jsonb,
    last_engagement timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.push_personalization OWNER TO neondb_owner;

--
-- TOC entry 548 (class 1259 OID 18950)
-- Name: push_personalization_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.push_personalization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.push_personalization_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8861 (class 0 OID 0)
-- Dependencies: 548
-- Name: push_personalization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.push_personalization_id_seq OWNED BY public.push_personalization.id;


--
-- TOC entry 551 (class 1259 OID 18965)
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    session_id character varying(255),
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    topics jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_notification_at timestamp without time zone,
    metadata jsonb
);


ALTER TABLE public.push_subscriptions OWNER TO neondb_owner;

--
-- TOC entry 550 (class 1259 OID 18964)
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.push_subscriptions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8862 (class 0 OID 0)
-- Dependencies: 550
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- TOC entry 553 (class 1259 OID 18980)
-- Name: pwa_aso_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pwa_aso_metrics (
    id integer NOT NULL,
    app_name character varying(255) NOT NULL,
    platform character varying(50) NOT NULL,
    keyword character varying(255),
    ranking integer,
    search_volume integer,
    conversion_rate real,
    impressions integer DEFAULT 0,
    installs integer DEFAULT 0,
    date timestamp without time zone DEFAULT now(),
    metadata jsonb
);


ALTER TABLE public.pwa_aso_metrics OWNER TO neondb_owner;

--
-- TOC entry 552 (class 1259 OID 18979)
-- Name: pwa_aso_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pwa_aso_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pwa_aso_metrics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8863 (class 0 OID 0)
-- Dependencies: 552
-- Name: pwa_aso_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pwa_aso_metrics_id_seq OWNED BY public.pwa_aso_metrics.id;


--
-- TOC entry 555 (class 1259 OID 18992)
-- Name: pwa_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pwa_config (
    id integer NOT NULL,
    vapid_public_key text,
    notification_topics jsonb DEFAULT '[]'::jsonb,
    cache_strategy character varying(50) DEFAULT 'networkFirst'::character varying,
    offline_pages jsonb DEFAULT '[]'::jsonb,
    install_prompt_config jsonb,
    features jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pwa_config OWNER TO neondb_owner;

--
-- TOC entry 554 (class 1259 OID 18991)
-- Name: pwa_config_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pwa_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pwa_config_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8864 (class 0 OID 0)
-- Dependencies: 554
-- Name: pwa_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pwa_config_id_seq OWNED BY public.pwa_config.id;


--
-- TOC entry 557 (class 1259 OID 19006)
-- Name: pwa_installs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pwa_installs (
    id integer NOT NULL,
    session_id character varying(255),
    user_agent text,
    platform character varying(50),
    install_source character varying(50),
    engagement_score integer DEFAULT 0,
    device_info jsonb,
    installed_at timestamp without time zone DEFAULT now(),
    uninstalled_at timestamp without time zone,
    is_active boolean DEFAULT true,
    metadata jsonb
);


ALTER TABLE public.pwa_installs OWNER TO neondb_owner;

--
-- TOC entry 556 (class 1259 OID 19005)
-- Name: pwa_installs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pwa_installs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pwa_installs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8865 (class 0 OID 0)
-- Dependencies: 556
-- Name: pwa_installs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pwa_installs_id_seq OWNED BY public.pwa_installs.id;


--
-- TOC entry 559 (class 1259 OID 19018)
-- Name: pwa_notification_campaigns; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pwa_notification_campaigns (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    topics jsonb DEFAULT '[]'::jsonb,
    targeted_users integer DEFAULT 0,
    delivered_count integer DEFAULT 0,
    clicked_count integer DEFAULT 0,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    metadata jsonb
);


ALTER TABLE public.pwa_notification_campaigns OWNER TO neondb_owner;

--
-- TOC entry 558 (class 1259 OID 19017)
-- Name: pwa_notification_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pwa_notification_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pwa_notification_campaigns_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8866 (class 0 OID 0)
-- Dependencies: 558
-- Name: pwa_notification_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pwa_notification_campaigns_id_seq OWNED BY public.pwa_notification_campaigns.id;


--
-- TOC entry 561 (class 1259 OID 19033)
-- Name: pwa_performance_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pwa_performance_metrics (
    id integer NOT NULL,
    session_id character varying(255),
    device_id character varying(255),
    metric_type character varying(50),
    metric_value real NOT NULL,
    url text,
    connection_type character varying(20),
    device_type character varying(20),
    user_agent text,
    "timestamp" timestamp without time zone DEFAULT now(),
    additional_data jsonb
);


ALTER TABLE public.pwa_performance_metrics OWNER TO neondb_owner;

--
-- TOC entry 560 (class 1259 OID 19032)
-- Name: pwa_performance_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pwa_performance_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pwa_performance_metrics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8867 (class 0 OID 0)
-- Dependencies: 560
-- Name: pwa_performance_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pwa_performance_metrics_id_seq OWNED BY public.pwa_performance_metrics.id;


--
-- TOC entry 563 (class 1259 OID 19043)
-- Name: pwa_usage_stats; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pwa_usage_stats (
    id integer NOT NULL,
    session_id character varying(255),
    date timestamp without time zone DEFAULT now(),
    is_standalone boolean DEFAULT false,
    is_offline boolean DEFAULT false,
    page_views integer DEFAULT 0,
    session_duration integer DEFAULT 0,
    features_used jsonb DEFAULT '[]'::jsonb,
    errors jsonb DEFAULT '[]'::jsonb,
    performance jsonb,
    metadata jsonb
);


ALTER TABLE public.pwa_usage_stats OWNER TO neondb_owner;

--
-- TOC entry 562 (class 1259 OID 19042)
-- Name: pwa_usage_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pwa_usage_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pwa_usage_stats_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8868 (class 0 OID 0)
-- Dependencies: 562
-- Name: pwa_usage_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pwa_usage_stats_id_seq OWNED BY public.pwa_usage_stats.id;


--
-- TOC entry 301 (class 1259 OID 17101)
-- Name: quiz_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.quiz_results (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    quiz_id character varying(255) NOT NULL,
    answers jsonb NOT NULL,
    score integer NOT NULL,
    result text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    user_id character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.quiz_results OWNER TO neondb_owner;

--
-- TOC entry 300 (class 1259 OID 17100)
-- Name: quiz_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.quiz_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_results_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8869 (class 0 OID 0)
-- Dependencies: 300
-- Name: quiz_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.quiz_results_id_seq OWNED BY public.quiz_results.id;


--
-- TOC entry 497 (class 1259 OID 18546)
-- Name: realtime_recommendations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.realtime_recommendations (
    id integer NOT NULL,
    user_id character varying(255),
    session_id character varying(255) NOT NULL,
    fingerprint character varying(500),
    node_id integer NOT NULL,
    recommendation_type character varying(50) NOT NULL,
    score real NOT NULL,
    reason text,
    context jsonb,
    "position" integer,
    is_displayed boolean DEFAULT false,
    is_clicked boolean DEFAULT false,
    is_converted boolean DEFAULT false,
    displayed_at timestamp without time zone,
    clicked_at timestamp without time zone,
    converted_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.realtime_recommendations OWNER TO neondb_owner;

--
-- TOC entry 496 (class 1259 OID 18545)
-- Name: realtime_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.realtime_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.realtime_recommendations_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8870 (class 0 OID 0)
-- Dependencies: 496
-- Name: realtime_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.realtime_recommendations_id_seq OWNED BY public.realtime_recommendations.id;


--
-- TOC entry 760 (class 1259 OID 20928)
-- Name: region_health; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.region_health (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    region_id text NOT NULL,
    status text NOT NULL,
    response_time_ms integer DEFAULT 0 NOT NULL,
    cpu_usage real DEFAULT 0 NOT NULL,
    memory_usage real DEFAULT 0 NOT NULL,
    disk_usage real DEFAULT 0 NOT NULL,
    network_throughput real DEFAULT 0 NOT NULL,
    error_rate real DEFAULT 0 NOT NULL,
    active_connections integer DEFAULT 0 NOT NULL,
    queue_length integer DEFAULT 0 NOT NULL,
    availability_percentage real DEFAULT 100 NOT NULL,
    health_score real DEFAULT 100 NOT NULL,
    check_timestamp timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.region_health OWNER TO neondb_owner;

--
-- TOC entry 761 (class 1259 OID 20948)
-- Name: regions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.regions (
    id text NOT NULL,
    name text NOT NULL,
    location jsonb NOT NULL,
    endpoints jsonb NOT NULL,
    capacity jsonb NOT NULL,
    load_balancing jsonb NOT NULL,
    auto_scaling jsonb NOT NULL,
    status text DEFAULT 'healthy'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.regions OWNER TO neondb_owner;

--
-- TOC entry 783 (class 1259 OID 21147)
-- Name: revenue_split_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.revenue_split_analytics (
    id integer NOT NULL,
    analytics_id character varying(255) NOT NULL,
    period character varying(20) NOT NULL,
    period_start timestamp without time zone NOT NULL,
    period_end timestamp without time zone NOT NULL,
    partner_id integer,
    vertical character varying(100),
    product_category character varying(100),
    total_revenue numeric(15,2) DEFAULT '0'::numeric,
    total_commissions numeric(15,2) DEFAULT '0'::numeric,
    total_payouts numeric(15,2) DEFAULT '0'::numeric,
    net_profit numeric(15,2) DEFAULT '0'::numeric,
    transaction_count integer DEFAULT 0,
    unique_partners integer DEFAULT 0,
    average_commission_rate real DEFAULT 0,
    average_order_value numeric(10,2) DEFAULT '0'::numeric,
    revenue_growth real DEFAULT 0,
    commission_growth real DEFAULT 0,
    partner_growth real DEFAULT 0,
    top_partners jsonb,
    top_products jsonb,
    top_verticals jsonb,
    conversion_rate real DEFAULT 0,
    revenue_per_partner numeric(10,2) DEFAULT '0'::numeric,
    cost_per_acquisition numeric(10,2) DEFAULT '0'::numeric,
    calculated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    metadata jsonb
);


ALTER TABLE public.revenue_split_analytics OWNER TO neondb_owner;

--
-- TOC entry 782 (class 1259 OID 21146)
-- Name: revenue_split_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.revenue_split_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.revenue_split_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8871 (class 0 OID 0)
-- Dependencies: 782
-- Name: revenue_split_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.revenue_split_analytics_id_seq OWNED BY public.revenue_split_analytics.id;


--
-- TOC entry 785 (class 1259 OID 21174)
-- Name: revenue_split_partners; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.revenue_split_partners (
    id integer NOT NULL,
    partner_id character varying(255) NOT NULL,
    partner_name character varying(255) NOT NULL,
    partner_type character varying(50) NOT NULL,
    contact_email character varying(255) NOT NULL,
    contact_phone character varying(50),
    legal_entity_name character varying(255),
    tax_id character varying(100),
    business_address jsonb,
    default_commission_rate numeric(5,2) NOT NULL,
    split_type character varying(50) DEFAULT 'percentage'::character varying,
    minimum_payout numeric(10,2) DEFAULT 50.00,
    payout_frequency character varying(20) DEFAULT 'monthly'::character varying,
    payment_method character varying(50) DEFAULT 'bank_transfer'::character varying,
    payment_details jsonb,
    currency character varying(3) DEFAULT 'USD'::character varying,
    total_earnings numeric(15,2) DEFAULT '0'::numeric,
    pending_payouts numeric(15,2) DEFAULT '0'::numeric,
    lifetime_revenue numeric(15,2) DEFAULT '0'::numeric,
    average_conversion_rate real DEFAULT 0,
    custom_split_rules jsonb,
    vertical_assignments text[],
    geo_restrictions text[],
    contract_terms jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    is_vip boolean DEFAULT false,
    auto_payouts boolean DEFAULT true,
    requires_approval boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_payout_at timestamp without time zone,
    contract_start_date timestamp without time zone,
    contract_end_date timestamp without time zone,
    metadata jsonb,
    notes text
);


ALTER TABLE public.revenue_split_partners OWNER TO neondb_owner;

--
-- TOC entry 784 (class 1259 OID 21173)
-- Name: revenue_split_partners_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.revenue_split_partners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.revenue_split_partners_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8872 (class 0 OID 0)
-- Dependencies: 784
-- Name: revenue_split_partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.revenue_split_partners_id_seq OWNED BY public.revenue_split_partners.id;


--
-- TOC entry 787 (class 1259 OID 21200)
-- Name: revenue_split_payouts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.revenue_split_payouts (
    id integer NOT NULL,
    payout_id character varying(255) NOT NULL,
    batch_id character varying(255) NOT NULL,
    partner_id integer NOT NULL,
    partner_name character varying(255) NOT NULL,
    payout_period jsonb NOT NULL,
    total_transactions integer NOT NULL,
    gross_amount numeric(15,2) NOT NULL,
    deductions numeric(10,2) DEFAULT '0'::numeric,
    net_payout_amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    payment_method character varying(50) NOT NULL,
    payment_details jsonb,
    payment_processor_id character varying(255),
    payment_processor_fee numeric(10,2) DEFAULT '0'::numeric,
    status character varying(50) DEFAULT 'pending'::character varying,
    failure_reason text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    scheduled_at timestamp without time zone NOT NULL,
    processed_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    invoice_number character varying(100),
    tax_documents jsonb,
    compliance_data jsonb,
    metadata jsonb,
    notes text
);


ALTER TABLE public.revenue_split_payouts OWNER TO neondb_owner;

--
-- TOC entry 786 (class 1259 OID 21199)
-- Name: revenue_split_payouts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.revenue_split_payouts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.revenue_split_payouts_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8873 (class 0 OID 0)
-- Dependencies: 786
-- Name: revenue_split_payouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.revenue_split_payouts_id_seq OWNED BY public.revenue_split_payouts.id;


--
-- TOC entry 789 (class 1259 OID 21218)
-- Name: revenue_split_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.revenue_split_rules (
    id integer NOT NULL,
    rule_id character varying(255) NOT NULL,
    rule_name character varying(255) NOT NULL,
    partner_id integer,
    vertical character varying(100),
    product_category character varying(100),
    specific_products integer[],
    split_type character varying(50) NOT NULL,
    commission_structure jsonb NOT NULL,
    minimum_order_value numeric(10,2),
    maximum_order_value numeric(10,2),
    eligible_countries text[],
    eligible_customer_types text[],
    time_restrictions jsonb,
    performance_bonuses jsonb,
    priority integer DEFAULT 1,
    is_active boolean DEFAULT true,
    effective_date timestamp without time zone DEFAULT now(),
    expiration_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by character varying(255),
    metadata jsonb
);


ALTER TABLE public.revenue_split_rules OWNER TO neondb_owner;

--
-- TOC entry 788 (class 1259 OID 21217)
-- Name: revenue_split_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.revenue_split_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.revenue_split_rules_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8874 (class 0 OID 0)
-- Dependencies: 788
-- Name: revenue_split_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.revenue_split_rules_id_seq OWNED BY public.revenue_split_rules.id;


--
-- TOC entry 791 (class 1259 OID 21234)
-- Name: revenue_split_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.revenue_split_transactions (
    id integer NOT NULL,
    transaction_id character varying(255) NOT NULL,
    order_id character varying(255),
    click_id character varying(255),
    affiliate_code character varying(100),
    partner_id integer NOT NULL,
    rule_id integer,
    original_amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    exchange_rate numeric(10,6) DEFAULT 1.000000,
    commission_rate numeric(5,2) NOT NULL,
    commission_amount numeric(15,2) NOT NULL,
    bonus_amount numeric(15,2) DEFAULT '0'::numeric,
    total_split_amount numeric(15,2) NOT NULL,
    processing_fees numeric(10,2) DEFAULT '0'::numeric,
    platform_fees numeric(10,2) DEFAULT '0'::numeric,
    net_payout_amount numeric(15,2) NOT NULL,
    vertical character varying(100),
    product_category character varying(100),
    product_id integer,
    product_name character varying(255),
    customer_segment character varying(100),
    customer_country character varying(3),
    is_new_customer boolean DEFAULT true,
    status character varying(50) DEFAULT 'pending'::character varying,
    payout_batch_id character varying(255),
    transaction_date timestamp without time zone DEFAULT now(),
    approved_at timestamp without time zone,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    audit_trail jsonb,
    compliance_checks jsonb,
    metadata jsonb
);


ALTER TABLE public.revenue_split_transactions OWNER TO neondb_owner;

--
-- TOC entry 790 (class 1259 OID 21233)
-- Name: revenue_split_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.revenue_split_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.revenue_split_transactions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8875 (class 0 OID 0)
-- Dependencies: 790
-- Name: revenue_split_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.revenue_split_transactions_id_seq OWNED BY public.revenue_split_transactions.id;


--
-- TOC entry 719 (class 1259 OID 20448)
-- Name: rlhf_feedback; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rlhf_feedback (
    id integer NOT NULL,
    feedback_id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id integer,
    agent_id character varying(255),
    prompt_version character varying(50),
    task_type character varying(100) NOT NULL,
    page_path character varying(500),
    user_archetype character varying(100),
    feedback_type character varying(50) NOT NULL,
    signal_type character varying(50) NOT NULL,
    signal_value real NOT NULL,
    raw_value jsonb,
    signal_weight real DEFAULT 1 NOT NULL,
    confidence_score real DEFAULT 0.5 NOT NULL,
    quality_score real DEFAULT 0.5 NOT NULL,
    interaction_duration integer,
    device_type character varying(50),
    browser_info jsonb,
    geo_location character varying(100),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    processing_status character varying(20) DEFAULT 'pending'::character varying,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rlhf_feedback OWNER TO neondb_owner;

--
-- TOC entry 718 (class 1259 OID 20447)
-- Name: rlhf_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.rlhf_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rlhf_feedback_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8876 (class 0 OID 0)
-- Dependencies: 718
-- Name: rlhf_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.rlhf_feedback_id_seq OWNED BY public.rlhf_feedback.id;


--
-- TOC entry 721 (class 1259 OID 20466)
-- Name: rlhf_training_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rlhf_training_sessions (
    id integer NOT NULL,
    session_id uuid DEFAULT gen_random_uuid() NOT NULL,
    training_type character varying(50) NOT NULL,
    target_agents jsonb DEFAULT '[]'::jsonb NOT NULL,
    target_personas jsonb DEFAULT '[]'::jsonb NOT NULL,
    feedback_data_range jsonb NOT NULL,
    training_data_size integer NOT NULL,
    data_quality_score real DEFAULT 0.5 NOT NULL,
    pre_training_metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    post_training_metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    improvement_score real,
    hyperparameters jsonb DEFAULT '{}'::jsonb NOT NULL,
    algorithm_version character varying(50),
    compute_resources jsonb DEFAULT '{}'::jsonb NOT NULL,
    status character varying(20) DEFAULT 'queued'::character varying,
    progress integer DEFAULT 0 NOT NULL,
    error_details text,
    results_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
    model_artifacts jsonb DEFAULT '{}'::jsonb NOT NULL,
    validation_results jsonb DEFAULT '{}'::jsonb NOT NULL,
    queued_at timestamp without time zone DEFAULT now() NOT NULL,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    triggered_by integer,
    automation_reason character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.rlhf_training_sessions OWNER TO neondb_owner;

--
-- TOC entry 720 (class 1259 OID 20465)
-- Name: rlhf_training_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.rlhf_training_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rlhf_training_sessions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8877 (class 0 OID 0)
-- Dependencies: 720
-- Name: rlhf_training_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.rlhf_training_sessions_id_seq OWNED BY public.rlhf_training_sessions.id;


--
-- TOC entry 689 (class 1259 OID 20134)
-- Name: router_learning; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.router_learning (
    id integer NOT NULL,
    learning_id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_type character varying(100) NOT NULL,
    complexity character varying(20) NOT NULL,
    context_patterns jsonb NOT NULL,
    best_agent_id uuid NOT NULL,
    alternative_agents jsonb DEFAULT '[]'::jsonb NOT NULL,
    success_rate real NOT NULL,
    average_cost real NOT NULL,
    average_latency integer NOT NULL,
    confidence real DEFAULT 0 NOT NULL,
    sample_size integer DEFAULT 1 NOT NULL,
    last_updated timestamp without time zone DEFAULT now() NOT NULL,
    model_version character varying(50) DEFAULT '1.0'::character varying NOT NULL,
    training_data jsonb,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.router_learning OWNER TO neondb_owner;

--
-- TOC entry 688 (class 1259 OID 20133)
-- Name: router_learning_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.router_learning_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.router_learning_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8878 (class 0 OID 0)
-- Dependencies: 688
-- Name: router_learning_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.router_learning_id_seq OWNED BY public.router_learning.id;


--
-- TOC entry 762 (class 1259 OID 20958)
-- Name: routing_decisions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.routing_decisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text,
    session_id text,
    request_id text,
    user_location jsonb,
    user_agent text,
    selected_region text NOT NULL,
    routing_algorithm text NOT NULL,
    applied_rules jsonb,
    decision_factors jsonb,
    routing_latency_ms integer DEFAULT 0 NOT NULL,
    prediction_confidence real DEFAULT 0 NOT NULL,
    actual_performance jsonb,
    user_satisfaction_score real,
    business_impact jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.routing_decisions OWNER TO neondb_owner;

--
-- TOC entry 327 (class 1259 OID 17277)
-- Name: saas_calculator_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saas_calculator_results (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    calculator_type character varying(100) NOT NULL,
    inputs jsonb NOT NULL,
    results jsonb NOT NULL,
    tools_compared jsonb,
    recommendations jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saas_calculator_results OWNER TO neondb_owner;

--
-- TOC entry 326 (class 1259 OID 17276)
-- Name: saas_calculator_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.saas_calculator_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saas_calculator_results_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8879 (class 0 OID 0)
-- Dependencies: 326
-- Name: saas_calculator_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.saas_calculator_results_id_seq OWNED BY public.saas_calculator_results.id;


--
-- TOC entry 329 (class 1259 OID 17287)
-- Name: saas_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saas_categories (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    icon character varying(100),
    parent_category character varying(100),
    tool_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saas_categories OWNER TO neondb_owner;

--
-- TOC entry 328 (class 1259 OID 17286)
-- Name: saas_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.saas_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saas_categories_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8880 (class 0 OID 0)
-- Dependencies: 328
-- Name: saas_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.saas_categories_id_seq OWNED BY public.saas_categories.id;


--
-- TOC entry 331 (class 1259 OID 17302)
-- Name: saas_comparisons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saas_comparisons (
    id integer NOT NULL,
    slug character varying(200) NOT NULL,
    title character varying(255) NOT NULL,
    tool_a integer,
    tool_b integer,
    category character varying(100),
    comparison_matrix jsonb,
    verdict text,
    votes_a integer DEFAULT 0,
    votes_b integer DEFAULT 0,
    total_votes integer DEFAULT 0,
    views integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saas_comparisons OWNER TO neondb_owner;

--
-- TOC entry 330 (class 1259 OID 17301)
-- Name: saas_comparisons_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.saas_comparisons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saas_comparisons_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8881 (class 0 OID 0)
-- Dependencies: 330
-- Name: saas_comparisons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.saas_comparisons_id_seq OWNED BY public.saas_comparisons.id;


--
-- TOC entry 333 (class 1259 OID 17320)
-- Name: saas_content; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saas_content (
    id integer NOT NULL,
    slug character varying(200) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    content text NOT NULL,
    content_type character varying(100) NOT NULL,
    category character varying(100),
    featured_tools jsonb,
    tags jsonb,
    meta_title character varying(255),
    meta_description text,
    og_image text,
    read_time integer,
    views integer DEFAULT 0,
    shares integer DEFAULT 0,
    is_published boolean DEFAULT false,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saas_content OWNER TO neondb_owner;

--
-- TOC entry 332 (class 1259 OID 17319)
-- Name: saas_content_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.saas_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saas_content_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8882 (class 0 OID 0)
-- Dependencies: 332
-- Name: saas_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.saas_content_id_seq OWNED BY public.saas_content.id;


--
-- TOC entry 335 (class 1259 OID 17336)
-- Name: saas_deals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saas_deals (
    id integer NOT NULL,
    tool_id integer,
    title character varying(255) NOT NULL,
    description text,
    deal_type character varying(100) NOT NULL,
    original_price numeric(10,2),
    deal_price numeric(10,2),
    discount_percent integer,
    deal_url text NOT NULL,
    coupon_code character varying(100),
    start_date timestamp without time zone DEFAULT now(),
    end_date timestamp without time zone,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saas_deals OWNER TO neondb_owner;

--
-- TOC entry 334 (class 1259 OID 17335)
-- Name: saas_deals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.saas_deals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saas_deals_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8883 (class 0 OID 0)
-- Dependencies: 334
-- Name: saas_deals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.saas_deals_id_seq OWNED BY public.saas_deals.id;


--
-- TOC entry 337 (class 1259 OID 17352)
-- Name: saas_quiz_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saas_quiz_results (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    quiz_type character varying(100) NOT NULL,
    answers jsonb NOT NULL,
    persona character varying(100),
    recommended_tools jsonb,
    recommended_stack jsonb,
    budget jsonb,
    priorities jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saas_quiz_results OWNER TO neondb_owner;

--
-- TOC entry 336 (class 1259 OID 17351)
-- Name: saas_quiz_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.saas_quiz_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saas_quiz_results_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8884 (class 0 OID 0)
-- Dependencies: 336
-- Name: saas_quiz_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.saas_quiz_results_id_seq OWNED BY public.saas_quiz_results.id;


--
-- TOC entry 339 (class 1259 OID 17362)
-- Name: saas_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saas_reviews (
    id integer NOT NULL,
    tool_id integer,
    session_id character varying(255),
    user_id character varying(255),
    rating integer NOT NULL,
    title character varying(255),
    content text,
    pros jsonb,
    cons jsonb,
    use_case character varying(100),
    user_role character varying(100),
    company_size character varying(100),
    is_verified boolean DEFAULT false,
    is_published boolean DEFAULT false,
    helpful_votes integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saas_reviews OWNER TO neondb_owner;

--
-- TOC entry 338 (class 1259 OID 17361)
-- Name: saas_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.saas_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saas_reviews_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8885 (class 0 OID 0)
-- Dependencies: 338
-- Name: saas_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.saas_reviews_id_seq OWNED BY public.saas_reviews.id;


--
-- TOC entry 341 (class 1259 OID 17375)
-- Name: saas_stacks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saas_stacks (
    id integer NOT NULL,
    session_id character varying(255),
    user_id character varying(255),
    name character varying(255) NOT NULL,
    description text,
    persona character varying(100),
    tools jsonb NOT NULL,
    total_cost jsonb,
    is_public boolean DEFAULT false,
    likes integer DEFAULT 0,
    views integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saas_stacks OWNER TO neondb_owner;

--
-- TOC entry 340 (class 1259 OID 17374)
-- Name: saas_stacks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.saas_stacks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saas_stacks_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8886 (class 0 OID 0)
-- Dependencies: 340
-- Name: saas_stacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.saas_stacks_id_seq OWNED BY public.saas_stacks.id;


--
-- TOC entry 343 (class 1259 OID 17389)
-- Name: saas_tools; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saas_tools (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    sub_category character varying(100),
    website text NOT NULL,
    affiliate_url text,
    logo text,
    screenshots jsonb,
    pricing jsonb NOT NULL,
    features jsonb NOT NULL,
    pros jsonb,
    cons jsonb,
    rating numeric(3,2) DEFAULT '0'::numeric,
    review_count integer DEFAULT 0,
    alternatives jsonb,
    integrations jsonb,
    target_users jsonb,
    tags jsonb,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    deal_active boolean DEFAULT false,
    deal_description text,
    deal_expiry timestamp without time zone,
    affiliate_commission numeric(5,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saas_tools OWNER TO neondb_owner;

--
-- TOC entry 342 (class 1259 OID 17388)
-- Name: saas_tools_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.saas_tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saas_tools_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8887 (class 0 OID 0)
-- Dependencies: 342
-- Name: saas_tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.saas_tools_id_seq OWNED BY public.saas_tools.id;


--
-- TOC entry 499 (class 1259 OID 18559)
-- Name: semantic_edges; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.semantic_edges (
    id integer NOT NULL,
    from_node_id integer NOT NULL,
    to_node_id integer NOT NULL,
    edge_type character varying(50) NOT NULL,
    weight real DEFAULT 1,
    confidence real DEFAULT 0.5,
    metadata jsonb,
    created_by character varying(50) DEFAULT 'system'::character varying,
    click_count integer DEFAULT 0,
    conversion_count integer DEFAULT 0,
    last_traversed timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.semantic_edges OWNER TO neondb_owner;

--
-- TOC entry 498 (class 1259 OID 18558)
-- Name: semantic_edges_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.semantic_edges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.semantic_edges_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8888 (class 0 OID 0)
-- Dependencies: 498
-- Name: semantic_edges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.semantic_edges_id_seq OWNED BY public.semantic_edges.id;


--
-- TOC entry 501 (class 1259 OID 18576)
-- Name: semantic_nodes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.semantic_nodes (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    node_type character varying(50) NOT NULL,
    title text NOT NULL,
    description text,
    content text,
    metadata jsonb,
    vector_embedding jsonb,
    semantic_keywords jsonb,
    llm_summary text,
    intent_profile_tags jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    vertical_id character varying(50),
    neuron_id character varying(100),
    click_through_rate real DEFAULT 0,
    conversion_rate real DEFAULT 0,
    engagement real DEFAULT 0,
    last_optimized timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.semantic_nodes OWNER TO neondb_owner;

--
-- TOC entry 500 (class 1259 OID 18575)
-- Name: semantic_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.semantic_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.semantic_nodes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8889 (class 0 OID 0)
-- Dependencies: 500
-- Name: semantic_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.semantic_nodes_id_seq OWNED BY public.semantic_nodes.id;


--
-- TOC entry 503 (class 1259 OID 18593)
-- Name: semantic_search_queries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.semantic_search_queries (
    id integer NOT NULL,
    query_text text NOT NULL,
    query_vector jsonb,
    user_id character varying(255),
    session_id character varying(255),
    results jsonb,
    clicked_results jsonb,
    performance_metrics jsonb,
    intent character varying(100),
    vertical character varying(50),
    neuron_id character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.semantic_search_queries OWNER TO neondb_owner;

--
-- TOC entry 502 (class 1259 OID 18592)
-- Name: semantic_search_queries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.semantic_search_queries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.semantic_search_queries_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8890 (class 0 OID 0)
-- Dependencies: 502
-- Name: semantic_search_queries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.semantic_search_queries_id_seq OWNED BY public.semantic_search_queries.id;


--
-- TOC entry 303 (class 1259 OID 17112)
-- Name: session_bridge; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session_bridge (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    global_user_id integer,
    device_fingerprint character varying(255),
    link_method character varying(50) NOT NULL,
    link_confidence integer DEFAULT 0,
    link_data jsonb,
    linked_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


ALTER TABLE public.session_bridge OWNER TO neondb_owner;

--
-- TOC entry 302 (class 1259 OID 17111)
-- Name: session_bridge_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.session_bridge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.session_bridge_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8891 (class 0 OID 0)
-- Dependencies: 302
-- Name: session_bridge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.session_bridge_id_seq OWNED BY public.session_bridge.id;


--
-- TOC entry 639 (class 1259 OID 19693)
-- Name: shopping_carts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shopping_carts (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    items jsonb NOT NULL,
    subtotal numeric(10,2) DEFAULT '0'::numeric,
    tax_amount numeric(10,2) DEFAULT '0'::numeric,
    discount_amount numeric(10,2) DEFAULT '0'::numeric,
    total numeric(10,2) DEFAULT '0'::numeric,
    currency character varying(3) DEFAULT 'USD'::character varying,
    promo_code character varying(100),
    abandoned_at timestamp without time zone,
    recovery_email_sent boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.shopping_carts OWNER TO neondb_owner;

--
-- TOC entry 638 (class 1259 OID 19692)
-- Name: shopping_carts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shopping_carts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shopping_carts_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8892 (class 0 OID 0)
-- Dependencies: 638
-- Name: shopping_carts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shopping_carts_id_seq OWNED BY public.shopping_carts.id;


--
-- TOC entry 641 (class 1259 OID 19710)
-- Name: storefront_ab_tests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.storefront_ab_tests (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    test_type character varying(50) NOT NULL,
    target_element character varying(100),
    variants jsonb NOT NULL,
    traffic_split jsonb,
    success_metric character varying(50) NOT NULL,
    minimum_sample_size integer DEFAULT 100,
    confidence_level real DEFAULT 0.95,
    minimum_detectable_effect real DEFAULT 0.05,
    status character varying(20) DEFAULT 'draft'::character varying,
    winning_variant character varying(50),
    statistical_significance real,
    results jsonb,
    target_products integer[],
    target_segments text[],
    target_countries character varying(2)[],
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    max_duration integer,
    total_participants integer DEFAULT 0,
    total_conversions integer DEFAULT 0,
    revenue_impact numeric(15,2) DEFAULT '0'::numeric,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


ALTER TABLE public.storefront_ab_tests OWNER TO neondb_owner;

--
-- TOC entry 640 (class 1259 OID 19709)
-- Name: storefront_ab_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.storefront_ab_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.storefront_ab_tests_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8893 (class 0 OID 0)
-- Dependencies: 640
-- Name: storefront_ab_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.storefront_ab_tests_id_seq OWNED BY public.storefront_ab_tests.id;


--
-- TOC entry 643 (class 1259 OID 19728)
-- Name: storefront_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.storefront_analytics (
    id integer NOT NULL,
    event_type character varying(100) NOT NULL,
    session_id character varying(255),
    user_id character varying(255),
    product_id integer,
    metadata jsonb,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.storefront_analytics OWNER TO neondb_owner;

--
-- TOC entry 642 (class 1259 OID 19727)
-- Name: storefront_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.storefront_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.storefront_analytics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8894 (class 0 OID 0)
-- Dependencies: 642
-- Name: storefront_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.storefront_analytics_id_seq OWNED BY public.storefront_analytics.id;


--
-- TOC entry 305 (class 1259 OID 17126)
-- Name: system_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.system_metrics (
    id integer NOT NULL,
    metric_name character varying(100) NOT NULL,
    value real NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    metadata text,
    source character varying(50) DEFAULT 'system'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_metrics OWNER TO neondb_owner;

--
-- TOC entry 304 (class 1259 OID 17125)
-- Name: system_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.system_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_metrics_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8895 (class 0 OID 0)
-- Dependencies: 304
-- Name: system_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.system_metrics_id_seq OWNED BY public.system_metrics.id;


--
-- TOC entry 691 (class 1259 OID 20152)
-- Name: task_routing_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.task_routing_history (
    id integer NOT NULL,
    task_id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_type character varying(100) NOT NULL,
    task_complexity character varying(20) NOT NULL,
    original_agent_id uuid NOT NULL,
    final_agent_id uuid NOT NULL,
    fallback_count integer DEFAULT 0 NOT NULL,
    routing_reason text NOT NULL,
    input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    total_cost real DEFAULT 0 NOT NULL,
    latency_ms integer NOT NULL,
    success boolean NOT NULL,
    error_message text,
    quality_score real,
    conversion_impact real,
    context_size integer DEFAULT 0 NOT NULL,
    parallel_routes jsonb DEFAULT '[]'::jsonb NOT NULL,
    executed_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.task_routing_history OWNER TO neondb_owner;

--
-- TOC entry 690 (class 1259 OID 20151)
-- Name: task_routing_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.task_routing_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_routing_history_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8896 (class 0 OID 0)
-- Dependencies: 690
-- Name: task_routing_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.task_routing_history_id_seq OWNED BY public.task_routing_history.id;


--
-- TOC entry 763 (class 1259 OID 20969)
-- Name: traffic_distribution; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.traffic_distribution (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    total_requests integer DEFAULT 0 NOT NULL,
    total_users integer DEFAULT 0 NOT NULL,
    average_response_time real DEFAULT 0 NOT NULL,
    global_error_rate real DEFAULT 0 NOT NULL,
    peak_concurrent_users integer DEFAULT 0 NOT NULL,
    bandwidth_utilization real DEFAULT 0 NOT NULL,
    distribution_efficiency real DEFAULT 0 NOT NULL,
    regions_data jsonb NOT NULL,
    geographic_spread jsonb NOT NULL,
    user_experience_score real DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.traffic_distribution OWNER TO neondb_owner;

--
-- TOC entry 321 (class 1259 OID 17235)
-- Name: translation_keys; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.translation_keys (
    id integer NOT NULL,
    key_path character varying(500) NOT NULL,
    category character varying(100) NOT NULL,
    context text,
    default_value text NOT NULL,
    interpolation_vars jsonb,
    is_plural boolean DEFAULT false,
    priority integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.translation_keys OWNER TO neondb_owner;

--
-- TOC entry 320 (class 1259 OID 17234)
-- Name: translation_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.translation_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.translation_keys_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8897 (class 0 OID 0)
-- Dependencies: 320
-- Name: translation_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.translation_keys_id_seq OWNED BY public.translation_keys.id;


--
-- TOC entry 323 (class 1259 OID 17250)
-- Name: translations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.translations (
    id integer NOT NULL,
    key_id integer,
    language_code character varying(10),
    translated_value text NOT NULL,
    is_auto_translated boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    quality integer DEFAULT 0,
    last_reviewed timestamp without time zone,
    reviewer_id character varying(255),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.translations OWNER TO neondb_owner;

--
-- TOC entry 322 (class 1259 OID 17249)
-- Name: translations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.translations_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8898 (class 0 OID 0)
-- Dependencies: 322
-- Name: translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.translations_id_seq OWNED BY public.translations.id;


--
-- TOC entry 385 (class 1259 OID 17712)
-- Name: travel_analytics_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_analytics_events (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    event_data jsonb,
    destination_id integer,
    offer_id integer,
    archetype_id integer,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    user_id character varying(255),
    page_slug character varying(255),
    referrer text,
    user_agent text,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_analytics_events OWNER TO neondb_owner;

--
-- TOC entry 384 (class 1259 OID 17711)
-- Name: travel_analytics_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_analytics_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_analytics_events_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8899 (class 0 OID 0)
-- Dependencies: 384
-- Name: travel_analytics_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_analytics_events_id_seq OWNED BY public.travel_analytics_events.id;


--
-- TOC entry 387 (class 1259 OID 17723)
-- Name: travel_archetypes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_archetypes (
    id integer NOT NULL,
    name text NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    characteristics jsonb,
    preferred_destinations jsonb,
    budget_range character varying(50),
    travel_style character varying(50),
    theme_colors jsonb,
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_archetypes OWNER TO neondb_owner;

--
-- TOC entry 386 (class 1259 OID 17722)
-- Name: travel_archetypes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_archetypes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_archetypes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8900 (class 0 OID 0)
-- Dependencies: 386
-- Name: travel_archetypes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_archetypes_id_seq OWNED BY public.travel_archetypes.id;


--
-- TOC entry 389 (class 1259 OID 17739)
-- Name: travel_articles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_articles (
    id integer NOT NULL,
    title text NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    excerpt text,
    featured_image text,
    author text DEFAULT 'Travel Expert'::text,
    read_time integer DEFAULT 5,
    tags jsonb,
    destinations jsonb,
    archetypes jsonb,
    is_published boolean DEFAULT false,
    published_at timestamp without time zone,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    meta_title text,
    meta_description text,
    keywords jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_articles OWNER TO neondb_owner;

--
-- TOC entry 388 (class 1259 OID 17738)
-- Name: travel_articles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_articles_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8901 (class 0 OID 0)
-- Dependencies: 388
-- Name: travel_articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_articles_id_seq OWNED BY public.travel_articles.id;


--
-- TOC entry 391 (class 1259 OID 17757)
-- Name: travel_content_sources; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_content_sources (
    id integer NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    source_type character varying(50) NOT NULL,
    selectors jsonb,
    last_scraped timestamp without time zone,
    scraping_enabled boolean DEFAULT true,
    priority integer DEFAULT 0,
    tags jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_content_sources OWNER TO neondb_owner;

--
-- TOC entry 390 (class 1259 OID 17756)
-- Name: travel_content_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_content_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_content_sources_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8902 (class 0 OID 0)
-- Dependencies: 390
-- Name: travel_content_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_content_sources_id_seq OWNED BY public.travel_content_sources.id;


--
-- TOC entry 393 (class 1259 OID 17770)
-- Name: travel_destinations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_destinations (
    id integer NOT NULL,
    name text NOT NULL,
    slug character varying(255) NOT NULL,
    country text NOT NULL,
    continent text NOT NULL,
    description text,
    short_description text,
    coordinates jsonb,
    featured_image text,
    gallery jsonb,
    best_time text,
    budget_range character varying(50),
    travel_time text,
    tags jsonb,
    visa_requirements text,
    currency character varying(10),
    language text,
    timezone character varying(50),
    safety_rating integer DEFAULT 5,
    popularity_score integer DEFAULT 0,
    is_hidden boolean DEFAULT false,
    is_trending boolean DEFAULT false,
    meta_title text,
    meta_description text,
    keywords jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_destinations OWNER TO neondb_owner;

--
-- TOC entry 392 (class 1259 OID 17769)
-- Name: travel_destinations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_destinations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_destinations_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8903 (class 0 OID 0)
-- Dependencies: 392
-- Name: travel_destinations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_destinations_id_seq OWNED BY public.travel_destinations.id;


--
-- TOC entry 395 (class 1259 OID 17787)
-- Name: travel_itineraries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_itineraries (
    id integer NOT NULL,
    title text NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    destinations jsonb NOT NULL,
    duration integer NOT NULL,
    budget jsonb,
    activities jsonb,
    tips jsonb,
    archetypes jsonb,
    difficulty character varying(20) DEFAULT 'easy'::character varying,
    season character varying(20),
    featured_image text,
    gallery jsonb,
    is_public boolean DEFAULT true,
    likes integer DEFAULT 0,
    saves integer DEFAULT 0,
    views integer DEFAULT 0,
    author_id character varying(255),
    meta_title text,
    meta_description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_itineraries OWNER TO neondb_owner;

--
-- TOC entry 394 (class 1259 OID 17786)
-- Name: travel_itineraries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_itineraries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_itineraries_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8904 (class 0 OID 0)
-- Dependencies: 394
-- Name: travel_itineraries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_itineraries_id_seq OWNED BY public.travel_itineraries.id;


--
-- TOC entry 397 (class 1259 OID 17805)
-- Name: travel_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_offers (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    offer_type character varying(50) NOT NULL,
    provider text NOT NULL,
    original_url text NOT NULL,
    affiliate_url text NOT NULL,
    price numeric(10,2),
    currency character varying(10) DEFAULT 'USD'::character varying,
    discount integer,
    valid_from timestamp without time zone,
    valid_to timestamp without time zone,
    destination_id integer,
    archetypes jsonb,
    tags jsonb,
    image text,
    priority integer DEFAULT 0,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_offers OWNER TO neondb_owner;

--
-- TOC entry 396 (class 1259 OID 17804)
-- Name: travel_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_offers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8905 (class 0 OID 0)
-- Dependencies: 396
-- Name: travel_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_offers_id_seq OWNED BY public.travel_offers.id;


--
-- TOC entry 399 (class 1259 OID 17821)
-- Name: travel_quiz_questions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_quiz_questions (
    id integer NOT NULL,
    quiz_type character varying(100) NOT NULL,
    question text NOT NULL,
    options jsonb NOT NULL,
    "order" integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_quiz_questions OWNER TO neondb_owner;

--
-- TOC entry 398 (class 1259 OID 17820)
-- Name: travel_quiz_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_quiz_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_quiz_questions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8906 (class 0 OID 0)
-- Dependencies: 398
-- Name: travel_quiz_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_quiz_questions_id_seq OWNED BY public.travel_quiz_questions.id;


--
-- TOC entry 401 (class 1259 OID 17832)
-- Name: travel_quiz_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_quiz_results (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    quiz_type character varying(100) NOT NULL,
    answers jsonb NOT NULL,
    result jsonb NOT NULL,
    archetype_id integer,
    destination_ids jsonb,
    confidence numeric(3,2) DEFAULT 0.00,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    user_id character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_quiz_results OWNER TO neondb_owner;

--
-- TOC entry 400 (class 1259 OID 17831)
-- Name: travel_quiz_results_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_quiz_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_quiz_results_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8907 (class 0 OID 0)
-- Dependencies: 400
-- Name: travel_quiz_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_quiz_results_id_seq OWNED BY public.travel_quiz_results.id;


--
-- TOC entry 403 (class 1259 OID 17844)
-- Name: travel_tools; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_tools (
    id integer NOT NULL,
    name text NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    tool_type character varying(50) NOT NULL,
    config jsonb,
    is_active boolean DEFAULT true,
    "order" integer DEFAULT 0,
    icon text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_tools OWNER TO neondb_owner;

--
-- TOC entry 402 (class 1259 OID 17843)
-- Name: travel_tools_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_tools_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8908 (class 0 OID 0)
-- Dependencies: 402
-- Name: travel_tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_tools_id_seq OWNED BY public.travel_tools.id;


--
-- TOC entry 405 (class 1259 OID 17859)
-- Name: travel_user_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.travel_user_sessions (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    archetype_id integer,
    preferences jsonb,
    wishlist jsonb,
    search_history jsonb,
    clicked_offers jsonb,
    quiz_results jsonb,
    device_info jsonb,
    location jsonb,
    is_active boolean DEFAULT true,
    last_activity timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.travel_user_sessions OWNER TO neondb_owner;

--
-- TOC entry 404 (class 1259 OID 17858)
-- Name: travel_user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.travel_user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_user_sessions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8909 (class 0 OID 0)
-- Dependencies: 404
-- Name: travel_user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.travel_user_sessions_id_seq OWNED BY public.travel_user_sessions.id;


--
-- TOC entry 621 (class 1259 OID 19518)
-- Name: user_data_control_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_data_control_requests (
    id integer NOT NULL,
    request_id character varying(100) NOT NULL,
    user_id character varying(255),
    email character varying(320),
    request_type character varying(50) NOT NULL,
    legal_basis character varying(100),
    description text,
    data_categories jsonb,
    verticals jsonb,
    date_range jsonb,
    status character varying(50) DEFAULT 'pending'::character varying,
    priority character varying(20) DEFAULT 'normal'::character varying,
    assigned_to character varying(255),
    verification_method character varying(100),
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    verification_attempts integer DEFAULT 0,
    verification_data jsonb,
    estimated_completion_date timestamp without time zone,
    actual_completion_date timestamp without time zone,
    processing_notes text,
    rejection_reason text,
    export_format character varying(50),
    export_file_size integer,
    export_url text,
    download_count integer DEFAULT 0,
    export_expires_at timestamp without time zone,
    follow_up_required boolean DEFAULT false,
    appealed boolean DEFAULT false,
    appeal_reason text,
    appeal_status character varying(50),
    response_time integer,
    sla_compliance boolean,
    audit_trail jsonb,
    notifications_sent jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_data_control_requests OWNER TO neondb_owner;

--
-- TOC entry 620 (class 1259 OID 19517)
-- Name: user_data_control_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_data_control_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_data_control_requests_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8910 (class 0 OID 0)
-- Dependencies: 620
-- Name: user_data_control_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_data_control_requests_id_seq OWNED BY public.user_data_control_requests.id;


--
-- TOC entry 747 (class 1259 OID 20743)
-- Name: user_emotion_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_emotion_tracking (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    country_code character varying(3) NOT NULL,
    detected_emotions jsonb NOT NULL,
    dominant_emotion character varying(100),
    emotion_intensity real DEFAULT 0.5,
    cultural_alignment real DEFAULT 0.5,
    behavior_context jsonb,
    device_type character varying(50),
    interaction_type character varying(100),
    time_on_page integer DEFAULT 0,
    emotion_confidence real DEFAULT 0.7,
    biometric_data jsonb,
    previous_emotions jsonb,
    cultural_modifiers jsonb,
    personalization_applied jsonb,
    conversion_probability real,
    optimization_suggestions jsonb,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_emotion_tracking OWNER TO neondb_owner;

--
-- TOC entry 746 (class 1259 OID 20742)
-- Name: user_emotion_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_emotion_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_emotion_tracking_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8911 (class 0 OID 0)
-- Dependencies: 746
-- Name: user_emotion_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_emotion_tracking_id_seq OWNED BY public.user_emotion_tracking.id;


--
-- TOC entry 307 (class 1259 OID 17138)
-- Name: user_experiment_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_experiment_assignments (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    experiment_id integer,
    variant_id integer,
    assigned_at timestamp without time zone DEFAULT now(),
    user_id character varying(255),
    device_fingerprint character varying(255),
    is_active boolean DEFAULT true
);


ALTER TABLE public.user_experiment_assignments OWNER TO neondb_owner;

--
-- TOC entry 306 (class 1259 OID 17137)
-- Name: user_experiment_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_experiment_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_experiment_assignments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8912 (class 0 OID 0)
-- Dependencies: 306
-- Name: user_experiment_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_experiment_assignments_id_seq OWNED BY public.user_experiment_assignments.id;


--
-- TOC entry 579 (class 1259 OID 19165)
-- Name: user_funnel_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_funnel_sessions (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    funnel_id integer,
    current_block_id integer,
    current_step integer DEFAULT 0,
    status character varying(50) DEFAULT 'active'::character varying,
    user_vector jsonb,
    emotion_state jsonb,
    device_info jsonb,
    geo_location jsonb,
    referral_source character varying(255),
    completed_blocks jsonb DEFAULT '[]'::jsonb,
    skipped_blocks jsonb DEFAULT '[]'::jsonb,
    block_responses jsonb DEFAULT '{}'::jsonb,
    assigned_variant character varying(100),
    personalization_applied jsonb,
    ai_recommendations jsonb,
    engagement_score real DEFAULT 0,
    conversion_score real DEFAULT 0,
    total_time_spent integer DEFAULT 0,
    started_at timestamp without time zone DEFAULT now(),
    last_activity_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    resume_token character varying(255),
    metadata jsonb
);


ALTER TABLE public.user_funnel_sessions OWNER TO neondb_owner;

--
-- TOC entry 578 (class 1259 OID 19164)
-- Name: user_funnel_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_funnel_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_funnel_sessions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8913 (class 0 OID 0)
-- Dependencies: 578
-- Name: user_funnel_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_funnel_sessions_id_seq OWNED BY public.user_funnel_sessions.id;


--
-- TOC entry 505 (class 1259 OID 18603)
-- Name: user_intent_vectors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_intent_vectors (
    id integer NOT NULL,
    user_id character varying(255),
    session_id character varying(255),
    fingerprint character varying(500),
    intent_vector jsonb NOT NULL,
    current_archetype character varying(100),
    intent_tags jsonb,
    behaviors jsonb,
    preferences jsonb,
    interaction_history jsonb,
    strength real DEFAULT 1,
    last_activity timestamp without time zone DEFAULT now(),
    decay_rate real DEFAULT 0.1,
    neuron_affinities jsonb,
    vertical_preferences jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_intent_vectors OWNER TO neondb_owner;

--
-- TOC entry 504 (class 1259 OID 18602)
-- Name: user_intent_vectors_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_intent_vectors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_intent_vectors_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8914 (class 0 OID 0)
-- Dependencies: 504
-- Name: user_intent_vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_intent_vectors_id_seq OWNED BY public.user_intent_vectors.id;


--
-- TOC entry 325 (class 1259 OID 17264)
-- Name: user_language_preferences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_language_preferences (
    id integer NOT NULL,
    session_id character varying(255),
    user_id character varying(255),
    preferred_language character varying(10),
    detected_language character varying(10),
    detection_method character varying(50),
    auto_detect boolean DEFAULT true,
    browser_languages jsonb,
    geo_location jsonb,
    is_manual_override boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_language_preferences OWNER TO neondb_owner;

--
-- TOC entry 324 (class 1259 OID 17263)
-- Name: user_language_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_language_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_language_preferences_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8915 (class 0 OID 0)
-- Dependencies: 324
-- Name: user_language_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_language_preferences_id_seq OWNED BY public.user_language_preferences.id;


--
-- TOC entry 754 (class 1259 OID 20830)
-- Name: user_layout_preferences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_layout_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    layout_id uuid NOT NULL,
    element_id character varying(255) NOT NULL,
    preferences json NOT NULL,
    preference_type character varying(50) NOT NULL,
    strength numeric(3,2) DEFAULT 1.00,
    source character varying(100) DEFAULT 'user_action'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_used timestamp without time zone DEFAULT now(),
    usage_count integer DEFAULT 1,
    effectiveness numeric(3,2)
);


ALTER TABLE public.user_layout_preferences OWNER TO neondb_owner;

--
-- TOC entry 539 (class 1259 OID 18875)
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_notification_preferences (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    session_id character varying(255),
    email character varying(255),
    email_enabled boolean DEFAULT true,
    sms_enabled boolean DEFAULT false,
    push_enabled boolean DEFAULT true,
    in_app_enabled boolean DEFAULT true,
    whatsapp_enabled boolean DEFAULT false,
    marketing_enabled boolean DEFAULT true,
    transactional_enabled boolean DEFAULT true,
    security_enabled boolean DEFAULT true,
    product_updates_enabled boolean DEFAULT true,
    frequency character varying(20) DEFAULT 'normal'::character varying,
    quiet_hours jsonb,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    personalization_level character varying(20) DEFAULT 'standard'::character varying,
    ai_optimization_enabled boolean DEFAULT true,
    consent_given boolean DEFAULT false,
    consent_date timestamp without time zone,
    gdpr_compliant boolean DEFAULT true,
    global_opt_out boolean DEFAULT false,
    opt_out_date timestamp without time zone,
    opt_out_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_notification_preferences OWNER TO neondb_owner;

--
-- TOC entry 538 (class 1259 OID 18874)
-- Name: user_notification_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_notification_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_notification_preferences_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8916 (class 0 OID 0)
-- Dependencies: 538
-- Name: user_notification_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_notification_preferences_id_seq OWNED BY public.user_notification_preferences.id;


--
-- TOC entry 309 (class 1259 OID 17149)
-- Name: user_profile_merge_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_profile_merge_history (
    id integer NOT NULL,
    master_profile_id integer,
    merged_profile_id integer,
    merged_session_ids jsonb,
    merge_reason character varying(100) NOT NULL,
    merge_confidence integer DEFAULT 0,
    merge_data jsonb,
    merged_at timestamp without time zone DEFAULT now(),
    merged_by character varying(255)
);


ALTER TABLE public.user_profile_merge_history OWNER TO neondb_owner;

--
-- TOC entry 308 (class 1259 OID 17148)
-- Name: user_profile_merge_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_profile_merge_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_profile_merge_history_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8917 (class 0 OID 0)
-- Dependencies: 308
-- Name: user_profile_merge_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_profile_merge_history_id_seq OWNED BY public.user_profile_merge_history.id;


--
-- TOC entry 311 (class 1259 OID 17160)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id character varying(255),
    start_time timestamp without time zone DEFAULT now() NOT NULL,
    last_activity timestamp without time zone DEFAULT now() NOT NULL,
    total_time_on_site integer DEFAULT 0,
    page_views integer DEFAULT 0,
    interactions integer DEFAULT 0,
    device_info jsonb,
    location jsonb,
    preferences jsonb,
    segment character varying(50) DEFAULT 'new_visitor'::character varying,
    personalization_flags jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_sessions OWNER TO neondb_owner;

--
-- TOC entry 310 (class 1259 OID 17159)
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8918 (class 0 OID 0)
-- Dependencies: 310
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- TOC entry 313 (class 1259 OID 17180)
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- TOC entry 312 (class 1259 OID 17179)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8919 (class 0 OID 0)
-- Dependencies: 312
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 507 (class 1259 OID 18617)
-- Name: vector_similarity_index; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.vector_similarity_index (
    id integer NOT NULL,
    node_id integer NOT NULL,
    similar_node_id integer NOT NULL,
    similarity real NOT NULL,
    algorithm character varying(50) DEFAULT 'cosine'::character varying,
    last_calculated timestamp without time zone DEFAULT now(),
    is_valid boolean DEFAULT true
);


ALTER TABLE public.vector_similarity_index OWNER TO neondb_owner;

--
-- TOC entry 506 (class 1259 OID 18616)
-- Name: vector_similarity_index_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.vector_similarity_index_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vector_similarity_index_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8920 (class 0 OID 0)
-- Dependencies: 506
-- Name: vector_similarity_index_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.vector_similarity_index_id_seq OWNED BY public.vector_similarity_index.id;


--
-- TOC entry 693 (class 1259 OID 20172)
-- Name: workflow_executions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.workflow_executions (
    id integer NOT NULL,
    execution_id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    current_step character varying(255),
    input jsonb NOT NULL,
    output jsonb,
    steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    errors jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_cost real DEFAULT 0 NOT NULL,
    total_tokens integer DEFAULT 0 NOT NULL,
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    triggered_by character varying(100) NOT NULL,
    user_id integer,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.workflow_executions OWNER TO neondb_owner;

--
-- TOC entry 692 (class 1259 OID 20171)
-- Name: workflow_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.workflow_executions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_executions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 8921 (class 0 OID 0)
-- Dependencies: 692
-- Name: workflow_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.workflow_executions_id_seq OWNED BY public.workflow_executions.id;


--
-- TOC entry 4649 (class 2604 OID 16480)
-- Name: affiliate_clicks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.affiliate_clicks ALTER COLUMN id SET DEFAULT nextval('public.affiliate_clicks_id_seq'::regclass);


--
-- TOC entry 5817 (class 2604 OID 19397)
-- Name: affiliate_compliance_management id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.affiliate_compliance_management ALTER COLUMN id SET DEFAULT nextval('public.affiliate_compliance_management_id_seq'::regclass);


--
-- TOC entry 4652 (class 2604 OID 16491)
-- Name: affiliate_networks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.affiliate_networks ALTER COLUMN id SET DEFAULT nextval('public.affiliate_networks_id_seq'::regclass);


--
-- TOC entry 4656 (class 2604 OID 16505)
-- Name: affiliate_offers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.affiliate_offers ALTER COLUMN id SET DEFAULT nextval('public.affiliate_offers_id_seq'::regclass);


--
-- TOC entry 5899 (class 2604 OID 19541)
-- Name: affiliate_partners id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.affiliate_partners ALTER COLUMN id SET DEFAULT nextval('public.affiliate_partners_id_seq'::regclass);


--
-- TOC entry 5914 (class 2604 OID 19566)
-- Name: affiliate_tracking id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.affiliate_tracking ALTER COLUMN id SET DEFAULT nextval('public.affiliate_tracking_id_seq'::regclass);


--
-- TOC entry 6114 (class 2604 OID 20010)
-- Name: agent_memories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agent_memories ALTER COLUMN id SET DEFAULT nextval('public.agent_memories_id_seq'::regclass);


--
-- TOC entry 6269 (class 2604 OID 20327)
-- Name: agent_rewards id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agent_rewards ALTER COLUMN id SET DEFAULT nextval('public.agent_rewards_id_seq'::regclass);


--
-- TOC entry 6122 (class 2604 OID 20028)
-- Name: agent_usage_tracking id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agent_usage_tracking ALTER COLUMN id SET DEFAULT nextval('public.agent_usage_tracking_id_seq'::regclass);


--
-- TOC entry 6129 (class 2604 OID 20045)
-- Name: agentic_workflows id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agentic_workflows ALTER COLUMN id SET DEFAULT nextval('public.agentic_workflows_id_seq'::regclass);


--
-- TOC entry 5339 (class 2604 OID 18255)
-- Name: ai_ml_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_ml_analytics ALTER COLUMN id SET DEFAULT nextval('public.ai_ml_analytics_id_seq'::regclass);


--
-- TOC entry 5348 (class 2604 OID 18272)
-- Name: ai_ml_audit_trail id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_ml_audit_trail ALTER COLUMN id SET DEFAULT nextval('public.ai_ml_audit_trail_id_seq'::regclass);


--
-- TOC entry 5351 (class 2604 OID 18285)
-- Name: ai_ml_experiments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_ml_experiments ALTER COLUMN id SET DEFAULT nextval('public.ai_ml_experiments_id_seq'::regclass);


--
-- TOC entry 5356 (class 2604 OID 18300)
-- Name: ai_ml_models id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_ml_models ALTER COLUMN id SET DEFAULT nextval('public.ai_ml_models_id_seq'::regclass);


--
-- TOC entry 4660 (class 2604 OID 16519)
-- Name: alert_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.alert_rules ALTER COLUMN id SET DEFAULT nextval('public.alert_rules_id_seq'::regclass);


--
-- TOC entry 4664 (class 2604 OID 16533)
-- Name: analytics_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analytics_events ALTER COLUMN id SET DEFAULT nextval('public.analytics_events_id_seq'::regclass);


--
-- TOC entry 4668 (class 2604 OID 16547)
-- Name: analytics_sync_status id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analytics_sync_status ALTER COLUMN id SET DEFAULT nextval('public.analytics_sync_status_id_seq'::regclass);


--
-- TOC entry 4675 (class 2604 OID 16562)
-- Name: api_neuron_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_neuron_analytics ALTER COLUMN id SET DEFAULT nextval('public.api_neuron_analytics_id_seq'::regclass);


--
-- TOC entry 4692 (class 2604 OID 16587)
-- Name: api_neuron_commands id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_neuron_commands ALTER COLUMN id SET DEFAULT nextval('public.api_neuron_commands_id_seq'::regclass);


--
-- TOC entry 4698 (class 2604 OID 16603)
-- Name: api_neuron_heartbeats id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_neuron_heartbeats ALTER COLUMN id SET DEFAULT nextval('public.api_neuron_heartbeats_id_seq'::regclass);


--
-- TOC entry 4700 (class 2604 OID 16613)
-- Name: api_only_neurons id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_only_neurons ALTER COLUMN id SET DEFAULT nextval('public.api_only_neurons_id_seq'::regclass);


--
-- TOC entry 6040 (class 2604 OID 19850)
-- Name: backups id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.backups ALTER COLUMN id SET DEFAULT nextval('public.backups_id_seq'::regclass);


--
-- TOC entry 4715 (class 2604 OID 16638)
-- Name: behavior_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.behavior_events ALTER COLUMN id SET DEFAULT nextval('public.behavior_events_id_seq'::regclass);


--
-- TOC entry 5733 (class 2604 OID 19187)
-- Name: codex_audits id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.codex_audits ALTER COLUMN id SET DEFAULT nextval('public.codex_audits_id_seq'::regclass);


--
-- TOC entry 5742 (class 2604 OID 19206)
-- Name: codex_fixes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.codex_fixes ALTER COLUMN id SET DEFAULT nextval('public.codex_fixes_id_seq'::regclass);


--
-- TOC entry 5748 (class 2604 OID 19222)
-- Name: codex_issues id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.codex_issues ALTER COLUMN id SET DEFAULT nextval('public.codex_issues_id_seq'::regclass);


--
-- TOC entry 5753 (class 2604 OID 19237)
-- Name: codex_learning id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.codex_learning ALTER COLUMN id SET DEFAULT nextval('public.codex_learning_id_seq'::regclass);


--
-- TOC entry 5759 (class 2604 OID 19253)
-- Name: codex_reports id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.codex_reports ALTER COLUMN id SET DEFAULT nextval('public.codex_reports_id_seq'::regclass);


--
-- TOC entry 5764 (class 2604 OID 19268)
-- Name: codex_schedules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.codex_schedules ALTER COLUMN id SET DEFAULT nextval('public.codex_schedules_id_seq'::regclass);


--
-- TOC entry 5825 (class 2604 OID 19413)
-- Name: compliance_audit_system id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.compliance_audit_system ALTER COLUMN id SET DEFAULT nextval('public.compliance_audit_system_id_seq'::regclass);


--
-- TOC entry 5838 (class 2604 OID 19436)
-- Name: compliance_rbac_management id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.compliance_rbac_management ALTER COLUMN id SET DEFAULT nextval('public.compliance_rbac_management_id_seq'::regclass);


--
-- TOC entry 5394 (class 2604 OID 18408)
-- Name: config_ai_metadata id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.config_ai_metadata ALTER COLUMN id SET DEFAULT nextval('public.config_ai_metadata_id_seq'::regclass);


--
-- TOC entry 5397 (class 2604 OID 18419)
-- Name: config_change_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.config_change_history ALTER COLUMN id SET DEFAULT nextval('public.config_change_history_id_seq'::regclass);


--
-- TOC entry 5402 (class 2604 OID 18432)
-- Name: config_federation_sync id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.config_federation_sync ALTER COLUMN id SET DEFAULT nextval('public.config_federation_sync_id_seq'::regclass);


--
-- TOC entry 5407 (class 2604 OID 18445)
-- Name: config_performance_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.config_performance_metrics ALTER COLUMN id SET DEFAULT nextval('public.config_performance_metrics_id_seq'::regclass);


--
-- TOC entry 5413 (class 2604 OID 18459)
-- Name: config_permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.config_permissions ALTER COLUMN id SET DEFAULT nextval('public.config_permissions_id_seq'::regclass);


--
-- TOC entry 5422 (class 2604 OID 18476)
-- Name: config_registry id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.config_registry ALTER COLUMN id SET DEFAULT nextval('public.config_registry_id_seq'::regclass);


--
-- TOC entry 5432 (class 2604 OID 18496)
-- Name: config_snapshots id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.config_snapshots ALTER COLUMN id SET DEFAULT nextval('public.config_snapshots_id_seq'::regclass);


--
-- TOC entry 5436 (class 2604 OID 18510)
-- Name: config_validation_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.config_validation_rules ALTER COLUMN id SET DEFAULT nextval('public.config_validation_rules_id_seq'::regclass);


--
-- TOC entry 6367 (class 2604 OID 20495)
-- Name: conflict_resolution_log id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conflict_resolution_log ALTER COLUMN id SET DEFAULT nextval('public.conflict_resolution_log_id_seq'::regclass);


--
-- TOC entry 5774 (class 2604 OID 19288)
-- Name: content_feed id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_feed ALTER COLUMN id SET DEFAULT nextval('public.content_feed_id_seq'::regclass);


--
-- TOC entry 5787 (class 2604 OID 19309)
-- Name: content_feed_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_feed_analytics ALTER COLUMN id SET DEFAULT nextval('public.content_feed_analytics_id_seq'::regclass);


--
-- TOC entry 5789 (class 2604 OID 19319)
-- Name: content_feed_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_feed_categories ALTER COLUMN id SET DEFAULT nextval('public.content_feed_categories_id_seq'::regclass);


--
-- TOC entry 5794 (class 2604 OID 19334)
-- Name: content_feed_interactions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_feed_interactions ALTER COLUMN id SET DEFAULT nextval('public.content_feed_interactions_id_seq'::regclass);


--
-- TOC entry 5796 (class 2604 OID 19344)
-- Name: content_feed_notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_feed_notifications ALTER COLUMN id SET DEFAULT nextval('public.content_feed_notifications_id_seq'::regclass);


--
-- TOC entry 5800 (class 2604 OID 19356)
-- Name: content_feed_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_feed_rules ALTER COLUMN id SET DEFAULT nextval('public.content_feed_rules_id_seq'::regclass);


--
-- TOC entry 5806 (class 2604 OID 19370)
-- Name: content_feed_sources id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_feed_sources ALTER COLUMN id SET DEFAULT nextval('public.content_feed_sources_id_seq'::regclass);


--
-- TOC entry 5811 (class 2604 OID 19383)
-- Name: content_feed_sync_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_feed_sync_logs ALTER COLUMN id SET DEFAULT nextval('public.content_feed_sync_logs_id_seq'::regclass);


--
-- TOC entry 5361 (class 2604 OID 18315)
-- Name: content_optimization_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_optimization_logs ALTER COLUMN id SET DEFAULT nextval('public.content_optimization_logs_id_seq'::regclass);


--
-- TOC entry 6000 (class 2604 OID 19742)
-- Name: cta_ab_tests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cta_ab_tests ALTER COLUMN id SET DEFAULT nextval('public.cta_ab_tests_id_seq'::regclass);


--
-- TOC entry 6006 (class 2604 OID 19758)
-- Name: cta_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cta_analytics ALTER COLUMN id SET DEFAULT nextval('public.cta_analytics_id_seq'::regclass);


--
-- TOC entry 6012 (class 2604 OID 19774)
-- Name: cta_assets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cta_assets ALTER COLUMN id SET DEFAULT nextval('public.cta_assets_id_seq'::regclass);


--
-- TOC entry 6019 (class 2604 OID 19791)
-- Name: cta_compliance id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cta_compliance ALTER COLUMN id SET DEFAULT nextval('public.cta_compliance_id_seq'::regclass);


--
-- TOC entry 6025 (class 2604 OID 19807)
-- Name: cta_instances id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cta_instances ALTER COLUMN id SET DEFAULT nextval('public.cta_instances_id_seq'::regclass);


--
-- TOC entry 6030 (class 2604 OID 19822)
-- Name: cta_templates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cta_templates ALTER COLUMN id SET DEFAULT nextval('public.cta_templates_id_seq'::regclass);


--
-- TOC entry 6036 (class 2604 OID 19838)
-- Name: cta_user_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cta_user_sessions ALTER COLUMN id SET DEFAULT nextval('public.cta_user_sessions_id_seq'::regclass);


--
-- TOC entry 6440 (class 2604 OID 20630)
-- Name: cultural_ab_tests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cultural_ab_tests ALTER COLUMN id SET DEFAULT nextval('public.cultural_ab_tests_id_seq'::regclass);


--
-- TOC entry 6447 (class 2604 OID 20647)
-- Name: cultural_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cultural_analytics ALTER COLUMN id SET DEFAULT nextval('public.cultural_analytics_id_seq'::regclass);


--
-- TOC entry 6461 (class 2604 OID 20669)
-- Name: cultural_feedback id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cultural_feedback ALTER COLUMN id SET DEFAULT nextval('public.cultural_feedback_id_seq'::regclass);


--
-- TOC entry 6469 (class 2604 OID 20687)
-- Name: cultural_mappings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cultural_mappings ALTER COLUMN id SET DEFAULT nextval('public.cultural_mappings_id_seq'::regclass);


--
-- TOC entry 6481 (class 2604 OID 20709)
-- Name: cultural_personalization_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cultural_personalization_rules ALTER COLUMN id SET DEFAULT nextval('public.cultural_personalization_rules_id_seq'::regclass);


--
-- TOC entry 5617 (class 2604 OID 18905)
-- Name: deep_link_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deep_link_analytics ALTER COLUMN id SET DEFAULT nextval('public.deep_link_analytics_id_seq'::regclass);


--
-- TOC entry 6048 (class 2604 OID 19868)
-- Name: deployment_audit id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deployment_audit ALTER COLUMN id SET DEFAULT nextval('public.deployment_audit_id_seq'::regclass);


--
-- TOC entry 6052 (class 2604 OID 19882)
-- Name: deployment_permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deployment_permissions ALTER COLUMN id SET DEFAULT nextval('public.deployment_permissions_id_seq'::regclass);


--
-- TOC entry 6060 (class 2604 OID 19898)
-- Name: deployment_steps id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deployment_steps ALTER COLUMN id SET DEFAULT nextval('public.deployment_steps_id_seq'::regclass);


--
-- TOC entry 6067 (class 2604 OID 19913)
-- Name: deployments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deployments ALTER COLUMN id SET DEFAULT nextval('public.deployments_id_seq'::regclass);


--
-- TOC entry 5620 (class 2604 OID 18916)
-- Name: device_capabilities id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.device_capabilities ALTER COLUMN id SET DEFAULT nextval('public.device_capabilities_id_seq'::regclass);


--
-- TOC entry 4718 (class 2604 OID 16649)
-- Name: device_fingerprints id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.device_fingerprints ALTER COLUMN id SET DEFAULT nextval('public.device_fingerprints_id_seq'::regclass);


--
-- TOC entry 6377 (class 2604 OID 20515)
-- Name: device_sync_state id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.device_sync_state ALTER COLUMN id SET DEFAULT nextval('public.device_sync_state_id_seq'::regclass);


--
-- TOC entry 5918 (class 2604 OID 19580)
-- Name: digital_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.digital_products ALTER COLUMN id SET DEFAULT nextval('public.digital_products_id_seq'::regclass);


--
-- TOC entry 6079 (class 2604 OID 19935)
-- Name: disaster_recovery_plans id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.disaster_recovery_plans ALTER COLUMN id SET DEFAULT nextval('public.disaster_recovery_plans_id_seq'::regclass);


--
-- TOC entry 6399 (class 2604 OID 20549)
-- Name: edge_ai_models id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.edge_ai_models ALTER COLUMN id SET DEFAULT nextval('public.edge_ai_models_id_seq'::regclass);


--
-- TOC entry 5187 (class 2604 OID 17877)
-- Name: education_ai_chat_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_ai_chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.education_ai_chat_sessions_id_seq'::regclass);


--
-- TOC entry 5197 (class 2604 OID 17897)
-- Name: education_archetypes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_archetypes ALTER COLUMN id SET DEFAULT nextval('public.education_archetypes_id_seq'::regclass);


--
-- TOC entry 5201 (class 2604 OID 17911)
-- Name: education_content id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_content ALTER COLUMN id SET DEFAULT nextval('public.education_content_id_seq'::regclass);


--
-- TOC entry 5211 (class 2604 OID 17931)
-- Name: education_daily_quests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_daily_quests ALTER COLUMN id SET DEFAULT nextval('public.education_daily_quests_id_seq'::regclass);


--
-- TOC entry 5216 (class 2604 OID 17944)
-- Name: education_gamification id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_gamification ALTER COLUMN id SET DEFAULT nextval('public.education_gamification_id_seq'::regclass);


--
-- TOC entry 5226 (class 2604 OID 17962)
-- Name: education_offers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_offers ALTER COLUMN id SET DEFAULT nextval('public.education_offers_id_seq'::regclass);


--
-- TOC entry 5236 (class 2604 OID 17982)
-- Name: education_paths id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_paths ALTER COLUMN id SET DEFAULT nextval('public.education_paths_id_seq'::regclass);


--
-- TOC entry 5246 (class 2604 OID 18002)
-- Name: education_progress id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_progress ALTER COLUMN id SET DEFAULT nextval('public.education_progress_id_seq'::regclass);


--
-- TOC entry 5255 (class 2604 OID 18019)
-- Name: education_quest_completions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_quest_completions ALTER COLUMN id SET DEFAULT nextval('public.education_quest_completions_id_seq'::regclass);


--
-- TOC entry 5260 (class 2604 OID 18032)
-- Name: education_quiz_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_quiz_results ALTER COLUMN id SET DEFAULT nextval('public.education_quiz_results_id_seq'::regclass);


--
-- TOC entry 5265 (class 2604 OID 18045)
-- Name: education_quizzes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_quizzes ALTER COLUMN id SET DEFAULT nextval('public.education_quizzes_id_seq'::regclass);


--
-- TOC entry 5275 (class 2604 OID 18065)
-- Name: education_tool_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_tool_sessions ALTER COLUMN id SET DEFAULT nextval('public.education_tool_sessions_id_seq'::regclass);


--
-- TOC entry 5279 (class 2604 OID 18077)
-- Name: education_tools id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.education_tools ALTER COLUMN id SET DEFAULT nextval('public.education_tools_id_seq'::regclass);


--
-- TOC entry 4726 (class 2604 OID 16667)
-- Name: email_campaigns id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_campaigns ALTER COLUMN id SET DEFAULT nextval('public.email_campaigns_id_seq'::regclass);


--
-- TOC entry 6490 (class 2604 OID 20728)
-- Name: emotion_profiles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.emotion_profiles ALTER COLUMN id SET DEFAULT nextval('public.emotion_profiles_id_seq'::regclass);


--
-- TOC entry 5365 (class 2604 OID 18329)
-- Name: empire_brain_config id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.empire_brain_config ALTER COLUMN id SET DEFAULT nextval('public.empire_brain_config_id_seq'::regclass);


--
-- TOC entry 4730 (class 2604 OID 16681)
-- Name: empire_config id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.empire_config ALTER COLUMN id SET DEFAULT nextval('public.empire_config_id_seq'::regclass);


--
-- TOC entry 4735 (class 2604 OID 16696)
-- Name: experiment_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experiment_events ALTER COLUMN id SET DEFAULT nextval('public.experiment_events_id_seq'::regclass);


--
-- TOC entry 4737 (class 2604 OID 16706)
-- Name: experiment_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experiment_results ALTER COLUMN id SET DEFAULT nextval('public.experiment_results_id_seq'::regclass);


--
-- TOC entry 4745 (class 2604 OID 16720)
-- Name: experiment_variants id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experiment_variants ALTER COLUMN id SET DEFAULT nextval('public.experiment_variants_id_seq'::regclass);


--
-- TOC entry 4750 (class 2604 OID 16733)
-- Name: experiments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experiments ALTER COLUMN id SET DEFAULT nextval('public.experiments_id_seq'::regclass);


--
-- TOC entry 6088 (class 2604 OID 19954)
-- Name: export_archives id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.export_archives ALTER COLUMN id SET DEFAULT nextval('public.export_archives_id_seq'::regclass);


--
-- TOC entry 4756 (class 2604 OID 16749)
-- Name: federation_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.federation_events ALTER COLUMN id SET DEFAULT nextval('public.federation_events_id_seq'::regclass);


--
-- TOC entry 6209 (class 2604 OID 20195)
-- Name: federation_memory_sync id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.federation_memory_sync ALTER COLUMN id SET DEFAULT nextval('public.federation_memory_sync_id_seq'::regclass);


--
-- TOC entry 6286 (class 2604 OID 20354)
-- Name: federation_rlhf_sync id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.federation_rlhf_sync ALTER COLUMN id SET DEFAULT nextval('public.federation_rlhf_sync_id_seq'::regclass);


--
-- TOC entry 6145 (class 2604 OID 20071)
-- Name: federation_tasks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.federation_tasks ALTER COLUMN id SET DEFAULT nextval('public.federation_tasks_id_seq'::regclass);


--
-- TOC entry 5058 (class 2604 OID 17570)
-- Name: finance_ai_chat_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_ai_chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.finance_ai_chat_sessions_id_seq'::regclass);


--
-- TOC entry 5065 (class 2604 OID 17587)
-- Name: finance_calculator_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_calculator_results ALTER COLUMN id SET DEFAULT nextval('public.finance_calculator_results_id_seq'::regclass);


--
-- TOC entry 5069 (class 2604 OID 17599)
-- Name: finance_content id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_content ALTER COLUMN id SET DEFAULT nextval('public.finance_content_id_seq'::regclass);


--
-- TOC entry 5080 (class 2604 OID 17620)
-- Name: finance_gamification id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_gamification ALTER COLUMN id SET DEFAULT nextval('public.finance_gamification_id_seq'::regclass);


--
-- TOC entry 5089 (class 2604 OID 17637)
-- Name: finance_lead_magnets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_lead_magnets ALTER COLUMN id SET DEFAULT nextval('public.finance_lead_magnets_id_seq'::regclass);


--
-- TOC entry 5095 (class 2604 OID 17651)
-- Name: finance_performance_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_performance_metrics ALTER COLUMN id SET DEFAULT nextval('public.finance_performance_metrics_id_seq'::regclass);


--
-- TOC entry 5110 (class 2604 OID 17674)
-- Name: finance_product_offers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_product_offers ALTER COLUMN id SET DEFAULT nextval('public.finance_product_offers_id_seq'::regclass);


--
-- TOC entry 5117 (class 2604 OID 17689)
-- Name: finance_profiles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_profiles ALTER COLUMN id SET DEFAULT nextval('public.finance_profiles_id_seq'::regclass);


--
-- TOC entry 5124 (class 2604 OID 17704)
-- Name: finance_quiz_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_quiz_results ALTER COLUMN id SET DEFAULT nextval('public.finance_quiz_results_id_seq'::regclass);


--
-- TOC entry 5676 (class 2604 OID 19062)
-- Name: funnel_ab_tests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funnel_ab_tests ALTER COLUMN id SET DEFAULT nextval('public.funnel_ab_tests_id_seq'::regclass);


--
-- TOC entry 5681 (class 2604 OID 19075)
-- Name: funnel_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funnel_analytics ALTER COLUMN id SET DEFAULT nextval('public.funnel_analytics_id_seq'::regclass);


--
-- TOC entry 5695 (class 2604 OID 19097)
-- Name: funnel_blocks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funnel_blocks ALTER COLUMN id SET DEFAULT nextval('public.funnel_blocks_id_seq'::regclass);


--
-- TOC entry 5701 (class 2604 OID 19113)
-- Name: funnel_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funnel_events ALTER COLUMN id SET DEFAULT nextval('public.funnel_events_id_seq'::regclass);


--
-- TOC entry 5703 (class 2604 OID 19123)
-- Name: funnel_integrations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funnel_integrations ALTER COLUMN id SET DEFAULT nextval('public.funnel_integrations_id_seq'::regclass);


--
-- TOC entry 5708 (class 2604 OID 19136)
-- Name: funnel_templates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funnel_templates ALTER COLUMN id SET DEFAULT nextval('public.funnel_templates_id_seq'::regclass);


--
-- TOC entry 5715 (class 2604 OID 19153)
-- Name: funnel_triggers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funnel_triggers ALTER COLUMN id SET DEFAULT nextval('public.funnel_triggers_id_seq'::regclass);


--
-- TOC entry 5852 (class 2604 OID 19458)
-- Name: geo_restriction_management id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.geo_restriction_management ALTER COLUMN id SET DEFAULT nextval('public.geo_restriction_management_id_seq'::regclass);


--
-- TOC entry 5862 (class 2604 OID 19478)
-- Name: global_consent_management id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.global_consent_management ALTER COLUMN id SET DEFAULT nextval('public.global_consent_management_id_seq'::regclass);


--
-- TOC entry 4781 (class 2604 OID 16817)
-- Name: global_user_profiles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.global_user_profiles ALTER COLUMN id SET DEFAULT nextval('public.global_user_profiles_id_seq'::regclass);


--
-- TOC entry 5442 (class 2604 OID 18526)
-- Name: graph_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.graph_analytics ALTER COLUMN id SET DEFAULT nextval('public.graph_analytics_id_seq'::regclass);


--
-- TOC entry 5445 (class 2604 OID 18537)
-- Name: graph_audit_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.graph_audit_results ALTER COLUMN id SET DEFAULT nextval('public.graph_audit_results_id_seq'::regclass);


--
-- TOC entry 4996 (class 2604 OID 17410)
-- Name: health_archetypes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_archetypes ALTER COLUMN id SET DEFAULT nextval('public.health_archetypes_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 17424)
-- Name: health_content id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_content ALTER COLUMN id SET DEFAULT nextval('public.health_content_id_seq'::regclass);


--
-- TOC entry 5006 (class 2604 OID 17440)
-- Name: health_content_performance id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_content_performance ALTER COLUMN id SET DEFAULT nextval('public.health_content_performance_id_seq'::regclass);


--
-- TOC entry 5015 (class 2604 OID 17455)
-- Name: health_daily_quests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_daily_quests ALTER COLUMN id SET DEFAULT nextval('public.health_daily_quests_id_seq'::regclass);


--
-- TOC entry 5022 (class 2604 OID 17472)
-- Name: health_gamification id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_gamification ALTER COLUMN id SET DEFAULT nextval('public.health_gamification_id_seq'::regclass);


--
-- TOC entry 5030 (class 2604 OID 17488)
-- Name: health_lead_magnets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_lead_magnets ALTER COLUMN id SET DEFAULT nextval('public.health_lead_magnets_id_seq'::regclass);


--
-- TOC entry 5036 (class 2604 OID 17504)
-- Name: health_quest_completions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_quest_completions ALTER COLUMN id SET DEFAULT nextval('public.health_quest_completions_id_seq'::regclass);


--
-- TOC entry 5041 (class 2604 OID 17517)
-- Name: health_quiz_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_quiz_results ALTER COLUMN id SET DEFAULT nextval('public.health_quiz_results_id_seq'::regclass);


--
-- TOC entry 5045 (class 2604 OID 17529)
-- Name: health_quizzes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_quizzes ALTER COLUMN id SET DEFAULT nextval('public.health_quizzes_id_seq'::regclass);


--
-- TOC entry 5050 (class 2604 OID 17544)
-- Name: health_tool_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_tool_sessions ALTER COLUMN id SET DEFAULT nextval('public.health_tool_sessions_id_seq'::regclass);


--
-- TOC entry 5053 (class 2604 OID 17555)
-- Name: health_tools id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_tools ALTER COLUMN id SET DEFAULT nextval('public.health_tools_id_seq'::regclass);


--
-- TOC entry 6093 (class 2604 OID 19969)
-- Name: import_operations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.import_operations ALTER COLUMN id SET DEFAULT nextval('public.import_operations_id_seq'::regclass);


--
-- TOC entry 6219 (class 2604 OID 20215)
-- Name: knowledge_graph_versions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.knowledge_graph_versions ALTER COLUMN id SET DEFAULT nextval('public.knowledge_graph_versions_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 17194)
-- Name: languages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.languages ALTER COLUMN id SET DEFAULT nextval('public.languages_id_seq'::regclass);


--
-- TOC entry 4793 (class 2604 OID 16843)
-- Name: lead_activities id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_activities ALTER COLUMN id SET DEFAULT nextval('public.lead_activities_id_seq'::regclass);


--
-- TOC entry 4795 (class 2604 OID 16853)
-- Name: lead_captures id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_captures ALTER COLUMN id SET DEFAULT nextval('public.lead_captures_id_seq'::regclass);


--
-- TOC entry 4800 (class 2604 OID 16866)
-- Name: lead_experiments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_experiments ALTER COLUMN id SET DEFAULT nextval('public.lead_experiments_id_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 16875)
-- Name: lead_form_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_form_assignments ALTER COLUMN id SET DEFAULT nextval('public.lead_form_assignments_id_seq'::regclass);


--
-- TOC entry 4807 (class 2604 OID 16885)
-- Name: lead_forms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_forms ALTER COLUMN id SET DEFAULT nextval('public.lead_forms_id_seq'::regclass);


--
-- TOC entry 4811 (class 2604 OID 16899)
-- Name: lead_magnets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_magnets ALTER COLUMN id SET DEFAULT nextval('public.lead_magnets_id_seq'::regclass);


--
-- TOC entry 5370 (class 2604 OID 18344)
-- Name: learning_cycles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.learning_cycles ALTER COLUMN id SET DEFAULT nextval('public.learning_cycles_id_seq'::regclass);


--
-- TOC entry 6155 (class 2604 OID 20091)
-- Name: llm_agents id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.llm_agents ALTER COLUMN id SET DEFAULT nextval('public.llm_agents_id_seq'::regclass);


--
-- TOC entry 4815 (class 2604 OID 16913)
-- Name: llm_insights id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.llm_insights ALTER COLUMN id SET DEFAULT nextval('public.llm_insights_id_seq'::regclass);


--
-- TOC entry 4819 (class 2604 OID 16927)
-- Name: llm_scheduling id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.llm_scheduling ALTER COLUMN id SET DEFAULT nextval('public.llm_scheduling_id_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 17213)
-- Name: localization_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.localization_analytics ALTER COLUMN id SET DEFAULT nextval('public.localization_analytics_id_seq'::regclass);


--
-- TOC entry 4925 (class 2604 OID 17225)
-- Name: localized_content_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.localized_content_assignments ALTER COLUMN id SET DEFAULT nextval('public.localized_content_assignments_id_seq'::regclass);


--
-- TOC entry 6225 (class 2604 OID 20231)
-- Name: memory_edges id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.memory_edges ALTER COLUMN id SET DEFAULT nextval('public.memory_edges_id_seq'::regclass);


--
-- TOC entry 6234 (class 2604 OID 20250)
-- Name: memory_nodes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.memory_nodes ALTER COLUMN id SET DEFAULT nextval('public.memory_nodes_id_seq'::regclass);


--
-- TOC entry 6250 (class 2604 OID 20278)
-- Name: memory_search_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.memory_search_sessions ALTER COLUMN id SET DEFAULT nextval('public.memory_search_sessions_id_seq'::regclass);


--
-- TOC entry 6257 (class 2604 OID 20295)
-- Name: memory_usage_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.memory_usage_analytics ALTER COLUMN id SET DEFAULT nextval('public.memory_usage_analytics_id_seq'::regclass);


--
-- TOC entry 4826 (class 2604 OID 16944)
-- Name: ml_models id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ml_models ALTER COLUMN id SET DEFAULT nextval('public.ml_models_id_seq'::regclass);


--
-- TOC entry 4832 (class 2604 OID 16960)
-- Name: ml_predictions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ml_predictions ALTER COLUMN id SET DEFAULT nextval('public.ml_predictions_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 16975)
-- Name: ml_training_data id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ml_training_data ALTER COLUMN id SET DEFAULT nextval('public.ml_training_data_id_seq'::regclass);


--
-- TOC entry 5624 (class 2604 OID 18928)
-- Name: mobile_app_configs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mobile_app_configs ALTER COLUMN id SET DEFAULT nextval('public.mobile_app_configs_id_seq'::regclass);


--
-- TOC entry 4843 (class 2604 OID 16989)
-- Name: model_performance_tracking id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.model_performance_tracking ALTER COLUMN id SET DEFAULT nextval('public.model_performance_tracking_id_seq'::regclass);


--
-- TOC entry 5373 (class 2604 OID 18357)
-- Name: model_training_jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.model_training_jobs ALTER COLUMN id SET DEFAULT nextval('public.model_training_jobs_id_seq'::regclass);


--
-- TOC entry 6105 (class 2604 OID 19991)
-- Name: multi_region_config id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.multi_region_config ALTER COLUMN id SET DEFAULT nextval('public.multi_region_config_id_seq'::regclass);


--
-- TOC entry 4847 (class 2604 OID 17001)
-- Name: neuron_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.neuron_analytics ALTER COLUMN id SET DEFAULT nextval('public.neuron_analytics_id_seq'::regclass);


--
-- TOC entry 4857 (class 2604 OID 17017)
-- Name: neuron_configs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.neuron_configs ALTER COLUMN id SET DEFAULT nextval('public.neuron_configs_id_seq'::regclass);


--
-- TOC entry 5378 (class 2604 OID 18372)
-- Name: neuron_data_pipelines id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.neuron_data_pipelines ALTER COLUMN id SET DEFAULT nextval('public.neuron_data_pipelines_id_seq'::regclass);


--
-- TOC entry 5482 (class 2604 OID 18630)
-- Name: neuron_offer_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.neuron_offer_assignments ALTER COLUMN id SET DEFAULT nextval('public.neuron_offer_assignments_id_seq'::regclass);


--
-- TOC entry 4860 (class 2604 OID 17028)
-- Name: neuron_status_updates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.neuron_status_updates ALTER COLUMN id SET DEFAULT nextval('public.neuron_status_updates_id_seq'::regclass);


--
-- TOC entry 4862 (class 2604 OID 17038)
-- Name: neurons id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.neurons ALTER COLUMN id SET DEFAULT nextval('public.neurons_id_seq'::regclass);


--
-- TOC entry 5540 (class 2604 OID 18766)
-- Name: notification_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_analytics ALTER COLUMN id SET DEFAULT nextval('public.notification_analytics_id_seq'::regclass);


--
-- TOC entry 5551 (class 2604 OID 18783)
-- Name: notification_campaigns id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_campaigns ALTER COLUMN id SET DEFAULT nextval('public.notification_campaigns_id_seq'::regclass);


--
-- TOC entry 5557 (class 2604 OID 18799)
-- Name: notification_channels id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_channels ALTER COLUMN id SET DEFAULT nextval('public.notification_channels_id_seq'::regclass);


--
-- TOC entry 5568 (class 2604 OID 18820)
-- Name: notification_queue id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_queue ALTER COLUMN id SET DEFAULT nextval('public.notification_queue_id_seq'::regclass);


--
-- TOC entry 5576 (class 2604 OID 18836)
-- Name: notification_templates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_templates ALTER COLUMN id SET DEFAULT nextval('public.notification_templates_id_seq'::regclass);


--
-- TOC entry 5587 (class 2604 OID 18857)
-- Name: notification_triggers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_triggers ALTER COLUMN id SET DEFAULT nextval('public.notification_triggers_id_seq'::regclass);


--
-- TOC entry 5488 (class 2604 OID 18644)
-- Name: offer_ai_optimization_queue id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_ai_optimization_queue ALTER COLUMN id SET DEFAULT nextval('public.offer_ai_optimization_queue_id_seq'::regclass);


--
-- TOC entry 5492 (class 2604 OID 18656)
-- Name: offer_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_analytics ALTER COLUMN id SET DEFAULT nextval('public.offer_analytics_id_seq'::regclass);


--
-- TOC entry 5494 (class 2604 OID 18666)
-- Name: offer_compliance_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_compliance_rules ALTER COLUMN id SET DEFAULT nextval('public.offer_compliance_rules_id_seq'::regclass);


--
-- TOC entry 5499 (class 2604 OID 18679)
-- Name: offer_experiments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_experiments ALTER COLUMN id SET DEFAULT nextval('public.offer_experiments_id_seq'::regclass);


--
-- TOC entry 5504 (class 2604 OID 18692)
-- Name: offer_feed id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_feed ALTER COLUMN id SET DEFAULT nextval('public.offer_feed_id_seq'::regclass);


--
-- TOC entry 5521 (class 2604 OID 18721)
-- Name: offer_personalization_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_personalization_rules ALTER COLUMN id SET DEFAULT nextval('public.offer_personalization_rules_id_seq'::regclass);


--
-- TOC entry 5527 (class 2604 OID 18735)
-- Name: offer_sources id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_sources ALTER COLUMN id SET DEFAULT nextval('public.offer_sources_id_seq'::regclass);


--
-- TOC entry 5533 (class 2604 OID 18751)
-- Name: offer_sync_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_sync_history ALTER COLUMN id SET DEFAULT nextval('public.offer_sync_history_id_seq'::regclass);


--
-- TOC entry 6408 (class 2604 OID 20568)
-- Name: offline_analytics_buffer id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offline_analytics_buffer ALTER COLUMN id SET DEFAULT nextval('public.offline_analytics_buffer_id_seq'::regclass);


--
-- TOC entry 6417 (class 2604 OID 20587)
-- Name: offline_content_cache id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offline_content_cache ALTER COLUMN id SET DEFAULT nextval('public.offline_content_cache_id_seq'::regclass);


--
-- TOC entry 5628 (class 2604 OID 18940)
-- Name: offline_queue id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offline_queue ALTER COLUMN id SET DEFAULT nextval('public.offline_queue_id_seq'::regclass);


--
-- TOC entry 6430 (class 2604 OID 20610)
-- Name: offline_sync_queue id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offline_sync_queue ALTER COLUMN id SET DEFAULT nextval('public.offline_sync_queue_id_seq'::regclass);


--
-- TOC entry 4870 (class 2604 OID 17056)
-- Name: orchestration_changes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orchestration_changes ALTER COLUMN id SET DEFAULT nextval('public.orchestration_changes_id_seq'::regclass);


--
-- TOC entry 4874 (class 2604 OID 17070)
-- Name: orchestration_runs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orchestration_runs ALTER COLUMN id SET DEFAULT nextval('public.orchestration_runs_id_seq'::regclass);


--
-- TOC entry 5934 (class 2604 OID 19606)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 4878 (class 2604 OID 17084)
-- Name: page_affiliate_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.page_affiliate_assignments ALTER COLUMN id SET DEFAULT nextval('public.page_affiliate_assignments_id_seq'::regclass);


--
-- TOC entry 4881 (class 2604 OID 17093)
-- Name: performance_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.performance_logs ALTER COLUMN id SET DEFAULT nextval('public.performance_logs_id_seq'::regclass);


--
-- TOC entry 6298 (class 2604 OID 20376)
-- Name: persona_evolution id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.persona_evolution ALTER COLUMN id SET DEFAULT nextval('public.persona_evolution_id_seq'::regclass);


--
-- TOC entry 6309 (class 2604 OID 20397)
-- Name: persona_profiles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.persona_profiles ALTER COLUMN id SET DEFAULT nextval('public.persona_profiles_id_seq'::regclass);


--
-- TOC entry 6331 (class 2604 OID 20429)
-- Name: persona_simulations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.persona_simulations ALTER COLUMN id SET DEFAULT nextval('public.persona_simulations_id_seq'::regclass);


--
-- TOC entry 5386 (class 2604 OID 18390)
-- Name: personalization_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.personalization_rules ALTER COLUMN id SET DEFAULT nextval('public.personalization_rules_id_seq'::regclass);


--
-- TOC entry 6623 (class 2604 OID 20991)
-- Name: plugin_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_analytics ALTER COLUMN id SET DEFAULT nextval('public.plugin_analytics_id_seq'::regclass);


--
-- TOC entry 6627 (class 2604 OID 21003)
-- Name: plugin_dependencies id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_dependencies ALTER COLUMN id SET DEFAULT nextval('public.plugin_dependencies_id_seq'::regclass);


--
-- TOC entry 6633 (class 2604 OID 21017)
-- Name: plugin_executions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_executions ALTER COLUMN id SET DEFAULT nextval('public.plugin_executions_id_seq'::regclass);


--
-- TOC entry 6640 (class 2604 OID 21034)
-- Name: plugin_instances id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_instances ALTER COLUMN id SET DEFAULT nextval('public.plugin_instances_id_seq'::regclass);


--
-- TOC entry 6649 (class 2604 OID 21053)
-- Name: plugin_manifests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_manifests ALTER COLUMN id SET DEFAULT nextval('public.plugin_manifests_id_seq'::regclass);


--
-- TOC entry 6659 (class 2604 OID 21073)
-- Name: plugin_marketplace id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_marketplace ALTER COLUMN id SET DEFAULT nextval('public.plugin_marketplace_id_seq'::regclass);


--
-- TOC entry 6670 (class 2604 OID 21094)
-- Name: plugin_reviews id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_reviews ALTER COLUMN id SET DEFAULT nextval('public.plugin_reviews_id_seq'::regclass);


--
-- TOC entry 5879 (class 2604 OID 19503)
-- Name: privacy_policy_management id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.privacy_policy_management ALTER COLUMN id SET DEFAULT nextval('public.privacy_policy_management_id_seq'::regclass);


--
-- TOC entry 5945 (class 2604 OID 19627)
-- Name: product_licenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_licenses ALTER COLUMN id SET DEFAULT nextval('public.product_licenses_id_seq'::regclass);


--
-- TOC entry 5953 (class 2604 OID 19645)
-- Name: product_reviews id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_reviews ALTER COLUMN id SET DEFAULT nextval('public.product_reviews_id_seq'::regclass);


--
-- TOC entry 5960 (class 2604 OID 19660)
-- Name: product_variants id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN id SET DEFAULT nextval('public.product_variants_id_seq'::regclass);


--
-- TOC entry 6679 (class 2604 OID 21113)
-- Name: profit_forecast_models id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.profit_forecast_models ALTER COLUMN id SET DEFAULT nextval('public.profit_forecast_models_id_seq'::regclass);


--
-- TOC entry 6692 (class 2604 OID 21136)
-- Name: profit_forecasts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.profit_forecasts ALTER COLUMN id SET DEFAULT nextval('public.profit_forecasts_id_seq'::regclass);


--
-- TOC entry 5966 (class 2604 OID 19674)
-- Name: promo_codes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.promo_codes ALTER COLUMN id SET DEFAULT nextval('public.promo_codes_id_seq'::regclass);


--
-- TOC entry 6262 (class 2604 OID 20310)
-- Name: prompt_optimizations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prompt_optimizations ALTER COLUMN id SET DEFAULT nextval('public.prompt_optimizations_id_seq'::regclass);


--
-- TOC entry 6169 (class 2604 OID 20115)
-- Name: prompt_templates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prompt_templates ALTER COLUMN id SET DEFAULT nextval('public.prompt_templates_id_seq'::regclass);


--
-- TOC entry 5634 (class 2604 OID 18954)
-- Name: push_personalization id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.push_personalization ALTER COLUMN id SET DEFAULT nextval('public.push_personalization_id_seq'::regclass);


--
-- TOC entry 5640 (class 2604 OID 18968)
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- TOC entry 5645 (class 2604 OID 18983)
-- Name: pwa_aso_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pwa_aso_metrics ALTER COLUMN id SET DEFAULT nextval('public.pwa_aso_metrics_id_seq'::regclass);


--
-- TOC entry 5649 (class 2604 OID 18995)
-- Name: pwa_config id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pwa_config ALTER COLUMN id SET DEFAULT nextval('public.pwa_config_id_seq'::regclass);


--
-- TOC entry 5655 (class 2604 OID 19009)
-- Name: pwa_installs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pwa_installs ALTER COLUMN id SET DEFAULT nextval('public.pwa_installs_id_seq'::regclass);


--
-- TOC entry 5659 (class 2604 OID 19021)
-- Name: pwa_notification_campaigns id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pwa_notification_campaigns ALTER COLUMN id SET DEFAULT nextval('public.pwa_notification_campaigns_id_seq'::regclass);


--
-- TOC entry 5666 (class 2604 OID 19036)
-- Name: pwa_performance_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pwa_performance_metrics ALTER COLUMN id SET DEFAULT nextval('public.pwa_performance_metrics_id_seq'::regclass);


--
-- TOC entry 5668 (class 2604 OID 19046)
-- Name: pwa_usage_stats id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pwa_usage_stats ALTER COLUMN id SET DEFAULT nextval('public.pwa_usage_stats_id_seq'::regclass);


--
-- TOC entry 4884 (class 2604 OID 17104)
-- Name: quiz_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quiz_results ALTER COLUMN id SET DEFAULT nextval('public.quiz_results_id_seq'::regclass);


--
-- TOC entry 5449 (class 2604 OID 18549)
-- Name: realtime_recommendations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.realtime_recommendations ALTER COLUMN id SET DEFAULT nextval('public.realtime_recommendations_id_seq'::regclass);


--
-- TOC entry 6696 (class 2604 OID 21150)
-- Name: revenue_split_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.revenue_split_analytics ALTER COLUMN id SET DEFAULT nextval('public.revenue_split_analytics_id_seq'::regclass);


--
-- TOC entry 6713 (class 2604 OID 21177)
-- Name: revenue_split_partners id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.revenue_split_partners ALTER COLUMN id SET DEFAULT nextval('public.revenue_split_partners_id_seq'::regclass);


--
-- TOC entry 6729 (class 2604 OID 21203)
-- Name: revenue_split_payouts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.revenue_split_payouts ALTER COLUMN id SET DEFAULT nextval('public.revenue_split_payouts_id_seq'::regclass);


--
-- TOC entry 6737 (class 2604 OID 21221)
-- Name: revenue_split_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.revenue_split_rules ALTER COLUMN id SET DEFAULT nextval('public.revenue_split_rules_id_seq'::regclass);


--
-- TOC entry 6743 (class 2604 OID 21237)
-- Name: revenue_split_transactions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.revenue_split_transactions ALTER COLUMN id SET DEFAULT nextval('public.revenue_split_transactions_id_seq'::regclass);


--
-- TOC entry 6343 (class 2604 OID 20451)
-- Name: rlhf_feedback id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rlhf_feedback ALTER COLUMN id SET DEFAULT nextval('public.rlhf_feedback_id_seq'::regclass);


--
-- TOC entry 6351 (class 2604 OID 20469)
-- Name: rlhf_training_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rlhf_training_sessions ALTER COLUMN id SET DEFAULT nextval('public.rlhf_training_sessions_id_seq'::regclass);


--
-- TOC entry 6181 (class 2604 OID 20137)
-- Name: router_learning id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.router_learning ALTER COLUMN id SET DEFAULT nextval('public.router_learning_id_seq'::regclass);


--
-- TOC entry 4946 (class 2604 OID 17280)
-- Name: saas_calculator_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saas_calculator_results ALTER COLUMN id SET DEFAULT nextval('public.saas_calculator_results_id_seq'::regclass);


--
-- TOC entry 4948 (class 2604 OID 17290)
-- Name: saas_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saas_categories ALTER COLUMN id SET DEFAULT nextval('public.saas_categories_id_seq'::regclass);


--
-- TOC entry 4953 (class 2604 OID 17305)
-- Name: saas_comparisons id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saas_comparisons ALTER COLUMN id SET DEFAULT nextval('public.saas_comparisons_id_seq'::regclass);


--
-- TOC entry 4961 (class 2604 OID 17323)
-- Name: saas_content id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saas_content ALTER COLUMN id SET DEFAULT nextval('public.saas_content_id_seq'::regclass);


--
-- TOC entry 4967 (class 2604 OID 17339)
-- Name: saas_deals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saas_deals ALTER COLUMN id SET DEFAULT nextval('public.saas_deals_id_seq'::regclass);


--
-- TOC entry 4975 (class 2604 OID 17355)
-- Name: saas_quiz_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saas_quiz_results ALTER COLUMN id SET DEFAULT nextval('public.saas_quiz_results_id_seq'::regclass);


--
-- TOC entry 4977 (class 2604 OID 17365)
-- Name: saas_reviews id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saas_reviews ALTER COLUMN id SET DEFAULT nextval('public.saas_reviews_id_seq'::regclass);


--
-- TOC entry 4982 (class 2604 OID 17378)
-- Name: saas_stacks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saas_stacks ALTER COLUMN id SET DEFAULT nextval('public.saas_stacks_id_seq'::regclass);


--
-- TOC entry 4988 (class 2604 OID 17392)
-- Name: saas_tools id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saas_tools ALTER COLUMN id SET DEFAULT nextval('public.saas_tools_id_seq'::regclass);


--
-- TOC entry 5454 (class 2604 OID 18562)
-- Name: semantic_edges id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.semantic_edges ALTER COLUMN id SET DEFAULT nextval('public.semantic_edges_id_seq'::regclass);


--
-- TOC entry 5463 (class 2604 OID 18579)
-- Name: semantic_nodes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.semantic_nodes ALTER COLUMN id SET DEFAULT nextval('public.semantic_nodes_id_seq'::regclass);


--
-- TOC entry 5470 (class 2604 OID 18596)
-- Name: semantic_search_queries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.semantic_search_queries ALTER COLUMN id SET DEFAULT nextval('public.semantic_search_queries_id_seq'::regclass);


--
-- TOC entry 4887 (class 2604 OID 17115)
-- Name: session_bridge id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_bridge ALTER COLUMN id SET DEFAULT nextval('public.session_bridge_id_seq'::regclass);


--
-- TOC entry 5978 (class 2604 OID 19696)
-- Name: shopping_carts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopping_carts ALTER COLUMN id SET DEFAULT nextval('public.shopping_carts_id_seq'::regclass);


--
-- TOC entry 5987 (class 2604 OID 19713)
-- Name: storefront_ab_tests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.storefront_ab_tests ALTER COLUMN id SET DEFAULT nextval('public.storefront_ab_tests_id_seq'::regclass);


--
-- TOC entry 5997 (class 2604 OID 19731)
-- Name: storefront_analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.storefront_analytics ALTER COLUMN id SET DEFAULT nextval('public.storefront_analytics_id_seq'::regclass);


--
-- TOC entry 4891 (class 2604 OID 17129)
-- Name: system_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_metrics ALTER COLUMN id SET DEFAULT nextval('public.system_metrics_id_seq'::regclass);


--
-- TOC entry 6189 (class 2604 OID 20155)
-- Name: task_routing_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_routing_history ALTER COLUMN id SET DEFAULT nextval('public.task_routing_history_id_seq'::regclass);


--
-- TOC entry 4930 (class 2604 OID 17238)
-- Name: translation_keys id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.translation_keys ALTER COLUMN id SET DEFAULT nextval('public.translation_keys_id_seq'::regclass);


--
-- TOC entry 4935 (class 2604 OID 17253)
-- Name: translations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.translations ALTER COLUMN id SET DEFAULT nextval('public.translations_id_seq'::regclass);


--
-- TOC entry 5127 (class 2604 OID 17715)
-- Name: travel_analytics_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_analytics_events ALTER COLUMN id SET DEFAULT nextval('public.travel_analytics_events_id_seq'::regclass);


--
-- TOC entry 5130 (class 2604 OID 17726)
-- Name: travel_archetypes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_archetypes ALTER COLUMN id SET DEFAULT nextval('public.travel_archetypes_id_seq'::regclass);


--
-- TOC entry 5134 (class 2604 OID 17742)
-- Name: travel_articles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_articles ALTER COLUMN id SET DEFAULT nextval('public.travel_articles_id_seq'::regclass);


--
-- TOC entry 5142 (class 2604 OID 17760)
-- Name: travel_content_sources id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_content_sources ALTER COLUMN id SET DEFAULT nextval('public.travel_content_sources_id_seq'::regclass);


--
-- TOC entry 5147 (class 2604 OID 17773)
-- Name: travel_destinations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_destinations ALTER COLUMN id SET DEFAULT nextval('public.travel_destinations_id_seq'::regclass);


--
-- TOC entry 5154 (class 2604 OID 17790)
-- Name: travel_itineraries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_itineraries ALTER COLUMN id SET DEFAULT nextval('public.travel_itineraries_id_seq'::regclass);


--
-- TOC entry 5162 (class 2604 OID 17808)
-- Name: travel_offers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_offers ALTER COLUMN id SET DEFAULT nextval('public.travel_offers_id_seq'::regclass);


--
-- TOC entry 5170 (class 2604 OID 17824)
-- Name: travel_quiz_questions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_quiz_questions ALTER COLUMN id SET DEFAULT nextval('public.travel_quiz_questions_id_seq'::regclass);


--
-- TOC entry 5173 (class 2604 OID 17835)
-- Name: travel_quiz_results id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_quiz_results ALTER COLUMN id SET DEFAULT nextval('public.travel_quiz_results_id_seq'::regclass);


--
-- TOC entry 5177 (class 2604 OID 17847)
-- Name: travel_tools id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_tools ALTER COLUMN id SET DEFAULT nextval('public.travel_tools_id_seq'::regclass);


--
-- TOC entry 5182 (class 2604 OID 17862)
-- Name: travel_user_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.travel_user_sessions ALTER COLUMN id SET DEFAULT nextval('public.travel_user_sessions_id_seq'::regclass);


--
-- TOC entry 5889 (class 2604 OID 19521)
-- Name: user_data_control_requests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_data_control_requests ALTER COLUMN id SET DEFAULT nextval('public.user_data_control_requests_id_seq'::regclass);


--
-- TOC entry 6498 (class 2604 OID 20746)
-- Name: user_emotion_tracking id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_emotion_tracking ALTER COLUMN id SET DEFAULT nextval('public.user_emotion_tracking_id_seq'::regclass);


--
-- TOC entry 4895 (class 2604 OID 17141)
-- Name: user_experiment_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_experiment_assignments ALTER COLUMN id SET DEFAULT nextval('public.user_experiment_assignments_id_seq'::regclass);


--
-- TOC entry 5722 (class 2604 OID 19168)
-- Name: user_funnel_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_funnel_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_funnel_sessions_id_seq'::regclass);


--
-- TOC entry 5472 (class 2604 OID 18606)
-- Name: user_intent_vectors id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_intent_vectors ALTER COLUMN id SET DEFAULT nextval('public.user_intent_vectors_id_seq'::regclass);


--
-- TOC entry 4941 (class 2604 OID 17267)
-- Name: user_language_preferences id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_language_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_language_preferences_id_seq'::regclass);


--
-- TOC entry 5598 (class 2604 OID 18878)
-- Name: user_notification_preferences id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_notification_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_notification_preferences_id_seq'::regclass);


--
-- TOC entry 4898 (class 2604 OID 17152)
-- Name: user_profile_merge_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_profile_merge_history ALTER COLUMN id SET DEFAULT nextval('public.user_profile_merge_history_id_seq'::regclass);


--
-- TOC entry 4901 (class 2604 OID 17163)
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- TOC entry 4911 (class 2604 OID 17183)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5478 (class 2604 OID 18620)
-- Name: vector_similarity_index id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vector_similarity_index ALTER COLUMN id SET DEFAULT nextval('public.vector_similarity_index_id_seq'::regclass);


--
-- TOC entry 6199 (class 2604 OID 20175)
-- Name: workflow_executions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.workflow_executions ALTER COLUMN id SET DEFAULT nextval('public.workflow_executions_id_seq'::regclass);


--
-- TOC entry 8073 (class 0 OID 16477)
-- Dependencies: 216
-- Data for Name: affiliate_clicks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.affiliate_clicks (id, offer_id, session_id, user_agent, ip_address, referrer_url, source_page, clicked_at, conversion_tracked, metadata) FROM stdin;
\.


--
-- TOC entry 8466 (class 0 OID 19394)
-- Dependencies: 609
-- Data for Name: affiliate_compliance_management; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.affiliate_compliance_management (id, network_name, network_type, network_id, allowed_countries, restricted_countries, restricted_regions, legal_frameworks, required_disclosures, disclosure_templates, disclosure_position, disclosure_languages, network_policies, commission_structure, cookie_duration, tracking_methods, compliance_checks, last_compliance_check, compliance_score, violation_history, status, contract_start, contract_end, auto_renewal, total_clicks, total_conversions, total_revenue, avg_epc, account_manager, support_email, technical_contact, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8075 (class 0 OID 16488)
-- Dependencies: 218
-- Data for Name: affiliate_networks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.affiliate_networks (id, slug, name, description, base_url, tracking_params, cookie_settings, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8077 (class 0 OID 16502)
-- Dependencies: 220
-- Data for Name: affiliate_offers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.affiliate_offers (id, network_id, slug, title, description, category, emotion, target_url, cta_text, commission, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8480 (class 0 OID 19538)
-- Dependencies: 623
-- Data for Name: affiliate_partners; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.affiliate_partners (id, partner_id, email, name, company, partner_type, commission_rate, custom_commissions, payout_method, payout_details, total_earnings, pending_earnings, paid_earnings, total_sales, total_clicks, conversion_rate, status, tier, allowed_products, cookie_duration, phone, website, social_profiles, tax_info, is_verified, created_at, updated_at, verified_at, last_activity_at) FROM stdin;
\.


--
-- TOC entry 8482 (class 0 OID 19563)
-- Dependencies: 625
-- Data for Name: affiliate_tracking; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.affiliate_tracking (id, partner_id, order_id, product_id, click_id, session_id, user_id, campaign, source, medium, content, sale_amount, commission_rate, commission_amount, commission_status, clicked_at, converted_at, conversion_type, ip_address, user_agent, country_code, device_type, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8534 (class 0 OID 20007)
-- Dependencies: 677
-- Data for Name: agent_memories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.agent_memories (id, memory_id, agent_id, task_type, prompt, response, context, embedding, tags, quality_score, usage_count, last_used, created_at, expires_at, metadata) FROM stdin;
\.


--
-- TOC entry 8566 (class 0 OID 20324)
-- Dependencies: 709
-- Data for Name: agent_rewards; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.agent_rewards (id, reward_id, agent_id, prompt_version, task_type, reward_score, performance_score, usage_count, success_rate, recent_performance, weekly_performance, overall_performance, persona_performance, device_performance, geo_performance, current_rank, routing_weight, is_active, last_training_run, training_data_count, model_version, last_updated, created_at, metadata) FROM stdin;
\.


--
-- TOC entry 8536 (class 0 OID 20025)
-- Dependencies: 679
-- Data for Name: agent_usage_tracking; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.agent_usage_tracking (id, tracking_id, agent_id, user_id, project_id, task_type, input_tokens, output_tokens, total_cost, latency_ms, success, executed_at, metadata) FROM stdin;
\.


--
-- TOC entry 8538 (class 0 OID 20042)
-- Dependencies: 681
-- Data for Name: agentic_workflows; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.agentic_workflows (id, workflow_id, name, description, category, definition, status, trigger, input_schema, output_schema, max_execution_time, retry_policy, cost_budget, execution_count, success_count, average_duration, average_cost, last_executed, created_by, version, created_at, updated_at, metadata) FROM stdin;
\.


--
-- TOC entry 8314 (class 0 OID 18252)
-- Dependencies: 457
-- Data for Name: ai_ml_analytics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_ml_analytics (id, date, vertical, neuron_id, model_type, metrics, predictions, correct_predictions, accuracy, revenue_impact, user_impact, optimizations_applied, rules_triggered, experiments_running, data_quality, system_health, created_at) FROM stdin;
1	2025-07-26 18:06:45.913	finance	finance	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:06:46.467236
2	2025-07-26 18:06:46.014	health	health	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:06:46.575235
3	2025-07-26 18:06:46.115	saas	saas	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:06:46.67968
4	2025-07-26 18:06:46.83	travel	travel	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:06:47.385581
5	2025-07-26 18:06:46.932	security	security	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:06:47.48554
6	2025-07-26 18:06:47.038	education	education	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:06:47.594417
7	2025-07-26 18:06:47.139	ai-tools	ai-tools	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:06:47.696968
8	2025-07-26 18:11:45.914	finance	finance	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:11:46.470621
9	2025-07-26 18:11:46.016	health	health	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:11:46.579666
10	2025-07-26 18:11:46.422	education	education	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:11:46.987663
11	2025-07-26 18:11:46.737	saas	saas	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:11:47.294526
12	2025-07-26 18:11:46.836	travel	travel	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:11:47.392286
13	2025-07-26 18:11:46.941	security	security	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:11:47.499913
14	2025-07-26 18:11:47.148	ai-tools	ai-tools	\N	{"traffic": {"sessions": 0, "pageViews": 0, "bounceRate": 0, "uniqueUsers": 0}, "engagement": {"contentViews": 0, "interactions": 0, "avgTimeOnSite": 0, "quizCompletions": 0}, "conversions": {"leads": 0, "revenue": 0, "conversionRate": 0, "affiliateClicks": 0}, "experiments": {"active": 0, "completed": 0, "winningVariants": 0}}	0	0	0.9999	0.00	0	0	0	0	0.9250	healthy	2025-07-26 18:11:47.709354
\.


--
-- TOC entry 8316 (class 0 OID 18269)
-- Dependencies: 459
-- Data for Name: ai_ml_audit_trail; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_ml_audit_trail (id, audit_id, action, entity_type, entity_id, user_id, session_id, old_value, new_value, change_reason, impact, is_automatic, learning_cycle_id, metadata, "timestamp") FROM stdin;
\.


--
-- TOC entry 8318 (class 0 OID 18282)
-- Dependencies: 461
-- Data for Name: ai_ml_experiments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_ml_experiments (id, experiment_id, name, description, type, vertical, model_id, hypothesis, variants, traffic_allocation, status, start_date, end_date, results, winner, confidence, significance, created_by, learning_cycle_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8320 (class 0 OID 18297)
-- Dependencies: 463
-- Data for Name: ai_ml_models; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_ml_models (id, model_id, model_type, name, description, version, weights, hyperparameters, architecture, training_data, performance, accuracy, is_active, is_production, training_start_time, training_end_time, deployed_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8290 (class 0 OID 18091)
-- Dependencies: 433
-- Data for Name: ai_tools; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools (id, name, slug, description, "shortDescription", website, logo, "categoryId", subcategories, "pricingModel", "priceFrom", "priceTo", "pricingDetails", features, "useCase", platforms, integrations, "apiAvailable", rating, "totalReviews", "launchDate", "lastUpdated", "isActive", "isFeatured", "trustScore", "metaTitle", "metaDescription", tags, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 8292 (class 0 OID 18109)
-- Dependencies: 435
-- Data for Name: ai_tools_analytics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_analytics (id, "sessionId", event, "toolId", "categoryId", "contentId", "offerId", "userArchetype", "deviceType", source, data, value, "timestamp") FROM stdin;
\.


--
-- TOC entry 8294 (class 0 OID 18118)
-- Dependencies: 437
-- Data for Name: ai_tools_archetypes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_archetypes (id, name, slug, description, icon, "primaryMotivation", "preferredFeatures", "uiPreferences", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 8296 (class 0 OID 18132)
-- Dependencies: 439
-- Data for Name: ai_tools_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_categories (id, name, slug, description, icon, "parentId", "sortOrder", "isActive", "createdAt") FROM stdin;
\.


--
-- TOC entry 8298 (class 0 OID 18145)
-- Dependencies: 441
-- Data for Name: ai_tools_comparisons; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_comparisons (id, title, slug, description, "toolIds", criteria, "overallWinner", "categoryWinners", "metaTitle", "metaDescription", views, "isPublished", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 8300 (class 0 OID 18159)
-- Dependencies: 443
-- Data for Name: ai_tools_content; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_content (id, title, slug, type, excerpt, content, "featuredImage", "relatedTools", categories, tags, "metaTitle", "metaDescription", "focusKeyword", views, "avgTimeOnPage", "bounceRate", status, "publishedAt", "isAiGenerated", "generationPrompt", "lastOptimized", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 8302 (class 0 OID 18176)
-- Dependencies: 445
-- Data for Name: ai_tools_experiments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_experiments (id, name, type, description, variants, "targetArchetypes", "targetPages", status, "startDate", "endDate", "participantCount", results, winner, confidence, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 8304 (class 0 OID 18188)
-- Dependencies: 447
-- Data for Name: ai_tools_leads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_leads (id, email, "sessionId", source, "leadMagnet", archetype, interests, experience, "quizTaken", "downloadsCount", "emailsOpened", "emailsClicked", "isSubscribed", "unsubscribedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 8306 (class 0 OID 18203)
-- Dependencies: 449
-- Data for Name: ai_tools_offers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_offers (id, "toolId", title, description, "offerType", "originalPrice", "offerPrice", "discountPercentage", "affiliateUrl", "affiliateNetwork", commission, "startDate", "endDate", "isActive", "isLimitedTime", clicks, conversions, revenue, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 8308 (class 0 OID 18218)
-- Dependencies: 451
-- Data for Name: ai_tools_quiz_results; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_quiz_results (id, "quizId", "sessionId", "userId", answers, "primaryArchetype", "secondaryArchetype", "recommendedCategories", "recommendedTools", "archetypeScores", "categoryScores", "completedAt") FROM stdin;
\.


--
-- TOC entry 8310 (class 0 OID 18227)
-- Dependencies: 453
-- Data for Name: ai_tools_quizzes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_quizzes (id, title, description, questions, "archetypeWeights", "categoryWeights", "isActive", "totalTaken", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 8312 (class 0 OID 18239)
-- Dependencies: 455
-- Data for Name: ai_tools_reviews; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_tools_reviews (id, "toolId", "userId", "sessionId", rating, title, content, pros, cons, "userArchetype", "useCase", "experienceLevel", verified, helpful, unhelpful, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 8079 (class 0 OID 16516)
-- Dependencies: 222
-- Data for Name: alert_rules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.alert_rules (id, rule_id, metric, threshold, operator, severity, actions, is_active, created_at, updated_at) FROM stdin;
1	high_cpu_usage	cpu_usage	85	greater_than	critical	["email","slack","auto_scale"]	t	2025-07-26 18:01:03.573423	2025-07-26 18:17:33.738
2	high_memory_usage	memory_usage	90	greater_than	critical	["email","slack","restart_service"]	t	2025-07-26 18:01:04.280304	2025-07-26 18:17:33.881
3	high_error_rate	error_rate	5	greater_than	warning	["email","log"]	t	2025-07-26 18:01:04.383636	2025-07-26 18:17:34.511
4	low_disk_space	disk_usage	95	greater_than	critical	["email","cleanup","alert_ops"]	t	2025-07-26 18:01:04.509296	2025-07-26 18:17:34.622
\.


--
-- TOC entry 8081 (class 0 OID 16530)
-- Dependencies: 224
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.analytics_events (id, event_id, session_id, global_user_id, device_fingerprint, event_type, event_category, event_action, event_label, event_value, page_slug, page_title, referrer_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content, device_type, browser_name, browser_version, operating_system, screen_resolution, language, timezone, ip_address, country, region, city, coordinates, custom_data, server_timestamp, client_timestamp, processing_delay, is_processed, batch_id, created_at) FROM stdin;
\.


--
-- TOC entry 8083 (class 0 OID 16544)
-- Dependencies: 226
-- Data for Name: analytics_sync_status; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.analytics_sync_status (id, session_id, global_user_id, last_sync_at, last_client_event_id, last_server_event_id, pending_event_count, sync_version, client_version, device_fingerprint, sync_errors, is_healthy, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8085 (class 0 OID 16559)
-- Dependencies: 228
-- Data for Name: api_neuron_analytics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_neuron_analytics (id, neuron_id, date, request_count, successful_requests, failed_requests, average_response_time, p95_response_time, p99_response_time, total_data_processed, error_rate, uptime, cpu_usage_avg, memory_usage_avg, disk_usage_avg, network_bytes_in, network_bytes_out, custom_metrics, alerts, events, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8087 (class 0 OID 16584)
-- Dependencies: 230
-- Data for Name: api_neuron_commands; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_neuron_commands (id, command_id, neuron_id, command_type, command_data, priority, status, issued_by, issued_at, sent_at, acknowledged_at, completed_at, failed_at, timeout_at, response, error_message, retry_count, max_retries, metadata) FROM stdin;
\.


--
-- TOC entry 8089 (class 0 OID 16600)
-- Dependencies: 232
-- Data for Name: api_neuron_heartbeats; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_neuron_heartbeats (id, neuron_id, status, health_score, uptime, process_id, host_info, system_metrics, application_metrics, dependency_status, error_log, warnings_log, performance_metrics, config_version, build_version, "timestamp") FROM stdin;
\.


--
-- TOC entry 8091 (class 0 OID 16610)
-- Dependencies: 234
-- Data for Name: api_only_neurons; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_only_neurons (id, neuron_id, name, type, language, version, base_url, healthcheck_endpoint, api_endpoints, authentication, capabilities, dependencies, resource_requirements, deployment_info, status, last_heartbeat, health_score, uptime, error_count, total_requests, successful_requests, average_response_time, last_error, alert_thresholds, auto_restart_enabled, max_restart_attempts, current_restart_attempts, last_restart_attempt, registered_at, api_key, metadata, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8612 (class 0 OID 20844)
-- Dependencies: 755
-- Data for Name: auto_scaling_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auto_scaling_events (id, region_id, scaling_action, trigger_metric, trigger_value, threshold_value, instances_before, instances_after, scaling_duration_seconds, cost_impact, performance_impact, prediction_accuracy, rollback_triggered, automation_confidence, created_at) FROM stdin;
\.


--
-- TOC entry 8516 (class 0 OID 19847)
-- Dependencies: 659
-- Data for Name: backups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.backups (id, backup_id, name, backup_type, scope, status, file_size, checksum, file_path, storage_location, retention_days, metadata, started_at, completed_at, created_by, created_at, expires_at, is_encrypted, encryption_key, compression_ratio, tags) FROM stdin;
\.


--
-- TOC entry 8093 (class 0 OID 16635)
-- Dependencies: 236
-- Data for Name: behavior_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.behavior_events (id, session_id, event_type, event_data, page_slug, "timestamp", user_id, created_at) FROM stdin;
\.


--
-- TOC entry 8438 (class 0 OID 19184)
-- Dependencies: 581
-- Data for Name: codex_audits; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.codex_audits (id, audit_id, audit_type, scope, target_path, status, priority, llm_provider, model_used, prompt_template, issues_found, issues_resolved, audit_score, started_at, completed_at, execution_time, triggered_by, audit_config, metadata, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8440 (class 0 OID 19203)
-- Dependencies: 583
-- Data for Name: codex_fixes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.codex_fixes (id, issue_id, fix_id, fix_type, fix_category, file_path, original_code, fixed_code, diff_patch, status, apply_method, requires_approval, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, commit_hash, branch_name, pull_request_url, can_rollback, rollback_data, rolled_back_at, tests_passed, validation_results, created_at, updated_at, applied_at) FROM stdin;
\.


--
-- TOC entry 8442 (class 0 OID 19219)
-- Dependencies: 585
-- Data for Name: codex_issues; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.codex_issues (id, audit_id, issue_id, category, severity, type, file_path, line_number, column_number, code_snippet, title, description, recommendation, status, resolution, ai_confidence, ai_reasoning, proposed_fix, fix_diff, fix_applied, impact_score, risk_level, created_at, updated_at, resolved_at) FROM stdin;
\.


--
-- TOC entry 8444 (class 0 OID 19234)
-- Dependencies: 587
-- Data for Name: codex_learning; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.codex_learning (id, learning_id, pattern_type, pattern_data, category, subcategory, neuron_scope, occurrence_count, success_rate, confidence, prevention_rule, improvement_suggestion, automation_opportunity, impact_score, priority_level, is_active, last_seen, evolution_stage, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8446 (class 0 OID 19250)
-- Dependencies: 589
-- Data for Name: codex_reports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.codex_reports (id, report_id, report_type, period, scope, start_date, end_date, report_data, summary, metrics, insights, recommendations, generated_by, generation_time, status, is_public, export_formats, distribution_list, last_distributed, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8448 (class 0 OID 19265)
-- Dependencies: 591
-- Data for Name: codex_schedules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.codex_schedules (id, schedule_id, name, description, audit_types, cron_expression, frequency, next_run, last_run, scope, filters, llm_config, audit_config, auto_fix_enabled, max_auto_fixes, is_active, last_successful_run, consecutive_failures, health_status, notify_on_completion, notify_on_failure, notification_channels, created_by, created_at, updated_at) FROM stdin;
1	schedule_1753552862187_5i32l3nze	Daily Security Audit	Daily security and compliance audit	["security", "compliance"]	0 2 * * *	daily	2025-07-26 19:01:02.187	\N	{"target": "global"}	\N	{"model": "gpt-4", "provider": "openai"}	\N	t	5	t	\N	0	healthy	f	t	["admin"]	\N	2025-07-26 18:01:02.238278	2025-07-26 18:01:02.238278
2	schedule_1753552862308_ywc4di2gd	Weekly Code Quality Audit	Weekly comprehensive code quality audit	["code", "performance"]	0 3 * * 1	weekly	2025-07-26 19:01:02.308	\N	{"target": "all_modules"}	\N	{"model": "gpt-4", "provider": "openai"}	\N	f	0	t	\N	0	healthy	f	t	["admin", "developers"]	\N	2025-07-26 18:01:02.359133	2025-07-26 18:01:02.359133
3	schedule_1753552862420_lfd6dsubm	SEO & Content Audit	Weekly SEO and content quality audit	["seo", "content", "ux"]	0 4 * * 3	weekly	2025-07-26 19:01:02.42	\N	{"target": "content_modules"}	\N	{"model": "gpt-4", "provider": "openai"}	\N	t	10	t	\N	0	healthy	f	t	["admin", "content_team"]	\N	2025-07-26 18:01:02.472292	2025-07-26 18:01:02.472292
\.


--
-- TOC entry 8468 (class 0 OID 19410)
-- Dependencies: 611
-- Data for Name: compliance_audit_system; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.compliance_audit_system (id, audit_id, audit_type, vertical, country, date_range, audit_criteria, status, started_at, completed_at, executed_by, automated_scan, overall_score, critical_issues, high_issues, medium_issues, low_issues, audit_findings, non_compliance_items, recommended_actions, risk_assessment, previous_audit_id, improvement_score, trend_analysis, remediation_plan, remediation_deadline, remediation_status, follow_up_required, next_audit_date, report_generated, report_url, report_format, stakeholders_notified, audit_framework, audit_standard, certification_impact, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8470 (class 0 OID 19433)
-- Dependencies: 613
-- Data for Name: compliance_rbac_management; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.compliance_rbac_management (id, user_id, role_id, role_name, permissions, vertical_access, country_access, data_access, role_type, access_level, can_view_pii, can_export_data, can_delete_data, can_manage_consent, session_timeout, ip_whitelist, require_mfa, last_login, failed_login_attempts, account_locked, is_delegated, delegated_by, delegation_reason, access_expires_at, access_log, actions_performed, data_accessed, compliance_training, status, granted_by, granted_at, revoked_by, revoked_at, revocation_reason, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8334 (class 0 OID 18405)
-- Dependencies: 477
-- Data for Name: config_ai_metadata; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.config_ai_metadata (id, config_id, prompt_snippets, rag_context, ai_assist_metadata, training_tags, training_examples, feedback_data, ai_generated_fields, confidence_scores, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 8336 (class 0 OID 18416)
-- Dependencies: 479
-- Data for Name: config_change_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.config_change_history (id, change_id, config_id, change_type, previous_version, new_version, previous_data, new_data, diff, reason, rollback_id, user_id, username, user_role, source, source_details, requires_approval, approved_by, approved_at, approval_notes, created_at) FROM stdin;
\.


--
-- TOC entry 8338 (class 0 OID 18429)
-- Dependencies: 481
-- Data for Name: config_federation_sync; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.config_federation_sync (id, sync_id, config_id, neuron_id, neuron_type, neuron_version, sync_type, sync_status, config_version, synced_data, overrides, conflicts, conflict_resolution, sync_duration, retry_count, last_error, sync_started_at, sync_completed_at, next_sync_at) FROM stdin;
\.


--
-- TOC entry 8340 (class 0 OID 18442)
-- Dependencies: 483
-- Data for Name: config_performance_metrics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.config_performance_metrics (id, metric_id, config_id, load_time, cache_hit_rate, validation_time, sync_time, access_count, update_count, error_count, memory_usage, cpu_usage, network_usage, environment, user_agent, region, recorded_at, day_bucket) FROM stdin;
1	b5a556c3-5f6c-48b4-bd81-30e266e52470	system	0	0	\N	\N	1	0	0	\N	\N	\N	development	\N	\N	2025-07-26 18:02:15.099493	2025-07-26
2	431f48a5-a5c5-479a-b86f-0aaf752ae38d	system	0	0	\N	\N	2	0	0	\N	\N	\N	development	\N	\N	2025-07-26 18:02:44.521148	2025-07-26
3	892875d5-e2fe-47bb-b27e-9277fa80f32b	system	0	0	\N	\N	3	0	0	\N	\N	\N	development	\N	\N	2025-07-26 18:03:14.493144	2025-07-26
4	08340269-96ac-438a-8787-799c56c394f1	system	0	0	\N	\N	4	0	0	\N	\N	\N	development	\N	\N	2025-