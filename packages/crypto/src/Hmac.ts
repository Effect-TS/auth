/**
 * HMAC authentication services with redacted key material and scoped native imports.
 *
 * @stability unstable
 * @since 0.1.0
 */
import * as Context from "effect/Context"
import type * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import type * as Scope from "effect/Scope"

import type { OperationError } from "./Errors.ts"

/**
 * SHA-1 exists for interoperability with TOTP, not new signature designs.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const Algorithm = Schema.Literals(["SHA-1", "SHA-256", "SHA-384", "SHA-512"])
/**
 * Value described by the Algorithm schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type Algorithm = typeof Algorithm.Type

/**
 * HMAC algorithm and redacted key material to import.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const KeyInput = Schema.Struct({
  algorithm: Algorithm,
  key: Schema.Redacted(Schema.Uint8Array, { disallowJsonEncode: true })
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
 * HMAC signing inputs with explicit data and redacted key material.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const Input = Schema.Struct({
  ...KeyInput.fields,
  data: Schema.Uint8Array
})

/**
 * Value described by the Input schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type Input = typeof Input.Type

/**
 * HMAC verification inputs including the expected authentication tag.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const VerifyInput = Schema.Struct({ ...Input.fields, tag: Schema.Uint8Array })
/**
 * Value described by the VerifyInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type VerifyInput = typeof VerifyInput.Type

/**
 * An imported, nonextractable key, usable only while its owning Scope is open.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export interface Key {
  readonly sign: (data: Uint8Array) => Effect.Effect<Uint8Array, OperationError>
  readonly verify: (data: Uint8Array, tag: Uint8Array) => Effect.Effect<boolean, OperationError>
}

/**
 * Signs and verifies HMAC tags, with optional scoped native-key reuse.
 *
 * @stability unstable
 * @category services
 * @since 0.1.0
 */
export class Hmac extends Context.Service<
  Hmac,
  {
    /** Snapshot and validate once. Closing the Scope joins native work and releases the key. */
    readonly importKey: (input: KeyInput) => Effect.Effect<Key, OperationError, Scope.Scope>
    readonly sign: (input: Input) => Effect.Effect<Uint8Array, OperationError>
    /** A wrong tag is false; a key or backend failure stays in the error channel. */
    readonly verify: (input: VerifyInput) => Effect.Effect<boolean, OperationError>
  }
>()("@yielded/crypto/Hmac") {}
