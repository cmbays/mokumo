CREATE TYPE "public"."activity_event_actor_type" AS ENUM('staff', 'system', 'customer');--> statement-breakpoint
CREATE TYPE "public"."activity_event_entity_type" AS ENUM('customer', 'quote', 'job', 'invoice', 'artwork');--> statement-breakpoint
CREATE TYPE "public"."activity_event_type" AS ENUM('created', 'updated', 'archived', 'status_changed', 'note_added', 'attachment_added', 'payment_recorded', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"entity_type" "activity_event_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"event_type" "activity_event_type" NOT NULL,
	"actor_type" "activity_event_actor_type" DEFAULT 'system' NOT NULL,
	"actor_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_events_entity" ON "activity_events" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_events_shop_id" ON "activity_events" USING btree ("shop_id","created_at");--> statement-breakpoint
-- Enable Row Level Security on activity_events.
-- All application access uses the service-role key (bypasses RLS).
-- These policies block direct PostgREST access via anon/authenticated roles,
-- matching the RLS pattern established on every other data table in this project.
ALTER TABLE "activity_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Service role full access" ON "activity_events"
  FOR ALL TO service_role USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "No direct anon access" ON "activity_events"
  FOR ALL TO anon USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "No direct authenticated access" ON "activity_events"
  FOR ALL TO authenticated USING (false) WITH CHECK (false);