CREATE TYPE "public"."announcement_category" AS ENUM('important', 'update', 'security', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('available', 'borrowed', 'maintenance', 'retired');--> statement-breakpoint
CREATE TYPE "public"."borrow_status" AS ENUM('pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer,
	"user_id" integer NOT NULL,
	"action" varchar(255) NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" "announcement_category" DEFAULT 'important' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"image_urls" text,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_tag" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" integer NOT NULL,
	"model" varchar(255),
	"serial_number" varchar(255),
	"status" "asset_status" DEFAULT 'available' NOT NULL,
	"location" varchar(255),
	"borrow_duration_days" integer DEFAULT 7 NOT NULL,
	"description" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assets_asset_tag_unique" UNIQUE("asset_tag")
);
--> statement-breakpoint
CREATE TABLE "borrow_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"asset_id" integer NOT NULL,
	"request_date" timestamp DEFAULT now() NOT NULL,
	"expected_return_date" timestamp NOT NULL,
	"actual_return_date" timestamp,
	"duration_days" integer DEFAULT 7 NOT NULL,
	"status" "borrow_status" DEFAULT 'pending' NOT NULL,
	"purpose" text NOT NULL,
	"admin_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(100) DEFAULT 'box' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"department" varchar(255),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
