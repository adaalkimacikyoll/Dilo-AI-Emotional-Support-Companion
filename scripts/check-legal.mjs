// Fails the build step if the Impressum / privacy details still contain placeholders.
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/lib/operator.ts", import.meta.url), "utf8");
const missing = [...source.matchAll(/"\[(.+?)\]"/g)].map((m) => m[1]);
if (missing.length) {
  console.error(`Fill in src/lib/operator.ts before publishing. Missing: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("Legal details complete.");
