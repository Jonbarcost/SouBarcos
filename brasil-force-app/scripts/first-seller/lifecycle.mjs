import { startLocal, stopLocal } from "./manage.mjs";
// Ownership is acquired before creation, but disposal is destructive only after proof.
export async function withLocalStack(
  task,
  { start = startLocal, stop = stopLocal } = {},
) {
  let owned = false,
    proven = false;
  try {
    await start({
      onOwned: () => {
        owned = true;
      },
      onProven: () => {
        proven = true;
      },
    });
    return await task();
  } finally {
    if (owned) await stop({ discard: proven });
  }
}
