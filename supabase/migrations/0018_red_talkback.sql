CREATE TABLE "catalog_brand_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" varchar(20) DEFAULT 'shop' NOT NULL,
	"scope_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"is_enabled" boolean,
	"is_favorite" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_color_group_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" varchar(20) DEFAULT 'shop' NOT NULL,
	"scope_id" uuid NOT NULL,
	"color_group_id" uuid NOT NULL,
	"is_favorite" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_color_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"color_group_name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_brand_preferences" ADD CONSTRAINT "catalog_brand_preferences_brand_id_catalog_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."catalog_brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_color_group_preferences" ADD CONSTRAINT "catalog_color_group_preferences_color_group_id_catalog_color_groups_id_fk" FOREIGN KEY ("color_group_id") REFERENCES "public"."catalog_color_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_color_groups" ADD CONSTRAINT "catalog_color_groups_brand_id_catalog_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."catalog_brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_brand_preferences_scope_type_scope_id_brand_id_key" ON "catalog_brand_preferences" USING btree ("scope_type","scope_id","brand_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_brand_preferences_scope" ON "catalog_brand_preferences" USING btree ("scope_type","scope_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_color_group_prefs_scope_type_scope_id_color_group_id_key" ON "catalog_color_group_preferences" USING btree ("scope_type","scope_id","color_group_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_color_group_preferences_scope" ON "catalog_color_group_preferences" USING btree ("scope_type","scope_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_color_groups_brand_id_color_group_name_key" ON "catalog_color_groups" USING btree ("brand_id","color_group_name");--> statement-breakpoint
CREATE INDEX "idx_catalog_color_groups_brand_id" ON "catalog_color_groups" USING btree ("brand_id");

-- Backfill catalog_color_groups from existing catalog_colors data (#640 Wave 0)
-- Populates the first-class entity table with all distinct (brand_id, color_group_name) pairs
-- already present in the catalog. Re-running is safe: ON CONFLICT DO NOTHING.
INSERT INTO catalog_color_groups (id, brand_id, color_group_name)
SELECT gen_random_uuid(), cs.brand_id, cc.color_group_name
FROM catalog_colors cc
JOIN catalog_styles cs ON cc.style_id = cs.id
WHERE cc.color_group_name IS NOT NULL
  AND cc.color_group_name <> ''
GROUP BY cs.brand_id, cc.color_group_name
ON CONFLICT (brand_id, color_group_name) DO NOTHING;