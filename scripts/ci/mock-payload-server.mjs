import { createServer } from "node:http";

const port = Number.parseInt(process.env.PORT ?? "4010", 10);

createServer((_request, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ docs: [] }));
}).listen(port, "127.0.0.1", () => {
  console.log(`Mock Payload API listening on http://127.0.0.1:${port}`);
});
