import { it } from "@effect/vitest"
import * as WebCrypto from "@yielded/crypto/WebCrypto"
import * as Crypto from "effect/Crypto"
import * as Effect from "effect/Effect"
import type * as PlatformError from "effect/PlatformError"
import { expect, vi } from "vitest"

it.effect("keeps digest and entropy failures typed without retaining native secrets", () =>
  Effect.gen(function*() {
    const crypto = yield* Crypto.Crypto
    const marker = "synthetic-native-secret-do-not-log"
    const failure = new Error(marker)
    const digest = vi.spyOn(globalThis.crypto.subtle, "digest").mockRejectedValue(failure)
    const entropy = vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(() => {
      throw failure
    })

    yield* Effect.gen(function*() {
      const operations: Array<Effect.Effect<unknown, PlatformError.PlatformError>> = [
        crypto.digest("SHA-256", new TextEncoder().encode(marker)),
        crypto.randomBytes(16),
        crypto.randomUUIDv4(),
        crypto.randomUUIDv7(),
        crypto.randomULID
      ]

      for (const operation of operations) {
        const error = yield* operation.pipe(Effect.flip)
        expect(error._tag).toBe("PlatformError")
        expect(JSON.stringify(error)).not.toContain(marker)
        expect(error.cause).toBeUndefined()
        expect(error.reason.cause).toBeUndefined()
      }

      expect(yield* crypto.randomBytes(-1).pipe(Effect.flip)).toMatchObject({
        reason: { _tag: "BadArgument" }
      })
    }).pipe(Effect.ensuring(Effect.sync(() => {
      digest.mockRestore()
      entropy.mockRestore()
    })))
  }).pipe(Effect.provide(WebCrypto.layerCryptoWeb)))
