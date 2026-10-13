import * as KdfAdmission from "@yielded/crypto/KdfAdmission"
import * as NodeCrypto from "@yielded/crypto/platform-node"
import * as Portable from "@yielded/crypto/Portable"
import * as WebCrypto from "@yielded/crypto/WebCrypto"
import * as Layer from "effect/Layer"
import * as Predicate from "effect/Predicate"
import * as crypto from "node:crypto"

// Some Node-compatible hosts expose Argon2 as a throwing stub. Probe only that
// specific capability failure; unexpected native failures still fail the suite.
const nativeArgon2Error = typeof crypto.argon2 !== "function"
  ? "CryptoUnsupportedAlgorithm"
  : await new Promise<"CryptoUnavailable" | undefined>((resolve, reject) => {
    const complete = (error: unknown) => {
      if (error === null) resolve(undefined)
      else if (Predicate.hasProperty(error, "code") && error.code === "ERR_CRYPTO_ARGON2_NOT_SUPPORTED") {
        resolve("CryptoUnavailable")
      } else reject(error)
    }
    try {
      crypto.argon2("argon2id", {
        message: new Uint8Array(1),
        nonce: new Uint8Array(8),
        memory: 8,
        parallelism: 1,
        passes: 1,
        tagLength: 4
      }, complete)
    } catch (error) {
      complete(error)
    }
  })

export const backends = [
  {
    name: "WebCrypto",
    extended: false,
    argon2Error: "CryptoUnsupportedAlgorithm",
    layer: WebCrypto.layer(globalThis.crypto.subtle)
  },
  { name: "Portable", extended: true, argon2Error: undefined, layer: Portable.layer(globalThis.crypto.subtle) },
  { name: "NodeCrypto", extended: true, argon2Error: nativeArgon2Error, layer: NodeCrypto.layer() }
].map((backend) => ({
  ...backend,
  layer: backend.layer.pipe(Layer.provide(KdfAdmission.layer()))
}))

export const utf8 = (value: string) => new TextEncoder().encode(value)
