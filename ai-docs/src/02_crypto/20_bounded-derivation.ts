/**
 * @title Sharing password-derivation admission
 *
 * Provide the backend once at the application's service lifetime so concurrent
 * password operations share the same admission limit. Supply a fresh random
 * salt and store the derivation parameters with each credential.
 */
import { Kdf, KdfAdmission } from "@yielded/crypto"
import * as Portable from "@yielded/crypto/Portable"
import { Effect, Layer, type Redacted } from "effect"

export const CryptoLive = Portable.layer(globalThis.crypto.subtle).pipe(
  Layer.provide(KdfAdmission.layer({ concurrency: 2, maxQueued: 16 }))
)

export const derive = (password: Redacted.Redacted<Uint8Array>, salt: Uint8Array) =>
  Effect.gen(function*() {
    const kdf = yield* Kdf.Kdf
    return yield* kdf.argon2id({
      password,
      salt,
      memoryKiB: 65536,
      passes: 2,
      parallelism: 1,
      length: 32
    })
  })
