/**
 * Asymmetric signature services with typed key parameters and scoped native imports.
 *
 * @stability unstable
 * @since 0.1.0
 */
import * as Context from "effect/Context"
import type * as Effect from "effect/Effect"
import type * as Redacted from "effect/Redacted"
import * as Schema from "effect/Schema"
import type * as Scope from "effect/Scope"

import type { OperationError } from "./Errors.ts"

/**
 * Supported asymmetric signature profiles with fixed hash and curve parameters.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const Algorithm = Schema.Literals([
  "ECDSA-P256-SHA256",
  "RSASSA-PKCS1-v1_5-SHA256",
  "RSA-PSS-SHA256",
  "Ed25519"
])

/**
 * Value described by the Algorithm schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type Algorithm = typeof Algorithm.Type

const coordinate = Schema.Uint8Array.check(Schema.isMinLength(32), Schema.isMaxLength(32))
const integer = Schema.Uint8Array.check(Schema.isMinLength(1), Schema.isMaxLength(1024))
const ec = { algorithm: Schema.Literal("ECDSA-P256-SHA256"), x: coordinate, y: coordinate }
const ed = { algorithm: Schema.Literal("Ed25519"), x: coordinate }

const rsa = {
  algorithm: Schema.Literals(["RSASSA-PKCS1-v1_5-SHA256", "RSA-PSS-SHA256"]),
  n: integer,
  e: integer
}

/**
 * Unsigned big-endian components: 32-byte curve values and RSA components up to
 * 1024 bytes. Native import validates the actual key, including RSA's minimum.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const PublicKeyParameters = Schema.Union([
  Schema.Struct(ec),
  Schema.Struct(ed),
  Schema.Struct(rsa)
])

/**
 * Value described by the PublicKeyParameters schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type PublicKeyParameters = typeof PublicKeyParameters.Type

/**
 * Raw private key components with the algorithm fixed by the discriminant.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const PrivateKeyParameters = Schema.Union([
  Schema.Struct({ ...ec, d: coordinate }),
  Schema.Struct({ ...ed, d: coordinate }),
  Schema.Struct({
    ...rsa,
    d: integer,
    p: integer,
    q: integer,
    dp: integer,
    dq: integer,
    qi: integer
  })
])

/**
 * Value described by the PrivateKeyParameters schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type PrivateKeyParameters = typeof PrivateKeyParameters.Type

/**
 * Supported RSA modulus sizes, in bits, for key-pair generation.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const RsaModulusLength = Schema.Literals([2048, 3072, 4096])

/**
 * RSA defaults to 2048 bits and exponent 65537; curves are fixed by algorithm.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const GenerateKeyPairInput = Schema.Union([
  Schema.Struct({ algorithm: Schema.Literals(["ECDSA-P256-SHA256", "Ed25519"]) }),
  Schema.Struct({
    algorithm: Schema.Literals(["RSASSA-PKCS1-v1_5-SHA256", "RSA-PSS-SHA256"]),
    modulusLength: Schema.optionalKey(RsaModulusLength)
  })
])

/**
 * Value described by the GenerateKeyPairInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type GenerateKeyPairInput = typeof GenerateKeyPairInput.Type

/**
 * Public components and redacted private components of a generated key pair.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const KeyPairParameters = Schema.Struct({
  publicKey: PublicKeyParameters,
  privateKey: Schema.Redacted(PrivateKeyParameters, { disallowJsonEncode: true })
})

/**
 * Value described by the KeyPairParameters schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type KeyPairParameters = typeof KeyPairParameters.Type

/**
 * Algorithm-bound, redacted PKCS8 DER private-key material.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const PrivateKeyInput = Schema.Struct({
  algorithm: Algorithm,
  privateKey: Schema.Redacted(Schema.Uint8Array, { disallowJsonEncode: true })
})

/**
 * Value described by the PrivateKeyInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type PrivateKeyInput = typeof PrivateKeyInput.Type

/**
 * Algorithm-bound SPKI DER public-key material.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const PublicKeyInput = Schema.Struct({
  algorithm: Algorithm,
  publicKey: Schema.Uint8Array
})

/**
 * Value described by the PublicKeyInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type PublicKeyInput = typeof PublicKeyInput.Type

/**
 * Signing inputs with explicit data and redacted PKCS8 key material.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const SignInput = Schema.Struct({
  ...PrivateKeyInput.fields,
  data: Schema.Uint8Array
})

/**
 * Value described by the SignInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type SignInput = typeof SignInput.Type

/**
 * Verification inputs with explicit data, signature, and SPKI key material.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const VerifyInput = Schema.Struct({
  ...PublicKeyInput.fields,
  data: Schema.Uint8Array,
  signature: Schema.Uint8Array
})

/**
 * Value described by the VerifyInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type VerifyInput = typeof VerifyInput.Type

/**
 * A nonextractable signing key with its algorithm fixed at import.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export interface PrivateKey {
  readonly sign: (data: Uint8Array) => Effect.Effect<Uint8Array, OperationError>
}

/**
 * A verification key with its algorithm fixed at import.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export interface PublicKey {
  readonly verify: (
    data: Uint8Array,
    signature: Uint8Array
  ) => Effect.Effect<boolean, OperationError>
}

/**
 * Private keys are PKCS8 DER; public keys are SPKI DER. ECDSA signatures are
 * 64-byte IEEE P1363 (r || s), not ASN.1 DER. RSA requires at least 2048 bits;
 * PSS uses a 32-byte salt. Key serialization/selection and JOSE policy stay outside.
 *
 * @stability unstable
 * @category services
 * @since 0.1.0
 */
export class Signature extends Context.Service<
  Signature,
  {
    /** Snapshot PKCS8 once; the imported key is usable only inside its owning Scope. */
    readonly importPrivateKey: (
      input: PrivateKeyInput
    ) => Effect.Effect<PrivateKey, OperationError, Scope.Scope>
    /** Snapshot SPKI once; scope closure joins native work and rejects later use. */
    readonly importPublicKey: (
      input: PublicKeyInput
    ) => Effect.Effect<PublicKey, OperationError, Scope.Scope>
    /** Generate exportable components. The caller owns the returned secret bytes. */
    readonly generateKeyPair: (
      input: GenerateKeyPairInput
    ) => Effect.Effect<KeyPairParameters, OperationError>
    readonly encodePublicKey: (
      input: PublicKeyParameters
    ) => Effect.Effect<Uint8Array, OperationError>
    readonly encodePrivateKey: (
      input: Redacted.Redacted<PrivateKeyParameters>
    ) => Effect.Effect<Redacted.Redacted<Uint8Array>, OperationError>
    /** Import extractable PKCS8 and return typed components. JOSE turns these
     * into a JWK; this is the reverse of encodePrivateKey. */
    readonly decodePrivateKey: (
      input: PrivateKeyInput
    ) => Effect.Effect<KeyPairParameters, OperationError>
    readonly sign: (input: SignInput) => Effect.Effect<Uint8Array, OperationError>
    readonly verify: (input: VerifyInput) => Effect.Effect<boolean, OperationError>
  }
>()("@yielded/crypto/Signature") {}
