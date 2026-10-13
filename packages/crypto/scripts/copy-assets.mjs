import { copyFile } from "node:fs/promises"

for (const name of ["argon2.wasm", "argon2-wasm-module.d.ts"]) {
  await copyFile(
    new URL(`../src/internal/${name}`, import.meta.url),
    new URL(`../dist/internal/${name}`, import.meta.url)
  )
}
