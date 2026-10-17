import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
export const ids = {
  buyer: "00000000-0000-4000-8000-000000000011",
  seller: "00000000-0000-4000-8000-000000000012",
  admin: "00000000-0000-4000-8000-000000000013",
  moderator: "00000000-0000-4000-8000-000000000014",
};
export const session = (id: string) => "1" + id.slice(1);
export async function database() {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz default now());
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id));
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.jwt(),auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
  const as = async (id: string | null, aal = "aal1") => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify(id ? { sub: id, session_id: session(id), aal } : {}),
    ]);
    await db.exec(id ? "set role authenticated" : "set role anon");
  };
  for (const [role, id] of Object.entries(ids)) {
    await db.exec("reset role");
    await db.query("insert into auth.users(id) values($1)", [id]);
    await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [
      session(id),
      id,
    ]);
    await as(id);
    await db.exec("select public.bf_join('Pessoa de teste','2026-10-15')");
    if (["admin", "moderator"].includes(role)) {
      await db.exec("reset role");
      await db.query("update public.bf_accounts set role=$1 where id=$2", [
        role,
        id,
      ]);
    }
  }
  return { db, as };
}
