import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const homepage = readFileSync(join(root, "src/app/page.tsx"), "utf8");
const categories = ["vestuario", "campo", "acessorios", "colecionismo", "outdoor", "servicos"];

const provenance = readFileSync(join(root, "docs/RESCUE-ASSETS.md"), "utf8");

test("every home category has a unique local photo with recorded provenance", () => {
  for (const slug of categories) {
    const name = `/images/categories/${slug}.webp`;
    assert.ok(homepage.includes(`image: "${name}"`), `missing image mapping: ${slug}`);
    const path = join(root, "public", "images", "categories", slug + ".webp");
    assert.ok(existsSync(path), `missing image file: ${slug}`);
    const file = readFileSync(path);
    assert.equal(file.subarray(0, 4).toString("latin1"), "RIFF", `${slug} is not WebP`);
    assert.equal(file.subarray(8, 12).toString("latin1"), "WEBP", `${slug} is not WebP`);
    assert.ok(file.length < 250_000, `${slug} photo is too heavy: ${file.length} bytes`);
    assert.ok(provenance.includes(`public/images/categories/${slug}.webp`), `missing provenance: ${slug}`);
  }
  assert.match(homepage, /bf-category-media/);
});
