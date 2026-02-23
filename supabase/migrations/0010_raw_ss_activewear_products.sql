-- raw schema already created in 0009_analytics_schemas.sql
CREATE TABLE "raw"."ss_activewear_products" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "raw"."ss_activewear_products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"sku" varchar(50) NOT NULL,
	"style_id_external" varchar(100) NOT NULL,
	"style_name" varchar(500),
	"brand_name" varchar(255),
	"color_name" varchar(255),
	"color_code" varchar(50),
	"color_price_code_name" varchar(255),
	"size_name" varchar(100),
	"size_code" varchar(50),
	"size_price_code_name" varchar(255),
	"piece_price" numeric(10, 4),
	"dozen_price" numeric(10, 4),
	"case_price" numeric(10, 4),
	"case_qty" varchar(20),
	"customer_price" numeric(10, 4),
	"map_price" numeric(10, 4),
	"sale_price" numeric(10, 4),
	"sale_expiration" varchar(50),
	"gtin" varchar(20),
	"_loaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"_source" varchar(50) DEFAULT 'ss_activewear' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_raw_ss_products_style_id" ON "raw"."ss_activewear_products" USING btree ("style_id_external");--> statement-breakpoint
CREATE INDEX "idx_raw_ss_products_loaded_at" ON "raw"."ss_activewear_products" USING btree ("_loaded_at");