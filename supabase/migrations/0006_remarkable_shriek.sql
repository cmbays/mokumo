CREATE TYPE "public"."user_role" AS ENUM('owner', 'operator');--> statement-breakpoint
CREATE TABLE "shop_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "shop_members" ADD CONSTRAINT "shop_members_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shop_members_user_id_shop_id_key" ON "shop_members" USING btree ("user_id","shop_id");--> statement-breakpoint
CREATE INDEX "idx_shop_members_user_id" ON "shop_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_brand_sources_brand_id" ON "catalog_brand_sources" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_colors_style_id" ON "catalog_colors" USING btree ("style_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_images_color_id" ON "catalog_images" USING btree ("color_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_sizes_style_id" ON "catalog_sizes" USING btree ("style_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_style_preferences_style_id" ON "catalog_style_preferences" USING btree ("style_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_styles_brand_id" ON "catalog_styles" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_archived_is_enabled" ON "catalog_archived" USING btree ("is_enabled");