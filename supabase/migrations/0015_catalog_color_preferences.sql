-- Note: shop_pricing_overrides was already created in 0013_shop_pricing_overrides.sql
-- (manually written, outside Drizzle journal). Only the two new tables are applied here.

CREATE TABLE "catalog_color_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" varchar(20) DEFAULT 'shop' NOT NULL,
	"scope_id" uuid NOT NULL,
	"color_id" uuid NOT NULL,
	"is_favorite" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"color_id" uuid NOT NULL,
	"size_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_color_preferences" ADD CONSTRAINT "catalog_color_preferences_color_id_catalog_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."catalog_colors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_inventory" ADD CONSTRAINT "catalog_inventory_color_id_catalog_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."catalog_colors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_inventory" ADD CONSTRAINT "catalog_inventory_size_id_catalog_sizes_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."catalog_sizes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_color_preferences_scope_type_scope_id_color_id_key" ON "catalog_color_preferences" USING btree ("scope_type","scope_id","color_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_color_preferences_color_id" ON "catalog_color_preferences" USING btree ("color_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_color_preferences_scope" ON "catalog_color_preferences" USING btree ("scope_type","scope_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_inventory_color_id_size_id_key" ON "catalog_inventory" USING btree ("color_id","size_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_inventory_color_id" ON "catalog_inventory" USING btree ("color_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_inventory_size_id" ON "catalog_inventory" USING btree ("size_id");

-- ─── RLS: catalog_color_preferences ─────────────────────────────────────────
-- Tenant-scoped — mirrors catalog_style_preferences policy pattern.
-- Authenticated read only; writes via postgres role (server actions + migrations).

ALTER TABLE catalog_color_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_color_preferences_read_authenticated" ON catalog_color_preferences
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "catalog_color_preferences_write_postgres" ON catalog_color_preferences
FOR ALL TO postgres
USING (true) WITH CHECK (true);