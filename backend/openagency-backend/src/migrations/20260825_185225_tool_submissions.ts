import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tool_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tool_slug" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"inputs" jsonb NOT NULL,
  	"result" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tool_submissions_id" integer;
  CREATE INDEX "tool_submissions_updated_at_idx" ON "tool_submissions" USING btree ("updated_at");
  CREATE INDEX "tool_submissions_created_at_idx" ON "tool_submissions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tool_submissions_fk" FOREIGN KEY ("tool_submissions_id") REFERENCES "public"."tool_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_tool_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("tool_submissions_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tool_submissions_fk";
  
  DROP INDEX "payload_locked_documents_rels_tool_submissions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tool_submissions_id";
  ALTER TABLE "tool_submissions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tool_submissions" CASCADE;`)
}
