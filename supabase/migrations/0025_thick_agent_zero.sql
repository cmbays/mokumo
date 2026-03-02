CREATE TABLE "artwork_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" text NOT NULL,
	"original_path" text NOT NULL,
	"thumb_path" text,
	"preview_path" text,
	"original_url" text,
	"thumb_url" text,
	"preview_url" text,
	"content_hash" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"filename" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_artwork_versions_shop_id_content_hash" ON "artwork_versions" USING btree ("shop_id","content_hash");--> statement-breakpoint
CREATE INDEX "idx_artwork_versions_shop_id" ON "artwork_versions" USING btree ("shop_id");