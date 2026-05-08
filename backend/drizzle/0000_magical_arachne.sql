CREATE TYPE "public"."effort_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('idea_generated', 'idea_saved', 'idea_dismissed', 'idea_clicked', 'user_login');--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event_type" "event_type" NOT NULL,
	"idea_id" uuid,
	"metadata" jsonb,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"estimated_daily_earn" integer NOT NULL,
	"estimated_weekly_earn" integer NOT NULL,
	"effort_level" "effort_level" NOT NULL,
	"skills_required" text[] DEFAULT '{}',
	"platform_name" varchar(100) NOT NULL,
	"platform_url" varchar(500) NOT NULL,
	"getting_started_steps" text[] DEFAULT '{}',
	"earnings_breakdown" text NOT NULL,
	"city_specific_tip" text NOT NULL,
	"is_saved" boolean DEFAULT false,
	"is_dismissed" boolean DEFAULT false,
	"generation_timestamp" timestamp NOT NULL,
	"idea_hash" varchar(64) NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" varchar(255) NOT NULL,
	"token_family" varchar(64) NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"is_revoked" boolean DEFAULT false,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_refresh_token_hash_unique" UNIQUE("refresh_token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(100),
	"city" varchar(100),
	"state" varchar(100),
	"skill_tags" text[] DEFAULT '{}',
	"daily_income_goal" integer DEFAULT 500,
	"language_pref" varchar(10) DEFAULT 'en',
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_user_id_idx" ON "analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_event_type_idx" ON "analytics" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "analytics_created_at_idx" ON "analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_user_event_idx" ON "analytics" USING btree ("user_id","event_type");--> statement-breakpoint
CREATE INDEX "analytics_user_created_idx" ON "analytics" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ideas_user_id_idx" ON "ideas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ideas_generated_at_idx" ON "ideas" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "ideas_is_saved_idx" ON "ideas" USING btree ("is_saved");--> statement-breakpoint
CREATE INDEX "ideas_is_dismissed_idx" ON "ideas" USING btree ("is_dismissed");--> statement-breakpoint
CREATE INDEX "ideas_user_generated_idx" ON "ideas" USING btree ("user_id","generated_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_family_idx" ON "sessions" USING btree ("token_family");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_user_created_idx" ON "sessions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");