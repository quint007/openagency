# Payload API Access

This backend supports two content automation paths: direct Payload API requests for scripts and the official Payload MCP endpoint for agent tooling.

## Direct API access

Use the `api-clients` auth collection for server-side scripts such as `../blog-writer`.

1. Sign in to the Payload admin panel as a real `users` account.
2. Open the **Api Clients** collection.
3. Create an API client record and generate/copy its API key.
4. Store that key in the script environment outside this repository.
5. Send it with Payload's API-key auth header:

```http
Authorization: api-clients API-Key <your-api-key>
```

Example REST request:

```bash
curl -X POST "$PAYLOAD_BASE_URL/api/blog-posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: api-clients API-Key $PAYLOAD_API_KEY" \
  --data '{
    "title": "Example Post",
    "slug": "example-post",
    "excerpt": "Example excerpt",
    "content": { "root": { "type": "root", "children": [], "direction": null, "format": "", "indent": 0, "version": 1 } },
    "authors": [1]
  }'
```

The current script-facing write access is enabled for `blog-posts` only. Direct API clients can read published blog posts, but draft/unpublished reads remain limited to real Payload users. Add other collections or broader read permissions explicitly if the uploader later needs to create media, authors, categories, or inspect drafts.

## MCP access

The official `@payloadcms/plugin-mcp` plugin is configured for `blog-posts` and exposes the MCP endpoint at:

```text
<PAYLOAD_BASE_URL>/api/mcp
```

MCP clients authenticate with the plugin's API key mechanism using a bearer token:

```http
Authorization: Bearer <mcp-api-key>
```

Cursor example:

```json
{
  "mcpServers": {
    "Payload": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:3000/api/mcp",
        "--header",
        "Authorization: Bearer MCP-USER-API-KEY"
      ]
    }
  }
}
```

VSCode example:

```json
{
  "mcp.servers": {
    "Payload": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://127.0.0.1:3000/api/mcp",
        "--header",
        "Authorization: Bearer MCP-USER-API-KEY"
      ]
    }
  }
}
```

## Security notes

- Do not commit generated API keys.
- The `users` collection remains restricted to real `users` accounts.
- `api-clients` is intended for server-side automation only, not browser code.
- Keep MCP and direct API keys scoped and rotated according to your deployment practices.
