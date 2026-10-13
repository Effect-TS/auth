import * as crypto from "node:crypto"

import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Result from "effect/Result"

import { CryptoUnavailable, UnsupportedAlgorithm } from "../Errors.ts"
import { ScryptBackend, type ScryptParameters } from "./scrypt-backend.ts"

const derive = Effect.fnUntraced(function*(input: ScryptParameters) {
  if (typeof crypto.scrypt !== "function") return yield* UnsupportedAlgorithm.make({})

  // Native work cannot be cancelled. Keep admission and borrowed buffers until
  // its callback finishes, including when the caller requests interruption.
  return yield* Effect.callback<Uint8Array, CryptoUnavailable>((resume) => {
    const registration = Result.try({
      try: () =>
        crypto.scrypt(
          input.password,
          input.salt,
          input.length,
          {
            N: input.cost,
            r: input.blockSize,
            p: input.parallelism,
            maxmem: input.maximumMemoryBytes
          },
          // Bun supplies undefined on success; Node supplies null.
          (error, key) => resume(error ? Effect.fail(CryptoUnavailable.make({})) : Effect.succeed(key))
        ),
      catch: () => CryptoUnavailable.make({})
    })

    if (Result.isFailure(registration)) resume(Effect.fail(registration.failure))
  }).pipe(Effect.uninterruptible)
})

export const layer = Layer.succeed(ScryptBackend, { derive })
