import type * as Aead from "@yielded/crypto/Aead"
import type * as Errors from "@yielded/crypto/Errors"
import type * as Hmac from "@yielded/crypto/Hmac"
import * as Kdf from "@yielded/crypto/Kdf"
import type * as KdfAdmission from "@yielded/crypto/KdfAdmission"
import type * as Signature from "@yielded/crypto/Signature"
import * as WebCrypto from "@yielded/crypto/WebCrypto"
import * as Effect from "effect/Effect"
import * as Redacted from "effect/Redacted"
import * as Schema from "effect/Schema"
import type * as Scope from "effect/Scope"
import { describe, expect, it } from "tstyche"

declare const hmac: Hmac.Hmac["Service"]
declare const aead: Aead.Aead["Service"]
declare const signature: Signature.Signature["Service"]
declare const kdf: Kdf.Kdf["Service"]

describe("crypto schema and service contracts", () => {
  it("preserves algorithm literals and redacted schema fields", () => {
    expect<Aead.Algorithm>().type.toBe<"AES-256-GCM" | "XChaCha20-Poly1305">()
    expect<Hmac.Algorithm>().type.toBe<"SHA-1" | "SHA-256" | "SHA-384" | "SHA-512">()
    expect<typeof Kdf.Argon2idInput.Type>().type.toBe<Kdf.Argon2idInput>()
    expect<Kdf.Argon2idInput["password"]>().type.toBe<Redacted.Redacted<Uint8Array>>()
    expect<Aead.EncryptInput["plaintext"]>().type.toBe<Redacted.Redacted<Uint8Array>>()
    expect<Signature.KeyPairParameters["privateKey"]>().type.toBe<
      Redacted.Redacted<Signature.PrivateKeyParameters>
    >()

    const decoded = Schema.decodeUnknownEffect(Kdf.Pbkdf2Input)({})
    expect<Effect.Success<typeof decoded>>().type.toBe<Kdf.Pbkdf2Input>()
    expect<Effect.Services<typeof decoded>>().type.toBe<never>()
  })

  it("requires a scope for reusable native key handles", () => {
    const key = Redacted.make(new Uint8Array(32))
    const mac = hmac.importKey({ algorithm: "SHA-256", key })
    const encryption = aead.importKey({ algorithm: "AES-256-GCM", key })
    const signing = signature.importPrivateKey({ algorithm: "Ed25519", privateKey: key })
    expect<Effect.Services<typeof mac>>().type.toBe<Scope.Scope>()
    expect<Effect.Services<typeof encryption>>().type.toBe<Scope.Scope>()
    expect<Effect.Services<typeof signing>>().type.toBe<Scope.Scope>()
    expect<Effect.Error<typeof mac>>().type.toBe<Errors.OperationError>()
    expect<Effect.Success<typeof mac>>().type.toBe<Hmac.Key>()
    expect<Effect.Success<typeof encryption>>().type.toBe<Aead.Key>()
    expect<Effect.Success<typeof signing>>().type.toBe<Signature.PrivateKey>()
  })

  it("retains admission requirements and typed derivation failures", () => {
    const derived = kdf.pbkdf2({
      password: Redacted.make(new Uint8Array(32)),
      salt: new Uint8Array(16),
      iterations: 1,
      length: 32
    })
    expect<Effect.Error<typeof derived>>().type.toBe<Errors.OperationError | Errors.KdfBusy>()
    expect<Effect.Success<typeof derived>>().type.toBe<Redacted.Redacted<Uint8Array>>()
    expect<Effect.Services<typeof derived>>().type.toBe<never>()

    const backend = Effect.gen(function*() {
      return yield* Kdf.Kdf
    }).pipe(Effect.provide(WebCrypto.layer(globalThis.crypto.subtle)))
    expect<Effect.Services<typeof backend>>().type.toBe<KdfAdmission.KdfAdmission>()
    expect<Effect.Error<typeof backend>>().type.toBe<Errors.InvalidInput>()

    const authenticated = aead.decrypt({
      algorithm: "AES-256-GCM",
      key: Redacted.make(new Uint8Array(32)),
      nonce: new Uint8Array(12),
      ciphertext: new Uint8Array(16)
    })
    expect<Effect.Error<typeof authenticated>>().type.toBe<Errors.OperationError | Errors.AuthenticationFailed>()
  })
})
