import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_posts" ADD COLUMN "thumbnail_id" integer;
  ALTER TABLE "_blog_posts_v" ADD COLUMN "version_thumbnail_id" integer;
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_version_thumbnail_id_media_id_fk" FOREIGN KEY ("version_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "blog_posts_thumbnail_idx" ON "blog_posts" USING btree ("thumbnail_id");
  CREATE INDEX "_blog_posts_v_version_version_thumbnail_idx" ON "_blog_posts_v" USING btree ("version_thumbnail_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_thumbnail_id_media_id_fk";
  
  ALTER TABLE "_blog_posts_v" DROP CONSTRAINT "_blog_posts_v_version_thumbnail_id_media_id_fk";
  
  DROP INDEX "blog_posts_thumbnail_idx";
  DROP INDEX "_blog_posts_v_version_version_thumbnail_idx";
  ALTER TABLE "blog_posts" DROP COLUMN "thumbnail_id";
  ALTER TABLE "_blog_posts_v" DROP COLUMN "version_thumbnail_id";`)
}
