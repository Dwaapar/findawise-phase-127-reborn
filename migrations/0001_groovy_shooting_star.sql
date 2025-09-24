CREATE TABLE "alert_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" varchar(100) NOT NULL,
	"metric" varchar(100) NOT NULL,
	"threshold" real NOT NULL,
	"operator" varchar(20) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"actions" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alert_rules_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
CREATE TABLE "api_neuron_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"neuron_id" varchar(100),
	"date" timestamp NOT NULL,
	"request_count" integer DEFAULT 0,
	"successful_requests" integer DEFAULT 0,
	"failed_requests" integer DEFAULT 0,
	"average_response_time" integer DEFAULT 0,
	"p95_response_time" integer DEFAULT 0,
	"p99_response_time" integer DEFAULT 0,
	"total_data_processed" integer DEFAULT 0,
	"error_rate" integer DEFAULT 0,
	"uptime" integer DEFAULT 0,
	"cpu_usage_avg" integer DEFAULT 0,
	"memory_usage_avg" integer DEFAULT 0,
	"disk_usage_avg" integer DEFAULT 0,
	"network_bytes_in" integer DEFAULT 0,
	"network_bytes_out" integer DEFAULT 0,
	"custom_metrics" jsonb,
	"alerts" jsonb,
	"events" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_neuron_commands" (
	"id" serial PRIMARY KEY NOT NULL,
	"command_id" varchar(36) NOT NULL,
	"neuron_id" varchar(100),
	"command_type" varchar(100) NOT NULL,
	"command_data" jsonb NOT NULL,
	"priority" integer DEFAULT 1,
	"status" varchar(50) DEFAULT 'pending',
	"issued_by" varchar(255) NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"acknowledged_at" timestamp,
	"completed_at" timestamp,
	"failed_at" timestamp,
	"timeout_at" timestamp,
	"response" jsonb,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"metadata" jsonb,
	CONSTRAINT "api_neuron_commands_command_id_unique" UNIQUE("command_id")
);
--> statement-breakpoint
CREATE TABLE "api_neuron_heartbeats" (
	"id" serial PRIMARY KEY NOT NULL,
	"neuron_id" varchar(100),
	"status" varchar(50) NOT NULL,
	"health_score" integer NOT NULL,
	"uptime" integer NOT NULL,
	"process_id" varchar(100),
	"host_info" jsonb,
	"system_metrics" jsonb,
	"application_metrics" jsonb,
	"dependency_status" jsonb,
	"error_log" text,
	"warnings_log" jsonb,
	"performance_metrics" jsonb,
	"config_version" varchar(50),
	"build_version" varchar(100),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_only_neurons" (
	"id" serial PRIMARY KEY NOT NULL,
	"neuron_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"language" varchar(50) NOT NULL,
	"version" varchar(50) NOT NULL,
	"base_url" text,
	"healthcheck_endpoint" text NOT NULL,
	"api_endpoints" jsonb NOT NULL,
	"authentication" jsonb NOT NULL,
	"capabilities" jsonb NOT NULL,
	"dependencies" jsonb,
	"resource_requirements" jsonb,
	"deployment_info" jsonb,
	"status" varchar(50) DEFAULT 'inactive',
	"last_heartbeat" timestamp,
	"health_score" integer DEFAULT 100,
	"uptime" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"total_requests" integer DEFAULT 0,
	"successful_requests" integer DEFAULT 0,
	"average_response_time" integer DEFAULT 0,
	"last_error" text,
	"alert_thresholds" jsonb,
	"auto_restart_enabled" boolean DEFAULT true,
	"max_restart_attempts" integer DEFAULT 3,
	"current_restart_attempts" integer DEFAULT 0,
	"last_restart_attempt" timestamp,
	"registered_at" timestamp DEFAULT now(),
	"api_key" varchar(255) NOT NULL,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "api_only_neurons_neuron_id_unique" UNIQUE("neuron_id")
);
--> statement-breakpoint
CREATE TABLE "performance_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" varchar(20) NOT NULL,
	"component" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"metadata" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_name" varchar(100) NOT NULL,
	"value" real NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" text,
	"source" varchar(50) DEFAULT 'system',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "education_ai_chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"chat_id" varchar(255) NOT NULL,
	"subject" varchar(100),
	"archetype" varchar(100),
	"conversation_history" jsonb NOT NULL,
	"total_messages" integer DEFAULT 0,
	"session_duration" integer DEFAULT 0,
	"questions_asked" integer DEFAULT 0,
	"answers_provided" integer DEFAULT 0,
	"helpful_rating" real DEFAULT 0,
	"topics_discussed" jsonb,
	"recommendations_given" jsonb,
	"is_active" boolean DEFAULT true,
	"last_interaction" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "education_ai_chat_sessions_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
CREATE TABLE "education_archetypes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"characteristics" jsonb,
	"emotion_mapping" varchar(50),
	"color_scheme" jsonb,
	"preferred_tools" jsonb,
	"learning_style" varchar(50),
	"goal_type" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "education_archetypes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "education_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"category" varchar(100),
	"content_type" varchar(50),
	"target_archetype" varchar(100),
	"difficulty" varchar(20),
	"estimated_time" integer DEFAULT 30,
	"xp_reward" integer DEFAULT 10,
	"prerequisites" jsonb,
	"emotion_tone" varchar(50),
	"reading_time" integer DEFAULT 5,
	"seo_title" varchar(255),
	"seo_description" text,
	"tags" jsonb,
	"sources" jsonb,
	"is_generated" boolean DEFAULT false,
	"published_at" timestamp,
	"is_active" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"completion_rate" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "education_content_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "education_daily_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"quest_type" varchar(50),
	"title" varchar(255) NOT NULL,
	"description" text,
	"requirements" jsonb,
	"xp_reward" integer DEFAULT 20,
	"badge_reward" varchar(100),
	"difficulty" varchar(20),
	"category" varchar(100),
	"target_archetype" varchar(100),
	"is_active" boolean DEFAULT true,
	"completion_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "education_gamification" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"total_xp" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_activity_date" date,
	"badges" jsonb,
	"achievements" jsonb,
	"leaderboard_position" integer,
	"friends_list" jsonb,
	"preferences" jsonb,
	"daily_goal" integer DEFAULT 30,
	"weekly_goal" integer DEFAULT 300,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "education_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"provider" varchar(100),
	"category" varchar(100),
	"offer_type" varchar(50),
	"original_price" real,
	"sale_price" real,
	"discount_percent" integer,
	"affiliate_url" text NOT NULL,
	"tracking_url" text,
	"commission_rate" real,
	"target_archetype" varchar(100),
	"tags" jsonb,
	"thumbnail_url" text,
	"rating" real DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"click_count" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"conversion_rate" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "education_offers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "education_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"target_archetype" varchar(100),
	"difficulty" varchar(20),
	"estimated_hours" integer DEFAULT 40,
	"curriculum" jsonb NOT NULL,
	"prerequisites" jsonb,
	"outcomes" jsonb,
	"xp_total" integer DEFAULT 500,
	"certificate_template" text,
	"is_active" boolean DEFAULT true,
	"enrollment_count" integer DEFAULT 0,
	"completion_rate" real DEFAULT 0,
	"rating" real DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "education_paths_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "education_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"path_id" integer,
	"content_id" integer,
	"quiz_id" integer,
	"status" varchar(50) NOT NULL,
	"progress_percentage" real DEFAULT 0,
	"time_spent" integer DEFAULT 0,
	"last_accessed" timestamp DEFAULT now(),
	"xp_earned" integer DEFAULT 0,
	"streak_days" integer DEFAULT 0,
	"completed_at" timestamp,
	"certificate_issued" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "education_quest_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quest_id" integer,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"completed_at" timestamp DEFAULT now(),
	"xp_earned" integer DEFAULT 0,
	"badge_earned" varchar(100),
	"time_to_complete" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "education_quiz_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"answers" jsonb NOT NULL,
	"score" integer NOT NULL,
	"percentage" real NOT NULL,
	"archetype_result" varchar(100),
	"recommendations" jsonb,
	"time_to_complete" integer DEFAULT 0,
	"exit_point" varchar(50),
	"action_taken" varchar(100),
	"xp_earned" integer DEFAULT 0,
	"is_passed" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "education_quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"quiz_type" varchar(50),
	"questions" jsonb NOT NULL,
	"scoring_logic" jsonb NOT NULL,
	"result_mappings" jsonb NOT NULL,
	"estimated_time" integer DEFAULT 300,
	"xp_reward" integer DEFAULT 25,
	"retake_allowed" boolean DEFAULT true,
	"passing_score" integer DEFAULT 70,
	"is_active" boolean DEFAULT true,
	"completion_count" integer DEFAULT 0,
	"average_score" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "education_quizzes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "education_tool_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_id" integer,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"inputs" jsonb NOT NULL,
	"outputs" jsonb NOT NULL,
	"archetype" varchar(100),
	"time_spent" integer DEFAULT 0,
	"action_taken" varchar(100),
	"xp_earned" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "education_tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"tool_type" varchar(50),
	"emotion_mapping" varchar(50),
	"input_fields" jsonb,
	"calculation_logic" text,
	"output_format" jsonb,
	"tracking_enabled" boolean DEFAULT true,
	"xp_reward" integer DEFAULT 5,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "education_tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ai_tools" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"shortDescription" text,
	"website" text NOT NULL,
	"logo" text,
	"categoryId" integer NOT NULL,
	"subcategories" jsonb,
	"pricingModel" text NOT NULL,
	"priceFrom" numeric(10, 2),
	"priceTo" numeric(10, 2),
	"pricingDetails" jsonb,
	"features" jsonb,
	"useCase" jsonb,
	"platforms" jsonb,
	"integrations" jsonb,
	"apiAvailable" boolean DEFAULT false,
	"rating" numeric(3, 2) DEFAULT '0',
	"totalReviews" integer DEFAULT 0,
	"launchDate" timestamp,
	"lastUpdated" timestamp,
	"isActive" boolean DEFAULT true,
	"isFeatured" boolean DEFAULT false,
	"trustScore" integer DEFAULT 50,
	"metaTitle" text,
	"metaDescription" text,
	"tags" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ai_tools_analytics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_analytics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" text NOT NULL,
	"event" text NOT NULL,
	"toolId" integer,
	"categoryId" integer,
	"contentId" integer,
	"offerId" integer,
	"userArchetype" text,
	"deviceType" text,
	"source" text,
	"data" jsonb,
	"value" numeric(10, 2),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tools_archetypes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_archetypes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"primaryMotivation" text NOT NULL,
	"preferredFeatures" jsonb,
	"uiPreferences" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_tools_archetypes_name_unique" UNIQUE("name"),
	CONSTRAINT "ai_tools_archetypes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ai_tools_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"parentId" integer,
	"sortOrder" integer DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_tools_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ai_tools_comparisons" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_comparisons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"toolIds" jsonb NOT NULL,
	"criteria" jsonb,
	"overallWinner" integer,
	"categoryWinners" jsonb,
	"metaTitle" text,
	"metaDescription" text,
	"views" integer DEFAULT 0,
	"isPublished" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_tools_comparisons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ai_tools_content" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_content_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"featuredImage" text,
	"relatedTools" jsonb,
	"categories" jsonb,
	"tags" jsonb,
	"metaTitle" text,
	"metaDescription" text,
	"focusKeyword" text,
	"views" integer DEFAULT 0,
	"avgTimeOnPage" integer DEFAULT 0,
	"bounceRate" numeric(5, 2) DEFAULT '0',
	"status" text DEFAULT 'draft',
	"publishedAt" timestamp,
	"isAiGenerated" boolean DEFAULT false,
	"generationPrompt" text,
	"lastOptimized" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_tools_content_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ai_tools_experiments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_experiments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"variants" jsonb NOT NULL,
	"targetArchetypes" jsonb,
	"targetPages" jsonb,
	"status" text DEFAULT 'draft',
	"startDate" timestamp,
	"endDate" timestamp,
	"participantCount" integer DEFAULT 0,
	"results" jsonb,
	"winner" text,
	"confidence" numeric(5, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tools_leads" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_leads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"sessionId" text NOT NULL,
	"source" text NOT NULL,
	"leadMagnet" text,
	"archetype" text,
	"interests" jsonb,
	"experience" text,
	"quizTaken" boolean DEFAULT false,
	"downloadsCount" integer DEFAULT 0,
	"emailsOpened" integer DEFAULT 0,
	"emailsClicked" integer DEFAULT 0,
	"isSubscribed" boolean DEFAULT true,
	"unsubscribedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tools_offers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_offers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"toolId" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"offerType" text NOT NULL,
	"originalPrice" numeric(10, 2),
	"offerPrice" numeric(10, 2),
	"discountPercentage" integer,
	"affiliateUrl" text NOT NULL,
	"affiliateNetwork" text,
	"commission" numeric(5, 2),
	"startDate" timestamp,
	"endDate" timestamp,
	"isActive" boolean DEFAULT true,
	"isLimitedTime" boolean DEFAULT false,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tools_quiz_results" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_quiz_results_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"quizId" integer NOT NULL,
	"sessionId" text NOT NULL,
	"userId" text,
	"answers" jsonb NOT NULL,
	"primaryArchetype" text NOT NULL,
	"secondaryArchetype" text,
	"recommendedCategories" jsonb,
	"recommendedTools" jsonb,
	"archetypeScores" jsonb,
	"categoryScores" jsonb,
	"completedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tools_quizzes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_quizzes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text,
	"questions" jsonb NOT NULL,
	"archetypeWeights" jsonb,
	"categoryWeights" jsonb,
	"isActive" boolean DEFAULT true,
	"totalTaken" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tools_reviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_tools_reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"toolId" integer NOT NULL,
	"userId" text,
	"sessionId" text,
	"rating" integer NOT NULL,
	"title" text,
	"content" text,
	"pros" jsonb,
	"cons" jsonb,
	"userArchetype" text,
	"useCase" text,
	"experienceLevel" text,
	"verified" boolean DEFAULT false,
	"helpful" integer DEFAULT 0,
	"unhelpful" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_ml_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"vertical" varchar(100),
	"neuron_id" varchar(255),
	"model_type" varchar(100),
	"metrics" jsonb NOT NULL,
	"predictions" integer DEFAULT 0,
	"correct_predictions" integer DEFAULT 0,
	"accuracy" numeric(5, 4),
	"revenue_impact" numeric(10, 2),
	"user_impact" integer DEFAULT 0,
	"optimizations_applied" integer DEFAULT 0,
	"rules_triggered" integer DEFAULT 0,
	"experiments_running" integer DEFAULT 0,
	"data_quality" numeric(5, 4),
	"system_health" varchar(50) DEFAULT 'healthy',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_ml_audit_trail" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"session_id" varchar(255),
	"old_value" jsonb,
	"new_value" jsonb,
	"change_reason" text,
	"impact" jsonb,
	"is_automatic" boolean DEFAULT false,
	"learning_cycle_id" varchar(255),
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now(),
	CONSTRAINT "ai_ml_audit_trail_audit_id_unique" UNIQUE("audit_id")
);
--> statement-breakpoint
CREATE TABLE "ai_ml_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(100) NOT NULL,
	"vertical" varchar(100),
	"model_id" varchar(255),
	"hypothesis" text,
	"variants" jsonb NOT NULL,
	"traffic_allocation" integer DEFAULT 100,
	"status" varchar(50) DEFAULT 'draft',
	"start_date" timestamp,
	"end_date" timestamp,
	"results" jsonb,
	"winner" varchar(255),
	"confidence" numeric(5, 4),
	"significance" numeric(5, 4),
	"created_by" varchar(255),
	"learning_cycle_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_ml_experiments_experiment_id_unique" UNIQUE("experiment_id")
);
--> statement-breakpoint
CREATE TABLE "ai_ml_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" varchar(255) NOT NULL,
	"model_type" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" varchar(50) NOT NULL,
	"weights" jsonb NOT NULL,
	"hyperparameters" jsonb,
	"architecture" jsonb,
	"training_data" jsonb NOT NULL,
	"performance" jsonb NOT NULL,
	"accuracy" numeric(5, 4),
	"is_active" boolean DEFAULT true,
	"is_production" boolean DEFAULT false,
	"training_start_time" timestamp,
	"training_end_time" timestamp,
	"deployed_at" timestamp,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_ml_models_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE TABLE "content_optimization_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"log_id" varchar(255) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"content_id" varchar(255) NOT NULL,
	"vertical" varchar(100) NOT NULL,
	"original_content" jsonb,
	"optimized_content" jsonb NOT NULL,
	"optimization_type" varchar(100) NOT NULL,
	"model_used" varchar(255),
	"rule_used" varchar(255),
	"confidence" numeric(5, 4),
	"expected_improvement" numeric(5, 4),
	"actual_improvement" numeric(5, 4),
	"is_applied" boolean DEFAULT false,
	"applied_at" timestamp,
	"is_reverted" boolean DEFAULT false,
	"reverted_at" timestamp,
	"performance" jsonb,
	"learning_cycle_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "content_optimization_logs_log_id_unique" UNIQUE("log_id")
);
--> statement-breakpoint
CREATE TABLE "empire_brain_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_key" varchar(255) NOT NULL,
	"config_value" jsonb NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true,
	"version" varchar(50) DEFAULT '1.0',
	"updated_by" varchar(255),
	"last_applied" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "empire_brain_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "learning_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_id" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"data_processed" jsonb NOT NULL,
	"discoveries" jsonb NOT NULL,
	"models_updated" jsonb,
	"rules_generated" integer DEFAULT 0,
	"performance" jsonb,
	"error_message" text,
	"triggered_by" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "learning_cycles_cycle_id_unique" UNIQUE("cycle_id")
);
--> statement-breakpoint
CREATE TABLE "model_training_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" varchar(255) NOT NULL,
	"model_id" varchar(255) NOT NULL,
	"model_type" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"progress" integer DEFAULT 0,
	"training_config" jsonb NOT NULL,
	"dataset_size" integer,
	"epochs" integer,
	"current_epoch" integer DEFAULT 0,
	"loss" numeric(10, 6),
	"accuracy" numeric(5, 4),
	"validation_loss" numeric(10, 6),
	"validation_accuracy" numeric(5, 4),
	"training_logs" text,
	"error_message" text,
	"start_time" timestamp,
	"end_time" timestamp,
	"estimated_completion_time" timestamp,
	"resources" jsonb,
	"learning_cycle_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "model_training_jobs_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "neuron_data_pipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"neuron_id" varchar(255) NOT NULL,
	"neuron_name" varchar(255) NOT NULL,
	"vertical" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"last_sync" timestamp DEFAULT now(),
	"sync_frequency" integer DEFAULT 300,
	"metrics_collected" jsonb NOT NULL,
	"health_score" numeric(5, 4) DEFAULT '1.0000',
	"config_version" varchar(100),
	"is_active" boolean DEFAULT true,
	"error_count" integer DEFAULT 0,
	"last_error" text,
	"last_error_time" timestamp,
	"data_quality" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "neuron_data_pipelines_neuron_id_unique" UNIQUE("neuron_id")
);
--> statement-breakpoint
CREATE TABLE "personalization_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"vertical" varchar(100) NOT NULL,
	"archetype" varchar(100) NOT NULL,
	"condition" jsonb NOT NULL,
	"action" jsonb NOT NULL,
	"confidence" numeric(5, 4) NOT NULL,
	"impact" numeric(5, 4),
	"priority" integer DEFAULT 100,
	"is_active" boolean DEFAULT true,
	"is_test_mode" boolean DEFAULT false,
	"test_results" jsonb,
	"applied_count" integer DEFAULT 0,
	"success_count" integer DEFAULT 0,
	"created_by" varchar(255),
	"learning_cycle_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "personalization_rules_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
