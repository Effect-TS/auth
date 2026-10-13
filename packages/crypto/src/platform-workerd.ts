/**
 * Cloudflare Workers backend with bundled Wasm Argon2id and native scrypt.
 *
 * @stability unstable
 * @since 0.1.0
 */
import * as Layer from "effect/Layer"

import { makeArgon2 } from "./internal/argon2-wasm.ts"
// @ts-types="./internal/argon2-wasm-module.d.ts"
import module from "./internal/argon2.wasm"
import { makeKdfLayer, makeLayer } from "./internal/layer.ts"
import * as Scrypt from "./internal/scrypt.ts"
import { xchacha } from "./internal/xchacha.ts"
import type { Limits } from "./Kdf.ts"

/**
 * Workers WebCrypto, Wasm Argon2id and native scrypt.
 * Bundle with Wrangler and enable Node.js compatibility.
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layer = (subtle: SubtleCrypto, limits: Partial<Limits> = {}) =>
  makeLayer(subtle, limits, { argon2: makeArgon2(module), xchacha }).pipe(
    Layer.provide(Scrypt.layer)
  )

/**
 * Wasm Argon2id, native scrypt and WebCrypto derivation. Requires shared KdfAdmission.
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layerKdf = (subtle: SubtleCrypto, limits: Partial<Limits> = {}) =>
  makeKdfLayer(subtle, limits, makeArgon2(module)).pipe(Layer.provide(Scrypt.layer))
