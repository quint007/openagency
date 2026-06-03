import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_posts" ADD COLUMN "level" varchar;
  ALTER TABLE "_blog_posts_v" ADD COLUMN "version_level" varchar;`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_posts" DROP COLUMN "level";
  ALTER TABLE "_blog_posts_v" DROP COLUMN "version_level";`)
}
