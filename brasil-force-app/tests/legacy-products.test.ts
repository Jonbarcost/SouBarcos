import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("legacy retirement preserves rows and reads while blocking client writes", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon; create role authenticated; create table public.products(id integer primary key); insert into public.products values(1); alter table public.products enable row level security; grant select,insert,update,delete,truncate on public.products to public,anon,authenticated; create policy "Leitura pública dos produtos" on public.products for select using(true); create policy "Permitir inserção de produtos" on public.products for insert with check(true); create policy "Permitir remoção de produtos" on public.products for delete using(true);`,
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/20261016102846_retire_legacy_product_writes.sql",
        "utf8",
      ),
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      assert.equal(
        (await db.query("select * from public.products")).rows.length,
        1,
      );
      for (const sql of [
        "insert into public.products values(2)",
        "delete from public.products",
        "update public.products set id=3",
        "truncate public.products",
      ])
        await assert.rejects(db.exec(sql), /permission denied/);
      await db.exec("reset role");
    }
    assert.equal(
      (await db.query("select * from public.products")).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});
