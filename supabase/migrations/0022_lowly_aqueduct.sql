CREATE TYPE "public"."activity_direction" AS ENUM('inbound', 'outbound', 'internal');--> statement-breakpoint
CREATE TYPE "public"."activity_source" AS ENUM('manual', 'system', 'email', 'sms', 'voicemail', 'portal');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('staff', 'system', 'customer');--> statement-breakpoint
CREATE TYPE "public"."customer_address_type" AS ENUM('billing', 'shipping', 'both');--> statement-breakpoint
CREATE TYPE "public"."contact_role" AS ENUM('ordering', 'billing', 'art-approver', 'primary');--> statement-breakpoint
CREATE TYPE "public"."health_status" AS ENUM('active', 'potentially-churning', 'churned');--> statement-breakpoint
CREATE TYPE "public"."lifecycle_stage" AS ENUM('prospect', 'new', 'repeat', 'vip', 'at-risk', 'archived');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"label" varchar(100) NOT NULL,
	"type" "customer_address_type" NOT NULL,
	"street1" varchar(255) NOT NULL,
	"street2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"zip" varchar(20) NOT NULL,
	"country" varchar(2) DEFAULT 'US' NOT NULL,
	"attention_to" varchar(100),
	"is_primary_billing" boolean DEFAULT false NOT NULL,
	"is_primary_shipping" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"title" varchar(100),
	"role" text[] DEFAULT '{}' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"portal_access" boolean DEFAULT false NOT NULL,
	"can_approve_proofs" boolean DEFAULT false NOT NULL,
	"can_place_orders" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"source" "activity_source" NOT NULL,
	"direction" "activity_direction" DEFAULT 'internal' NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" uuid,
	"content" text NOT NULL,
	"external_ref" varchar(255),
	"related_entity_type" varchar(50),
	"related_entity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_group_members" (
	"customer_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	CONSTRAINT "customer_group_members_customer_id_group_id_pk" PRIMARY KEY("customer_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "customer_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_tax_exemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"state" varchar(2) NOT NULL,
	"cert_number" varchar(100),
	"document_url" text,
	"expiry_date" date,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"company" varchar(255) NOT NULL,
	"lifecycle_stage" "lifecycle_stage" DEFAULT 'prospect' NOT NULL,
	"health_status" "health_status" DEFAULT 'active' NOT NULL,
	"type_tags" text[] DEFAULT '{}' NOT NULL,
	"payment_terms" varchar(50) DEFAULT 'net30',
	"pricing_tier" varchar(50) DEFAULT 'standard',
	"discount_pct" numeric(5, 4) DEFAULT '0',
	"tax_exempt" boolean DEFAULT false NOT NULL,
	"tax_exempt_cert_expiry" date,
	"credit_limit" numeric(10, 2),
	"referral_by_customer_id" uuid,
	"metadata" jsonb,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_group_members" ADD CONSTRAINT "customer_group_members_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_group_members" ADD CONSTRAINT "customer_group_members_group_id_customer_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."customer_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_groups" ADD CONSTRAINT "customer_groups_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tax_exemptions" ADD CONSTRAINT "customer_tax_exemptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_addresses_customer_id" ON "addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_contacts_customer_id" ON "contacts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_activities_customer_id_created_at" ON "customer_activities" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_customer_activities_shop_id" ON "customer_activities" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_tax_exemptions_customer_id_state" ON "customer_tax_exemptions" USING btree ("customer_id","state");--> statement-breakpoint
CREATE INDEX "idx_customers_shop_id_company" ON "customers" USING btree ("shop_id","company");--> statement-breakpoint
CREATE INDEX "idx_customers_referral" ON "customers" USING btree ("referral_by_customer_id");

-- ─── Row Level Security ────────────────────────────────────────────────────────
-- All customer tables are tenant-scoped: only authenticated users of the same
-- shop can read/write. The shop_id is extracted from the Supabase JWT claims.
-- Pattern: shop_id = (auth.jwt() ->> 'shop_id')::uuid

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_shop_scoped_read" ON customers
  FOR SELECT TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
CREATE POLICY "customers_shop_scoped_write" ON customers
  FOR ALL TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid)
  WITH CHECK (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_shop_scoped_read" ON contacts
  FOR SELECT TO authenticated
  USING (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));