CREATE TABLE "config_ai_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" varchar(255) NOT NULL,
	"prompt_snippets" jsonb,
	"rag_context" jsonb,
	"ai_assist_metadata" jsonb,
	"training_tags" jsonb,
	"training_examples" jsonb,
	"feedback_data" jsonb,
	"ai_generated_fields" jsonb,
	"confidence_scores" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "config_change_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"change_id" uuid DEFAULT gen_random_uuid(),
	"config_id" varchar(255) NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"previous_version" varchar(50),
	"new_version" varchar(50),
	"previous_data" jsonb,
	"new_data" jsonb,
	"diff" jsonb,
	"reason" text,
	"rollback_id" varchar(255),
	"user_id" varchar(255),
	"username" varchar(255),
	"user_role" varchar(100),
	"source" varchar(100) DEFAULT 'manual',
	"source_details" jsonb,
	"requires_approval" boolean DEFAULT false,
	"approved_by" varchar(255),
	"approved_at" timestamp,
	"approval_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "config_federation_sync" (
	"id" serial PRIMARY KEY NOT NULL,
	"sync_id" uuid DEFAULT gen_random_uuid(),
	"config_id" varchar(255) NOT NULL,
	"neuron_id" varchar(255) NOT NULL,
	"neuron_type" varchar(100),
	"neuron_version" varchar(50),
	"sync_type" varchar(50) NOT NULL,
	"sync_status" varchar(50) DEFAULT 'pending',
	"config_version" varchar(50),
	"synced_data" jsonb,
	"overrides" jsonb,
	"conflicts" jsonb,
	"conflict_resolution" varchar(50),
	"sync_duration" integer,
	"retry_count" integer DEFAULT 0,
	"last_error" text,
	"sync_started_at" timestamp DEFAULT now(),
	"sync_completed_at" timestamp,
	"next_sync_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "config_performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_id" uuid DEFAULT gen_random_uuid(),
	"config_id" varchar(255) NOT NULL,
	"load_time" real,
	"cache_hit_rate" real,
	"validation_time" real,
	"sync_time" real,
	"access_count" integer DEFAULT 0,
	"update_count" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"memory_usage" integer,
	"cpu_usage" real,
	"network_usage" integer,
	"environment" varchar(50),
	"user_agent" varchar(255),
	"region" varchar(50),
	"recorded_at" timestamp DEFAULT now(),
	"day_bucket" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "config_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"user_role" varchar(100),
	"team_id" varchar(255),
	"can_read" boolean DEFAULT true,
	"can_write" boolean DEFAULT false,
	"can_delete" boolean DEFAULT false,
	"can_approve" boolean DEFAULT false,
	"can_rollback" boolean DEFAULT false,
	"allowed_environments" jsonb DEFAULT '["development"]'::jsonb,
	"allowed_verticals" jsonb,
	"allowed_locales" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "config_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" varchar(255) NOT NULL,
	"version" varchar(50) NOT NULL,
	"vertical" varchar(100),
	"locale" varchar(10) DEFAULT 'en-US',
	"user_persona" varchar(100),
	"intent_cluster" varchar(100),
	"layout_type" varchar(50) DEFAULT 'standard',
	"feature_flags" jsonb DEFAULT '{}'::jsonb,
	"ab_test_variant" varchar(100),
	"config_data" jsonb NOT NULL,
	"schema" jsonb,
	"title" varchar(255) NOT NULL,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"category" varchar(100),
	"is_active" boolean DEFAULT true,
	"is_locked" boolean DEFAULT false,
	"deprecated" boolean DEFAULT false,
	"author" varchar(255),
	"last_modified_by" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_deployed_at" timestamp,
	CONSTRAINT "config_registry_config_id_unique" UNIQUE("config_id")
);
--> statement-breakpoint
CREATE TABLE "config_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" varchar(255) NOT NULL,
	"config_id" varchar(255) NOT NULL,
	"version" varchar(50) NOT NULL,
	"config_data" jsonb NOT NULL,
	"metadata" jsonb,
	"snapshot_type" varchar(50) DEFAULT 'manual',
	"description" text,
	"is_valid" boolean DEFAULT true,
	"validation_errors" jsonb,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	CONSTRAINT "config_snapshots_snapshot_id_unique" UNIQUE("snapshot_id")
);
--> statement-breakpoint
CREATE TABLE "config_validation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"rule_type" varchar(50) NOT NULL,
	"rule_definition" jsonb NOT NULL,
	"severity" varchar(50) DEFAULT 'error',
	"applies_to" jsonb,
	"conditions" jsonb,
	"is_active" boolean DEFAULT true,
	"is_built_in" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "config_validation_rules_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
