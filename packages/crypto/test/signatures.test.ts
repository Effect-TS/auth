import { generateKeyPairSync, verify } from "node:crypto"

import { it } from "@effect/vitest"
import * as Portable from "@yielded/crypto/Portable"
import { Signature } from "@yielded/crypto/Signature"
import * as Effect from "effect/Effect"
import * as Hex from "effect/encoding/Hex"
import * as Redacted from "effect/Redacted"
import * as Schema from "effect/Schema"
import { describe, expect } from "vitest"

import { backends, utf8 } from "./backends.ts"
import { ed25519PrivateKeyHex, signatureVectors } from "./vectors.ts"

const bytes = Schema.decodeSync(Schema.Uint8ArrayFromHex)

it.effect("keeps RSA and Ed25519 native export failures unavailable", () =>
  Effect.gen(function*() {
    const signatures = yield* Signature
    const subtle = new Proxy(globalThis.crypto.subtle, {
      get(target, property) {
        if (property === "exportKey") {
          return () => Promise.reject(new DOMException("private-native-diagnostic", "OperationError"))
        }
        const value = Reflect.get(target, property, target)
        return typeof value === "function" ? value.bind(target) : value
      }
    })

    for (const algorithm of ["RSA-PSS-SHA256", "RSASSA-PKCS1-v1_5-SHA256", "Ed25519"] as const) {
      const pair = yield* signatures.generateKeyPair({ algorithm })
      const failure = yield* Effect.gen(function*() {
        const failing = yield* Signature
        return yield* failing.encodePublicKey(pair.publicKey).pipe(Effect.flip)
      }).pipe(Effect.provide(Portable.layerWithoutKdf(subtle)))

      expect(failure).toMatchObject({ _tag: "CryptoUnavailable" })
      expect(JSON.stringify(failure)).not.toContain("private-native-diagnostic")
      expect(failure).not.toHaveProperty("cause")
    }
  }).pipe(Effect.provide(backends[0]!.layer)))

// Adapted Wycheproof/RFC8032 behavior through public Effect APIs.
// Fixed independent verification fixtures catch serialization, padding and profile
// mistakes. Native cross-verification separately establishes the signing contract.
// See vectors.ts and ../THIRD_PARTY_NOTICES.md for exact revisions and notices.
for (const backend of backends) {
  describe(`${backend.name}`, () => {
    it.effect("rejects invalid EC components even when the host defers validation to export", () =>
      Effect.gen(function*() {
        const signatures = yield* Signature
        const failure = yield* signatures.encodePublicKey({
          algorithm: "ECDSA-P256-SHA256",
          x: new Uint8Array(32),
          y: new Uint8Array(32)
        }).pipe(Effect.flip)

        expect(failure).toMatchObject({ _tag: "CryptoInvalidInput", reason: "key" })
        expect(failure).not.toHaveProperty("cause")
      }).pipe(Effect.provide(backend.layer)))

    it.effect("verifies independent signatures and rejects invalid padding/profile values", () =>
      Effect.gen(function*() {
        const signatures = yield* Signature

        for (const vector of signatureVectors) {
          const result = yield* signatures.verify({
            algorithm: vector.algorithm,
            publicKey: bytes(vector.publicKeySpkiHex),
            data: bytes(vector.messageHex),
            signature: bytes(vector.signatureHex)
          })

          expect(result, `${vector.algorithm}: ${vector.source}`).toBe(vector.expectedValid)
        }
      }).pipe(Effect.provide(backend.layer)))

    it.effect("signs the deterministic RFC8032 Ed25519 vector", () =>
      Effect.gen(function*() {
        const signatures = yield* Signature
        const vector = signatureVectors.find((value) => value.algorithm === "Ed25519")!

        const result = yield* signatures.sign({
          algorithm: "Ed25519",
          privateKey: Redacted.make(bytes(ed25519PrivateKeyHex)),
          data: bytes(vector.messageHex)
        })

        expect(Hex.encode(result)).toBe(vector.signatureHex)
      }).pipe(Effect.provide(backend.layer)))

    it.effect("signs ECDSA P1363 and RSA with the explicit native verification profile", () =>
      Effect.gen(function*() {
        const signatures = yield* Signature
        const data = utf8("cross-implementation message")

        const ec = yield* Effect.sync(() => generateKeyPairSync("ec", { namedCurve: "prime256v1" }))

        const ecSignature = yield* signatures.sign({
          algorithm: "ECDSA-P256-SHA256",
          privateKey: Redacted.make(ec.privateKey.export({ type: "pkcs8", format: "der" })),
          data
        })

        expect(ecSignature).toHaveLength(64)
        expect(
          verify("sha256", data, { key: ec.publicKey, dsaEncoding: "ieee-p1363" }, ecSignature)
        ).toBe(true)

        const rsa = yield* Effect.sync(() => generateKeyPairSync("rsa", { modulusLength: 2048 }))

        for (const algorithm of ["RSASSA-PKCS1-v1_5-SHA256", "RSA-PSS-SHA256"] as const) {
          const rsaSignature = yield* signatures.sign({
            algorithm,
            privateKey: Redacted.make(rsa.privateKey.export({ type: "pkcs8", format: "der" })),
            data
          })

          expect(
            verify(
              "sha256",
              data,
              {
                key: rsa.publicKey,
                padding: algorithm === "RSA-PSS-SHA256" ? 6 : 1,
                saltLength: 32
              },
              rsaSignature
            )
          ).toBe(true)
        }
      }).pipe(Effect.provide(backend.layer)))

    it.effect("rejects RSA keys below the advertised 2048-bit minimum", () =>
      Effect.gen(function*() {
        const signatures = yield* Signature
        const rsa = yield* Effect.sync(() => generateKeyPairSync("rsa", { modulusLength: 1024 }))

        const result = yield* signatures
          .sign({
            algorithm: "RSASSA-PKCS1-v1_5-SHA256",
            privateKey: Redacted.make(rsa.privateKey.export({ type: "pkcs8", format: "der" })),
            data: utf8("data")
          })
          .pipe(Effect.flip)

        expect(result).toMatchObject({ _tag: "CryptoInvalidInput", reason: "key" })
      }).pipe(Effect.provide(backend.layer)))
  })
}
