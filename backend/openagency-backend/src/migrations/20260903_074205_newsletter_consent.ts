import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_newsletter_subscriptions_status" AS ENUM('pending', 'active', 'unsubscribed', 'suppressed', 'expired');
  CREATE TYPE "public"."enum_newsletter_subscriptions_confirmation_delivery_status" AS ENUM('pending', 'sending', 'sent', 'failed');
  CREATE TYPE "public"."enum_newsletter_subscriptions_suppression_reason" AS ENUM('user_unsubscribe', 'complaint', 'hard_bounce', 'administrative');
  CREATE TYPE "public"."enum_newsletter_subscriptions_provider_sync_status" AS ENUM('pending', 'syncing', 'synced', 'failed');
  CREATE TYPE "public"."enum_newsletter_subscriptions_welcome_delivery_status" AS ENUM('pending', 'sending', 'sent', 'failed');
  CREATE TYPE "public"."enum_newsletter_consent_events_event_type" AS ENUM('signup_requested', 'confirmation_sent', 'confirmation_delivery_failed', 'pending_expired', 'consent_confirmed', 'unsubscribed', 'provider_synced', 'provider_sync_failed', 'welcome_sent', 'welcome_delivery_failed');
  CREATE TABLE "newsletter_subscriptions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"status" "enum_newsletter_subscriptions_status" DEFAULT 'pending' NOT NULL,
  	"generation" numeric DEFAULT 1 NOT NULL,
  	"purpose" varchar DEFAULT 'newsletter_marketing' NOT NULL,
  	"consent_version" varchar NOT NULL,
  	"privacy_version" varchar NOT NULL,
  	"source" varchar NOT NULL,
  	"requested_at" timestamp(3) with time zone NOT NULL,
  	"confirmation_token_hash" varchar,
  	"confirmation_expires_at" timestamp(3) with time zone,
  	"confirmation_sent_at" timestamp(3) with time zone,
  	"confirmation_delivery_status" "enum_newsletter_subscriptions_confirmation_delivery_status" DEFAULT 'pending' NOT NULL,
  	"confirmation_delivery_attempts" numeric DEFAULT 0 NOT NULL,
  	"confirmation_next_attempt_at" timestamp(3) with time zone,
  	"confirmed_at" timestamp(3) with time zone,
  	"unsubscribed_at" timestamp(3) with time zone,
  	"unsubscribe_token_hash" varchar,
  	"unsubscribe_token_ciphertext" varchar,
  	"suppression_reason" "enum_newsletter_subscriptions_suppression_reason",
  	"provider_sync_status" "enum_newsletter_subscriptions_provider_sync_status" DEFAULT 'pending' NOT NULL,
  	"provider_operation_id" varchar,
  	"provider_contact_id" varchar,
  	"provider_sync_attempts" numeric DEFAULT 0 NOT NULL,
  	"provider_next_attempt_at" timestamp(3) with time zone,
  	"provider_error" varchar,
  	"welcome_sent_at" timestamp(3) with time zone,
  	"welcome_delivery_status" "enum_newsletter_subscriptions_welcome_delivery_status" DEFAULT 'pending' NOT NULL,
  	"welcome_delivery_attempts" numeric DEFAULT 0 NOT NULL,
  	"welcome_next_attempt_at" timestamp(3) with time zone,
  	"welcome_operation_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "newsletter_consent_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subscription_id" integer NOT NULL,
  	"generation" numeric NOT NULL,
  	"event_type" "enum_newsletter_consent_events_event_type" NOT NULL,
  	"event_key" varchar NOT NULL,
  	"occurred_at" timestamp(3) with time zone NOT NULL,
  	"purpose" varchar NOT NULL,
  	"consent_version" varchar NOT NULL,
  	"privacy_version" varchar NOT NULL,
  	"source" varchar NOT NULL,
  	"provider_message_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "newsletter_request_limits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletter_subscriptions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletter_consent_events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletter_request_limits_id" integer;
  ALTER TABLE "newsletter_consent_events" ADD CONSTRAINT "newsletter_consent_events_subscription_id_newsletter_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."newsletter_subscriptions"("id") ON DELETE restrict ON UPDATE no action;
  CREATE UNIQUE INDEX "newsletter_subscriptions_email_idx" ON "newsletter_subscriptions" USING btree ("email");
  CREATE INDEX "newsletter_subscriptions_status_idx" ON "newsletter_subscriptions" USING btree ("status");
  CREATE INDEX "newsletter_subscriptions_confirmation_token_hash_idx" ON "newsletter_subscriptions" USING btree ("confirmation_token_hash");
  CREATE INDEX "newsletter_subscriptions_confirmation_next_attempt_at_idx" ON "newsletter_subscriptions" USING btree ("confirmation_next_attempt_at");
  CREATE INDEX "newsletter_subscriptions_unsubscribe_token_hash_idx" ON "newsletter_subscriptions" USING btree ("unsubscribe_token_hash");
  CREATE INDEX "newsletter_subscriptions_provider_next_attempt_at_idx" ON "newsletter_subscriptions" USING btree ("provider_next_attempt_at");
  CREATE INDEX "newsletter_subscriptions_welcome_next_attempt_at_idx" ON "newsletter_subscriptions" USING btree ("welcome_next_attempt_at");
  CREATE INDEX "newsletter_subscriptions_updated_at_idx" ON "newsletter_subscriptions" USING btree ("updated_at");
  CREATE INDEX "newsletter_subscriptions_created_at_idx" ON "newsletter_subscriptions" USING btree ("created_at");
  CREATE INDEX "newsletter_consent_events_subscription_idx" ON "newsletter_consent_events" USING btree ("subscription_id");
  CREATE UNIQUE INDEX "newsletter_consent_events_event_key_idx" ON "newsletter_consent_events" USING btree ("event_key");
  CREATE INDEX "newsletter_consent_events_updated_at_idx" ON "newsletter_consent_events" USING btree ("updated_at");
  CREATE INDEX "newsletter_consent_events_created_at_idx" ON "newsletter_consent_events" USING btree ("created_at");
  CREATE UNIQUE INDEX "newsletter_request_limits_key_idx" ON "newsletter_request_limits" USING btree ("key");
  CREATE INDEX "newsletter_request_limits_expires_at_idx" ON "newsletter_request_limits" USING btree ("expires_at");
  CREATE INDEX "newsletter_request_limits_updated_at_idx" ON "newsletter_request_limits" USING btree ("updated_at");
  CREATE INDEX "newsletter_request_limits_created_at_idx" ON "newsletter_request_limits" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_subscriptions_fk" FOREIGN KEY ("newsletter_subscriptions_id") REFERENCES "public"."newsletter_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_consent_events_fk" FOREIGN KEY ("newsletter_consent_events_id") REFERENCES "public"."newsletter_consent_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_request_limits_fk" FOREIGN KEY ("newsletter_request_limits_id") REFERENCES "public"."newsletter_request_limits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_newsletter_subscriptions_i_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_subscriptions_id");
  CREATE INDEX "payload_locked_documents_rels_newsletter_consent_events__idx" ON "payload_locked_documents_rels" USING btree ("newsletter_consent_events_id");
  CREATE INDEX "payload_locked_documents_rels_newsletter_request_limits__idx" ON "payload_locked_documents_rels" USING btree ("newsletter_request_limits_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_newsletter_subscriptions_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_newsletter_consent_events_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_newsletter_request_limits_fk";
  DROP INDEX "payload_locked_documents_rels_newsletter_subscriptions_i_idx";
  DROP INDEX "payload_locked_documents_rels_newsletter_consent_events__idx";
  DROP INDEX "payload_locked_documents_rels_newsletter_request_limits__idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "newsletter_subscriptions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "newsletter_consent_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "newsletter_request_limits_id";
  ALTER TABLE "newsletter_subscriptions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "newsletter_consent_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "newsletter_request_limits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "newsletter_consent_events";
  DROP TABLE "newsletter_request_limits";
  DROP TABLE "newsletter_subscriptions";
  DROP TYPE "public"."enum_newsletter_subscriptions_status";
  DROP TYPE "public"."enum_newsletter_subscriptions_confirmation_delivery_status";
  DROP TYPE "public"."enum_newsletter_subscriptions_suppression_reason";
  DROP TYPE "public"."enum_newsletter_subscriptions_provider_sync_status";
  DROP TYPE "public"."enum_newsletter_subscriptions_welcome_delivery_status";
  DROP TYPE "public"."enum_newsletter_consent_events_event_type";`)
}
