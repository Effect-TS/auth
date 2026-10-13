/**
 * Authenticated encryption services with explicit keys, nonces, and scoped native key handles.
 *
 * @stability unstable
 * @since 0.1.0
 */
import * as Context from "effect/Context"
import type * as Effect from "effect/Effect"
import type * as Redacted from "effect/Redacted"
import * as Schema from "effect/Schema"
import type * as Scope from "effect/Scope"

import type { AuthenticationFailed, OperationError } from "./Errors.ts"

/**
 * Supported authenticated-encryption algorithm names.
 *
 * **Example** (Decoding an algorithm)
 *
 * ```ts import.meta.vitest
 * import { Aead } from "@yielded/crypto"
 * import * as Schema from "effect/Schema"
 *
 * Schema.decodeUnknownSync(Aead.Algorithm)("AES-256-GCM") // => "AES-256-GCM"
 * ```
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const Algorithm = Schema.Literals(["AES-256-GCM", "XChaCha20-Poly1305"])
/**
 * Value described by the Algorithm schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type Algorithm = typeof Algorithm.Type

const context = {
  algorithm: Algorithm,
  key: Schema.Redacted(Schema.Uint8Array, { disallowJsonEncode: true }),
  nonce: Schema.Uint8Array,
  additionalData: Schema.optionalKey(Schema.Uint8Array)
}

/**
 * Encryption inputs with redacted plaintext and key material.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const EncryptInput = Schema.Struct({
  ...context,
  plaintext: Schema.Redacted(Schema.Uint8Array, { disallowJsonEncode: true })
})

/**
 * Value described by the EncryptInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type EncryptInput = typeof EncryptInput.Type

/**
 * Decryption inputs with ciphertext and an explicit authentication context.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const DecryptInput = Schema.Struct({ ...context, ciphertext: Schema.Uint8Array })
/**
 * Value described by the DecryptInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type DecryptInput = typeof DecryptInput.Type

/**
 * Native AES keys can be imported once for repeated encryption and decryption.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const KeyInput = Schema.Struct({
  algorithm: Schema.Literal("AES-256-GCM"),
  key: context.key
})

/**
 * Value described by the KeyInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type KeyInput = typeof KeyInput.Type

/**
 * Per-message encryption inputs for an imported AES key.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const KeyEncryptInput = Schema.Struct({
  nonce: context.nonce,
  additionalData: context.additionalData,
  plaintext: EncryptInput.fields.plaintext
})

/**
 * Value described by the KeyEncryptInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type KeyEncryptInput = typeof KeyEncryptInput.Type

/**
 * Per-message decryption inputs for an imported AES key.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const KeyDecryptInput = Schema.Struct({
  nonce: context.nonce,
  additionalData: context.additionalData,
  ciphertext: DecryptInput.fields.ciphertext
})

/**
 * Value described by the KeyDecryptInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type KeyDecryptInput = typeof KeyDecryptInput.Type

/**
 * A nonextractable AES-256-GCM key owned by the import's Scope.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export interface Key {
  readonly encrypt: (input: KeyEncryptInput) => Effect.Effect<Uint8Array, OperationError>
  readonly decrypt: (
    input: KeyDecryptInput
  ) => Effect.Effect<Redacted.Redacted<Uint8Array>, OperationError | AuthenticationFailed>
}

/**
 * Both algorithms use a 32-byte key and append a 16-byte tag to ciphertext.
 * AES-GCM uses a 12-byte nonce; XChaCha uses 24. The caller MUST supply a unique
 * nonce for each encryption with a key. Obtain entropy from Effect Crypto.
 * Envelope serialization and key selection belong to the caller.
 *
 * @stability unstable
 * @category services
 * @since 0.1.0
 */
export class Aead extends Context.Service<
  Aead,
  {
    /** Whether this backend implements an algorithm. Host operations may still fail. */
    readonly supports: (algorithm: Algorithm) => boolean
    /** Snapshot once; scope closure joins native work and rejects later use. */
    readonly importKey: (input: KeyInput) => Effect.Effect<Key, OperationError, Scope.Scope>
    readonly encrypt: (input: EncryptInput) => Effect.Effect<Uint8Array, OperationError>
    readonly decrypt: (
      input: DecryptInput
    ) => Effect.Effect<Redacted.Redacted<Uint8Array>, OperationError | AuthenticationFailed>
  }
>()("@yielded/crypto/Aead") {}
