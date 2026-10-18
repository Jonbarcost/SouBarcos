import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const homepage = readFileSync(join(root, "src/app/page.tsx"), "utf8");
const categories = ["vestuario", "campo", "acessorios", "colecionismo", "outdoor", "servicos"];

test("every home category has a unique local thematic SVG image", () => {
  for (const slug of categories) {
    const name = `/images/categories/${slug}.svg`;
    assert.ok(homepage.includes(`image: "${name}"`), `missing image mapping: ${slug}`);
    const path = join(root, "public", "images", "categories", slug + ".svg");
    assert.ok(existsSync(path), `missing image file: ${slug}`);
    const svg = readFileSync(path, "utf8");
    assert.match(svg, /^<svg\b/);
    assert.match(svg, /viewBox="0 0 640 420"/);
    assert.doesNotMatch(svg, /<script|<foreignObject|href\s*=\s*["']https?:/i);
  }
  assert.match(homepage, /bf-category-media/);
});