CREATE TABLE "graph_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"node_id" integer,
	"edge_id" integer,
	"metric_type" varchar(50) NOT NULL,
	"value" real NOT NULL,
	"aggregation_type" varchar(20) DEFAULT 'sum',
	"timeframe" varchar(20) NOT NULL,
	"date" timestamp NOT NULL,
	"neuron_id" varchar(100),
	"vertical" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "graph_audit_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_type" varchar(50) NOT NULL,
	"node_id" integer,
	"edge_id" integer,
	"severity" varchar(20) NOT NULL,
	"issue" text NOT NULL,
	"recommendation" text,
	"auto_fix_available" boolean DEFAULT false,
	"is_resolved" boolean DEFAULT false,
	"resolved_by" varchar(50),
	"resolved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "realtime_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"session_id" varchar(255) NOT NULL,
	"fingerprint" varchar(500),
	"node_id" integer NOT NULL,
	"recommendation_type" varchar(50) NOT NULL,
	"score" real NOT NULL,
	"reason" text,
	"context" jsonb,
	"position" integer,
	"is_displayed" boolean DEFAULT false,
	"is_clicked" boolean DEFAULT false,
	"is_converted" boolean DEFAULT false,
	"displayed_at" timestamp,
	"clicked_at" timestamp,
	"converted_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "semantic_edges" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_node_id" integer NOT NULL,
	"to_node_id" integer NOT NULL,
	"edge_type" varchar(50) NOT NULL,
	"weight" real DEFAULT 1,
	"confidence" real DEFAULT 0.5,
	"metadata" jsonb,
	"created_by" varchar(50) DEFAULT 'system',
	"click_count" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"last_traversed" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "semantic_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"node_type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content" text,
	"metadata" jsonb,
	"vector_embedding" jsonb,
	"semantic_keywords" jsonb,
	"llm_summary" text,
	"intent_profile_tags" jsonb,
	"status" varchar(20) DEFAULT 'active',
	"vertical_id" varchar(50),
	"neuron_id" varchar(100),
	"click_through_rate" real DEFAULT 0,
	"conversion_rate" real DEFAULT 0,
	"engagement" real DEFAULT 0,
	"last_optimized" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "semantic_nodes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "semantic_search_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_text" text NOT NULL,
	"query_vector" jsonb,
	"user_id" varchar(255),
	"session_id" varchar(255),
	"results" jsonb,
	"clicked_results" jsonb,
	"performance_metrics" jsonb,
	"intent" varchar(100),
	"vertical" varchar(50),
	"neuron_id" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_intent_vectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"session_id" varchar(255),
	"fingerprint" varchar(500),
	"intent_vector" jsonb NOT NULL,
	"current_archetype" varchar(100),
	"intent_tags" jsonb,
	"behaviors" jsonb,
	"preferences" jsonb,
	"interaction_history" jsonb,
	"strength" real DEFAULT 1,
	"last_activity" timestamp DEFAULT now(),
	"decay_rate" real DEFAULT 0.1,
	"neuron_affinities" jsonb,
	"vertical_preferences" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vector_similarity_index" (
	"id" serial PRIMARY KEY NOT NULL,
	"node_id" integer NOT NULL,
	"similar_node_id" integer NOT NULL,
	"similarity" real NOT NULL,
	"algorithm" varchar(50) DEFAULT 'cosine',
	"last_calculated" timestamp DEFAULT now(),
	"is_valid" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "neuron_offer_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"neuron_id" varchar(255) NOT NULL,
	"offer_id" integer,
	"position" varchar(100),
	"context" varchar(255),
	"emotion_match" varchar(50),
	"intent_match" real DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"auto_assigned" boolean DEFAULT true,
	"assigned_at" timestamp DEFAULT now(),
	"last_served" timestamp,
	"serve_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "offer_ai_optimization_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_type" varchar(100) NOT NULL,
	"priority" integer DEFAULT 1,
	"offer_id" integer,
	"neuron_id" varchar(255),
	"parameters" jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"result" jsonb,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offer_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"offer_id" integer,
	"session_id" varchar(255),
	"user_id" varchar(255),
	"neuron_id" varchar(255),
	"page_slug" varchar(255),
	"event_type" varchar(50) NOT NULL,
	"device_type" varchar(50),
	"geo_location" varchar(100),
	"user_agent" text,
	"referrer" text,
	"conversion_value" real,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offer_compliance_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"rule_type" varchar(50) NOT NULL,
	"conditions" jsonb NOT NULL,
	"action" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium',
	"is_active" boolean DEFAULT true,
	"violation_count" integer DEFAULT 0,
	"last_triggered" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offer_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"target_metric" varchar(50) NOT NULL,
	"variants" jsonb NOT NULL,
	"traffic_split" jsonb DEFAULT '{"control": 50, "variant": 50}',
	"status" varchar(50) DEFAULT 'draft',
	"start_date" timestamp,
	"end_date" timestamp,
	"results" jsonb,
	"winning_variant" varchar(100),
	"confidence" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offer_feed" (
	"id" serial PRIMARY KEY NOT NULL,
	"offer_uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"source_id" integer,
	"title" varchar(500) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"merchant" varchar(255) NOT NULL,
	"price" real,
	"old_price" real,
	"currency" varchar(10) DEFAULT 'USD',
	"coupon_code" varchar(100),
	"discount_type" varchar(50),
	"discount_value" real,
	"valid_till" timestamp,
	"region" varchar(100) DEFAULT 'global',
	"emotion" varchar(50),
	"category" varchar(100) NOT NULL,
	"tags" jsonb,
	"source_type" varchar(50) NOT NULL,
	"is_expired" boolean DEFAULT false,
	"click_tracking_url" text NOT NULL,
	"api_source" varchar(100),
	"commission_estimate" real,
	"meta" jsonb,
	"llm_summary" text,
	"intent_embedding" jsonb,
	"quality_score" real DEFAULT 0,
	"ctr" real DEFAULT 0,
	"conversion_rate" real DEFAULT 0,
	"last_click" timestamp,
	"click_count" integer DEFAULT 0,
	"revenue_generated" real DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"priority" integer DEFAULT 1,
	"auto_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp DEFAULT now(),
	CONSTRAINT "offer_feed_offer_uuid_unique" UNIQUE("offer_uuid"),
	CONSTRAINT "offer_feed_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "offer_personalization_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"priority" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"success_rate" real DEFAULT 0,
	"last_tested" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offer_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"base_url" text,
	"api_config" jsonb,
	"scraping_config" jsonb,
	"credentials" jsonb,
	"is_active" boolean DEFAULT true,
	"last_sync" timestamp,
	"sync_frequency" varchar(50) DEFAULT 'hourly',
	"error_count" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "offer_sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "offer_sync_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"batch_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"sync_type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"offers_processed" integer DEFAULT 0,
	"offers_added" integer DEFAULT 0,
	"offers_updated" integer DEFAULT 0,
	"offers_removed" integer DEFAULT 0,
	"errors" jsonb,
	"metadata" jsonb,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer,
	"trigger_id" integer,
	"campaign_id" integer,
	"queue_id" integer,
	"date" timestamp NOT NULL,
	"hour" integer,
	"channel" varchar(50) NOT NULL,
	"segment" varchar(100),
	"queued" integer DEFAULT 0,
	"sent" integer DEFAULT 0,
	"delivered" integer DEFAULT 0,
	"failed" integer DEFAULT 0,
	"bounced" integer DEFAULT 0,
	"opened" integer DEFAULT 0,
	"clicked" integer DEFAULT 0,
	"converted" integer DEFAULT 0,
	"unsubscribed" integer DEFAULT 0,
	"avg_delivery_time" real,
	"open_rate" real,
	"click_rate" real,
	"conversion_rate" real,
	"unsubscribe_rate" real,
	"cost_per_send" real,
	"total_cost" real,
	"spam_score" real,
	"reputation_score" real,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'draft',
	"target_audience" jsonb,
	"estimated_reach" integer DEFAULT 0,
	"start_date" timestamp,
	"end_date" timestamp,
	"primary_goal" varchar(100),
	"success_metrics" jsonb,
	"is_test_campaign" boolean DEFAULT false,
	"test_configuration" jsonb,
	"budget_limit" real,
	"send_limit" integer,
	"tags" jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_campaigns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notification_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" varchar(50) NOT NULL,
	"provider" varchar(100) NOT NULL,
	"config" jsonb NOT NULL,
	"credentials" jsonb,
	"is_active" boolean DEFAULT true,
	"is_primary" boolean DEFAULT false,
	"priority" integer DEFAULT 1,
	"rate_limit" integer DEFAULT 1000,
	"daily_limit" integer DEFAULT 10000,
	"last_health_check" timestamp,
	"health_status" varchar(20) DEFAULT 'healthy',
	"error_rate" real DEFAULT 0,
	"cost_per_send" real DEFAULT 0,
	"monthly_budget" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_channels_channel_unique" UNIQUE("channel")
);
--> statement-breakpoint
CREATE TABLE "notification_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer,
	"trigger_id" integer,
	"campaign_id" integer,
	"user_id" varchar(255),
	"session_id" varchar(255),
	"recipient_email" varchar(255),
	"recipient_phone" varchar(50),
	"recipient_push_token" text,
	"channel" varchar(50) NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"html_content" text,
	"personalization_data" jsonb,
	"rendered_at" timestamp,
	"priority" varchar(20) DEFAULT 'normal',
	"scheduled_for" timestamp DEFAULT now(),
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"status" varchar(20) DEFAULT 'queued',
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"failed_at" timestamp,
	"error_message" text,
	"provider_response" jsonb,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"converted_at" timestamp,
	"unsubscribed_at" timestamp,
	"delivery_time" integer,
	"engagement_score" real,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"channel" varchar(50) NOT NULL,
	"type" varchar(100) NOT NULL,
	"subject" text,
	"body_template" text NOT NULL,
	"html_template" text,
	"variables" jsonb,
	"priority" varchar(20) DEFAULT 'normal',
	"segment" varchar(100),
	"locale" varchar(10) DEFAULT 'en',
	"personalization_rules" jsonb,
	"ai_optimized" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"testing_enabled" boolean DEFAULT false,
	"conversion_goal" varchar(100),
	"requires_consent" boolean DEFAULT false,
	"gdpr_compliant" boolean DEFAULT true,
	"tags" jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notification_triggers" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"trigger_type" varchar(50) NOT NULL,
	"event_name" varchar(100),
	"conditions" jsonb NOT NULL,
	"delay" integer DEFAULT 0,
	"time_window" jsonb,
	"timezone" varchar(50) DEFAULT 'UTC',
	"target_segments" jsonb,
	"exclude_segments" jsonb,
	"channel_priority" jsonb NOT NULL,
	"fallback_logic" jsonb,
	"max_sends_per_user" integer DEFAULT 1,
	"cooldown_period" integer DEFAULT 1440,
	"is_active" boolean DEFAULT true,
	"pause_after_failures" integer DEFAULT 5,
	"priority" varchar(20) DEFAULT 'normal',
	"expected_volume" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_triggers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"session_id" varchar(255),
	"email" varchar(255),
	"email_enabled" boolean DEFAULT true,
	"sms_enabled" boolean DEFAULT false,
	"push_enabled" boolean DEFAULT true,
	"in_app_enabled" boolean DEFAULT true,
	"whatsapp_enabled" boolean DEFAULT false,
	"marketing_enabled" boolean DEFAULT true,
	"transactional_enabled" boolean DEFAULT true,
	"security_enabled" boolean DEFAULT true,
	"product_updates_enabled" boolean DEFAULT true,
	"frequency" varchar(20) DEFAULT 'normal',
	"quiet_hours" jsonb,
	"timezone" varchar(50) DEFAULT 'UTC',
	"personalization_level" varchar(20) DEFAULT 'standard',
	"ai_optimization_enabled" boolean DEFAULT true,
	"consent_given" boolean DEFAULT false,
	"consent_date" timestamp,
	"gdpr_compliant" boolean DEFAULT true,
	"global_opt_out" boolean DEFAULT false,
	"opt_out_date" timestamp,
	"opt_out_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deep_link_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255),
	"link_type" varchar(50),
	"source_url" text,
	"target_path" varchar(500),
	"campaign_source" varchar(100),
	"campaign_medium" varchar(100),
	"campaign_name" varchar(100),
	"referrer" text,
	"user_agent" text,
	"is_success" boolean DEFAULT true,
	"error_message" text,
	"conversion_value" real,
	"timestamp" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "device_capabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255),
	"device_type" varchar(50),
	"operating_system" varchar(50),
	"os_version" varchar(50),
	"browser_engine" varchar(50),
	"screen_resolution" varchar(50),
	"color_depth" integer,
	"pixel_ratio" real,
	"touch_support" boolean DEFAULT false,
	"gpu_info" jsonb,
	"network_type" varchar(20),
	"battery_level" real,
	"memory_gb" real,
	"storage_gb" real,
	"supported_features" jsonb,
	"performance_metrics" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mobile_app_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" varchar(50) NOT NULL,
	"app_version" varchar(50) NOT NULL,
	"build_number" integer NOT NULL,
	"manifest_config" jsonb NOT NULL,
	"native_plugins" jsonb,
	"permissions" jsonb,
	"store_listing_data" jsonb,
	"security_config" jsonb,
	"performance_config" jsonb,
	"compliance_settings" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offline_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255),
	"action" varchar(100) NOT NULL,
	"endpoint" varchar(255),
	"method" varchar(10) DEFAULT 'POST',
	"data" jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "push_personalization" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer,
	"session_id" varchar(255),
	"user_archetype" varchar(100),
	"preferred_time" varchar(20),
	"timezone" varchar(50),
	"engagement_score" real DEFAULT 0,
	"click_through_rate" real DEFAULT 0,
	"unsubscribe_rate" real DEFAULT 0,
	"content_preferences" jsonb,
	"device_preferences" jsonb,
	"behavior_metrics" jsonb,
	"last_engagement" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255),
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_notification_at" timestamp,
	"metadata" jsonb,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "pwa_aso_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_name" varchar(255) NOT NULL,
	"platform" varchar(50) NOT NULL,
	"keyword" varchar(255),
	"ranking" integer,
	"search_volume" integer,
	"conversion_rate" real,
	"impressions" integer DEFAULT 0,
	"installs" integer DEFAULT 0,
	"date" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "pwa_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"vapid_public_key" text,
	"notification_topics" jsonb DEFAULT '[]'::jsonb,
	"cache_strategy" varchar(50) DEFAULT 'networkFirst',
	"offline_pages" jsonb DEFAULT '[]'::jsonb,
	"install_prompt_config" jsonb,
	"features" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pwa_installs" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255),
	"user_agent" text,
	"platform" varchar(50),
	"install_source" varchar(50),
	"engagement_score" integer DEFAULT 0,
	"device_info" jsonb,
	"installed_at" timestamp DEFAULT now(),
	"uninstalled_at" timestamp,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "pwa_notification_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb,
	"targeted_users" integer DEFAULT 0,
	"delivered_count" integer DEFAULT 0,
	"clicked_count" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "pwa_performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255),
	"device_id" varchar(255),
	"metric_type" varchar(50),
	"metric_value" real NOT NULL,
	"url" text,
	"connection_type" varchar(20),
	"device_type" varchar(20),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now(),
	"additional_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "pwa_usage_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255),
	"date" timestamp DEFAULT now(),
	"is_standalone" boolean DEFAULT false,
	"is_offline" boolean DEFAULT false,
	"page_views" integer DEFAULT 0,
	"session_duration" integer DEFAULT 0,
	"features_used" jsonb DEFAULT '[]'::jsonb,
	"errors" jsonb DEFAULT '[]'::jsonb,
	"performance" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "funnel_ab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"funnel_id" integer,
	"test_type" varchar(50) DEFAULT 'ab',
	"variants" jsonb NOT NULL,
	"traffic_split" jsonb NOT NULL,
	"target_audience" jsonb,
	"start_conditions" jsonb,
	"stop_conditions" jsonb,
	"status" varchar(50) DEFAULT 'draft',
	"winning_variant" varchar(100),
	"confidence" real,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "funnel_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"funnel_id" integer,
	"block_id" integer,
	"date" timestamp NOT NULL,
	"period" varchar(20) DEFAULT 'daily',
	"views" integer DEFAULT 0,
	"interactions" integer DEFAULT 0,
	"completions" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"abandons" integer DEFAULT 0,
	"average_time_spent" real DEFAULT 0,
	"bounce_rate" real DEFAULT 0,
	"conversion_rate" real DEFAULT 0,
	"engagement_score" real DEFAULT 0,
	"revenue" real DEFAULT 0,
	"avg_order_value" real DEFAULT 0,
	"ltv" real DEFAULT 0,
	"variant" varchar(100),
	"test_confidence" real,
	"segment" varchar(100),
	"demographic_data" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "funnel_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"category" varchar(100),
	"config" jsonb NOT NULL,
	"content" jsonb NOT NULL,
	"styling" jsonb,
	"entry_conditions" jsonb,
	"exit_conditions" jsonb,
	"personalization_rules" jsonb,
	"tracking_events" jsonb,
	"is_reusable" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "funnel_blocks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "funnel_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"funnel_session_id" integer,
	"event_type" varchar(100) NOT NULL,
	"block_id" integer,
	"block_type" varchar(100),
	"event_data" jsonb,
	"user_input" jsonb,
	"timestamp" timestamp DEFAULT now(),
	"time_on_block" integer,
	"scroll_depth" real,
	"click_position" jsonb,
	"emotion_detected" varchar(50),
	"intent_score" real,
	"engagement_level" varchar(50),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "funnel_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"endpoint" varchar(500),
	"credentials" jsonb,
	"config" jsonb,
	"event_mapping" jsonb,
	"data_mapping" jsonb,
	"is_active" boolean DEFAULT true,
	"last_sync" timestamp,
	"error_count" integer DEFAULT 0,
	"last_error" text,
	"rate_limit_config" jsonb,
	"retry_config" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "funnel_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"category" varchar(100),
	"is_public" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"version" varchar(50) DEFAULT '1.0.0',
	"blocks" jsonb NOT NULL,
	"flow_logic" jsonb NOT NULL,
	"trigger_rules" jsonb,
	"personalization_rules" jsonb,
	"ai_optimization_settings" jsonb,
	"ml_model_config" jsonb,
	"conversion_goals" jsonb,
	"testing_config" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "funnel_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "funnel_triggers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"funnel_id" integer,
	"trigger_type" varchar(100) NOT NULL,
	"conditions" jsonb NOT NULL,
	"action" varchar(100) NOT NULL,
	"action_config" jsonb,
	"audience_rules" jsonb,
	"timing_rules" jsonb,
	"frequency_rules" jsonb,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 100,
	"trigger_count" integer DEFAULT 0,
	"success_rate" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_funnel_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"funnel_id" integer,
	"current_block_id" integer,
	"current_step" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'active',
	"user_vector" jsonb,
	"emotion_state" jsonb,
	"device_info" jsonb,
	"geo_location" jsonb,
	"referral_source" varchar(255),
	"completed_blocks" jsonb DEFAULT '[]'::jsonb,
	"skipped_blocks" jsonb DEFAULT '[]'::jsonb,
	"block_responses" jsonb DEFAULT '{}'::jsonb,
	"assigned_variant" varchar(100),
	"personalization_applied" jsonb,
	"ai_recommendations" jsonb,
	"engagement_score" real DEFAULT 0,
	"conversion_score" real DEFAULT 0,
	"total_time_spent" integer DEFAULT 0,
	"started_at" timestamp DEFAULT now(),
	"last_activity_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"resume_token" varchar(255),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "codex_audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" varchar(255) NOT NULL,
	"audit_type" varchar(100) NOT NULL,
	"scope" varchar(255) NOT NULL,
	"target_path" varchar(500),
	"status" varchar(50) DEFAULT 'pending',
	"priority" varchar(20) DEFAULT 'medium',
	"llm_provider" varchar(100) DEFAULT 'openai',
	"model_used" varchar(100),
	"prompt_template" text,
	"issues_found" integer DEFAULT 0,
	"issues_resolved" integer DEFAULT 0,
	"audit_score" real,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"execution_time" integer,
	"triggered_by" varchar(100),
	"audit_config" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "codex_audits_audit_id_unique" UNIQUE("audit_id")
);
--> statement-breakpoint
CREATE TABLE "codex_fixes" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_id" integer,
	"fix_id" varchar(255) NOT NULL,
	"fix_type" varchar(100) NOT NULL,
	"fix_category" varchar(100),
	"file_path" varchar(500) NOT NULL,
	"original_code" text,
	"fixed_code" text,
	"diff_patch" text,
	"status" varchar(50) DEFAULT 'pending',
	"apply_method" varchar(100),
	"requires_approval" boolean DEFAULT true,
	"approved_by" varchar(255),
	"approved_at" timestamp,
	"rejected_by" varchar(255),
	"rejected_at" timestamp,
	"rejection_reason" text,
	"commit_hash" varchar(100),
	"branch_name" varchar(255),
	"pull_request_url" varchar(500),
	"can_rollback" boolean DEFAULT true,
	"rollback_data" jsonb,
	"rolled_back_at" timestamp,
	"tests_passed" boolean,
	"validation_results" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"applied_at" timestamp,
	CONSTRAINT "codex_fixes_fix_id_unique" UNIQUE("fix_id")
);
--> statement-breakpoint
CREATE TABLE "codex_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" integer,
	"issue_id" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"type" varchar(100) NOT NULL,
	"file_path" varchar(500),
	"line_number" integer,
	"column_number" integer,
	"code_snippet" text,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"recommendation" text,
	"status" varchar(50) DEFAULT 'open',
	"resolution" varchar(50),
	"ai_confidence" real,
	"ai_reasoning" text,
	"proposed_fix" text,
	"fix_diff" text,
	"fix_applied" boolean DEFAULT false,
	"impact_score" real,
	"risk_level" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	CONSTRAINT "codex_issues_issue_id_unique" UNIQUE("issue_id")
);
--> statement-breakpoint
CREATE TABLE "codex_learning" (
	"id" serial PRIMARY KEY NOT NULL,
	"learning_id" varchar(255) NOT NULL,
	"pattern_type" varchar(100) NOT NULL,
	"pattern_data" jsonb NOT NULL,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"neuron_scope" varchar(100),
	"occurrence_count" integer DEFAULT 1,
	"success_rate" real,
	"confidence" real,
	"prevention_rule" jsonb,
	"improvement_suggestion" text,
	"automation_opportunity" text,
	"impact_score" real,
	"priority_level" varchar(20),
	"is_active" boolean DEFAULT true,
	"last_seen" timestamp DEFAULT now(),
	"evolution_stage" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "codex_learning_learning_id_unique" UNIQUE("learning_id")
);
--> statement-breakpoint
CREATE TABLE "codex_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" varchar(255) NOT NULL,
	"report_type" varchar(100) NOT NULL,
	"period" varchar(50),
	"scope" varchar(100),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"report_data" jsonb NOT NULL,
	"summary" jsonb,
	"metrics" jsonb,
	"insights" jsonb,
	"recommendations" jsonb,
	"generated_by" varchar(100),
	"generation_time" integer,
	"status" varchar(50) DEFAULT 'generated',
	"is_public" boolean DEFAULT false,
	"export_formats" jsonb,
	"distribution_list" jsonb,
	"last_distributed" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "codex_reports_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE "codex_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"audit_types" jsonb NOT NULL,
	"cron_expression" varchar(100),
	"frequency" varchar(50),
	"next_run" timestamp,
	"last_run" timestamp,
	"scope" jsonb,
	"filters" jsonb,
	"llm_config" jsonb,
	"audit_config" jsonb,
	"auto_fix_enabled" boolean DEFAULT false,
	"max_auto_fixes" integer DEFAULT 10,
	"is_active" boolean DEFAULT true,
	"last_successful_run" timestamp,
	"consecutive_failures" integer DEFAULT 0,
	"health_status" varchar(50) DEFAULT 'healthy',
	"notify_on_completion" boolean DEFAULT false,
	"notify_on_failure" boolean DEFAULT true,
	"notification_channels" jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "codex_schedules_schedule_id_unique" UNIQUE("schedule_id")
);
--> statement-breakpoint
CREATE TABLE "content_feed" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"external_id" varchar(255),
	"content_type" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"content" text,
	"excerpt" text,
	"category" varchar(100),
	"tags" jsonb,
	"price" numeric(10, 2),
	"original_price" numeric(10, 2),
	"currency" varchar(10),
	"discount" numeric(5, 2),
	"coupon_code" varchar(100),
	"affiliate_url" text,
	"merchant_name" varchar(255),
	"author" varchar(255),
	"published_at" timestamp,
	"image_url" text,
	"images" jsonb,
	"rating" numeric(3, 2),
	"review_count" integer,
	"views" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"ctr" numeric(5, 4) DEFAULT '0',
	"conversion_rate" numeric(5, 4) DEFAULT '0',
	"quality_score" numeric(3, 2),
	"status" varchar(50) DEFAULT 'active',
	"is_manually_overridden" boolean DEFAULT false,
	"manual_priority" integer,
	"ai_enriched" boolean DEFAULT false,
	"ai_generated_content" jsonb,
	"ai_quality_flags" jsonb,
	"compliance_status" varchar(50) DEFAULT 'pending',
	"moderation_flags" jsonb,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_feed_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer,
	"date" timestamp NOT NULL,
	"metric" varchar(100) NOT NULL,
	"value" numeric(15, 4) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_feed_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"parent_id" integer,
	"description" text,
	"icon" varchar(100),
	"vertical_neuron" varchar(100),
	"content_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "content_feed_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_feed_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer,
	"session_id" varchar(255),
	"user_id" varchar(255),
	"interaction_type" varchar(100) NOT NULL,
	"metadata" jsonb,
	"revenue" numeric(10, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_feed_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer,
	"source_id" integer,
	"notification_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"severity" varchar(50) DEFAULT 'info',
	"is_read" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_feed_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"source_id" integer,
	"rule_type" varchar(100) NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"applied_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_feed_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"source_type" varchar(100) NOT NULL,
	"api_endpoint" text,
	"auth_config" jsonb,
	"refresh_interval" integer DEFAULT 3600,
	"is_active" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"next_sync_at" timestamp,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_feed_sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"sync_type" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"items_processed" integer DEFAULT 0,
	"items_added" integer DEFAULT 0,
	"items_updated" integer DEFAULT 0,
	"items_removed" integer DEFAULT 0,
	"errors" jsonb,
	"metadata" jsonb,
	"duration" integer,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "affiliate_compliance_management" (
	"id" serial PRIMARY KEY NOT NULL,
	"network_name" varchar(255) NOT NULL,
	"network_type" varchar(100) NOT NULL,
	"network_id" varchar(255),
	"allowed_countries" jsonb,
	"restricted_countries" jsonb,
	"restricted_regions" jsonb,
	"legal_frameworks" jsonb,
	"required_disclosures" jsonb,
	"disclosure_templates" jsonb,
	"disclosure_position" varchar(50),
	"disclosure_languages" jsonb,
	"network_policies" jsonb,
	"commission_structure" jsonb,
	"cookie_duration" integer,
	"tracking_methods" jsonb,
	"compliance_checks" jsonb,
	"last_compliance_check" timestamp,
	"compliance_score" numeric(3, 2),
	"violation_history" jsonb,
	"status" varchar(50) DEFAULT 'active',
	"contract_start" timestamp,
	"contract_end" timestamp,
	"auto_renewal" boolean DEFAULT false,
	"total_clicks" integer DEFAULT 0,
	"total_conversions" integer DEFAULT 0,
	"total_revenue" numeric(12, 2) DEFAULT '0',
	"avg_epc" numeric(8, 4),
	"account_manager" varchar(255),
	"support_email" varchar(320),
	"technical_contact" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compliance_audit_system" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" varchar(100) NOT NULL,
	"audit_type" varchar(100) NOT NULL,
	"vertical" varchar(100),
	"country" varchar(10),
	"date_range" jsonb,
	"audit_criteria" jsonb,
	"status" varchar(50) DEFAULT 'scheduled',
	"started_at" timestamp,
	"completed_at" timestamp,
	"executed_by" varchar(255),
	"automated_scan" boolean DEFAULT true,
	"overall_score" numeric(3, 2),
	"critical_issues" integer DEFAULT 0,
	"high_issues" integer DEFAULT 0,
	"medium_issues" integer DEFAULT 0,
	"low_issues" integer DEFAULT 0,
	"audit_findings" jsonb,
	"non_compliance_items" jsonb,
	"recommended_actions" jsonb,
	"risk_assessment" jsonb,
	"previous_audit_id" integer,
	"improvement_score" numeric(3, 2),
	"trend_analysis" jsonb,
	"remediation_plan" jsonb,
	"remediation_deadline" timestamp,
	"remediation_status" varchar(50),
	"follow_up_required" boolean DEFAULT false,
	"next_audit_date" timestamp,
	"report_generated" boolean DEFAULT false,
	"report_url" text,
	"report_format" varchar(50),
	"stakeholders_notified" boolean DEFAULT false,
	"audit_framework" varchar(100),
	"audit_standard" varchar(100),
	"certification_impact" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "compliance_audit_system_audit_id_unique" UNIQUE("audit_id")
);
--> statement-breakpoint
CREATE TABLE "compliance_rbac_management" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role_id" varchar(100) NOT NULL,
	"role_name" varchar(255) NOT NULL,
	"permissions" jsonb,
	"vertical_access" jsonb,
	"country_access" jsonb,
	"data_access" jsonb,
	"role_type" varchar(50) NOT NULL,
	"access_level" varchar(50) NOT NULL,
	"can_view_pii" boolean DEFAULT false,
	"can_export_data" boolean DEFAULT false,
	"can_delete_data" boolean DEFAULT false,
	"can_manage_consent" boolean DEFAULT false,
	"session_timeout" integer DEFAULT 3600,
	"ip_whitelist" jsonb,
	"require_mfa" boolean DEFAULT true,
	"last_login" timestamp,
	"failed_login_attempts" integer DEFAULT 0,
	"account_locked" boolean DEFAULT false,
	"is_delegated" boolean DEFAULT false,
	"delegated_by" varchar(255),
	"delegation_reason" text,
	"access_expires_at" timestamp,
	"access_log" jsonb,
	"actions_performed" jsonb,
	"data_accessed" jsonb,
	"compliance_training" jsonb,
	"status" varchar(50) DEFAULT 'active',
	"granted_by" varchar(255),
	"granted_at" timestamp DEFAULT now(),
	"revoked_by" varchar(255),
	"revoked_at" timestamp,
	"revocation_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "geo_restriction_management" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" varchar(100) NOT NULL,
	"rule_name" varchar(255) NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"target_countries" jsonb,
	"target_regions" jsonb,
	"excluded_countries" jsonb,
	"excluded_regions" jsonb,
	"content_types" jsonb,
	"verticals" jsonb,
	"affiliate_networks" jsonb,
	"offer_categories" jsonb,
	"conditions" jsonb,
	"actions" jsonb,
	"fallback_content" jsonb,
	"redirect_url" text,
	"legal_basis" varchar(255),
	"compliance_framework" varchar(100),
	"regulatory_requirement" text,
	"status" varchar(50) DEFAULT 'active',
	"priority" integer DEFAULT 100,
	"effective_date" timestamp,
	"expiration_date" timestamp,
	"applications_count" integer DEFAULT 0,
	"blocked_requests" integer DEFAULT 0,
	"allowed_requests" integer DEFAULT 0,
	"last_triggered" timestamp,
	"test_mode" boolean DEFAULT false,
	"test_results" jsonb,
	"validation_status" varchar(50),
	"created_by" varchar(255),
	"last_modified_by" varchar(255),
	"change_reason" text,
	"approval_required" boolean DEFAULT false,
	"approved_by" varchar(255),
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "geo_restriction_management_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
CREATE TABLE "global_consent_management" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"session_id" varchar(255),
	"fingerprint" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"country" varchar(10) NOT NULL,
	"region" varchar(100),
	"detected_region" varchar(100),
	"legal_framework" varchar(50) NOT NULL,
	"language_code" varchar(10) DEFAULT 'en',
	"cookies_consent" varchar(20) DEFAULT 'pending',
	"analytics_consent" varchar(20) DEFAULT 'pending',
	"personalization_consent" varchar(20) DEFAULT 'pending',
	"marketing_consent" varchar(20) DEFAULT 'pending',
	"affiliate_consent" varchar(20) DEFAULT 'pending',
	"email_consent" varchar(20) DEFAULT 'pending',
	"push_consent" varchar(20) DEFAULT 'pending',
	"sms_consent" varchar(20) DEFAULT 'pending',
	"consent_details" jsonb,
	"consent_method" varchar(50),
	"consent_version" varchar(20) NOT NULL,
	"legal_basis" varchar(100),
	"consent_evidence" jsonb,
	"withdrawal_reason" text,
	"consent_granted_at" timestamp,
	"consent_withdrawn_at" timestamp,
	"last_updated_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"requires_reconfirmation" boolean DEFAULT false,
	"is_minor" boolean DEFAULT false,
	"parental_consent_required" boolean DEFAULT false,
	"audit_trail" jsonb,
	"synced_with_external_systems" jsonb,
	"compliance_score" numeric(3, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "privacy_policy_management" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"vertical" varchar(100),
	"country" varchar(10),
	"language" varchar(10) DEFAULT 'en',
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"html_content" text,
	"summary" text,
	"legal_frameworks" jsonb,
	"required_disclosures" jsonb,
	"affiliate_networks" jsonb,
	"ad_networks" jsonb,
	"version" varchar(50) NOT NULL,
	"previous_version_id" integer,
	"status" varchar(50) DEFAULT 'draft',
	"approved_by" varchar(255),
	"approved_at" timestamp,
	"is_auto_generated" boolean DEFAULT false,
	"generation_prompt" text,
	"ai_model" varchar(100),
	"generation_metadata" jsonb,
	"published_at" timestamp,
	"effective_date" timestamp,
	"expiration_date" timestamp,
	"notification_sent" boolean DEFAULT false,
	"notification_sent_at" timestamp,
	"views" integer DEFAULT 0,
	"acceptances" integer DEFAULT 0,
	"rejections" integer DEFAULT 0,
	"avg_read_time" integer,
	"bounce_rate" numeric(5, 4),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_data_control_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" varchar(100) NOT NULL,
	"user_id" varchar(255),
	"email" varchar(320),
	"request_type" varchar(50) NOT NULL,
	"legal_basis" varchar(100),
	"description" text,
	"data_categories" jsonb,
	"verticals" jsonb,
	"date_range" jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"priority" varchar(20) DEFAULT 'normal',
	"assigned_to" varchar(255),
	"verification_method" varchar(100),
	"verification_status" varchar(50) DEFAULT 'pending',
	"verification_attempts" integer DEFAULT 0,
	"verification_data" jsonb,
	"estimated_completion_date" timestamp,
	"actual_completion_date" timestamp,
	"processing_notes" text,
	"rejection_reason" text,
	"export_format" varchar(50),
	"export_file_size" integer,
	"export_url" text,
	"download_count" integer DEFAULT 0,
	"export_expires_at" timestamp,
	"follow_up_required" boolean DEFAULT false,
	"appealed" boolean DEFAULT false,
	"appeal_reason" text,
	"appeal_status" varchar(50),
	"response_time" integer,
	"sla_compliance" boolean,
	"audit_trail" jsonb,
	"notifications_sent" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_data_control_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "affiliate_partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"company" varchar(255),
	"partner_type" varchar(50) NOT NULL,
	"commission_rate" real DEFAULT 0,
	"custom_commissions" jsonb,
	"payout_method" varchar(50) DEFAULT 'paypal',
	"payout_details" jsonb,
	"total_earnings" numeric(15, 2) DEFAULT '0',
	"pending_earnings" numeric(15, 2) DEFAULT '0',
	"paid_earnings" numeric(15, 2) DEFAULT '0',
	"total_sales" integer DEFAULT 0,
	"total_clicks" integer DEFAULT 0,
	"conversion_rate" real DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"tier" varchar(20) DEFAULT 'standard',
	"allowed_products" integer[],
	"cookie_duration" integer DEFAULT 30,
	"phone" varchar(50),
	"website" varchar(255),
	"social_profiles" jsonb,
	"tax_info" jsonb,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"verified_at" timestamp,
	"last_activity_at" timestamp,
	CONSTRAINT "affiliate_partners_partner_id_unique" UNIQUE("partner_id")
);
--> statement-breakpoint
CREATE TABLE "affiliate_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" varchar(100) NOT NULL,
	"order_id" integer,
	"product_id" integer,
	"click_id" varchar(255) NOT NULL,
	"session_id" varchar(255),
	"user_id" varchar(255),
	"campaign" varchar(100),
	"source" varchar(100),
	"medium" varchar(100),
	"content" varchar(255),
	"sale_amount" numeric(10, 2),
	"commission_rate" real,
	"commission_amount" numeric(10, 2),
	"commission_status" varchar(20) DEFAULT 'pending',
	"clicked_at" timestamp,
	"converted_at" timestamp,
	"conversion_type" varchar(50),
	"ip_address" varchar(45),
	"user_agent" text,
	"country_code" varchar(2),
	"device_type" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "affiliate_tracking_click_id_unique" UNIQUE("click_id")
);
--> statement-breakpoint
CREATE TABLE "digital_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"long_description" text,
	"product_type" varchar(50) NOT NULL,
	"category" varchar(100),
	"tags" text[],
	"base_price" numeric(10, 2) NOT NULL,
	"sale_price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"price_by_country" jsonb,
	"featured_image" text,
	"gallery_images" text[],
	"preview_url" text,
	"demo_url" text,
	"video_url" text,
	"download_url" text,
	"access_type" varchar(50) DEFAULT 'immediate',
	"drip_schedule" jsonb,
	"license_type" varchar(50) DEFAULT 'single',
	"max_downloads" integer DEFAULT -1,
	"expiration_days" integer,
	"meta_title" text,
	"meta_description" text,
	"keywords" text[],
	"upsell_products" integer[],
	"cross_sell_products" integer[],
	"bundle_products" integer[],
	"total_sales" integer DEFAULT 0,
	"total_revenue" numeric(15, 2) DEFAULT '0',
	"conversion_rate" real DEFAULT 0,
	"average_rating" real DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"personalization_tags" text[],
	"target_archetypes" text[],
	"emotion_triggers" jsonb,
	"ai_optimized_title" text,
	"ai_optimized_description" text,
	"status" varchar(20) DEFAULT 'draft',
	"is_digital" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"auto_optimize" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"published_at" timestamp,
	CONSTRAINT "digital_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(100) NOT NULL,
	"session_id" varchar(255),
	"user_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"customer_info" jsonb,
	"billing_address" jsonb,
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"shipping_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"payment_method" varchar(50),
	"payment_provider" varchar(50),
	"transaction_id" varchar(255),
	"payment_status" varchar(20) DEFAULT 'pending',
	"fulfillment_status" varchar(20) DEFAULT 'pending',
	"delivery_method" varchar(50) DEFAULT 'digital',
	"download_links" jsonb,
	"access_keys" jsonb,
	"promo_code" varchar(100),
	"affiliate_id" varchar(255),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"device_info" jsonb,
	"ip_address" varchar(45),
	"country_code" varchar(2),
	"conversion_source" varchar(100),
	"affiliate_commission" numeric(10, 2) DEFAULT '0',
	"partner_revenue" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"paid_at" timestamp,
	"delivered_at" timestamp,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "product_licenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" varchar(255),
	"license_key" varchar(255) NOT NULL,
	"license_type" varchar(50) NOT NULL,
	"max_activations" integer DEFAULT 1,
	"current_activations" integer DEFAULT 0,
	"download_count" integer DEFAULT 0,
	"max_downloads" integer DEFAULT -1,
	"status" varchar(20) DEFAULT 'active',
	"expires_at" timestamp,
	"last_accessed_at" timestamp,
	"last_download_at" timestamp,
	"allowed_ips" text[],
	"device_fingerprints" jsonb,
	"suspicious_activity" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"activated_at" timestamp,
	CONSTRAINT "product_licenses_license_key_unique" UNIQUE("license_key")
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"order_id" integer,
	"user_id" varchar(255),
	"email" varchar(255),
	"rating" integer NOT NULL,
	"title" varchar(255),
	"content" text,
	"pros" text[],
	"cons" text[],
	"is_verified_purchase" boolean DEFAULT false,
	"is_recommended" boolean,
	"helpful_votes" integer DEFAULT 0,
	"total_votes" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"moderated_by" varchar(255),
	"moderation_notes" text,
	"sentiment_score" real,
	"key_phrases" text[],
	"ai_summary" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"moderated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"features" jsonb,
	"max_licenses" integer DEFAULT 1,
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255),
	"description" text,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2),
	"max_discount_amount" numeric(10, 2),
	"max_uses" integer DEFAULT -1,
	"current_uses" integer DEFAULT 0,
	"max_uses_per_user" integer DEFAULT 1,
	"applicable_products" integer[],
	"excluded_products" integer[],
	"applicable_categories" text[],
	"valid_from" timestamp,
	"valid_until" timestamp,
	"target_countries" varchar(2)[],
	"target_user_segments" text[],
	"first_time_customers_only" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT true,
	"auto_apply" boolean DEFAULT false,
	"total_savings" numeric(15, 2) DEFAULT '0',
	"conversion_rate" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "shopping_carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'USD',
	"promo_code" varchar(100),
	"abandoned_at" timestamp,
	"recovery_email_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "storefront_ab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"test_type" varchar(50) NOT NULL,
	"target_element" varchar(100),
	"variants" jsonb NOT NULL,
	"traffic_split" jsonb,
	"success_metric" varchar(50) NOT NULL,
	"minimum_sample_size" integer DEFAULT 100,
	"confidence_level" real DEFAULT 0.95,
	"minimum_detectable_effect" real DEFAULT 0.05,
	"status" varchar(20) DEFAULT 'draft',
	"winning_variant" varchar(50),
	"statistical_significance" real,
	"results" jsonb,
	"target_products" integer[],
	"target_segments" text[],
	"target_countries" varchar(2)[],
	"start_date" timestamp,
	"end_date" timestamp,
	"max_duration" integer,
	"total_participants" integer DEFAULT 0,
	"total_conversions" integer DEFAULT 0,
	"revenue_impact" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "storefront_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"product_id" integer,
	"page_views" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	"sessions" integer DEFAULT 0,
	"bounce_rate" real DEFAULT 0,
	"avg_session_duration" integer DEFAULT 0,
	"add_to_cart_rate" real DEFAULT 0,
	"checkout_rate" real DEFAULT 0,
	"conversion_rate" real DEFAULT 0,
	"average_order_value" numeric(10, 2) DEFAULT '0',
	"total_orders" integer DEFAULT 0,
	"total_revenue" numeric(15, 2) DEFAULT '0',
	"refund_rate" real DEFAULT 0,
	"product_views" integer DEFAULT 0,
	"product_clicks" integer DEFAULT 0,
	"wishlist_adds" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"top_countries" jsonb,
	"top_cities" jsonb,
	"top_devices" jsonb,
	"top_sources" jsonb,
	"top_channels" jsonb,
	"ai_insights" jsonb,
	"optimization_suggestions" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cta_ab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"variants" jsonb NOT NULL,
	"traffic_allocation" jsonb,
	"targeting_rules" jsonb,
	"hypothesis" text,
	"primary_metric" varchar(100),
	"secondary_metrics" jsonb,
	"minimum_sample_size" integer DEFAULT 1000,
	"significance_threshold" real DEFAULT 0.05,
	"status" varchar(50) DEFAULT 'draft',
	"start_date" timestamp,
	"end_date" timestamp,
	"planned_duration" integer,
	"results" jsonb,
	"winning_variant" varchar(50),
	"confidence_level" real,
	"created_by" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cta_ab_tests_test_id_unique" UNIQUE("test_id")
);
--> statement-breakpoint
CREATE TABLE "cta_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(100) NOT NULL,
	"instance_id" varchar(100) NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"event_type" varchar(100) NOT NULL,
	"event_data" jsonb,
	"dwell_time" integer DEFAULT 0,
	"interaction_depth" integer DEFAULT 0,
	"completion_rate" real DEFAULT 0,
	"render_time" integer,
	"frame_rate" real,
	"device_performance" jsonb,
	"entry_point" varchar(255),
	"exit_point" varchar(255),
	"conversion_action" varchar(255),
	"page_url" text,
	"referrer" text,
	"device_info" jsonb,
	"browser_info" jsonb,
	"geolocation" jsonb,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "cta_analytics_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "cta_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"format" varchar(50) NOT NULL,
	"category" varchar(100),
	"file_path" text NOT NULL,
	"file_size" integer,
	"dimensions" jsonb,
	"resolution" jsonb,
	"compression_level" varchar(50),
	"lod_levels" jsonb,
	"optimized_versions" jsonb,
	"tags" jsonb,
	"license" varchar(100),
	"attribution" text,
	"scan_status" varchar(50) DEFAULT 'pending',
	"scan_results" jsonb,
	"compliance_flags" jsonb,
	"usage_count" integer DEFAULT 0,
	"last_used" timestamp,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"uploaded_by" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cta_assets_asset_id_unique" UNIQUE("asset_id")
);
--> statement-breakpoint
CREATE TABLE "cta_compliance" (
	"id" serial PRIMARY KEY NOT NULL,
	"compliance_id" varchar(100) NOT NULL,
	"instance_id" varchar(100),
	"template_id" varchar(100),
	"compliance_type" varchar(100) NOT NULL,
	"wcag_level" varchar(10),
	"accessibility_features" jsonb,
	"alternative_formats" jsonb,
	"data_collection" jsonb,
	"consent_required" boolean DEFAULT false,
	"consent_obtained" boolean DEFAULT false,
	"privacy_policy_ref" text,
	"asset_integrity" jsonb,
	"content_security_policy" text,
	"cross_origin_policy" text,
	"content_rating" varchar(50),
	"content_warnings" jsonb,
	"cultural_considerations" jsonb,
	"last_audit_date" timestamp,
	"audit_results" jsonb,
	"remedial_actions" jsonb,
	"compliance_status" varchar(50) DEFAULT 'pending',
	"expiry_date" timestamp,
	"created_by" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cta_compliance_compliance_id_unique" UNIQUE("compliance_id")
);
--> statement-breakpoint
CREATE TABLE "cta_instances" (
	"id" serial PRIMARY KEY NOT NULL,
	"instance_id" varchar(100) NOT NULL,
	"template_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"custom_config" jsonb,
	"targeting_rules" jsonb,
	"personalization_data" jsonb,
	"context_rules" jsonb,
	"triggers" jsonb,
	"activation_conditions" jsonb,
	"display_rules" jsonb,
	"ab_test_id" varchar(100),
	"variant" varchar(50) DEFAULT 'default',
	"integration_hooks" jsonb,
	"affiliate_data" jsonb,
	"status" varchar(50) DEFAULT 'draft',
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"neuron_id" varchar(100),
	"federation_config" jsonb,
	"created_by" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cta_instances_instance_id_unique" UNIQUE("instance_id")
);
--> statement-breakpoint
CREATE TABLE "cta_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"assets" jsonb,
	"interactions" jsonb,
	"animations" jsonb,
	"physics" jsonb,
	"render_settings" jsonb,
	"device_compatibility" jsonb,
	"fallback_options" jsonb,
	"customizable_elements" jsonb,
	"branding_options" jsonb,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"created_by" varchar(100),
	"version" varchar(20) DEFAULT '1.0.0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cta_templates_template_id_unique" UNIQUE("template_id")
);
--> statement-breakpoint
CREATE TABLE "cta_user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"instance_id" varchar(100) NOT NULL,
	"user_id" varchar(255),
	"start_time" timestamp DEFAULT now(),
	"end_time" timestamp,
	"total_duration" integer,
	"device_capabilities" jsonb,
	"performance_metrics" jsonb,
	"browser_support" jsonb,
	"interactions" jsonb,
	"gesture_data" jsonb,
	"gaze_tracking" jsonb,
	"conversion_events" jsonb,
	"exit_reason" varchar(100),
	"user_feedback" jsonb,
	"page_context" jsonb,
	"user_segment" varchar(100),
	"personalization_applied" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"backup_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"backup_type" varchar(50) NOT NULL,
	"scope" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"file_size" integer,
	"checksum" varchar(128),
	"file_path" text,
	"storage_location" varchar(100) NOT NULL,
	"retention_days" integer DEFAULT 90 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_encrypted" boolean DEFAULT true NOT NULL,
	"encryption_key" varchar(128),
	"compression_ratio" real,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "backups_backup_id_unique" UNIQUE("backup_id")
);
--> statement-breakpoint
CREATE TABLE "deployment_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"user_id" integer,
	"user_agent" text,
	"ip_address" varchar(45),
	"before" jsonb,
	"after" jsonb,
	"changes" jsonb,
	"reason" text,
	"outcome" varchar(20) NOT NULL,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "deployment_audit_audit_id_unique" UNIQUE("audit_id")
);
--> statement-breakpoint
CREATE TABLE "deployment_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"permissions" jsonb NOT NULL,
	"environments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"restrictions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"granted_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"deployment_id" uuid NOT NULL,
	"step_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"step_type" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"command" text,
	"output" text,
	"error_output" text,
	"duration" integer,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rollback_command" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" serial PRIMARY KEY NOT NULL,
	"deployment_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"environment" varchar(50) NOT NULL,
	"deployment_type" varchar(50) NOT NULL,
	"version" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"completed_steps" integer DEFAULT 0 NOT NULL,
	"failed_steps" integer DEFAULT 0 NOT NULL,
	"config" jsonb NOT NULL,
	"manifest" jsonb NOT NULL,
	"logs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"health_checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"deployed_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"rollback_data" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "deployments_deployment_id_unique" UNIQUE("deployment_id")
);
--> statement-breakpoint
CREATE TABLE "disaster_recovery_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"plan_type" varchar(50) NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"rto" integer NOT NULL,
	"rpo" integer NOT NULL,
	"steps" jsonb NOT NULL,
	"dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"test_results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_tested" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "disaster_recovery_plans_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "export_archives" (
	"id" serial PRIMARY KEY NOT NULL,
	"archive_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"export_type" varchar(50) NOT NULL,
	"version" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"checksum" varchar(128) NOT NULL,
	"file_path" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"exported_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "export_archives_archive_id_unique" UNIQUE("archive_id")
);
--> statement-breakpoint
CREATE TABLE "import_operations" (
	"id" serial PRIMARY KEY NOT NULL,
	"operation_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"archive_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"import_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"processed_items" integer DEFAULT 0 NOT NULL,
	"failed_items" integer DEFAULT 0 NOT NULL,
	"import_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"logs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"imported_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"rollback_data" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "import_operations_operation_id_unique" UNIQUE("operation_id")
);
--> statement-breakpoint
CREATE TABLE "multi_region_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"primary_region" varchar(50) NOT NULL,
	"regions" jsonb NOT NULL,
	"load_balancing" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"failover_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"data_replication" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"health_check_url" text,
	"last_health_check" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "multi_region_config_config_id_unique" UNIQUE("config_id")
);
--> statement-breakpoint
CREATE TABLE "agent_memories" (
	"id" serial PRIMARY KEY NOT NULL,
	"memory_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"task_type" varchar(100) NOT NULL,
	"prompt" text NOT NULL,
	"response" text NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"embedding" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quality_score" real,
	"usage_count" integer DEFAULT 1 NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "agent_memories_memory_id_unique" UNIQUE("memory_id")
);
--> statement-breakpoint
CREATE TABLE "agent_usage_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"tracking_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"user_id" integer,
	"project_id" varchar(100),
	"task_type" varchar(100) NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_cost" real DEFAULT 0 NOT NULL,
	"latency_ms" integer NOT NULL,
	"success" boolean NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "agent_usage_tracking_tracking_id_unique" UNIQUE("tracking_id")
);
--> statement-breakpoint
CREATE TABLE "agentic_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"definition" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"trigger" jsonb NOT NULL,
	"input_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_execution_time" integer DEFAULT 300 NOT NULL,
	"retry_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cost_budget" real DEFAULT 0 NOT NULL,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"average_duration" integer DEFAULT 0 NOT NULL,
	"average_cost" real DEFAULT 0 NOT NULL,
	"last_executed" timestamp,
	"created_by" integer NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "agentic_workflows_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
