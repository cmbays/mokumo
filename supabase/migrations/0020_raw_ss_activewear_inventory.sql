CREATE TABLE "raw"."ss_activewear_inventory" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "raw"."ss_activewear_inventory_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"sku" varchar(50) NOT NULL,
	"sku_id_master" bigint,
	"style_id_external" varchar(100) NOT NULL,
	"warehouses" jsonb NOT NULL,
	"_loaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"_source" varchar(50) DEFAULT 'ss_activewear' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_raw_ss_inv_sku_loaded_at" ON "raw"."ss_activewear_inventory" USING btree ("sku","_loaded_at");--> statement-breakpoint
CREATE INDEX "idx_raw_ss_inv_style_id" ON "raw"."ss_activewear_inventory" USING btree ("style_id_external");--> statement-breakpoint
CREATE INDEX "idx_raw_ss_inv_loaded_at" ON "raw"."ss_activewear_inventory" USING btree ("_loaded_at");