CREATE SCHEMA IF NOT EXISTS "marts";
--> statement-breakpoint
CREATE TABLE "marts"."dim_price_group" (
	"price_group_key" varchar(32) PRIMARY KEY NOT NULL,
	"source" varchar(50) NOT NULL,
	"color_price_group" varchar(255) NOT NULL,
	"size_price_group" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marts"."dim_product" (
	"product_key" varchar(32) PRIMARY KEY NOT NULL,
	"source" varchar(50) NOT NULL,
	"style_id" varchar(100) NOT NULL,
	"product_name" varchar(500),
	"brand_name" varchar(255),
	"gtin" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "marts"."dim_supplier" (
	"supplier_key" varchar(32) PRIMARY KEY NOT NULL,
	"supplier_code" varchar(50) NOT NULL,
	"supplier_name" varchar(255) NOT NULL,
	"website" varchar(500),
	"is_active" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marts"."fct_supplier_pricing" (
	"pricing_fact_key" varchar(32) PRIMARY KEY NOT NULL,
	"product_key" varchar(32) NOT NULL,
	"supplier_key" varchar(32) NOT NULL,
	"price_group_key" varchar(32) NOT NULL,
	"tier_name" varchar(20) NOT NULL,
	"effective_date" date NOT NULL,
	"is_current" boolean NOT NULL,
	"min_qty" integer NOT NULL,
	"max_qty" integer,
	"unit_price" numeric(10, 4) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_styles" DROP COLUMN "piece_price";--> statement-breakpoint
ALTER TABLE "catalog_styles" DROP COLUMN "dozen_price";--> statement-breakpoint
ALTER TABLE "catalog_styles" DROP COLUMN "case_price";