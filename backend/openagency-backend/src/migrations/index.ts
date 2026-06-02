import * as migration_20260418_105543 from './20260418_105543';
import * as migration_20260526_191417_api_clients_mcp_keys from './20260526_191417_api_clients_mcp_keys';
import * as migration_20260602_072007_blog_post_thumbnail_columns from './20260602_072007_blog_post_thumbnail_columns';

export const migrations = [
  {
    up: migration_20260418_105543.up,
    down: migration_20260418_105543.down,
    name: '20260418_105543',
  },
  {
    up: migration_20260526_191417_api_clients_mcp_keys.up,
    down: migration_20260526_191417_api_clients_mcp_keys.down,
    name: '20260526_191417_api_clients_mcp_keys',
  },
  {
    up: migration_20260602_072007_blog_post_thumbnail_columns.up,
    down: migration_20260602_072007_blog_post_thumbnail_columns.down,
    name: '20260602_072007_blog_post_thumbnail_columns'
  },
];
