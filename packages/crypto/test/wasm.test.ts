import { readFileSync } from "node:fs"

import { it } from "@effect/vitest"
import * as Kdf from "@yielded/crypto/Kdf"
import * as KdfAdmission from "@yielded/crypto/KdfAdmission"
import * as Effect from "effect/Effect"
import * as Hex from "effect/encoding/Hex"
import * as Layer from "effect/Layer"
import * as Redacted from "effect/Redacted"
import * as Schema from "effect/Schema"
import { expect } from "vitest"

import { makeArgon2 } from "../src/internal/argon2-wasm.ts"
import { makeKdfLayer } from "../src/internal/layer.ts"
import { layerUnsupported } from "../src/internal/scrypt-backend.ts"
import { nativeArgon2Vectors } from "./fixtures/argon2-vectors.ts"
import { argon2Vector } from "./vectors.ts"

const bytes = Schema.decodeSync(Schema.Uint8ArrayFromHex)
const module = new WebAssembly.Module(
  new Uint8Array(readFileSync(new URL("../src/internal/argon2.wasm", import.meta.url)))
)
const layer = makeKdfLayer(globalThis.crypto.subtle, {}, makeArgon2(module)).pipe(
  Layer.provide(layerUnsupported),
  Layer.provide(KdfAdmission.layer())
)

// Exercise the shipped artifact through the same admission and validation path
// used by Workerd, using existing independent references rather than a JS oracle.
it.effect("shipped Argon2 Wasm matches RFC9106 with secret and associated data", () =>
  Effect.gen(function*() {
    const kdf = yield* Kdf.Kdf
    const result = yield* kdf.argon2id({
      password: Redacted.make(bytes(argon2Vector.passwordHex)),
      salt: bytes(argon2Vector.saltHex),
      secret: Redacted.make(bytes(argon2Vector.secretHex)),
      associatedData: bytes(argon2Vector.associatedDataHex),
      memoryKiB: argon2Vector.memoryKiB,
      passes: argon2Vector.iterations,
      parallelism: argon2Vector.parallelism,
      length: argon2Vector.lengthBytes
    })
    expect(Hex.encode(Redacted.value(result))).toBe(argon2Vector.expectedHex)
  }).pipe(Effect.provide(layer)))

for (const vector of nativeArgon2Vectors) {
  it.effect(`shipped Argon2 Wasm matches native reference: ${vector.id}`, () =>
    Effect.gen(function*() {
      const kdf = yield* Kdf.Kdf
      const result = yield* kdf.argon2id({
        password: Redacted.make(bytes(vector.passwordHex)),
        salt: bytes(vector.saltHex),
        memoryKiB: vector.m,
        passes: vector.t,
        parallelism: vector.p,
        length: vector.length
      })
      expect(Hex.encode(Redacted.value(result))).toBe(vector.expectedHex)
    }).pipe(Effect.provide(layer)))
}
