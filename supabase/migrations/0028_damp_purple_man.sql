ALTER TABLE "artwork_pieces" DROP CONSTRAINT "artwork_pieces_customer_id_customers_id_fk";
--> statement-breakpoint
DROP INDEX "idx_artwork_pieces_shop_customer";--> statement-breakpoint
ALTER TABLE "artwork_pieces" ADD COLUMN "scope" text DEFAULT 'shop' NOT NULL;--> statement-breakpoint
ALTER TABLE "artwork_pieces" ADD CONSTRAINT "artwork_pieces_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_artwork_pieces_shop_scope" ON "artwork_pieces" USING btree ("shop_id","scope");

-- ─── Invariant: scope and customer_id must be consistent ───────────────────────
-- scope='shop'     → customer_id must be NULL (no customer association)
-- scope='customer' → customer_id must be NOT NULL (explicit customer link)
-- This replaces the anti-pattern of using nullable FK as an implicit discriminator.
ALTER TABLE "artwork_pieces" ADD CONSTRAINT "artwork_pieces_scope_check"
  CHECK (
    (scope = 'shop'     AND customer_id IS NULL) OR
    (scope = 'customer' AND customer_id IS NOT NULL)
  );