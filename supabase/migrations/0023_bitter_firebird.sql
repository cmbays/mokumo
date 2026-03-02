ALTER TABLE "customers" ALTER COLUMN "payment_terms" SET DEFAULT 'net-30';--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "discount_pct" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_referral_by_customer_id_customers_id_fk" FOREIGN KEY ("referral_by_customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;