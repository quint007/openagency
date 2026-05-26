import * as migration_20260418_105543 from './20260418_105543';
import * as migration_20260526_191417_api_clients_mcp_keys from './20260526_191417_api_clients_mcp_keys';

export const migrations = [
  {
    up: migration_20260418_105543.up,
    down: migration_20260418_105543.down,
    name: '20260418_105543',
  },
  {
    up: migration_20260526_191417_api_clients_mcp_keys.up,
    down: migration_20260526_191417_api_clients_mcp_keys.down,
    name: '20260526_191417_api_clients_mcp_keys'
  },
];
