CREATE TYPE "public"."catalog_image_type" AS ENUM('front', 'back', 'side', 'direct-side', 'on-model-front', 'on-model-back', 'on-model-side', 'swatch');--> statement-breakpoint
CREATE TYPE "public"."garment_category" AS ENUM('t-shirts', 'polos', 'fleece', 'knits-layering', 'outerwear', 'pants', 'shorts', 'headwear', 'activewear', 'accessories', 'wovens', 'other');--> statement-breakpoint
CREATE TABLE "catalog_brand_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"source" varchar(50) NOT NULL,
	"external_id" varchar(100) NOT NULL,
	"external_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_brands_canonical_name_unique" UNIQUE("canonical_name")
);
--> statement-breakpoint
CREATE TABLE "catalog_colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"style_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"hex1" varchar(7),
	"hex2" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"color_id" uuid NOT NULL,
	"image_type" "catalog_image_type" NOT NULL,
	"url" varchar(1024) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_sizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"style_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"price_adjustment" numeric(10, 2) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_style_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" varchar(20) DEFAULT 'shop' NOT NULL,
	"scope_id" uuid NOT NULL,
	"style_id" uuid NOT NULL,
	"is_enabled" boolean,
	"is_favorite" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_styles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(50) NOT NULL,
	"external_id" varchar(100) NOT NULL,
	"brand_id" uuid NOT NULL,
	"style_number" varchar(100) NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" text,
	"category" "garment_category" NOT NULL,
	"subcategory" varchar(100),
	"gtin" varchar(20),
	"piece_price" numeric(10, 2),
	"dozen_price" numeric(10, 2),
	"case_price" numeric(10, 2),
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_brand_sources" ADD CONSTRAINT "catalog_brand_sources_brand_id_catalog_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."catalog_brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_colors" ADD CONSTRAINT "catalog_colors_style_id_catalog_styles_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."catalog_styles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_images" ADD CONSTRAINT "catalog_images_color_id_catalog_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."catalog_colors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_sizes" ADD CONSTRAINT "catalog_sizes_style_id_catalog_styles_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."catalog_styles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_style_preferences" ADD CONSTRAINT "catalog_style_preferences_style_id_catalog_styles_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."catalog_styles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_styles" ADD CONSTRAINT "catalog_styles_brand_id_catalog_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."catalog_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_brand_sources_source_external_id_key" ON "catalog_brand_sources" USING btree ("source","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_colors_style_id_name_key" ON "catalog_colors" USING btree ("style_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_images_color_id_image_type_key" ON "catalog_images" USING btree ("color_id","image_type");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_sizes_style_id_name_key" ON "catalog_sizes" USING btree ("style_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_style_preferences_scope_type_scope_id_style_id_key" ON "catalog_style_preferences" USING btree ("scope_type","scope_id","style_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_styles_source_external_id_key" ON "catalog_styles" USING btree ("source","external_id");