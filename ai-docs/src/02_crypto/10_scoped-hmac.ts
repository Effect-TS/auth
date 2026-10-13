/**
 * @title Signing with an imported HMAC key
 *
 * Import a key for one scope and sign bytes with an explicit WebCrypto backend.
 * The handle cannot be reused after that scope closes.
 */
import * as Hmac from "@yielded/crypto/Hmac"
import * as WebCrypto from "@yielded/crypto/WebCrypto"
import { Effect, type Redacted } from "effect"

export const sign = (secret: Redacted.Redacted<Uint8Array>, data: Uint8Array) =>
  Effect.gen(function*() {
    const hmac = yield* Hmac.Hmac
    const key = yield* hmac.importKey({ algorithm: "SHA-256", key: secret })
    return yield* key.sign(data)
  }).pipe(
    Effect.scoped,
    Effect.provide(WebCrypto.layerHmac(globalThis.crypto.subtle))
  )