CREATE TABLE "federation_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"source_neuron" varchar(100) NOT NULL,
	"target_neuron" varchar(100),
	"task_type" varchar(100) NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"assigned_agent" uuid,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"cost_budget" real DEFAULT 0 NOT NULL,
	"cost_used" real DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "federation_tasks_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "llm_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"provider" varchar(100) NOT NULL,
	"model" varchar(255) NOT NULL,
	"api_endpoint" text NOT NULL,
	"api_key" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"capabilities" jsonb NOT NULL,
	"cost_per_token" real DEFAULT 0 NOT NULL,
	"rate_limit" integer DEFAULT 0 NOT NULL,
	"max_tokens" integer DEFAULT 4096 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"success_rate" real DEFAULT 1 NOT NULL,
	"quota_daily" integer DEFAULT 0 NOT NULL,
	"quota_used" integer DEFAULT 0 NOT NULL,
	"last_used" timestamp,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "llm_agents_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"template" text NOT NULL,
	"variables" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"supported_agents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"average_tokens" integer DEFAULT 0 NOT NULL,
	"success_rate" real DEFAULT 1 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used" timestamp,
	"created_by" integer NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "prompt_templates_template_id_unique" UNIQUE("template_id")
);
--> statement-breakpoint
CREATE TABLE "router_learning" (
	"id" serial PRIMARY KEY NOT NULL,
	"learning_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"task_type" varchar(100) NOT NULL,
	"complexity" varchar(20) NOT NULL,
	"context_patterns" jsonb NOT NULL,
	"best_agent_id" uuid NOT NULL,
	"alternative_agents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"success_rate" real NOT NULL,
	"average_cost" real NOT NULL,
	"average_latency" integer NOT NULL,
	"confidence" real DEFAULT 0 NOT NULL,
	"sample_size" integer DEFAULT 1 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"model_version" varchar(50) DEFAULT '1.0' NOT NULL,
	"training_data" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "router_learning_learning_id_unique" UNIQUE("learning_id")
);
--> statement-breakpoint
CREATE TABLE "task_routing_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"task_type" varchar(100) NOT NULL,
	"task_complexity" varchar(20) NOT NULL,
	"original_agent_id" uuid NOT NULL,
	"final_agent_id" uuid NOT NULL,
	"fallback_count" integer DEFAULT 0 NOT NULL,
	"routing_reason" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_cost" real DEFAULT 0 NOT NULL,
	"latency_ms" integer NOT NULL,
	"success" boolean NOT NULL,
	"error_message" text,
	"quality_score" real,
	"conversion_impact" real,
	"context_size" integer DEFAULT 0 NOT NULL,
	"parallel_routes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "task_routing_history_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"execution_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_step" varchar(255),
	"input" jsonb NOT NULL,
	"output" jsonb,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_cost" real DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"triggered_by" varchar(100) NOT NULL,
	"user_id" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "workflow_executions_execution_id_unique" UNIQUE("execution_id")
);
--> statement-breakpoint
CREATE TABLE "federation_memory_sync" (
	"id" serial PRIMARY KEY NOT NULL,
	"sync_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"source_neuron" varchar(100) NOT NULL,
	"target_neuron" varchar(100) NOT NULL,
	"sync_type" varchar(50) NOT NULL,
	"nodes_synced" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"edges_synced" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sync_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"total_time" integer,
	"triggered_by" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "federation_memory_sync_sync_id_unique" UNIQUE("sync_id")
);
--> statement-breakpoint
CREATE TABLE "knowledge_graph_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"previous_data" jsonb,
	"new_data" jsonb NOT NULL,
	"diff" jsonb NOT NULL,
	"change_reason" text,
	"change_source" varchar(100) NOT NULL,
	"approval_status" varchar(20) DEFAULT 'pending',
	"changed_by" integer NOT NULL,
	"approved_by" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"effective_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "knowledge_graph_versions_version_id_unique" UNIQUE("version_id")
);
--> statement-breakpoint
CREATE TABLE "memory_edges" (
	"id" serial PRIMARY KEY NOT NULL,
	"edge_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"relationship_type" varchar(100) NOT NULL,
	"strength" real DEFAULT 0.5 NOT NULL,
	"direction" varchar(20) DEFAULT 'bidirectional' NOT NULL,
	"context" text,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_verified" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "memory_edges_edge_id_unique" UNIQUE("edge_id")
);
--> statement-breakpoint
CREATE TABLE "memory_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"node_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"node_type" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"embedding" jsonb,
	"embedding_model" varchar(100) DEFAULT 'text-embedding-ada-002',
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"entities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"user_archetype" varchar(100),
	"conversion_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used" timestamp,
	"quality_score" real DEFAULT 0.5 NOT NULL,
	"confidence_score" real DEFAULT 0.5 NOT NULL,
	"verification_status" varchar(20) DEFAULT 'unverified',
	"source_type" varchar(100) NOT NULL,
	"source_id" varchar(255),
	"parent_node_id" uuid,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"content_timestamp" timestamp,
	"expires_at" timestamp,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "memory_nodes_node_id_unique" UNIQUE("node_id"),
	CONSTRAINT "memory_nodes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "memory_search_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"search_type" varchar(50) NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"results_returned" integer NOT NULL,
	"top_result_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"search_time" integer NOT NULL,
	"user_id" integer,
	"user_archetype" varchar(100),
	"clicked_results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"satisfaction_score" real,
	"context_type" varchar(100),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "memory_search_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "memory_usage_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"analytics_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"context_id" varchar(255),
	"retrieval_time" integer,
	"relevance_score" real,
	"user_engagement" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"conversion_impact" real,
	"quality_feedback" real,
	"user_id" integer,
	"session_id" varchar(255),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "memory_usage_analytics_analytics_id_unique" UNIQUE("analytics_id")
);
--> statement-breakpoint
CREATE TABLE "prompt_optimizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"optimization_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"original_prompt" text NOT NULL,
	"optimized_prompt" text NOT NULL,
	"injected_nodes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"injection_strategy" varchar(100) NOT NULL,
	"task_type" varchar(100) NOT NULL,
	"user_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"session_id" varchar(255),
	"retrieval_score" real,
	"prompt_quality" real,
	"execution_time" integer NOT NULL,
	"tokens_added" integer DEFAULT 0 NOT NULL,
	"output_generated" text,
	"user_satisfaction" real,
	"conversion_result" boolean,
	"agent_id" uuid,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "prompt_optimizations_optimization_id_unique" UNIQUE("optimization_id")
);
--> statement-breakpoint
CREATE TABLE "agent_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"reward_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(255) NOT NULL,
	"prompt_version" varchar(50),
	"task_type" varchar(100) NOT NULL,
	"reward_score" real NOT NULL,
	"performance_score" real NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"success_rate" real DEFAULT 0 NOT NULL,
	"recent_performance" real DEFAULT 0 NOT NULL,
	"weekly_performance" real DEFAULT 0 NOT NULL,
	"overall_performance" real DEFAULT 0 NOT NULL,
	"persona_performance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"device_performance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"geo_performance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_rank" integer DEFAULT 100 NOT NULL,
	"routing_weight" real DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_training_run" timestamp,
	"training_data_count" integer DEFAULT 0 NOT NULL,
	"model_version" varchar(50),
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "agent_rewards_reward_id_unique" UNIQUE("reward_id")
);
--> statement-breakpoint
CREATE TABLE "federation_rlhf_sync" (
	"id" serial PRIMARY KEY NOT NULL,
	"sync_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"source_neuron" varchar(255) NOT NULL,
	"target_neurons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sync_type" varchar(50) NOT NULL,
	"sync_data" jsonb NOT NULL,
	"data_type" varchar(50) NOT NULL,
	"data_size" integer NOT NULL,
	"data_quality" real DEFAULT 0.5 NOT NULL,
	"validation_results" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"conflict_resolution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"processed_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"error_details" text,
	"federation_version" varchar(50),
	"consensus_score" real,
	"priority_level" varchar(20) DEFAULT 'normal',
	"initiated_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"completed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "federation_rlhf_sync_sync_id_unique" UNIQUE("sync_id")
);
--> statement-breakpoint
CREATE TABLE "persona_evolution" (
	"id" serial PRIMARY KEY NOT NULL,
	"evolution_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"evolution_type" varchar(50) NOT NULL,
	"source_persona" varchar(100),
	"target_persona" varchar(100),
	"cluster_data" jsonb,
	"cluster_size" integer,
	"cluster_cohesion" real,
	"evolution_strength" real NOT NULL,
	"affected_users" integer DEFAULT 0 NOT NULL,
	"confidence_score" real DEFAULT 0.5 NOT NULL,
	"behavior_patterns" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"demographic_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"performance_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"validation_status" varchar(20) DEFAULT 'pending',
	"validated_by" integer,
	"validation_notes" text,
	"is_implemented" boolean DEFAULT false NOT NULL,
	"implemented_at" timestamp,
	"rollback_plan" jsonb,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"algorithm_version" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "persona_evolution_evolution_id_unique" UNIQUE("evolution_id")
);
--> statement-breakpoint
CREATE TABLE "persona_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer,
	"session_id" varchar(255),
	"primary_persona" varchar(100) NOT NULL,
	"primary_score" real NOT NULL,
	"persona_scores" jsonb NOT NULL,
	"hybrid_personas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"traits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"persona_drift" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence_level" real DEFAULT 0.5 NOT NULL,
	"stability_score" real DEFAULT 0.5 NOT NULL,
	"quiz_results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"behavior_patterns" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"engagement_history" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"conversion_history" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ui_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"offer_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_active" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"data_quality" real DEFAULT 0.5 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "persona_profiles_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "persona_simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"simulation_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"simulation_type" varchar(50) NOT NULL,
	"target_persona" varchar(100) NOT NULL,
	"persona_config" jsonb NOT NULL,
	"test_scenarios" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"test_duration" integer,
	"sample_size" integer,
	"engagement_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"conversion_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ui_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"baseline_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"improvement_ratio" real,
	"statistical_significance" real,
	"status" varchar(20) DEFAULT 'planned',
	"is_active" boolean DEFAULT false NOT NULL,
	"user_feedback" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"qualitative_notes" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "persona_simulations_simulation_id_unique" UNIQUE("simulation_id")
);
--> statement-breakpoint
CREATE TABLE "rlhf_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedback_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" integer,
	"agent_id" varchar(255),
	"prompt_version" varchar(50),
	"task_type" varchar(100) NOT NULL,
	"page_path" varchar(500),
	"user_archetype" varchar(100),
	"feedback_type" varchar(50) NOT NULL,
	"signal_type" varchar(50) NOT NULL,
	"signal_value" real NOT NULL,
	"raw_value" jsonb,
	"signal_weight" real DEFAULT 1 NOT NULL,
	"confidence_score" real DEFAULT 0.5 NOT NULL,
	"quality_score" real DEFAULT 0.5 NOT NULL,
	"interaction_duration" integer,
	"device_type" varchar(50),
	"browser_info" jsonb,
	"geo_location" varchar(100),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processing_status" varchar(20) DEFAULT 'pending',
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rlhf_feedback_feedback_id_unique" UNIQUE("feedback_id")
);
--> statement-breakpoint
CREATE TABLE "rlhf_training_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"training_type" varchar(50) NOT NULL,
	"target_agents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_personas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"feedback_data_range" jsonb NOT NULL,
	"training_data_size" integer NOT NULL,
	"data_quality_score" real DEFAULT 0.5 NOT NULL,
	"pre_training_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"post_training_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"improvement_score" real,
	"hyperparameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"algorithm_version" varchar(50),
	"compute_resources" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'queued',
	"progress" integer DEFAULT 0 NOT NULL,
	"error_details" text,
	"results_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model_artifacts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"validation_results" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"queued_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"triggered_by" integer,
	"automation_reason" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "rlhf_training_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "conflict_resolution_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"log_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"conflict_type" varchar(50) NOT NULL,
	"conflict_description" text,
	"client_data" jsonb NOT NULL,
	"server_data" jsonb NOT NULL,
	"resolved_data" jsonb,
	"resolution_strategy" varchar(50) NOT NULL,
	"resolution_method" varchar(50),
	"resolution_status" varchar(20) DEFAULT 'pending',
	"resolved_by" varchar(255),
	"resolved_at" timestamp,
	"data_loss" boolean DEFAULT false,
	"business_impact" varchar(20) DEFAULT 'low',
	"affected_users" integer DEFAULT 0,
	"confidence" real DEFAULT 0.5,
	"feedback" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"conflict_detected_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conflict_resolution_log_log_id_unique" UNIQUE("log_id")
);
--> statement-breakpoint
CREATE TABLE "device_sync_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"device_fingerprint" varchar(500),
	"user_id" integer,
	"last_sync_at" timestamp,
	"last_successful_sync" timestamp,
	"next_scheduled_sync" timestamp,
	"total_sync_operations" integer DEFAULT 0,
	"successful_syncs" integer DEFAULT 0,
	"failed_syncs" integer DEFAULT 0,
	"pending_operations" integer DEFAULT 0,
	"device_capabilities" jsonb DEFAULT '{}'::jsonb,
	"supported_models" jsonb DEFAULT '[]'::jsonb,
	"sync_strategy" varchar(50) DEFAULT 'smart',
	"sync_only_on_wifi" boolean DEFAULT false,
	"background_sync_enabled" boolean DEFAULT true,
	"is_currently_offline" boolean DEFAULT false,
	"last_online_at" timestamp,
	"offline_duration" integer DEFAULT 0,
	"local_data_version" varchar(50),
	"server_data_version" varchar(50),
	"data_freshness_score" real DEFAULT 1,
	"local_storage_usage" integer DEFAULT 0,
	"max_storage_limit" integer DEFAULT 100000000,
	"compression_enabled" boolean DEFAULT true,
	"encryption_enabled" boolean DEFAULT true,
	"last_sync_error" text,
	"error_count" integer DEFAULT 0,
	"last_error_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_sync_state_state_id_unique" UNIQUE("state_id"),
	CONSTRAINT "device_sync_state_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "edge_ai_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"model_type" varchar(100) NOT NULL,
	"model_version" varchar(50) NOT NULL,
	"model_config" jsonb NOT NULL,
	"input_schema" jsonb NOT NULL,
	"output_schema" jsonb NOT NULL,
	"deployment_target" varchar(50) NOT NULL,
	"model_format" varchar(50) NOT NULL,
	"model_url" varchar(500),
	"model_size" integer,
	"inference_time" real,
	"accuracy" real,
	"memory_usage" integer,
	"min_browser_version" jsonb DEFAULT '{}'::jsonb,
	"device_requirements" jsonb DEFAULT '{}'::jsonb,
	"fallback_strategy" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_trained" timestamp,
	"next_update" timestamp,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "edge_ai_models_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE TABLE "offline_analytics_buffer" (
	"id" serial PRIMARY KEY NOT NULL,
	"buffer_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" integer,
	"event_type" varchar(100) NOT NULL,
	"event_data" jsonb NOT NULL,
	"event_timestamp" timestamp NOT NULL,
	"page_path" varchar(500),
	"user_agent" text,
	"referrer" varchar(500),
	"is_synced" boolean DEFAULT false,
	"synced_at" timestamp,
	"sync_attempts" integer DEFAULT 0,
	"consent_given" boolean DEFAULT false,
	"anonymized" boolean DEFAULT false,
	"can_be_deleted" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offline_analytics_buffer_buffer_id_unique" UNIQUE("buffer_id")
);
--> statement-breakpoint
CREATE TABLE "offline_content_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cache_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"content_id" varchar(255) NOT NULL,
	"content_url" varchar(500),
	"cached_content" jsonb,
	"content_hash" varchar(64),
	"content_size" integer,
	"mime_type" varchar(100),
	"cache_strategy" varchar(50) DEFAULT 'smart',
	"priority" integer DEFAULT 5,
	"access_count" integer DEFAULT 0,
	"last_accessed" timestamp,
	"original_timestamp" timestamp,
	"cache_expires_at" timestamp,
	"server_version" varchar(50),
	"is_stale" boolean DEFAULT false,
	"device_id" varchar(255),
	"device_capabilities" jsonb DEFAULT '{}'::jsonb,
	"is_compressed" boolean DEFAULT false,
	"compression_ratio" real,
	"is_encrypted" boolean DEFAULT false,
	"encryption_key" varchar(255),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offline_content_cache_cache_id_unique" UNIQUE("cache_id")
);
--> statement-breakpoint
CREATE TABLE "offline_sync_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"queue_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"session_id" varchar(255),
	"user_id" integer,
	"operation_type" varchar(50) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(255),
	"payload" jsonb NOT NULL,
	"original_payload" jsonb,
	"conflicts" jsonb DEFAULT '[]'::jsonb,
	"sync_status" varchar(20) DEFAULT 'pending',
	"sync_attempts" integer DEFAULT 0 NOT NULL,
	"last_sync_attempt" timestamp,
	"sync_completed_at" timestamp,
	"priority" integer DEFAULT 5 NOT NULL,
	"sequence_number" integer NOT NULL,
	"depends_on" varchar(255),
	"conflict_resolution_strategy" varchar(50) DEFAULT 'last_write_wins',
	"server_version" varchar(50),
	"client_version" varchar(50),
	"last_error" text,
	"error_details" jsonb,
	"created_offline_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "offline_sync_queue_queue_id_unique" UNIQUE("queue_id")
);
--> statement-breakpoint
CREATE TABLE "cultural_ab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" varchar(100) NOT NULL,
	"test_name" text NOT NULL,
	"target_countries" jsonb NOT NULL,
	"emotion_targets" jsonb NOT NULL,
	"variants" jsonb NOT NULL,
	"traffic_allocation" jsonb DEFAULT '{"control": 50, "variant": 50}',
	"status" varchar(20) DEFAULT 'draft',
	"cultural_hypothesis" text,
	"expected_outcome" text,
	"metrics" jsonb NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"min_sample_size" integer DEFAULT 1000,
	"confidence_level" real DEFAULT 0.95,
	"results" jsonb,
	"cultural_insights" jsonb,
	"winning_variant" varchar(100),
	"statistical_significance" real,
	"cultural_significance" real,
	"recommended_actions" jsonb,
	"created_by" varchar(255),
	"approved_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cultural_ab_tests_test_id_unique" UNIQUE("test_id")
);
--> statement-breakpoint
CREATE TABLE "cultural_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"date" varchar(10) NOT NULL,
	"unique_visitors" integer DEFAULT 0,
	"total_sessions" integer DEFAULT 0,
	"average_session_duration" integer DEFAULT 0,
	"emotion_distribution" jsonb NOT NULL,
	"dominant_emotions" jsonb NOT NULL,
	"cultural_personalizations_applied" integer DEFAULT 0,
	"personalization_success_rate" real DEFAULT 0,
	"conversion_rate" real DEFAULT 0,
	"cultural_conversion_lift" real DEFAULT 0,
	"revenue_per_visitor" real DEFAULT 0,
	"cultural_revenue_impact" real DEFAULT 0,
	"top_performing_rules" jsonb,
	"cultural_insights" jsonb,
	"quality_score" real DEFAULT 0.8,
	"data_points" integer DEFAULT 0,
	"cultural_trends" jsonb,
	"seasonal_factors" jsonb,
	"local_events" jsonb,
	"competitor_analysis" jsonb,
	"recommended_actions" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cultural_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedback_id" varchar(100) NOT NULL,
	"feedback_type" varchar(50) NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"cultural_element_id" varchar(100),
	"element_type" varchar(50),
	"rating" integer,
	"feedback" text NOT NULL,
	"cultural_accuracy" real,
	"offensive_risk" real DEFAULT 0,
	"improvement_suggestions" jsonb,
	"cultural_context" text,
	"validation_status" varchar(20) DEFAULT 'pending',
	"expert_validation" jsonb,
	"user_impact" real,
	"business_impact" real,
	"implementation_status" varchar(20) DEFAULT 'pending',
	"submitted_by" varchar(255),
	"expert_reviewer" varchar(255),
	"review_notes" text,
	"priority" integer DEFAULT 3,
	"resolved" boolean DEFAULT false,
	"resolution" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cultural_feedback_feedback_id_unique" UNIQUE("feedback_id")
);
--> statement-breakpoint
CREATE TABLE "cultural_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"country_name" text NOT NULL,
	"region" varchar(100) NOT NULL,
	"communication_style" varchar(50) NOT NULL,
	"color_psychology" jsonb NOT NULL,
	"trust_indicators" jsonb NOT NULL,
	"conversion_triggers" jsonb NOT NULL,
	"emotion_patterns" jsonb NOT NULL,
	"cultural_context" jsonb,
	"marketing_preferences" jsonb,
	"decision_making_style" varchar(50),
	"collectivism_score" real DEFAULT 0.5,
	"uncertainty_avoidance" real DEFAULT 0.5,
	"power_distance" real DEFAULT 0.5,
	"masculinity_index" real DEFAULT 0.5,
	"long_term_orientation" real DEFAULT 0.5,
	"indulgence_level" real DEFAULT 0.5,
	"is_active" boolean DEFAULT true,
	"data_quality" integer DEFAULT 85,
	"last_validated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cultural_mappings_country_code_unique" UNIQUE("country_code")
);
--> statement-breakpoint
CREATE TABLE "cultural_personalization_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" varchar(100) NOT NULL,
	"rule_name" text NOT NULL,
	"target_countries" jsonb NOT NULL,
	"emotion_triggers" jsonb NOT NULL,
	"conditions" jsonb NOT NULL,
	"personalizations" jsonb NOT NULL,
	"priority" integer DEFAULT 5,
	"rule_type" varchar(50) NOT NULL,
	"cultural_reasoning" text,
	"expected_impact" real DEFAULT 0.1,
	"actual_impact" real,
	"confidence" real DEFAULT 0.8,
	"testing_phase" varchar(50) DEFAULT 'production',
	"application_count" integer DEFAULT 0,
	"success_rate" real,
	"cultural_feedback" jsonb,
	"user_feedback" jsonb,
	"business_impact" jsonb,
	"is_active" boolean DEFAULT true,
	"last_applied" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cultural_personalization_rules_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
