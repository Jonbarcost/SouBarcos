import { createHmac } from "node:crypto";
export function totp(secret, time = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.toUpperCase().replace(/=+$/, "")) {
    const v = alphabet.indexOf(c);
    if (v < 0) throw Error("Invalid test TOTP secret");
    bits += v.toString(2).padStart(5, "0");
  }
  const key = Buffer.from(
    (bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)),
  );
  const count = Buffer.alloc(8);
  count.writeBigUInt64BE(BigInt(Math.floor(time / 30000)));
  const hash = createHmac("sha1", key).update(count).digest();
  const offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
