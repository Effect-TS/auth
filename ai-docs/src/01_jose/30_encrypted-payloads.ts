/**
 * @title Encrypting payloads with fresh IVs
 *
 * Import a 32-byte direct-encryption key and provide the runtime Crypto layer.
 * Plaintext stays redacted through authenticated encryption and decryption.
 */
import { NodeCrypto } from "@effect/platform-node"
import { Jwe, Jwk } from "@yielded/jose"
import { Effect, type Redacted } from "effect"

export const roundTrip = (
  secret: Redacted.Redacted<Jwk.SecretJwk>,
  plaintext: Redacted.Redacted<Uint8Array>
) =>
  Effect.gen(function*() {
    const key = yield* Jwk.importSecret(secret, "dir")
    const token = yield* Jwe.encrypt(plaintext, key, { alg: "dir", enc: "A256GCM" })
    const decrypted = yield* Jwe.decrypt(token, key)
    return decrypted.plaintext
  }).pipe(Effect.provide(NodeCrypto.layer))
