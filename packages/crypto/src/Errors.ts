/**
 * Fixed, secret-safe failure classifications shared by cryptographic services.
 *
 * @stability unstable
 * @since 0.1.0
 */
import * as Schema from "effect/Schema"

/**
 * Diagnostics contain only fixed classifications, never native causes or input.
 *
 * @stability unstable
 * @category errors
 * @since 0.1.0
 */
export class InvalidInput extends Schema.TaggedError<InvalidInput>()("CryptoInvalidInput", {
  reason: Schema.Literals(["key", "nonce", "parameters", "data"])
}) {}

/**
 * The selected backend does not implement the requested algorithm.
 *
 * @stability unstable
 * @category errors
 * @since 0.1.0
 */
export class UnsupportedAlgorithm extends Schema.TaggedError<UnsupportedAlgorithm>()(
  "CryptoUnsupportedAlgorithm",
  {}
) {}

/**
 * A native backend failed without a more specific classification.
 *
 * @stability unstable
 * @category errors
 * @since 0.1.0
 */
export class CryptoUnavailable extends Schema.TaggedError<CryptoUnavailable>()(
  "CryptoUnavailable",
  {}
) {}

/**
 * An authenticated decryption rejected the supplied ciphertext or context.
 *
 * @stability unstable
 * @category errors
 * @since 0.1.0
 */
export class AuthenticationFailed extends Schema.TaggedError<AuthenticationFailed>()(
  "CryptoAuthenticationFailed",
  {}
) {}

/**
 * Shared key-derivation admission is full or its acquisition wait expired.
 *
 * @stability unstable
 * @category errors
 * @since 0.1.0
 */
export class KdfBusy extends Schema.TaggedError<KdfBusy>()("CryptoKdfBusy", {}) {}

/**
 * Validation, capability, and native-backend failures shared by operations.
 *
 * @stability unstable
 * @category models
 * @since 0.1.0
 */
export type OperationError = InvalidInput | UnsupportedAlgorithm | CryptoUnavailable
