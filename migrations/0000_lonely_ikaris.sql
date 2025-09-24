CREATE TABLE "affiliate_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"offer_id" integer,
	"session_id" varchar(255),
	"user_agent" text,
	"ip_address" varchar(45),
	"referrer_url" text,
	"source_page" varchar(255),
	"clicked_at" timestamp DEFAULT now(),
	"conversion_tracked" boolean DEFAULT false,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "affiliate_networks" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"base_url" text NOT NULL,
	"tracking_params" jsonb,
	"cookie_settings" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "affiliate_networks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "affiliate_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"network_id" integer,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"emotion" varchar(50),
	"target_url" text NOT NULL,
	"cta_text" varchar(100),
	"commission" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "affiliate_offers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(36) NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"global_user_id" integer,
	"device_fingerprint" varchar(255),
	"event_type" varchar(100) NOT NULL,
	"event_category" varchar(100),
	"event_action" varchar(100),
	"event_label" varchar(255),
	"event_value" integer,
	"page_slug" varchar(255),
	"page_title" varchar(255),
	"referrer_url" text,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"utm_term" varchar(100),
	"utm_content" varchar(100),
	"device_type" varchar(50),
	"browser_name" varchar(50),
	"browser_version" varchar(50),
	"operating_system" varchar(50),
	"screen_resolution" varchar(50),
	"language" varchar(10),
	"timezone" varchar(50),
	"ip_address" varchar(45),
	"country" varchar(5),
	"region" varchar(100),
	"city" varchar(100),
	"coordinates" jsonb,
	"custom_data" jsonb,
	"server_timestamp" timestamp DEFAULT now(),
	"client_timestamp" timestamp,
	"processing_delay" integer,
	"is_processed" boolean DEFAULT false,
	"batch_id" varchar(36),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "analytics_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_sync_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"global_user_id" integer,
	"last_sync_at" timestamp DEFAULT now(),
	"last_client_event_id" varchar(36),
	"last_server_event_id" varchar(36),
	"pending_event_count" integer DEFAULT 0,
	"sync_version" varchar(10) DEFAULT '1.0',
	"client_version" varchar(20),
	"device_fingerprint" varchar(255),
	"sync_errors" jsonb,
	"is_healthy" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "behavior_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_data" jsonb,
	"page_slug" varchar(255),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "device_fingerprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" varchar(255) NOT NULL,
	"global_user_id" integer,
	"device_info" jsonb NOT NULL,
	"browser_info" jsonb NOT NULL,
	"hardware_info" jsonb,
	"network_info" jsonb,
	"confidence_score" integer DEFAULT 0,
	"session_count" integer DEFAULT 0,
	"first_seen" timestamp DEFAULT now(),
	"last_seen" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "device_fingerprints_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"lead_magnet_id" integer,
	"email_sequence" jsonb NOT NULL,
	"trigger_type" varchar(50) NOT NULL,
	"trigger_config" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "email_campaigns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "empire_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_key" varchar(255) NOT NULL,
	"config_value" jsonb NOT NULL,
	"description" text,
	"category" varchar(100),
	"is_secret" boolean DEFAULT false,
	"version" varchar(50) DEFAULT '1.0',
	"updated_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "empire_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "experiment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"experiment_id" integer,
	"variant_id" integer,
	"event_type" varchar(50) NOT NULL,
	"event_value" varchar(255),
	"page_slug" varchar(255),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar(255),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "experiment_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" integer,
	"variant_id" integer,
	"date" timestamp NOT NULL,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"bounces" integer DEFAULT 0,
	"unique_users" integer DEFAULT 0,
	"conversion_rate" varchar(10),
	"click_through_rate" varchar(10),
	"bounce_rate" varchar(10),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "experiment_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" integer,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"traffic_percentage" integer NOT NULL,
	"configuration" jsonb NOT NULL,
	"is_control" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"target_entity" varchar(255) NOT NULL,
	"traffic_allocation" integer DEFAULT 100,
	"status" varchar(20) DEFAULT 'draft',
	"start_date" timestamp,
	"end_date" timestamp,
	"created_by" varchar(255),
	"metadata" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "experiments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "federation_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"neuron_id" varchar(100),
	"event_type" varchar(100) NOT NULL,
	"event_data" jsonb,
	"initiated_by" varchar(255),
	"success" boolean DEFAULT true,
	"error_message" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" varchar(36) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"merged_from_sessions" jsonb,
	"total_sessions" integer DEFAULT 0,
	"total_page_views" integer DEFAULT 0,
	"total_interactions" integer DEFAULT 0,
	"total_time_on_site" integer DEFAULT 0,
	"first_visit" timestamp,
	"last_visit" timestamp,
	"preferred_device_type" varchar(50),
	"preferred_browser" varchar(50),
	"preferred_os" varchar(50),
	"location_data" jsonb,
	"preferences" jsonb,
	"segments" jsonb,
	"tags" jsonb,
	"custom_attributes" jsonb,
	"lifetime_value" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"lead_quality_score" integer DEFAULT 0,
	"engagement_score" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "global_user_profiles_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "global_user_profiles_email_unique" UNIQUE("email"),
	CONSTRAINT "global_user_profiles_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_capture_id" integer,
	"activity_type" varchar(50) NOT NULL,
	"activity_data" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"session_id" varchar(255),
	"page_slug" varchar(255),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "lead_captures" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"lead_form_id" integer,
	"lead_magnet_id" integer,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(20),
	"additional_data" jsonb,
	"source" varchar(100),
	"user_agent" text,
	"ip_address" varchar(45),
	"referrer_url" text,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"utm_term" varchar(100),
	"utm_content" varchar(100),
	"is_verified" boolean DEFAULT false,
	"is_delivered" boolean DEFAULT false,
	"delivered_at" timestamp,
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" integer,
	"lead_form_id" integer,
	"variant_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_form_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_form_id" integer,
	"page_slug" varchar(255),
	"position" varchar(50) NOT NULL,
	"priority" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"lead_magnet_id" integer,
	"form_type" varchar(50) NOT NULL,
	"trigger_config" jsonb,
	"form_fields" jsonb NOT NULL,
	"styling" jsonb,
	"emotion" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "lead_forms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lead_magnets" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"delivery_method" varchar(50) NOT NULL,
	"delivery_url" text,
	"delivery_config" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "lead_magnets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "llm_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"insight_id" varchar(36) NOT NULL,
	"llm_provider" varchar(100) NOT NULL,
	"llm_model" varchar(100) NOT NULL,
	"insight_type" varchar(100) NOT NULL,
	"analysis_scope" varchar(100),
	"target_entity" varchar(255),
	"prompt" text NOT NULL,
	"response" text NOT NULL,
	"insights" jsonb NOT NULL,
	"suggestions" jsonb,
	"confidence" integer,
	"data_references" jsonb,
	"token_usage" jsonb,
	"processing_time" integer,
	"status" varchar(50) DEFAULT 'generated',
	"implemented_change_ids" jsonb,
	"reviewed_by" varchar(255),
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "llm_insights_insight_id_unique" UNIQUE("insight_id")
);
--> statement-breakpoint
CREATE TABLE "llm_scheduling" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_name" varchar(255) NOT NULL,
	"frequency" varchar(50) NOT NULL,
	"analysis_type" varchar(100) NOT NULL,
	"scope" varchar(100),
	"trigger_conditions" jsonb,
	"llm_config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"run_count" integer DEFAULT 0,
	"success_count" integer DEFAULT 0,
	"failure_count" integer DEFAULT 0,
	"average_execution_time" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "llm_scheduling_schedule_name_unique" UNIQUE("schedule_name")
);
--> statement-breakpoint
CREATE TABLE "ml_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" varchar(50) NOT NULL,
	"type" varchar(100) NOT NULL,
	"algorithm" varchar(100) NOT NULL,
	"purpose" text NOT NULL,
	"features" jsonb NOT NULL,
	"hyperparameters" jsonb,
	"performance" jsonb,
	"training_data" jsonb,
	"model_path" text,
	"is_active" boolean DEFAULT true,
	"is_production" boolean DEFAULT false,
	"trained_at" timestamp,
	"deployed_at" timestamp,
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ml_models_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ml_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"prediction_id" varchar(36) NOT NULL,
	"model_id" integer,
	"input_features" jsonb NOT NULL,
	"prediction" jsonb NOT NULL,
	"confidence" integer NOT NULL,
	"actual_outcome" jsonb,
	"source_entity" varchar(255),
	"source_type" varchar(100),
	"orchestration_run_id" varchar(255),
	"was_implemented" boolean DEFAULT false,
	"implemented_at" timestamp,
	"feedback_received" boolean DEFAULT false,
	"feedback_data" jsonb,
	"is_correct" boolean,
	"prediction_accuracy" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ml_predictions_prediction_id_unique" UNIQUE("prediction_id")
);
--> statement-breakpoint
CREATE TABLE "ml_training_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"dataset_name" varchar(255) NOT NULL,
	"model_type" varchar(100) NOT NULL,
	"features" jsonb NOT NULL,
	"labels" jsonb NOT NULL,
	"source_entity" varchar(255),
	"source_type" varchar(100),
	"performance_metrics" jsonb,
	"context_data" jsonb,
	"is_validated" boolean DEFAULT false,
	"is_outlier" boolean DEFAULT false,
	"confidence_score" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "model_performance_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer,
	"evaluation_date" timestamp DEFAULT now(),
	"evaluation_type" varchar(50) NOT NULL,
	"dataset_size" integer,
	"metrics" jsonb NOT NULL,
	"confusion_matrix" jsonb,
	"feature_importance" jsonb,
	"prediction_distribution" jsonb,
	"drift_detection" jsonb,
	"performance_change" jsonb,
	"is_production_ready" boolean DEFAULT false,
	"recommended_actions" jsonb,
	"evaluated_by" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "neuron_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"neuron_id" varchar(100),
	"date" timestamp NOT NULL,
	"page_views" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" varchar(20) DEFAULT '0',
	"uptime" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"average_response_time" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "neuron_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"neuron_id" varchar(100),
	"config_version" varchar(50) NOT NULL,
	"config_data" jsonb NOT NULL,
	"deployed_at" timestamp,
	"is_active" boolean DEFAULT false,
	"deployed_by" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "neuron_status_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"neuron_id" varchar(100),
	"status" varchar(50) NOT NULL,
	"health_score" integer,
	"uptime" integer,
	"stats" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "neurons" (
	"id" serial PRIMARY KEY NOT NULL,
	"neuron_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"version" varchar(50),
	"supported_features" jsonb,
	"last_check_in" timestamp,
	"health_score" integer DEFAULT 100,
	"uptime" integer DEFAULT 0,
	"registered_at" timestamp DEFAULT now(),
	"api_key" varchar(255) NOT NULL,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "neurons_neuron_id_unique" UNIQUE("neuron_id")
);
--> statement-breakpoint
CREATE TABLE "orchestration_changes" (
	"id" serial PRIMARY KEY NOT NULL,
	"change_id" varchar(255) NOT NULL,
	"orchestration_run_id" varchar(255) NOT NULL,
	"change_type" varchar(100) NOT NULL,
	"target_entity" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"reason" text NOT NULL,
	"ml_prediction_id" varchar(36),
	"confidence" integer NOT NULL,
	"expected_impact" jsonb,
	"actual_impact" jsonb,
	"status" varchar(50) NOT NULL,
	"applied_at" timestamp,
	"rolled_back_at" timestamp,
	"rollback_reason" text,
	"is_reversible" boolean DEFAULT true,
	"reverse_change_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orchestration_changes_change_id_unique" UNIQUE("change_id")
);
--> statement-breakpoint
CREATE TABLE "orchestration_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"trigger_type" varchar(50) NOT NULL,
	"triggered_by" varchar(255),
	"orchestration_config" jsonb NOT NULL,
	"analytics_snapshot" jsonb,
	"models_used" jsonb,
	"changes_proposed" jsonb,
	"changes_applied" jsonb,
	"changes_rejected" jsonb,
	"approval_status" varchar(50) DEFAULT 'auto_approved',
	"approved_by" varchar(255),
	"approved_at" timestamp,
	"backup_id" varchar(255),
	"performance_metrics" jsonb,
	"ml_confidence" integer,
	"error_log" text,
	"execution_time" integer,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "orchestration_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "page_affiliate_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_slug" varchar(255) NOT NULL,
	"offer_id" integer,
	"position" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quiz_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"quiz_id" varchar(255) NOT NULL,
	"answers" jsonb NOT NULL,
	"score" integer NOT NULL,
	"result" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_bridge" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"global_user_id" integer,
	"device_fingerprint" varchar(255),
	"link_method" varchar(50) NOT NULL,
	"link_confidence" integer DEFAULT 0,
	"link_data" jsonb,
	"linked_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "session_bridge_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "user_experiment_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"experiment_id" integer,
	"variant_id" integer,
	"assigned_at" timestamp DEFAULT now(),
	"user_id" varchar(255),
	"device_fingerprint" varchar(255),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "user_profile_merge_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"master_profile_id" integer,
	"merged_profile_id" integer,
	"merged_session_ids" jsonb,
	"merge_reason" varchar(100) NOT NULL,
	"merge_confidence" integer DEFAULT 0,
	"merge_data" jsonb,
	"merged_at" timestamp DEFAULT now(),
	"merged_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"start_time" timestamp DEFAULT now() NOT NULL,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"total_time_on_site" integer DEFAULT 0,
	"page_views" integer DEFAULT 0,
	"interactions" integer DEFAULT 0,
	"device_info" jsonb,
	"location" jsonb,
	"preferences" jsonb,
	"segment" varchar(50) DEFAULT 'new_visitor',
	"personalization_flags" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"native_name" varchar(100) NOT NULL,
	"direction" varchar(3) DEFAULT 'ltr',
	"region" varchar(10),
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"fallback_language" varchar(10) DEFAULT 'en',
	"completeness" integer DEFAULT 0,
	"auto_translate" boolean DEFAULT true,
	"custom_settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "languages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "localization_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"language_code" varchar(10) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"content_type" varchar(100),
	"content_id" varchar(255),
	"key_path" varchar(500),
	"fallback_used" boolean DEFAULT false,
	"translation_quality" integer,
	"user_feedback" jsonb,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "localized_content_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"content_id" varchar(255) NOT NULL,
	"language_code" varchar(10),
	"translation_keys" jsonb NOT NULL,
	"custom_translations" jsonb,
	"seo_settings" jsonb,
	"routing_settings" jsonb,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "translation_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_path" varchar(500) NOT NULL,
	"category" varchar(100) NOT NULL,
	"context" text,
	"default_value" text NOT NULL,
	"interpolation_vars" jsonb,
	"is_plural" boolean DEFAULT false,
	"priority" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "translation_keys_key_path_unique" UNIQUE("key_path")
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_id" integer,
	"language_code" varchar(10),
	"translated_value" text NOT NULL,
	"is_auto_translated" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"quality" integer DEFAULT 0,
	"last_reviewed" timestamp,
	"reviewer_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_language_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255),
	"user_id" varchar(255),
	"preferred_language" varchar(10),
	"detected_language" varchar(10),
	"detection_method" varchar(50),
	"auto_detect" boolean DEFAULT true,
	"browser_languages" jsonb,
	"geo_location" jsonb,
	"is_manual_override" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saas_calculator_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"calculator_type" varchar(100) NOT NULL,
	"inputs" jsonb NOT NULL,
	"results" jsonb NOT NULL,
	"tools_compared" jsonb,
	"recommendations" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saas_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(100),
	"parent_category" varchar(100),
	"tool_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "saas_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "saas_comparisons" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(255) NOT NULL,
	"tool_a" integer,
	"tool_b" integer,
	"category" varchar(100),
	"comparison_matrix" jsonb,
	"verdict" text,
	"votes_a" integer DEFAULT 0,
	"votes_b" integer DEFAULT 0,
	"total_votes" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "saas_comparisons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "saas_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"category" varchar(100),
	"featured_tools" jsonb,
	"tags" jsonb,
	"meta_title" varchar(255),
	"meta_description" text,
	"og_image" text,
	"read_time" integer,
	"views" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "saas_content_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "saas_deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_id" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"deal_type" varchar(100) NOT NULL,
	"original_price" numeric(10, 2),
	"deal_price" numeric(10, 2),
	"discount_percent" integer,
	"deal_url" text NOT NULL,
	"coupon_code" varchar(100),
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saas_quiz_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"quiz_type" varchar(100) NOT NULL,
	"answers" jsonb NOT NULL,
	"persona" varchar(100),
	"recommended_tools" jsonb,
	"recommended_stack" jsonb,
	"budget" jsonb,
	"priorities" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saas_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_id" integer,
	"session_id" varchar(255),
	"user_id" varchar(255),
	"rating" integer NOT NULL,
	"title" varchar(255),
	"content" text,
	"pros" jsonb,
	"cons" jsonb,
	"use_case" varchar(100),
	"user_role" varchar(100),
	"company_size" varchar(100),
	"is_verified" boolean DEFAULT false,
	"is_published" boolean DEFAULT false,
	"helpful_votes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saas_stacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255),
	"user_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"description" text,
	"persona" varchar(100),
	"tools" jsonb NOT NULL,
	"total_cost" jsonb,
	"is_public" boolean DEFAULT false,
	"likes" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saas_tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"sub_category" varchar(100),
	"website" text NOT NULL,
	"affiliate_url" text,
	"logo" text,
	"screenshots" jsonb,
	"pricing" jsonb NOT NULL,
	"features" jsonb NOT NULL,
	"pros" jsonb,
	"cons" jsonb,
	"rating" numeric(3, 2) DEFAULT '0',
	"review_count" integer DEFAULT 0,
	"alternatives" jsonb,
	"integrations" jsonb,
	"target_users" jsonb,
	"tags" jsonb,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"deal_active" boolean DEFAULT false,
	"deal_description" text,
	"deal_expiry" timestamp,
	"affiliate_commission" numeric(5, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "saas_tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health_archetypes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"characteristics" jsonb,
	"emotion_mapping" varchar(50),
	"color_scheme" jsonb,
	"preferred_tools" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "health_archetypes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"category" varchar(100),
	"content_type" varchar(50),
	"target_archetype" varchar(100),
	"emotion_tone" varchar(50),
	"reading_time" integer DEFAULT 5,
	"seo_title" varchar(255),
	"seo_description" text,
	"tags" jsonb,
	"sources" jsonb,
	"is_generated" boolean DEFAULT false,
	"published_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "health_content_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health_content_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer,
	"date" date NOT NULL,
	"views" integer DEFAULT 0,
	"unique_views" integer DEFAULT 0,
	"average_time_on_page" integer DEFAULT 0,
	"bounce_rate" real DEFAULT 0,
	"cta_clicks" integer DEFAULT 0,
	"lead_captures" integer DEFAULT 0,
	"social_shares" integer DEFAULT 0,
	"archetype" varchar(100),
	"traffic_source" varchar(100),
	"device_type" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health_daily_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"xp_reward" integer DEFAULT 10,
	"difficulty_level" varchar(20) DEFAULT 'easy',
	"completion_criteria" jsonb,
	"is_daily" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "health_daily_quests_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health_gamification" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"current_level" integer DEFAULT 1,
	"total_xp" integer DEFAULT 0,
	"streak_days" integer DEFAULT 0,
	"last_activity" date,
	"achieved_badges" jsonb,
	"current_quests" jsonb,
	"wellness_points" integer DEFAULT 0,
	"preferences" jsonb,
	"share_settings" jsonb,
	"leaderboard_opt_in" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health_lead_magnets" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"magnet_type" varchar(50),
	"category" varchar(100),
	"target_archetype" varchar(100),
	"delivery_method" varchar(50),
	"file_url" text,
	"email_sequence" jsonb,
	"download_count" integer DEFAULT 0,
	"conversion_rate" real DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "health_lead_magnets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health_quest_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quest_id" integer,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"completed_at" timestamp DEFAULT now(),
	"completion_data" jsonb,
	"xp_earned" integer DEFAULT 0,
	"streak_contribution" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health_quiz_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"answers" jsonb NOT NULL,
	"score" integer NOT NULL,
	"archetype_result" varchar(100),
	"confidence_score" real DEFAULT 0.8,
	"recommendations" jsonb,
	"time_to_complete" integer DEFAULT 0,
	"exit_point" varchar(50),
	"action_taken" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health_quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"questions" jsonb NOT NULL,
	"scoring_logic" jsonb NOT NULL,
	"result_mappings" jsonb NOT NULL,
	"estimated_time" integer DEFAULT 300,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "health_quizzes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health_tool_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_id" integer,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"inputs" jsonb NOT NULL,
	"outputs" jsonb NOT NULL,
	"archetype" varchar(100),
	"time_spent" integer DEFAULT 0,
	"action_taken" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health_tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"emotion_mapping" varchar(50),
	"input_fields" jsonb,
	"calculation_logic" text,
	"output_format" jsonb,
	"tracking_enabled" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "health_tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "finance_ai_chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"chat_session_id" varchar(255) NOT NULL,
	"persona" varchar(100),
	"context" jsonb,
	"messages" jsonb NOT NULL,
	"topics" jsonb,
	"recommendations" jsonb,
	"product_suggestions" jsonb,
	"satisfaction_rating" integer,
	"resolved_query" boolean DEFAULT false,
	"follow_up_scheduled" boolean DEFAULT false,
	"total_messages" integer DEFAULT 0,
	"session_duration" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "finance_ai_chat_sessions_chat_session_id_unique" UNIQUE("chat_session_id")
);
--> statement-breakpoint
CREATE TABLE "finance_calculator_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"calculator_type" varchar(100) NOT NULL,
	"inputs" jsonb NOT NULL,
	"results" jsonb NOT NULL,
	"recommendations" jsonb,
	"action_items" jsonb,
	"shareable_link" varchar(255),
	"bookmarked" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"meta_description" text,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"target_personas" jsonb NOT NULL,
	"emotion_tone" varchar(50) DEFAULT 'optimistic',
	"content_type" varchar(50) DEFAULT 'article',
	"content" text NOT NULL,
	"reading_time" integer,
	"difficulty" varchar(50) DEFAULT 'beginner',
	"key_takeaways" jsonb,
	"action_items" jsonb,
	"related_products" jsonb,
	"seo_keywords" jsonb,
	"last_updated" timestamp DEFAULT now(),
	"author_credentials" varchar(255),
	"fact_check_date" timestamp,
	"view_count" integer DEFAULT 0,
	"engagement_score" numeric(5, 2) DEFAULT '0.00',
	"is_published" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "finance_content_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "finance_gamification" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"current_level" integer DEFAULT 1,
	"total_xp" integer DEFAULT 0,
	"streak_days" integer DEFAULT 0,
	"last_activity_date" timestamp DEFAULT now(),
	"completed_challenges" jsonb,
	"earned_badges" jsonb,
	"current_quests" jsonb,
	"lifetime_stats" jsonb,
	"weekly_goals" jsonb,
	"monthly_goals" jsonb,
	"preferences" jsonb,
	"leaderboard_score" integer DEFAULT 0,
	"is_public_profile" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_lead_magnets" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"magnet_type" varchar(100) NOT NULL,
	"magnet_title" varchar(255) NOT NULL,
	"user_email" varchar(255),
	"user_first_name" varchar(100),
	"user_persona" varchar(100),
	"downloaded_at" timestamp DEFAULT now(),
	"download_source" varchar(100),
	"follow_up_sequence" varchar(100),
	"conversion_tracked" boolean DEFAULT false,
	"email_opt_in" boolean DEFAULT true,
	"sms_opt_in" boolean DEFAULT false,
	"preferences" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_date" timestamp DEFAULT now(),
	"total_sessions" integer DEFAULT 0,
	"unique_users" integer DEFAULT 0,
	"quiz_completions" integer DEFAULT 0,
	"calculator_usage" integer DEFAULT 0,
	"content_views" integer DEFAULT 0,
	"ai_chat_sessions" integer DEFAULT 0,
	"lead_magnet_downloads" integer DEFAULT 0,
	"affiliate_clicks" integer DEFAULT 0,
	"average_session_duration" integer DEFAULT 0,
	"bounce_rate" numeric(5, 2) DEFAULT '0.00',
	"conversion_rate" numeric(5, 2) DEFAULT '0.00',
	"engagement_score" numeric(5, 2) DEFAULT '0.00',
	"content_performance" jsonb,
	"product_performance" jsonb,
	"persona_breakdown" jsonb,
	"top_performing_content" jsonb,
	"optimization_suggestions" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_product_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_type" varchar(100) NOT NULL,
	"provider_name" varchar(255) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"key_features" jsonb NOT NULL,
	"target_personas" jsonb NOT NULL,
	"apr" numeric(5, 2),
	"interest_rate" numeric(5, 2),
	"fees" jsonb,
	"minimum_amount" numeric(12, 2),
	"maximum_amount" numeric(12, 2),
	"eligibility_requirements" jsonb,
	"affiliate_url" text NOT NULL,
	"cta_text" varchar(100) DEFAULT 'Learn More',
	"trust_score" integer DEFAULT 85,
	"priority" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"disclaimers" jsonb,
	"promotional_offer" text,
	"expiration_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"persona" varchar(100) NOT NULL,
	"goals" jsonb NOT NULL,
	"risk_tolerance" varchar(50) DEFAULT 'moderate',
	"current_income" numeric(12, 2),
	"current_savings" numeric(12, 2),
	"current_debt" numeric(12, 2),
	"age" integer,
	"dependents" integer DEFAULT 0,
	"financial_experience" varchar(50) DEFAULT 'beginner',
	"preferred_products" jsonb,
	"last_quiz_score" integer,
	"engagement_level" varchar(50) DEFAULT 'low',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_quiz_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"quiz_type" varchar(100) NOT NULL,
	"answers" jsonb NOT NULL,
	"calculated_persona" varchar(100) NOT NULL,
	"score" integer NOT NULL,
	"recommendations" jsonb NOT NULL,
	"product_matches" jsonb,
	"completion_time" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_data" jsonb,
	"destination_id" integer,
	"offer_id" integer,
	"archetype_id" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar(255),
	"page_slug" varchar(255),
	"referrer" text,
	"user_agent" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_archetypes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"characteristics" jsonb,
	"preferred_destinations" jsonb,
	"budget_range" varchar(50),
	"travel_style" varchar(50),
	"theme_colors" jsonb,
	"icon" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "travel_archetypes_name_unique" UNIQUE("name"),
	CONSTRAINT "travel_archetypes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "travel_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"featured_image" text,
	"author" text DEFAULT 'Travel Expert',
	"read_time" integer DEFAULT 5,
	"tags" jsonb,
	"destinations" jsonb,
	"archetypes" jsonb,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"meta_title" text,
	"meta_description" text,
	"keywords" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "travel_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "travel_content_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"selectors" jsonb,
	"last_scraped" timestamp,
	"scraping_enabled" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_destinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"country" text NOT NULL,
	"continent" text NOT NULL,
	"description" text,
	"short_description" text,
	"coordinates" jsonb,
	"featured_image" text,
	"gallery" jsonb,
	"best_time" text,
	"budget_range" varchar(50),
	"travel_time" text,
	"tags" jsonb,
	"visa_requirements" text,
	"currency" varchar(10),
	"language" text,
	"timezone" varchar(50),
	"safety_rating" integer DEFAULT 5,
	"popularity_score" integer DEFAULT 0,
	"is_hidden" boolean DEFAULT false,
	"is_trending" boolean DEFAULT false,
	"meta_title" text,
	"meta_description" text,
	"keywords" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "travel_destinations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "travel_itineraries" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"destinations" jsonb NOT NULL,
	"duration" integer NOT NULL,
	"budget" jsonb,
	"activities" jsonb,
	"tips" jsonb,
	"archetypes" jsonb,
	"difficulty" varchar(20) DEFAULT 'easy',
	"season" varchar(20),
	"featured_image" text,
	"gallery" jsonb,
	"is_public" boolean DEFAULT true,
	"likes" integer DEFAULT 0,
	"saves" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"author_id" varchar(255),
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "travel_itineraries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "travel_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"offer_type" varchar(50) NOT NULL,
	"provider" text NOT NULL,
	"original_url" text NOT NULL,
	"affiliate_url" text NOT NULL,
	"price" numeric(10, 2),
	"currency" varchar(10) DEFAULT 'USD',
	"discount" integer,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"destination_id" integer,
	"archetypes" jsonb,
	"tags" jsonb,
	"image" text,
	"priority" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_type" varchar(100) NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_quiz_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"quiz_type" varchar(100) NOT NULL,
	"answers" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"archetype_id" integer,
	"destination_ids" jsonb,
	"confidence" numeric(3, 2) DEFAULT '0.00',
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"tool_type" varchar(50) NOT NULL,
	"config" jsonb,
	"is_active" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"icon" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "travel_tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "travel_user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"archetype_id" integer,
	"preferences" jsonb,
	"wishlist" jsonb,
	"search_history" jsonb,
	"clicked_offers" jsonb,
	"quiz_results" jsonb,
	"device_info" jsonb,
	"location" jsonb,
	"is_active" boolean DEFAULT true,
	"last_activity" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "travel_user_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_offer_id_affiliate_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."affiliate_offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_offers" ADD CONSTRAINT "affiliate_offers_network_id_affiliate_networks_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."affiliate_networks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_global_user_id_global_user_profiles_id_fk" FOREIGN KEY ("global_user_id") REFERENCES "public"."global_user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_sync_status" ADD CONSTRAINT "analytics_sync_status_global_user_id_global_user_profiles_id_fk" FOREIGN KEY ("global_user_id") REFERENCES "public"."global_user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_fingerprints" ADD CONSTRAINT "device_fingerprints_global_user_id_global_user_profiles_id_fk" FOREIGN KEY ("global_user_id") REFERENCES "public"."global_user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_lead_magnet_id_lead_magnets_id_fk" FOREIGN KEY ("lead_magnet_id") REFERENCES "public"."lead_magnets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_events" ADD CONSTRAINT "experiment_events_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_events" ADD CONSTRAINT "experiment_events_variant_id_experiment_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."experiment_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_results" ADD CONSTRAINT "experiment_results_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_results" ADD CONSTRAINT "experiment_results_variant_id_experiment_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."experiment_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_capture_id_lead_captures_id_fk" FOREIGN KEY ("lead_capture_id") REFERENCES "public"."lead_captures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_captures" ADD CONSTRAINT "lead_captures_lead_form_id_lead_forms_id_fk" FOREIGN KEY ("lead_form_id") REFERENCES "public"."lead_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_captures" ADD CONSTRAINT "lead_captures_lead_magnet_id_lead_magnets_id_fk" FOREIGN KEY ("lead_magnet_id") REFERENCES "public"."lead_magnets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_experiments" ADD CONSTRAINT "lead_experiments_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_experiments" ADD CONSTRAINT "lead_experiments_lead_form_id_lead_forms_id_fk" FOREIGN KEY ("lead_form_id") REFERENCES "public"."lead_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_experiments" ADD CONSTRAINT "lead_experiments_variant_id_experiment_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."experiment_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_form_assignments" ADD CONSTRAINT "lead_form_assignments_lead_form_id_lead_forms_id_fk" FOREIGN KEY ("lead_form_id") REFERENCES "public"."lead_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_forms" ADD CONSTRAINT "lead_forms_lead_magnet_id_lead_magnets_id_fk" FOREIGN KEY ("lead_magnet_id") REFERENCES "public"."lead_magnets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_predictions" ADD CONSTRAINT "ml_predictions_model_id_ml_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_performance_tracking" ADD CONSTRAINT "model_performance_tracking_model_id_ml_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neuron_analytics" ADD CONSTRAINT "neuron_analytics_neuron_id_neurons_neuron_id_fk" FOREIGN KEY ("neuron_id") REFERENCES "public"."neurons"("neuron_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neuron_configs" ADD CONSTRAINT "neuron_configs_neuron_id_neurons_neuron_id_fk" FOREIGN KEY ("neuron_id") REFERENCES "public"."neurons"("neuron_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neuron_status_updates" ADD CONSTRAINT "neuron_status_updates_neuron_id_neurons_neuron_id_fk" FOREIGN KEY ("neuron_id") REFERENCES "public"."neurons"("neuron_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_affiliate_assignments" ADD CONSTRAINT "page_affiliate_assignments_offer_id_affiliate_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."affiliate_offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_bridge" ADD CONSTRAINT "session_bridge_global_user_id_global_user_profiles_id_fk" FOREIGN KEY ("global_user_id") REFERENCES "public"."global_user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_experiment_assignments" ADD CONSTRAINT "user_experiment_assignments_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_experiment_assignments" ADD CONSTRAINT "user_experiment_assignments_variant_id_experiment_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."experiment_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile_merge_history" ADD CONSTRAINT "user_profile_merge_history_master_profile_id_global_user_profiles_id_fk" FOREIGN KEY ("master_profile_id") REFERENCES "public"."global_user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localized_content_assignments" ADD CONSTRAINT "localized_content_assignments_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translations" ADD CONSTRAINT "translations_key_id_translation_keys_id_fk" FOREIGN KEY ("key_id") REFERENCES "public"."translation_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translations" ADD CONSTRAINT "translations_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_language_preferences" ADD CONSTRAINT "user_language_preferences_preferred_language_languages_code_fk" FOREIGN KEY ("preferred_language") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_comparisons" ADD CONSTRAINT "saas_comparisons_tool_a_saas_tools_id_fk" FOREIGN KEY ("tool_a") REFERENCES "public"."saas_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_comparisons" ADD CONSTRAINT "saas_comparisons_tool_b_saas_tools_id_fk" FOREIGN KEY ("tool_b") REFERENCES "public"."saas_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_deals" ADD CONSTRAINT "saas_deals_tool_id_saas_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."saas_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_reviews" ADD CONSTRAINT "saas_reviews_tool_id_saas_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."saas_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_content_performance" ADD CONSTRAINT "health_content_performance_content_id_health_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."health_content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_quest_completions" ADD CONSTRAINT "health_quest_completions_quest_id_health_daily_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."health_daily_quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_quiz_results" ADD CONSTRAINT "health_quiz_results_quiz_id_health_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."health_quizzes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_tool_sessions" ADD CONSTRAINT "health_tool_sessions_tool_id_health_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."health_tools"("id") ON DELETE no action ON UPDATE no action;