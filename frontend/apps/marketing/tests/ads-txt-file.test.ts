// @vitest-environment node

import { readFile } from "node:fs/promises";

import { expect, test } from "vitest";

test("ads.txt declares the Google AdSense publisher", async () => {
  const adsTxt = await readFile(new URL("../public/ads.txt", import.meta.url), "utf8");

  expect(adsTxt).toBe(
    "google.com, pub-4790131778246365, DIRECT, f08c47fec0942fa0\n",
  );
});