CREATE POLICY "contacts_shop_scoped_write" ON contacts
  FOR ALL TO authenticated
  USING (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_shop_scoped_read" ON addresses
  FOR SELECT TO authenticated
  USING (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));
CREATE POLICY "addresses_shop_scoped_write" ON addresses
  FOR ALL TO authenticated
  USING (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));

ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_groups_shop_scoped_read" ON customer_groups
  FOR SELECT TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
CREATE POLICY "customer_groups_shop_scoped_write" ON customer_groups
  FOR ALL TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid)
  WITH CHECK (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

ALTER TABLE customer_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_group_members_shop_scoped_read" ON customer_group_members
  FOR SELECT TO authenticated
  USING (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));
CREATE POLICY "customer_group_members_shop_scoped_write" ON customer_group_members
  FOR ALL TO authenticated
  USING (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));

ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_activities_shop_scoped_read" ON customer_activities
  FOR SELECT TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
CREATE POLICY "customer_activities_shop_scoped_write" ON customer_activities
  FOR ALL TO authenticated
  USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid)
  WITH CHECK (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

ALTER TABLE customer_tax_exemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_tax_exemptions_shop_scoped_read" ON customer_tax_exemptions
  FOR SELECT TO authenticated
  USING (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));
CREATE POLICY "customer_tax_exemptions_shop_scoped_write" ON customer_tax_exemptions
  FOR ALL TO authenticated
  USING (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM customers WHERE shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));

-- ─── Seed Data ─────────────────────────────────────────────────────────────────
-- 5 realistic 4Ink-style customers. UUIDs are deterministic for idempotency.
-- Shop UUID: 00000000-0000-4000-8000-000000004e6b (4Ink production shop)

INSERT INTO customers (id, shop_id, company, lifecycle_stage, health_status, type_tags, payment_terms, pricing_tier, discount_pct, tax_exempt, created_at, updated_at)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000004e6b',
    'River City Brewing Co.',
    'repeat', 'active',
    ARRAY['wholesale', 'hospitality'],
    'net30', 'preferred', 0.1000,
    false, NOW(), NOW()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000004e6b',
    'Riverside Academy',
    'vip', 'active',
    ARRAY['school', 'nonprofit'],
    'net15', 'wholesale', 0.1500,
    true, NOW(), NOW()
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000004e6b',
    'Austin Sports League',
    'repeat', 'active',
    ARRAY['sports', 'nonprofit'],
    'due-on-receipt', 'standard', 0.0500,
    false, NOW(), NOW()
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000004e6b',
    'Central Baptist Church',
    'new', 'active',
    ARRAY['nonprofit', 'religious'],
    'net30', 'standard', 0.0000,
    true, NOW(), NOW()
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    '00000000-0000-4000-8000-000000004e6b',
    'Thompson''s Restaurant Group',
    'prospect', 'active',
    ARRAY['hospitality', 'corporate'],
    'net30', 'standard', 0.0000,
    false, NOW(), NOW()
  )
ON CONFLICT DO NOTHING;

-- Seed primary contacts for the first three customers
INSERT INTO contacts (id, customer_id, first_name, last_name, email, phone, title, role, is_primary, created_at)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Marcus', 'Rivera', 'marcus@rivercitybrewing.com', '512-555-0101',
    'Marketing Director', ARRAY['ordering', 'primary'], true, NOW()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'Coach', 'Johnson', 'cjohnson@riversideacademy.edu', '512-555-0102',
    'Athletic Director', ARRAY['ordering', 'primary'], true, NOW()
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'Dana', 'Kim', 'dana@austinsportsleague.org', '512-555-0103',
    'League Coordinator', ARRAY['ordering', 'primary'], true, NOW()
  )
ON CONFLICT DO NOTHING;

-- Seed primary addresses for the first three customers
INSERT INTO addresses (id, customer_id, label, type, street1, city, state, zip, country, is_primary_billing, is_primary_shipping, created_at)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Main Taproom', 'both', '1200 Barton Springs Rd', 'Austin', 'TX', '78704', 'US', true, true, NOW()
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'School Office', 'both', '4500 Riverside Dr', 'Austin', 'TX', '78741', 'US', true, true, NOW()
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'League HQ', 'both', '8000 Research Blvd', 'Austin', 'TX', '78758', 'US', true, true, NOW()
  )
ON CONFLICT DO NOTHING;