CREATE TABLE "emotion_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"emotion_id" varchar(100) NOT NULL,
	"emotion_name" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"intensity" real DEFAULT 0.5,
	"cultural_variance" real DEFAULT 0.3,
	"universality" real DEFAULT 0.7,
	"behavioral_triggers" jsonb NOT NULL,
	"response_patterns" jsonb NOT NULL,
	"neural_signals" jsonb,
	"color_associations" jsonb,
	"contextual_modifiers" jsonb,
	"opposite_emotions" jsonb,
	"complementary_emotions" jsonb,
	"psychological_basis" text,
	"marketing_application" jsonb,
	"conversion_impact" real DEFAULT 0.5,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "emotion_profiles_emotion_id_unique" UNIQUE("emotion_id")
);
--> statement-breakpoint
CREATE TABLE "user_emotion_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"country_code" varchar(3) NOT NULL,
	"detected_emotions" jsonb NOT NULL,
	"dominant_emotion" varchar(100),
	"emotion_intensity" real DEFAULT 0.5,
	"cultural_alignment" real DEFAULT 0.5,
	"behavior_context" jsonb,
	"device_type" varchar(50),
	"interaction_type" varchar(100),
	"time_on_page" integer DEFAULT 0,
	"emotion_confidence" real DEFAULT 0.7,
	"biometric_data" jsonb,
	"previous_emotions" jsonb,
	"cultural_modifiers" jsonb,
	"personalization_applied" jsonb,
	"conversion_probability" real,
	"optimization_suggestions" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "layout_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"block_id" varchar(100) NOT NULL,
	"block_name" text NOT NULL,
	"block_type" varchar(50) NOT NULL,
	"block_category" varchar(50) NOT NULL,
	"content" jsonb NOT NULL,
	"position" jsonb NOT NULL,
	"dimensions" jsonb NOT NULL,
	"styles" jsonb NOT NULL,
	"animations" jsonb,
	"interactivity_rules" jsonb,
	"visibility_conditions" jsonb,
	"responsive_settings" jsonb,
	"accessibility_attributes" jsonb,
	"priority" integer DEFAULT 5,
	"version" varchar(20) DEFAULT '1.0',
	"is_reusable" boolean DEFAULT true,
	"performance_impact" real DEFAULT 0.1,
	"mutability_level" varchar(20) DEFAULT 'flexible',
	"ai_optimizable" boolean DEFAULT true,
	"cultural_sensitive" boolean DEFAULT false,
	"business_critical" boolean DEFAULT false,
	"testing_compliant" boolean DEFAULT true,
	"created_by" varchar(255),
	"tags" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "layout_blocks_block_id_unique" UNIQUE("block_id")
);
--> statement-breakpoint
CREATE TABLE "layout_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" varchar(100) NOT NULL,
	"experiment_name" text NOT NULL,
	"experiment_type" varchar(50) NOT NULL,
	"baseline_template_id" varchar(100) NOT NULL,
	"variants" jsonb NOT NULL,
	"traffic_allocation" jsonb NOT NULL,
	"target_audience" jsonb,
	"exclusion_criteria" jsonb,
	"primary_metric" varchar(100) NOT NULL,
	"secondary_metrics" jsonb,
	"hypotheses" jsonb NOT NULL,
	"cultural_considerations" jsonb,
	"device_considerations" jsonb,
	"emotional_considerations" jsonb,
	"status" varchar(20) DEFAULT 'draft',
	"start_date" timestamp,
	"end_date" timestamp,
	"planned_duration" integer,
	"min_sample_size" integer DEFAULT 1000,
	"max_sample_size" integer,
	"confidence_level" real DEFAULT 0.95,
	"power_level" real DEFAULT 0.8,
	"minimum_detectable_effect" real DEFAULT 0.05,
	"current_sample_size" integer DEFAULT 0,
	"results" jsonb,
	"statistical_significance" real,
	"practical_significance" real,
	"winning_variant" varchar(100),
	"lift_amount" real,
	"confidence_interval" jsonb,
	"segmented_results" jsonb,
	"unexpected_outcomes" jsonb,
	"learnings_and_insights" jsonb,
	"recommended_actions" jsonb,
	"risk_assessment" jsonb,
	"business_impact" jsonb,
	"follow_up_experiments" jsonb,
	"created_by" varchar(255),
	"approved_by" varchar(255),
	"reviewed_by" varchar(255),
	"stakeholders" jsonb,
	"budget" real,
	"actual_cost" real,
	"roi" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "layout_experiments_experiment_id_unique" UNIQUE("experiment_id")
);
--> statement-breakpoint
CREATE TABLE "layout_mutations" (
	"id" serial PRIMARY KEY NOT NULL,
	"mutation_id" varchar(100) NOT NULL,
	"mutation_name" text NOT NULL,
	"mutation_type" varchar(50) NOT NULL,
	"trigger" varchar(100) NOT NULL,
	"target_blocks" jsonb NOT NULL,
	"mutation_rules" jsonb NOT NULL,
	"conditions" jsonb NOT NULL,
	"priority" integer DEFAULT 5,
	"duration" integer DEFAULT 0,
	"frequency" varchar(50) DEFAULT 'once',
	"cooldown_period" integer DEFAULT 0,
	"mutation_scope" varchar(50) DEFAULT 'session',
	"reversible" boolean DEFAULT true,
	"auto_revert" boolean DEFAULT false,
	"conflict_resolution" varchar(50) DEFAULT 'priority',
	"cultural_context" jsonb,
	"device_context" jsonb,
	"emotional_context" jsonb,
	"business_impact" jsonb,
	"testing_phase" varchar(50) DEFAULT 'production',
	"success_metrics" jsonb,
	"failure_conditions" jsonb,
	"rollback_strategy" jsonb,
	"is_active" boolean DEFAULT true,
	"application_count" integer DEFAULT 0,
	"success_rate" real,
	"average_impact" real,
	"created_by" varchar(255),
	"approved_by" varchar(255),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "layout_mutations_mutation_id_unique" UNIQUE("mutation_id")
);
--> statement-breakpoint
CREATE TABLE "layout_performance_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" varchar(100) NOT NULL,
	"date" varchar(10) NOT NULL,
	"total_sessions" integer DEFAULT 0,
	"unique_users" integer DEFAULT 0,
	"average_session_duration" integer DEFAULT 0,
	"average_page_views" real DEFAULT 0,
	"bounce_rate" real DEFAULT 0,
	"conversion_rate" real DEFAULT 0,
	"mutation_application_rate" real DEFAULT 0,
	"mutation_success_rate" real DEFAULT 0,
	"average_personalization_level" real DEFAULT 0,
	"performance_metrics" jsonb NOT NULL,
	"engagement_metrics" jsonb NOT NULL,
	"conversion_metrics" jsonb NOT NULL,
	"device_breakdown" jsonb NOT NULL,
	"cultural_breakdown" jsonb,
	"emotional_breakdown" jsonb,
	"top_performing_mutations" jsonb,
	"underperforming_elements" jsonb,
	"optimization_opportunities" jsonb,
	"user_feedback_summary" jsonb,
	"business_impact" jsonb,
	"trends_analysis" jsonb,
	"competitive_analysis" jsonb,
	"recommended_improvements" jsonb,
	"quality_score" real DEFAULT 0.8,
	"data_quality" real DEFAULT 0.9,
	"sample_size" integer DEFAULT 0,
	"confidence_level" real DEFAULT 0.95,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "layout_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" varchar(100) NOT NULL,
	"template_name" text NOT NULL,
	"template_type" varchar(50) NOT NULL,
	"template_category" varchar(50) NOT NULL,
	"industry" varchar(100),
	"layout_blocks" jsonb NOT NULL,
	"default_settings" jsonb,
	"device_support" jsonb DEFAULT '["desktop", "tablet", "mobile"]',
	"browser_support" jsonb,
	"cultural_adaptations" jsonb,
	"accessibility_features" jsonb,
	"seo_optimized" boolean DEFAULT true,
	"conversion_optimized" boolean DEFAULT true,
	"loading_performance" real DEFAULT 0.8,
	"version" varchar(20) DEFAULT '1.0',
	"status" varchar(20) DEFAULT 'active',
	"usage_count" integer DEFAULT 0,
	"average_conversion_rate" real,
	"business_impact" jsonb,
	"user_feedback" jsonb,
	"created_by" varchar(255),
	"tags" jsonb,
	"description" text,
	"preview_image" text,
	"documentation_url" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "layout_templates_template_id_unique" UNIQUE("template_id")
);
--> statement-breakpoint
CREATE TABLE "mutation_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"history_id" varchar(100) NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"mutation_id" varchar(100) NOT NULL,
	"mutation_type" varchar(50) NOT NULL,
	"trigger" varchar(100) NOT NULL,
	"trigger_data" jsonb,
	"before_state" jsonb NOT NULL,
	"after_state" jsonb NOT NULL,
	"mutation_diff" jsonb,
	"application_status" varchar(20) DEFAULT 'applied',
	"application_time" integer,
	"user_reaction" jsonb,
	"performance_impact" real,
	"error_details" jsonb,
	"success_metrics" jsonb,
	"business_outcome" jsonb,
	"reverted_at" timestamp,
	"revert_reason" text,
	"duration" integer,
	"user_feedback" jsonb,
	"automatic_revert" boolean DEFAULT false,
	"cultural_context" jsonb,
	"emotional_context" jsonb,
	"device_context" jsonb,
	"quality_score" real,
	"learning_value" real,
	"applied_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "mutation_history_history_id_unique" UNIQUE("history_id")
);
--> statement-breakpoint
CREATE TABLE "user_layout_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"template_id" varchar(100) NOT NULL,
	"layout_version" varchar(20) DEFAULT '1.0',
	"current_layout" jsonb NOT NULL,
	"applied_mutations" jsonb,
	"user_context" jsonb NOT NULL,
	"device_info" jsonb NOT NULL,
	"location_info" jsonb,
	"behavior_data" jsonb,
	"emotion_profile" jsonb,
	"personalization_level" real DEFAULT 0.5,
	"conversion_goals" jsonb,
	"ab_test_assignments" jsonb,
	"performance_metrics" jsonb,
	"user_engagement" jsonb,
	"conversion_events" jsonb,
	"layout_satisfaction" real,
	"session_duration" integer,
	"page_views" integer DEFAULT 0,
	"interaction_count" integer DEFAULT 0,
	"bounce_status" boolean,
	"conversion_status" boolean DEFAULT false,
	"error_logs" jsonb,
	"feedback_submitted" jsonb,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auto_scaling_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" text NOT NULL,
	"scaling_action" text NOT NULL,
	"trigger_metric" text NOT NULL,
	"trigger_value" real NOT NULL,
	"threshold_value" real NOT NULL,
	"instances_before" integer NOT NULL,
	"instances_after" integer NOT NULL,
	"scaling_duration_seconds" integer DEFAULT 0 NOT NULL,
	"cost_impact" real DEFAULT 0 NOT NULL,
	"performance_impact" jsonb,
	"prediction_accuracy" real,
	"rollback_triggered" boolean DEFAULT false NOT NULL,
	"automation_confidence" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disaster_recovery_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_name" text NOT NULL,
	"scenario_type" text NOT NULL,
	"affected_regions" jsonb NOT NULL,
	"backup_regions" jsonb NOT NULL,
	"recovery_strategy" jsonb NOT NULL,
	"estimated_recovery_time" integer DEFAULT 0 NOT NULL,
	"data_recovery_method" text NOT NULL,
	"business_continuity_plan" jsonb,
	"last_tested" timestamp,
	"test_success_rate" real DEFAULT 0 NOT NULL,
	"identified_gaps" jsonb,
	"times_executed" integer DEFAULT 0 NOT NULL,
	"average_execution_time" real DEFAULT 0 NOT NULL,
	"success_rate" real DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failover_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"trigger_reason" text NOT NULL,
	"from_region" text NOT NULL,
	"to_region" text NOT NULL,
	"affected_users" integer DEFAULT 0 NOT NULL,
	"affected_requests" integer DEFAULT 0 NOT NULL,
	"recovery_time_seconds" integer DEFAULT 0 NOT NULL,
	"downtime_seconds" integer DEFAULT 0 NOT NULL,
	"data_consistency_check" boolean DEFAULT false NOT NULL,
	"rollback_available" boolean DEFAULT false NOT NULL,
	"impact_assessment" jsonb NOT NULL,
	"automated_actions" jsonb NOT NULL,
	"manual_interventions" jsonb,
	"lessons_learned" text,
	"resolution_status" text DEFAULT 'resolved' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "global_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metric_type" text NOT NULL,
	"global_uptime_percentage" real DEFAULT 100 NOT NULL,
	"average_response_time" real DEFAULT 0 NOT NULL,
	"p95_response_time" real DEFAULT 0 NOT NULL,
	"p99_response_time" real DEFAULT 0 NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"successful_requests" integer DEFAULT 0 NOT NULL,
	"failed_requests" integer DEFAULT 0 NOT NULL,
	"peak_concurrent_users" integer DEFAULT 0 NOT NULL,
	"regions_active" integer DEFAULT 0 NOT NULL,
	"cross_region_requests" integer DEFAULT 0 NOT NULL,
	"geographic_efficiency" real DEFAULT 0 NOT NULL,
	"revenue_impact" real DEFAULT 0 NOT NULL,
	"conversion_rate" real DEFAULT 0 NOT NULL,
	"user_satisfaction_avg" real DEFAULT 0 NOT NULL,
	"sla_compliance_percentage" real DEFAULT 100 NOT NULL,
	"predicted_growth_rate" real DEFAULT 0 NOT NULL,
	"capacity_utilization" real DEFAULT 0 NOT NULL,
	"optimization_opportunities" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "load_balancing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"effectiveness_score" real DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "region_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" text NOT NULL,
	"status" text NOT NULL,
	"response_time_ms" integer DEFAULT 0 NOT NULL,
	"cpu_usage" real DEFAULT 0 NOT NULL,
	"memory_usage" real DEFAULT 0 NOT NULL,
	"disk_usage" real DEFAULT 0 NOT NULL,
	"network_throughput" real DEFAULT 0 NOT NULL,
	"error_rate" real DEFAULT 0 NOT NULL,
	"active_connections" integer DEFAULT 0 NOT NULL,
	"queue_length" integer DEFAULT 0 NOT NULL,
	"availability_percentage" real DEFAULT 100 NOT NULL,
	"health_score" real DEFAULT 100 NOT NULL,
	"check_timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" jsonb NOT NULL,
	"endpoints" jsonb NOT NULL,
	"capacity" jsonb NOT NULL,
	"load_balancing" jsonb NOT NULL,
	"auto_scaling" jsonb NOT NULL,
	"status" text DEFAULT 'healthy' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routing_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"session_id" text,
	"request_id" text,
	"user_location" jsonb,
	"user_agent" text,
	"selected_region" text NOT NULL,
	"routing_algorithm" text NOT NULL,
	"applied_rules" jsonb,
	"decision_factors" jsonb,
	"routing_latency_ms" integer DEFAULT 0 NOT NULL,
	"prediction_confidence" real DEFAULT 0 NOT NULL,
	"actual_performance" jsonb,
	"user_satisfaction_score" real,
	"business_impact" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_distribution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"average_response_time" real DEFAULT 0 NOT NULL,
	"global_error_rate" real DEFAULT 0 NOT NULL,
	"peak_concurrent_users" integer DEFAULT 0 NOT NULL,
	"bandwidth_utilization" real DEFAULT 0 NOT NULL,
	"distribution_efficiency" real DEFAULT 0 NOT NULL,
	"regions_data" jsonb NOT NULL,
	"geographic_spread" jsonb NOT NULL,
	"user_experience_score" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_neuron_analytics" ADD CONSTRAINT "api_neuron_analytics_neuron_id_api_only_neurons_neuron_id_fk" FOREIGN KEY ("neuron_id") REFERENCES "public"."api_only_neurons"("neuron_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_neuron_commands" ADD CONSTRAINT "api_neuron_commands_neuron_id_api_only_neurons_neuron_id_fk" FOREIGN KEY ("neuron_id") REFERENCES "public"."api_only_neurons"("neuron_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_neuron_heartbeats" ADD CONSTRAINT "api_neuron_heartbeats_neuron_id_api_only_neurons_neuron_id_fk" FOREIGN KEY ("neuron_id") REFERENCES "public"."api_only_neurons"("neuron_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_progress" ADD CONSTRAINT "education_progress_path_id_education_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."education_paths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_progress" ADD CONSTRAINT "education_progress_content_id_education_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."education_content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_progress" ADD CONSTRAINT "education_progress_quiz_id_education_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."education_quizzes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_quest_completions" ADD CONSTRAINT "education_quest_completions_quest_id_education_daily_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."education_daily_quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_quiz_results" ADD CONSTRAINT "education_quiz_results_quiz_id_education_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."education_quizzes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_tool_sessions" ADD CONSTRAINT "education_tool_sessions_tool_id_education_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."education_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_analytics" ADD CONSTRAINT "graph_analytics_node_id_semantic_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."semantic_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_analytics" ADD CONSTRAINT "graph_analytics_edge_id_semantic_edges_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."semantic_edges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_audit_results" ADD CONSTRAINT "graph_audit_results_node_id_semantic_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."semantic_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_audit_results" ADD CONSTRAINT "graph_audit_results_edge_id_semantic_edges_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."semantic_edges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realtime_recommendations" ADD CONSTRAINT "realtime_recommendations_node_id_semantic_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."semantic_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semantic_edges" ADD CONSTRAINT "semantic_edges_from_node_id_semantic_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."semantic_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semantic_edges" ADD CONSTRAINT "semantic_edges_to_node_id_semantic_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."semantic_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vector_similarity_index" ADD CONSTRAINT "vector_similarity_index_node_id_semantic_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."semantic_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vector_similarity_index" ADD CONSTRAINT "vector_similarity_index_similar_node_id_semantic_nodes_id_fk" FOREIGN KEY ("similar_node_id") REFERENCES "public"."semantic_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neuron_offer_assignments" ADD CONSTRAINT "neuron_offer_assignments_offer_id_offer_feed_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer_feed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_ai_optimization_queue" ADD CONSTRAINT "offer_ai_optimization_queue_offer_id_offer_feed_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer_feed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_analytics" ADD CONSTRAINT "offer_analytics_offer_id_offer_feed_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer_feed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_feed" ADD CONSTRAINT "offer_feed_source_id_offer_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."offer_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_sync_history" ADD CONSTRAINT "offer_sync_history_source_id_offer_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."offer_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_analytics" ADD CONSTRAINT "notification_analytics_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_analytics" ADD CONSTRAINT "notification_analytics_trigger_id_notification_triggers_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."notification_triggers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_analytics" ADD CONSTRAINT "notification_analytics_campaign_id_notification_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."notification_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_analytics" ADD CONSTRAINT "notification_analytics_queue_id_notification_queue_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."notification_queue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_trigger_id_notification_triggers_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."notification_triggers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_campaign_id_notification_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."notification_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_personalization" ADD CONSTRAINT "push_personalization_subscription_id_push_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."push_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_ab_tests" ADD CONSTRAINT "funnel_ab_tests_funnel_id_funnel_templates_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnel_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_analytics" ADD CONSTRAINT "funnel_analytics_funnel_id_funnel_templates_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnel_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_funnel_session_id_user_funnel_sessions_id_fk" FOREIGN KEY ("funnel_session_id") REFERENCES "public"."user_funnel_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_triggers" ADD CONSTRAINT "funnel_triggers_funnel_id_funnel_templates_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnel_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_funnel_sessions" ADD CONSTRAINT "user_funnel_sessions_funnel_id_funnel_templates_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnel_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_fixes" ADD CONSTRAINT "codex_fixes_issue_id_codex_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."codex_issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_issues" ADD CONSTRAINT "codex_issues_audit_id_codex_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."codex_audits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_feed" ADD CONSTRAINT "content_feed_source_id_content_feed_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."content_feed_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_feed_analytics" ADD CONSTRAINT "content_feed_analytics_content_id_content_feed_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_feed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_feed_interactions" ADD CONSTRAINT "content_feed_interactions_content_id_content_feed_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_feed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_feed_notifications" ADD CONSTRAINT "content_feed_notifications_content_id_content_feed_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_feed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_feed_notifications" ADD CONSTRAINT "content_feed_notifications_source_id_content_feed_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."content_feed_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_feed_rules" ADD CONSTRAINT "content_feed_rules_source_id_content_feed_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."content_feed_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_feed_sync_logs" ADD CONSTRAINT "content_feed_sync_logs_source_id_content_feed_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."content_feed_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_scaling_events" ADD CONSTRAINT "auto_scaling_events_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failover_events" ADD CONSTRAINT "failover_events_from_region_regions_id_fk" FOREIGN KEY ("from_region") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failover_events" ADD CONSTRAINT "failover_events_to_region_regions_id_fk" FOREIGN KEY ("to_region") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_health" ADD CONSTRAINT "region_health_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routing_decisions" ADD CONSTRAINT "routing_decisions_selected_region_regions_id_fk" FOREIGN KEY ("selected_region") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_edge_idx" ON "semantic_edges" USING btree ("from_node_id","to_node_id","edge_type");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_similarity_idx" ON "vector_similarity_index" USING btree ("node_id","similar_node_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_analytics_idx" ON "notification_analytics" USING btree ("template_id","channel","date","hour");--> statement-breakpoint
