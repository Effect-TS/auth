/**
 * Byte-preserving key derivation services, algorithm inputs, and resource ceilings.
 *
 * @stability unstable
 * @since 0.1.0
 */
import * as Context from "effect/Context"
import type * as Effect from "effect/Effect"
import type * as Redacted from "effect/Redacted"
import * as Schema from "effect/Schema"

import type { KdfBusy, OperationError } from "./Errors.ts"

const positive = Schema.Int.check(Schema.isGreaterThan(0))
const uint32 = Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 0xffffffff }))
const bytes = Schema.Uint8Array
const secret = Schema.Redacted(bytes, { disallowJsonEncode: true })
const argon2Bytes = bytes.check(Schema.isMaxLength(0xffffffff))
const argon2Secret = Schema.Redacted(argon2Bytes, { disallowJsonEncode: true })

/**
 * Argon2id version 19 inputs, including optional secret and associated data.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const Argon2idInput = Schema.Struct({
  password: argon2Secret,
  salt: argon2Bytes.check(Schema.isMinLength(8)),
  memoryKiB: uint32,
  passes: uint32,
  parallelism: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 0xffffff })),
  length: Schema.Int.check(Schema.isBetween({ minimum: 4, maximum: 0xffffffff })),
  secret: Schema.optionalKey(argon2Secret),
  associatedData: Schema.optionalKey(argon2Bytes)
})

/**
 * Value described by the Argon2idInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type Argon2idInput = typeof Argon2idInput.Type

/**
 * Scrypt inputs with cost, block-size, and parallelism parameters.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const ScryptInput = Schema.Struct({
  password: secret,
  salt: bytes,
  cost: Schema.Int.check(Schema.isBetween({ minimum: 2, maximum: 0x80000000 })),
  blockSize: uint32,
  parallelism: uint32,
  length: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 0x7fffffff }))
})

/**
 * Value described by the ScryptInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type ScryptInput = typeof ScryptInput.Type

/**
 * PBKDF2-HMAC-SHA256 inputs with byte-count output length.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const Pbkdf2Input = Schema.Struct({
  password: secret,
  salt: bytes,
  // Native Node/Bun PBKDF2 accepts a positive signed 32-bit iteration count.
  iterations: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 0x7fffffff })),
  // WebCrypto takes an unsigned 32-bit bit count; this API takes whole bytes.
  length: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 0x1fffffff }))
})

/**
 * Value described by the Pbkdf2Input schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type Pbkdf2Input = typeof Pbkdf2Input.Type

/**
 * HKDF-SHA256 inputs with separate salt and context information.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const HkdfInput = Schema.Struct({
  key: secret,
  salt: bytes,
  info: bytes.check(Schema.isMaxLength(1024)),
  length: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 255 * 32 }))
})

/**
 * Value described by the HkdfInput schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type HkdfInput = typeof HkdfInput.Type

/**
 * Resource ceilings, not a password-strength policy. Limits apply per permit.
 * Scrypt bounds its allocation by maximumMemoryKiB and N*r*p/8 by
 * maximumMemoryPasses. maximumPasses/maximumParallelism apply to Argon2id.
 *
 * @stability unstable
 * @category schemas
 * @since 0.1.0
 */
export const Limits = Schema.Struct({
  maximumMemoryKiB: positive,
  maximumPasses: positive,
  maximumParallelism: positive,
  maximumMemoryPasses: positive,
  maximumIterations: positive,
  maximumInputBytes: positive,
  maximumOutputBytes: positive
})

/**
 * Value described by the Limits schema.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type Limits = typeof Limits.Type

/**
 * Default per-permit resource ceilings applied before derivation begins.
 *
 * @stability unstable
 * @category defaults
 * @since 0.1.0
 */
export const defaultLimits: Limits = Object.freeze({
  maximumMemoryKiB: 65536,
  maximumPasses: 6,
  maximumParallelism: 4,
  maximumMemoryPasses: 131072,
  maximumIterations: 1000000,
  maximumInputBytes: 65536,
  maximumOutputBytes: 1024
})

/**
 * Byte-preserving derivation; no text normalization, PHC parsing or password policy.
 * Argon2id uses version 19; PBKDF2 and HKDF use SHA-256. Scrypt names N/r/p as
 * cost/blockSize/parallelism. A backend captures shared
 * KdfAdmission when its Layer is built and retains admission until work and cleanup
 * finish, including when a native operation cannot be cancelled.
 *
 * @stability unstable
 * @category services
 * @since 0.1.0
 */
export class Kdf extends Context.Service<
  Kdf,
  {
    readonly argon2id: (
      input: Argon2idInput
    ) => Effect.Effect<Redacted.Redacted<Uint8Array>, OperationError | KdfBusy>
    readonly scrypt: (
      input: ScryptInput
    ) => Effect.Effect<Redacted.Redacted<Uint8Array>, OperationError | KdfBusy>
    readonly pbkdf2: (
      input: Pbkdf2Input
    ) => Effect.Effect<Redacted.Redacted<Uint8Array>, OperationError | KdfBusy>
    readonly hkdf: (
      input: HkdfInput
    ) => Effect.Effect<Redacted.Redacted<Uint8Array>, OperationError | KdfBusy>
  }
>()("@yielded/crypto/Kdf") {}
