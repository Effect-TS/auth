# @yielded/crypto

Effect services for authenticated encryption, HMAC, key derivation and signatures.
Effect is its only runtime package dependency; it is independent of Auth.
Applications own keys, nonces, password
policy, envelopes and protocol formats. Use Effect `Crypto` for secure randomness
and SHA digests.

```sh
pnpm add @yielded/crypto@beta effect
```

Import `Aead`, `Hmac`, `Kdf`, `KdfAdmission` and `Signature` from the root. Select
an implementation through a direct backend import:

- `/WebCrypto`: native operations from a supplied `SubtleCrypto`, plus named global
  web adapters for Effect entropy/digests and HMAC.
- `/Portable`: WebCrypto plus owned Argon2id and XChaCha20-Poly1305 implementations.
- `/platform-node`, `/platform-bun`: shared Node-compatible WebCrypto and native
  Argon2id and scrypt, plus the owned XChaCha20-Poly1305 implementation.
  An absent native Argon2 API returns `CryptoUnsupportedAlgorithm`; a rejecting
  native stub remains `CryptoUnavailable`. Other services remain available.
- `/platform-workerd`: supplied WebCrypto, Wasm Argon2id, native scrypt and owned
  XChaCha20-Poly1305. Wrangler bundles the included Wasm module; consumers need
  no compiler. This backend requires Workers Node.js compatibility.

Full backend Layers require one shared `KdfAdmission` Layer to bound derivation
concurrency and waiting. Interruption waits for admitted native work to finish;
portable Argon2id yields cooperatively but runs on the calling thread. The focused
`WebCrypto.layerHmac(subtle)` and global `layerWebCrypto` adapters need no KDF admission.
`Portable.layerWithoutKdf(subtle)` supplies AEAD, HMAC and signatures without
KDFs or admission; `platform-workerd.layerKdf(subtle, limits?)` supplies only KDFs.

Secret inputs, derived bytes and decrypted plaintext use `Redacted`. Backend
errors contain classifications without native causes or secret payloads. Keep
each AEAD nonce unique for its key. HMAC, AES-GCM and signature services offer
scoped imports for repeated key use. Handles snapshot nonextractable native keys;
closure joins native work and prevents further use. Signature operations use PKCS8/SPKI DER keys;
raw key components can be encoded through the native key parser.
`decodePrivateKey` imports extractable PKCS8 and returns those components.
[JOSE](../jose/README.md) and password-hash serialization belong to other layers.

```ts
import * as Kdf from "@yielded/crypto/Kdf"
import * as KdfAdmission from "@yielded/crypto/KdfAdmission"
import * as Portable from "@yielded/crypto/Portable"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Redacted from "effect/Redacted"

const backend = Portable.layer(globalThis.crypto.subtle).pipe(
  Layer.provide(KdfAdmission.layer({ concurrency: 2 }))
)

const program = Effect.gen(function*() {
  const kdf = yield* Kdf.Kdf
  return yield* kdf.hkdf({
    key: Redacted.make(new Uint8Array(32).fill(7)), // Public example material.
    salt: new Uint8Array(),
    info: new TextEncoder().encode("example/session-key"),
    length: 32
  })
})

const derived = await Effect.runPromise(program.pipe(Effect.provide(backend)))
```

Builds emit JavaScript and declarations with TypeScript and copy the precompiled
`argon2.wasm` beside the Workerd adapter. The C source and Wasm asset ship in the
package; consumers do not need a C compiler. Maintainers can regenerate the Wasm
with `pnpm --filter @yielded/crypto build:wasm` when a Wasm-capable Clang is installed.

See the [third-party notices](THIRD_PARTY_NOTICES.md) for the retained implementation
and independent vector provenance. The notices ship in this package.
