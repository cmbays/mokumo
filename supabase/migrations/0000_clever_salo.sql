CREATE TABLE "catalog" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"brand" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(500) NOT NULL,
	"base_category" varchar(100) NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"available_colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"available_sizes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
