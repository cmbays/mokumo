CREATE TYPE "public"."interpolation_mode" AS ENUM('linear', 'step');--> statement-breakpoint
CREATE TABLE "garment_markup_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"garment_category" varchar(50) NOT NULL,
	"markup_multiplier" numeric(5, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"service_type" varchar(50) NOT NULL,
	"interpolation_mode" "interpolation_mode" DEFAULT 'linear' NOT NULL,
	"setup_fee_per_color" numeric(10, 2) DEFAULT 0 NOT NULL,
	"size_upcharge_xxl" numeric(10, 2) DEFAULT 0 NOT NULL,
	"standard_turnaround_days" integer DEFAULT 7 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "print_cost_matrix" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"qty_anchor" integer NOT NULL,
	"color_count" integer,
	"cost_per_piece" numeric(10, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rush_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"days_under_standard" integer NOT NULL,
	"flat_fee" numeric(10, 2) DEFAULT 0 NOT NULL,
	"pct_surcharge" numeric(5, 4) DEFAULT 0 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "garment_markup_rules" ADD CONSTRAINT "garment_markup_rules_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_templates" ADD CONSTRAINT "pricing_templates_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_cost_matrix" ADD CONSTRAINT "print_cost_matrix_template_id_pricing_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."pricing_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rush_tiers" ADD CONSTRAINT "rush_tiers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_garment_markup_rules_shop_id" ON "garment_markup_rules" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_templates_shop_id" ON "pricing_templates" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_templates_shop_service" ON "pricing_templates" USING btree ("shop_id","service_type");--> statement-breakpoint
CREATE INDEX "idx_print_cost_matrix_template_id" ON "print_cost_matrix" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_rush_tiers_shop_id" ON "rush_tiers" USING btree ("shop_id");

-- ─── Partial Unique Indexes ────────────────────────────────────────────────────
-- These constraints cannot be expressed in Drizzle schema and must be added manually.

-- Only one default template per (shop_id, service_type)
CREATE UNIQUE INDEX "uq_pricing_templates_default_per_shop_service"
  ON "pricing_templates" ("shop_id", "service_type")
  WHERE is_default = true;

-- print_cost_matrix uniqueness depends on whether color_count is NULL (DTF) or set (screen print)
-- Screen print: one row per (template, qty_anchor, color_count)
CREATE UNIQUE INDEX "uq_print_cost_matrix_sp"
  ON "print_cost_matrix" ("template_id", "qty_anchor", "color_count")
  WHERE color_count IS NOT NULL;

-- DTF: one row per (template, qty_anchor) — color_count is always NULL
CREATE UNIQUE INDEX "uq_print_cost_matrix_dtf"
  ON "print_cost_matrix" ("template_id", "qty_anchor")
  WHERE color_count IS NULL;

-- ─── Row Level Security ────────────────────────────────────────────────────────
-- All pricing tables are tenant-scoped: only authenticated users of the same
-- shop can read/write. Pattern: shop_id = (auth.jwt() ->> 'shop_id')::uuid
-- Matches the established pattern from migration 0022 (customers tables).

ALTER TABLE pricing_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_templates_shop_scoped_read" ON pricing_templates
  FOR SELECT TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
CREATE POLICY "pricing_templates_shop_scoped_write" ON pricing_templates
  FOR ALL TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid)
  WITH CHECK (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

ALTER TABLE garment_markup_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "garment_markup_rules_shop_scoped_read" ON garment_markup_rules
  FOR SELECT TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
CREATE POLICY "garment_markup_rules_shop_scoped_write" ON garment_markup_rules
  FOR ALL TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid)
  WITH CHECK (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

ALTER TABLE rush_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rush_tiers_shop_scoped_read" ON rush_tiers
  FOR SELECT TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
CREATE POLICY "rush_tiers_shop_scoped_write" ON rush_tiers
  FOR ALL TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid)
  WITH CHECK (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

-- print_cost_matrix has no direct shop_id — scope via pricing_templates join
ALTER TABLE print_cost_matrix ENABLE ROW LEVEL SECURITY;
CREATE POLICY "print_cost_matrix_shop_scoped_read" ON print_cost_matrix
  FOR SELECT TO authenticated
  USING (template_id IN (
    SELECT id FROM pricing_templates WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));
CREATE POLICY "print_cost_matrix_shop_scoped_write" ON print_cost_matrix
  FOR ALL TO authenticated
  USING (template_id IN (
    SELECT id FROM pricing_templates WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ))
  WITH CHECK (template_id IN (
    SELECT id FROM pricing_templates WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));