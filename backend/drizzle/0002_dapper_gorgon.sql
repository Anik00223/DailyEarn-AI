ALTER TABLE "ideas" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "ideas" ADD COLUMN "state" varchar(100);--> statement-breakpoint
CREATE INDEX "ideas_user_location_idx" ON "ideas" USING btree ("user_id","city");