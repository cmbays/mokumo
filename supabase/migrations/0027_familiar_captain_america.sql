CREATE TABLE "artwork_pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" text NOT NULL,
	"customer_id" uuid,
	"name" text NOT NULL,
	"notes" text,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artwork_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"piece_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color_count" integer,
	"colors" jsonb,
	"internal_status" text DEFAULT 'received' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artwork_versions" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "artwork_pieces" ADD CONSTRAINT "artwork_pieces_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_variants" ADD CONSTRAINT "artwork_variants_piece_id_artwork_pieces_id_fk" FOREIGN KEY ("piece_id") REFERENCES "public"."artwork_pieces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_artwork_pieces_shop_id" ON "artwork_pieces" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_artwork_pieces_customer_id" ON "artwork_pieces" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_artwork_pieces_shop_customer" ON "artwork_pieces" USING btree ("shop_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_artwork_variants_piece_id" ON "artwork_variants" USING btree ("piece_id");--> statement-breakpoint
ALTER TABLE "artwork_versions" ADD CONSTRAINT "artwork_versions_variant_id_artwork_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."artwork_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_artwork_versions_variant_id" ON "artwork_versions" USING btree ("variant_id");

-- ─── Row Level Security ────────────────────────────────────────────────────────
-- Matches the RLS pattern established on artwork_versions (migration 0026):
-- all application access uses the service-role key (bypasses RLS);
-- these policies block direct PostgREST access via anon/authenticated roles.

ALTER TABLE "artwork_pieces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Service role full access" ON "artwork_pieces"
  FOR ALL TO service_role USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "No direct anon access" ON "artwork_pieces"
  FOR ALL TO anon USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "No direct authenticated access" ON "artwork_pieces"
  FOR ALL TO authenticated USING (false) WITH CHECK (false);--> statement-breakpoint

ALTER TABLE "artwork_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Service role full access" ON "artwork_variants"
  FOR ALL TO service_role USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "No direct anon access" ON "artwork_variants"
  FOR ALL TO anon USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "No direct authenticated access" ON "artwork_variants"
  FOR ALL TO authenticated USING (false) WITH CHECK (false);