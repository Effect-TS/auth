/**
 * Explicit WebCrypto backends and global adapters for Effect entropy, digests, and HMAC.
 *
 * @stability unstable
 * @since 0.1.0
 */
import * as Crypto from "effect/Crypto"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as PlatformError from "effect/PlatformError"

import { Hmac } from "./Hmac.ts"
import { makeHmac } from "./internal/hmac.ts"
import { makeLayer } from "./internal/layer.ts"
import { layerUnsupported } from "./internal/scrypt-backend.ts"
import type { Limits } from "./Kdf.ts"

/**
 * Supply the host capability explicitly; no implicit global backend selection.
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layer = (subtle: SubtleCrypto, limits: Partial<Limits> = {}) =>
  makeLayer(subtle, limits).pipe(Layer.provide(layerUnsupported))

/**
 * HMAC alone has no KDF admission requirement.
 *
 * **Example** (Signing with an explicit WebCrypto backend)
 *
 * ```ts import.meta.vitest
 * import { Hmac } from "@yielded/crypto"
 * import { layerHmac } from "@yielded/crypto/WebCrypto"
 * import * as Effect from "effect/Effect"
 * import * as Redacted from "effect/Redacted"
 *
 * const program = Effect.gen(function*() {
 *   const hmac = yield* Hmac.Hmac
 *   return yield* hmac.sign({
 *     algorithm: "SHA-256",
 *     key: Redacted.make(new Uint8Array(32).fill(7)),
 *     data: new TextEncoder().encode("example")
 *   })
 * })
 * const tag = await Effect.runPromise(
 *   program.pipe(Effect.provide(layerHmac(globalThis.crypto.subtle)))
 * )
 * tag.length // => 32
 * ```
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layerHmac = (subtle: SubtleCrypto): Layer.Layer<Hmac> => Layer.sync(Hmac)(() => makeHmac(subtle))

const unavailable = (method: string) => PlatformError.systemError({ _tag: "Unknown", module: "Crypto", method })

/**
 * Effect entropy and SHA digests from the host's global WebCrypto implementation.
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layerCryptoWeb: Layer.Layer<Crypto.Crypto> = Layer.sync(Crypto.Crypto)(() => {
  const service = Crypto.make({
    randomBytes: (size) => {
      try {
        return globalThis.crypto.getRandomValues(new Uint8Array(size))
      } catch {
        // Crypto's synchronous random helpers have no typed error channel.
        // Keep their defects secret-safe, too.
        throw unavailable("randomBytes")
      }
    },
    digest: (algorithm, data) =>
      Effect.tryPromise({
        try: () => globalThis.crypto.subtle.digest(algorithm, new Uint8Array(data)),
        catch: () => unavailable("digest")
      }).pipe(Effect.map((bytes) => new Uint8Array(bytes)))
  })

  // Crypto.make executes its synchronous entropy callback inside Effects. Its
  // typed methods need an explicit boundary to classify host exceptions.
  const capture = <A>(effect: Effect.Effect<A, PlatformError.PlatformError>, method: string) =>
    effect.pipe(Effect.catchDefect(() => Effect.fail(unavailable(method))))

  return Crypto.Crypto.of({
    ...service,
    randomBytes: (size) => capture(service.randomBytes(size), "randomBytes"),
    randomUUIDv4: ((options?: { readonly format?: "hex" | "bytes" }) =>
      capture(service.randomUUIDv4(options), "randomUUIDv4")) as Crypto.Crypto["randomUUIDv4"],
    randomUUIDv7: ((options?: { readonly format?: "hex" | "bytes" }) =>
      capture(service.randomUUIDv7(options), "randomUUIDv7")) as Crypto.Crypto["randomUUIDv7"],
    randomULID: capture(service.randomULID, "randomULID")
  })
})

/**
 * HMAC from global WebCrypto. Missing WebCrypto is a platform defect at Layer construction.
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layerHmacWeb: Layer.Layer<Hmac> = Layer.effect(Hmac)(
  Effect.suspend(() => {
    const subtle = globalThis.crypto?.subtle

    return subtle === undefined
      ? Effect.die(
        PlatformError.systemError({
          _tag: "NotFound",
          module: "Crypto",
          method: "layerHmacWeb",
          description: "WebCrypto is unavailable in this runtime"
        })
      )
      : Effect.succeed(makeHmac(subtle))
  })
)

/**
 * Entropy, SHA digests and HMAC for sessions and proofs, without password derivation.
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layerWebCrypto = Layer.merge(layerCryptoWeb, layerHmacWeb)
