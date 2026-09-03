CREATE TABLE "execution_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"recommendation_id" uuid,
	"opportunity_slug" varchar(100) NOT NULL,
	"opportunity_name" varchar(200) NOT NULL,
	"platform" varchar(100) NOT NULL,
	"target_daily_earn" varchar(50) NOT NULL,
	"days" jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"platform" varchar(100) NOT NULL,
	"opportunity_name" varchar(200) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"required_skills" text[] DEFAULT '{}' NOT NULL,
	"minimum_skill_level" varchar(20) DEFAULT 'beginner' NOT NULL,
	"supported_location_tiers" text[] DEFAULT '{"tier1","tier2","tier3","pan_india"}' NOT NULL,
	"supported_cities" text[] DEFAULT '{}',
	"eligibility_requirements" text[] DEFAULT '{}' NOT NULL,
	"requires_vehicle" boolean DEFAULT false NOT NULL,
	"requires_smartphone" boolean DEFAULT true NOT NULL,
	"minimum_age" integer DEFAULT 18 NOT NULL,
	"startup_cost_min" integer DEFAULT 0 NOT NULL,
	"startup_cost_max" integer DEFAULT 0 NOT NULL,
	"recurring_cost_monthly" integer DEFAULT 0 NOT NULL,
	"payout_model" varchar(50) NOT NULL,
	"estimated_payout_min" integer NOT NULL,
	"estimated_payout_max" integer NOT NULL,
	"platform_fee_percent" integer DEFAULT 0 NOT NULL,
	"typical_time_per_unit_min" integer NOT NULL,
	"units_per_hour_typical" real DEFAULT 1.5 NOT NULL,
	"demand_level" varchar(20) DEFAULT 'medium' NOT NULL,
	"reliability_score" integer DEFAULT 85 NOT NULL,
	"verification_status" varchar(30) DEFAULT 'VERIFIED' NOT NULL,
	"source_url" varchar(500) NOT NULL,
	"source_title" varchar(200) NOT NULL,
	"last_verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_fields" jsonb,
	"notes" text,
	"restrictions" text,
	"active_status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "opportunities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"target_daily_income" integer NOT NULL,
	"available_hours_per_day" real NOT NULL,
	"available_capital" integer DEFAULT 0 NOT NULL,
	"has_vehicle" boolean DEFAULT false NOT NULL,
	"experience_level" varchar(20) DEFAULT 'beginner' NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"feasibility_verdict" varchar(30) NOT NULL,
	"feasibility_reason" text NOT NULL,
	"realistic_ceiling_min" integer NOT NULL,
	"realistic_ceiling_max" integer NOT NULL,
	"target_gap" integer DEFAULT 0 NOT NULL,
	"ranked_opportunities" jsonb NOT NULL,
	"income_mix" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"opportunity_slug" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"attempted" boolean DEFAULT true NOT NULL,
	"first_step_completed" boolean DEFAULT false NOT NULL,
	"predicted_daily_income" integer NOT NULL,
	"actual_daily_earned" integer DEFAULT 0 NOT NULL,
	"hours_spent" real DEFAULT 0 NOT NULL,
	"costs_incurred" integer DEFAULT 0 NOT NULL,
	"was_estimate_accurate" boolean,
	"prediction_error_amount" integer,
	"feedback_notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "execution_plans" ADD CONSTRAINT "execution_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_plans" ADD CONSTRAINT "execution_plans_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_outcomes" ADD CONSTRAINT "user_outcomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "execution_plans_user_id_idx" ON "execution_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "execution_plans_opportunity_idx" ON "execution_plans" USING btree ("opportunity_slug");--> statement-breakpoint
CREATE INDEX "opportunities_category_idx" ON "opportunities" USING btree ("category");--> statement-breakpoint
CREATE INDEX "opportunities_active_idx" ON "opportunities" USING btree ("active_status");--> statement-breakpoint
CREATE INDEX "opportunities_platform_idx" ON "opportunities" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "recommendations_user_id_idx" ON "recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recommendations_city_idx" ON "recommendations" USING btree ("city");--> statement-breakpoint
CREATE INDEX "recommendations_created_at_idx" ON "recommendations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_outcomes_user_id_idx" ON "user_outcomes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_outcomes_opportunity_idx" ON "user_outcomes" USING btree ("opportunity_slug");--> statement-breakpoint
CREATE INDEX "user_outcomes_city_idx" ON "user_outcomes" USING btree ("city");