CREATE UNIQUE INDEX "user_channel_queue_idx" ON "notification_queue" USING btree ("user_id","channel","scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_preferences_idx" ON "user_notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fed_sync_source_idx" ON "federation_memory_sync" USING btree ("source_neuron");--> statement-breakpoint
CREATE INDEX "fed_sync_target_idx" ON "federation_memory_sync" USING btree ("target_neuron");--> statement-breakpoint
CREATE INDEX "fed_sync_status_idx" ON "federation_memory_sync" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "fed_sync_timestamp_idx" ON "federation_memory_sync" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "kg_versions_node_idx" ON "knowledge_graph_versions" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "kg_versions_timestamp_idx" ON "knowledge_graph_versions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "kg_versions_approval_idx" ON "knowledge_graph_versions" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "memory_edges_source_idx" ON "memory_edges" USING btree ("source_node_id");--> statement-breakpoint
CREATE INDEX "memory_edges_target_idx" ON "memory_edges" USING btree ("target_node_id");--> statement-breakpoint
CREATE INDEX "memory_edges_relationship_idx" ON "memory_edges" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "memory_edges_strength_idx" ON "memory_edges" USING btree ("strength");--> statement-breakpoint
CREATE INDEX "memory_nodes_slug_idx" ON "memory_nodes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "memory_nodes_type_idx" ON "memory_nodes" USING btree ("node_type");--> statement-breakpoint
CREATE INDEX "memory_nodes_embedding_idx" ON "memory_nodes" USING btree ("embedding");--> statement-breakpoint
CREATE INDEX "memory_nodes_usage_idx" ON "memory_nodes" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "memory_nodes_quality_idx" ON "memory_nodes" USING btree ("quality_score");--> statement-breakpoint
CREATE INDEX "memory_search_query_idx" ON "memory_search_sessions" USING btree ("query");--> statement-breakpoint
CREATE INDEX "memory_search_timestamp_idx" ON "memory_search_sessions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "memory_search_user_idx" ON "memory_search_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memory_usage_node_idx" ON "memory_usage_analytics" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "memory_usage_timestamp_idx" ON "memory_usage_analytics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "memory_usage_relevance_idx" ON "memory_usage_analytics" USING btree ("relevance_score");--> statement-breakpoint
CREATE INDEX "prompt_opts_task_type_idx" ON "prompt_optimizations" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "prompt_opts_timestamp_idx" ON "prompt_optimizations" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "prompt_opts_quality_idx" ON "prompt_optimizations" USING btree ("prompt_quality");--> statement-breakpoint
CREATE INDEX "agent_rewards_agent_idx" ON "agent_rewards" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_rewards_task_idx" ON "agent_rewards" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "agent_rewards_performance_idx" ON "agent_rewards" USING btree ("performance_score");--> statement-breakpoint
CREATE INDEX "agent_rewards_rank_idx" ON "agent_rewards" USING btree ("current_rank");--> statement-breakpoint
CREATE INDEX "federation_rlhf_source_idx" ON "federation_rlhf_sync" USING btree ("source_neuron");--> statement-breakpoint
CREATE INDEX "federation_rlhf_type_idx" ON "federation_rlhf_sync" USING btree ("sync_type");--> statement-breakpoint
CREATE INDEX "federation_rlhf_status_idx" ON "federation_rlhf_sync" USING btree ("status");--> statement-breakpoint
CREATE INDEX "federation_rlhf_priority_idx" ON "federation_rlhf_sync" USING btree ("priority_level");--> statement-breakpoint
CREATE INDEX "persona_evolution_type_idx" ON "persona_evolution" USING btree ("evolution_type");--> statement-breakpoint
CREATE INDEX "persona_evolution_source_idx" ON "persona_evolution" USING btree ("source_persona");--> statement-breakpoint
CREATE INDEX "persona_evolution_status_idx" ON "persona_evolution" USING btree ("validation_status");--> statement-breakpoint
CREATE INDEX "persona_evolution_strength_idx" ON "persona_evolution" USING btree ("evolution_strength");--> statement-breakpoint
CREATE INDEX "persona_profiles_user_idx" ON "persona_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "persona_profiles_session_idx" ON "persona_profiles" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "persona_profiles_primary_idx" ON "persona_profiles" USING btree ("primary_persona");--> statement-breakpoint
CREATE INDEX "persona_profiles_confidence_idx" ON "persona_profiles" USING btree ("confidence_level");--> statement-breakpoint
CREATE INDEX "persona_simulations_type_idx" ON "persona_simulations" USING btree ("simulation_type");--> statement-breakpoint
CREATE INDEX "persona_simulations_persona_idx" ON "persona_simulations" USING btree ("target_persona");--> statement-breakpoint
CREATE INDEX "persona_simulations_status_idx" ON "persona_simulations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rlhf_feedback_session_idx" ON "rlhf_feedback" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "rlhf_feedback_agent_idx" ON "rlhf_feedback" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "rlhf_feedback_signal_idx" ON "rlhf_feedback" USING btree ("signal_type");--> statement-breakpoint
CREATE INDEX "rlhf_feedback_archetype_idx" ON "rlhf_feedback" USING btree ("user_archetype");--> statement-breakpoint
CREATE INDEX "rlhf_feedback_quality_idx" ON "rlhf_feedback" USING btree ("quality_score");--> statement-breakpoint
CREATE INDEX "rlhf_training_type_idx" ON "rlhf_training_sessions" USING btree ("training_type");--> statement-breakpoint
CREATE INDEX "rlhf_training_status_idx" ON "rlhf_training_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rlhf_training_completed_idx" ON "rlhf_training_sessions" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "conflict_resolution_device_idx" ON "conflict_resolution_log" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "conflict_resolution_entity_idx" ON "conflict_resolution_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "conflict_resolution_status_idx" ON "conflict_resolution_log" USING btree ("resolution_status");--> statement-breakpoint
CREATE INDEX "conflict_resolution_impact_idx" ON "conflict_resolution_log" USING btree ("business_impact");--> statement-breakpoint
CREATE INDEX "device_sync_device_idx" ON "device_sync_state" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "device_sync_user_idx" ON "device_sync_state" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "device_sync_offline_idx" ON "device_sync_state" USING btree ("is_currently_offline");--> statement-breakpoint
CREATE INDEX "device_sync_last_sync_idx" ON "device_sync_state" USING btree ("last_sync_at");--> statement-breakpoint
CREATE INDEX "edge_ai_models_type_idx" ON "edge_ai_models" USING btree ("model_type");--> statement-breakpoint
CREATE INDEX "edge_ai_models_active_idx" ON "edge_ai_models" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "edge_ai_models_target_idx" ON "edge_ai_models" USING btree ("deployment_target");--> statement-breakpoint
CREATE INDEX "offline_analytics_device_idx" ON "offline_analytics_buffer" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "offline_analytics_sync_idx" ON "offline_analytics_buffer" USING btree ("is_synced");--> statement-breakpoint
CREATE INDEX "offline_analytics_event_idx" ON "offline_analytics_buffer" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "offline_analytics_timestamp_idx" ON "offline_analytics_buffer" USING btree ("event_timestamp");--> statement-breakpoint
CREATE INDEX "offline_cache_content_idx" ON "offline_content_cache" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "offline_cache_device_idx" ON "offline_content_cache" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "offline_cache_priority_idx" ON "offline_content_cache" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "offline_cache_expiry_idx" ON "offline_content_cache" USING btree ("cache_expires_at");--> statement-breakpoint
CREATE INDEX "offline_cache_stale_idx" ON "offline_content_cache" USING btree ("is_stale");--> statement-breakpoint
CREATE INDEX "offline_sync_device_idx" ON "offline_sync_queue" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "offline_sync_status_idx" ON "offline_sync_queue" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "offline_sync_priority_idx" ON "offline_sync_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "offline_sync_sequence_idx" ON "offline_sync_queue" USING btree ("sequence_number");--> statement-breakpoint
CREATE INDEX "offline_sync_type_idx" ON "offline_sync_queue" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "cultural_ab_tests_test_id_idx" ON "cultural_ab_tests" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "cultural_ab_tests_status_idx" ON "cultural_ab_tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cultural_ab_tests_start_date_idx" ON "cultural_ab_tests" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "cultural_analytics_country_date_idx" ON "cultural_analytics" USING btree ("country_code","date");--> statement-breakpoint
CREATE INDEX "cultural_analytics_conversion_rate_idx" ON "cultural_analytics" USING btree ("conversion_rate");--> statement-breakpoint
CREATE INDEX "cultural_analytics_quality_score_idx" ON "cultural_analytics" USING btree ("quality_score");--> statement-breakpoint
CREATE INDEX "cultural_feedback_feedback_id_idx" ON "cultural_feedback" USING btree ("feedback_id");--> statement-breakpoint
CREATE INDEX "cultural_feedback_country_code_idx" ON "cultural_feedback" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "cultural_feedback_feedback_type_idx" ON "cultural_feedback" USING btree ("feedback_type");--> statement-breakpoint
CREATE INDEX "cultural_feedback_validation_status_idx" ON "cultural_feedback" USING btree ("validation_status");--> statement-breakpoint
CREATE INDEX "cultural_feedback_priority_idx" ON "cultural_feedback" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "cultural_mappings_country_code_idx" ON "cultural_mappings" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "cultural_mappings_region_idx" ON "cultural_mappings" USING btree ("region");--> statement-breakpoint
CREATE INDEX "cultural_mappings_active_idx" ON "cultural_mappings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "cultural_personalization_rules_rule_id_idx" ON "cultural_personalization_rules" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "cultural_personalization_rules_rule_type_idx" ON "cultural_personalization_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX "cultural_personalization_rules_priority_idx" ON "cultural_personalization_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "cultural_personalization_rules_active_idx" ON "cultural_personalization_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "emotion_profiles_emotion_id_idx" ON "emotion_profiles" USING btree ("emotion_id");--> statement-breakpoint
CREATE INDEX "emotion_profiles_category_idx" ON "emotion_profiles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "emotion_profiles_intensity_idx" ON "emotion_profiles" USING btree ("intensity");--> statement-breakpoint
CREATE INDEX "user_emotion_tracking_session_id_idx" ON "user_emotion_tracking" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "user_emotion_tracking_user_id_idx" ON "user_emotion_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_emotion_tracking_country_code_idx" ON "user_emotion_tracking" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "user_emotion_tracking_dominant_emotion_idx" ON "user_emotion_tracking" USING btree ("dominant_emotion");--> statement-breakpoint
CREATE INDEX "user_emotion_tracking_timestamp_idx" ON "user_emotion_tracking" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "layout_blocks_block_id_idx" ON "layout_blocks" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "layout_blocks_block_type_idx" ON "layout_blocks" USING btree ("block_type");--> statement-breakpoint
CREATE INDEX "layout_blocks_priority_idx" ON "layout_blocks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "layout_blocks_mutability_level_idx" ON "layout_blocks" USING btree ("mutability_level");--> statement-breakpoint
CREATE INDEX "layout_experiments_experiment_id_idx" ON "layout_experiments" USING btree ("experiment_id");--> statement-breakpoint
CREATE INDEX "layout_experiments_status_idx" ON "layout_experiments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "layout_experiments_start_date_idx" ON "layout_experiments" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "layout_experiments_baseline_template_idx" ON "layout_experiments" USING btree ("baseline_template_id");--> statement-breakpoint
CREATE INDEX "layout_mutations_mutation_id_idx" ON "layout_mutations" USING btree ("mutation_id");--> statement-breakpoint
CREATE INDEX "layout_mutations_mutation_type_idx" ON "layout_mutations" USING btree ("mutation_type");--> statement-breakpoint
CREATE INDEX "layout_mutations_trigger_idx" ON "layout_mutations" USING btree ("trigger");--> statement-breakpoint
CREATE INDEX "layout_mutations_priority_idx" ON "layout_mutations" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "layout_mutations_active_idx" ON "layout_mutations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "layout_performance_analytics_template_date_idx" ON "layout_performance_analytics" USING btree ("template_id","date");--> statement-breakpoint
CREATE INDEX "layout_performance_analytics_conversion_rate_idx" ON "layout_performance_analytics" USING btree ("conversion_rate");--> statement-breakpoint
CREATE INDEX "layout_performance_analytics_quality_score_idx" ON "layout_performance_analytics" USING btree ("quality_score");--> statement-breakpoint
CREATE INDEX "layout_templates_template_id_idx" ON "layout_templates" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "layout_templates_template_type_idx" ON "layout_templates" USING btree ("template_type");--> statement-breakpoint
CREATE INDEX "layout_templates_status_idx" ON "layout_templates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "layout_templates_industry_idx" ON "layout_templates" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "mutation_history_history_id_idx" ON "mutation_history" USING btree ("history_id");--> statement-breakpoint
CREATE INDEX "mutation_history_session_id_idx" ON "mutation_history" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "mutation_history_mutation_id_idx" ON "mutation_history" USING btree ("mutation_id");--> statement-breakpoint
CREATE INDEX "mutation_history_application_status_idx" ON "mutation_history" USING btree ("application_status");--> statement-breakpoint
CREATE INDEX "mutation_history_applied_at_idx" ON "mutation_history" USING btree ("applied_at");--> statement-breakpoint
CREATE INDEX "user_layout_sessions_session_id_idx" ON "user_layout_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "user_layout_sessions_user_id_idx" ON "user_layout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_layout_sessions_template_id_idx" ON "user_layout_sessions" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "user_layout_sessions_conversion_status_idx" ON "user_layout_sessions" USING btree ("conversion_status");--> statement-breakpoint
CREATE INDEX "user_layout_sessions_started_at_idx" ON "user_layout_sessions" USING btree ("started_at");