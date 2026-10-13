import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

import { Aead } from "../Aead.ts"
import { Hmac } from "../Hmac.ts"
import { defaultLimits, Kdf, Limits } from "../Kdf.ts"
import { Signature } from "../Signature.ts"
import { makeAead, type XChaCha } from "./aead.ts"
import { decode } from "./common.ts"
import { makeHmac } from "./hmac.ts"
import { type Argon2, makeKdf } from "./kdf.ts"
import { makeSignature } from "./signature.ts"

export const makeCryptoLayer = (subtle: SubtleCrypto, xchacha?: XChaCha) =>
  Layer.syncContext(() =>
    Context.make(Aead, makeAead(subtle, xchacha)).pipe(
      Context.add(Hmac, makeHmac(subtle)),
      Context.add(Signature, makeSignature(subtle))
    )
  )

export const makeKdfLayer = (subtle: SubtleCrypto, input: Partial<Limits>, argon2?: Argon2) => {
  const snapshot = { ...defaultLimits, ...input }

  return Layer.effect(Kdf)(
    Effect.gen(function*() {
      const limits = yield* decode(Limits, snapshot, "parameters")

      return yield* makeKdf(subtle, limits, argon2)
    })
  )
}

export const makeLayer = (
  subtle: SubtleCrypto,
  input: Partial<Limits>,
  extensions: {
    readonly argon2?: Argon2
    readonly xchacha?: XChaCha
  } = {}
) =>
  Layer.merge(
    makeCryptoLayer(subtle, extensions.xchacha),
    makeKdfLayer(subtle, input, extensions.argon2)
  )
