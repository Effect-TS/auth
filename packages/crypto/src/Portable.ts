/**
 * WebCrypto services extended with owned Argon2id and XChaCha20-Poly1305 implementations.
 *
 * @stability unstable
 * @since 0.1.0
 */
import * as Layer from "effect/Layer"

import { argon2 } from "./internal/argon2.ts"
import { makeCryptoLayer, makeLayer } from "./internal/layer.ts"
import { layerUnsupported } from "./internal/scrypt-backend.ts"
import { xchacha } from "./internal/xchacha.ts"
import type { Limits } from "./Kdf.ts"

/**
 * WebCrypto with owned, portable Argon2id and XChaCha20-Poly1305 implementations.
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layer = (subtle: SubtleCrypto, limits: Partial<Limits> = {}) =>
  makeLayer(subtle, limits, { argon2, xchacha }).pipe(Layer.provide(layerUnsupported))

/**
 * AEAD (including XChaCha20-Poly1305), HMAC and signatures, without KDFs or admission.
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layerWithoutKdf = (subtle: SubtleCrypto) => makeCryptoLayer(subtle, xchacha)
