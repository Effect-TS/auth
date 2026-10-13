# Effect Auth documentation

Effect Auth provides authentication building blocks. `@yielded/jose` supports schema-based JWTs,
compact JWS signatures, direct A256GCM encryption, and local or remote public key
sets. Use the public `Errors`, `Jwk`, `Jwks`, `Jws`, `Jwt`, and `Jwe` modules.

Keep tokens, plaintext, private keys, and symmetric keys inside `Redacted` values.
Choose accepted algorithms and trusted key-set URLs in application configuration.
Never derive either trust decision from unverified token content. Native crypto
failures remain typed and omit inputs and native causes.

JWT verification authenticates the signature before validating registered claims
and decoding the application schema. `Jwt.decodeUnverified` only parses claims;
it is unsuitable for authorization decisions. Provide issuer, audience, and
required-claim policies appropriate to the application.

`@yielded/oauth` provides the `OAuth`, `Oidc`, and `Pkce` modules. Install clients
and verifiers in a scope that remains open for their lifetime. Supply a trusted
issuer and a nonretrying, nonredirecting HTTP client. Keep state, nonces, PKCE
verifiers, token receipts, and tokens private. An uncertain exchange outcome
does not authorize another exchange. Validate provider-specific receipts before
normalizing them with `OAuth.tokens`, and verify ID tokens before using identity claims.

`@yielded/crypto` supplies explicit HMAC, AEAD, signature, and KDF services.
Use Effect `Crypto` for entropy and digests. Select a crypto backend through
`WebCrypto`, `Portable`, or a platform subpath. Keep imported key handles inside
their owning scope and supply a unique nonce for every AEAD encryption with a key.
Share one `KdfAdmission` layer across backend instances to bound actual work and
waiting; rebuilding it per request creates independent limits.

## Working with JOSE

Use `Jwk` to import keys with explicit algorithm bindings. `Jws` handles arbitrary
payload bytes; `Jwt` applies schemas to JSON claims. `Jwe` requires a 32-byte key
bound to `dir` and uses `Crypto` for fresh IVs. `Jwks.layerLocal` takes an immutable
public-key snapshot. `Jwks.layerRemote` requires a trusted HTTPS URL and an
`HttpClient` whose egress policy rejects redirects.

- **[Signing and verifying application claims](./ai-docs/src/01_jose/10_signed-claims.ts)**:
  Import an algorithm-bound secret, sign schema-checked claims, and verify an
  explicit issuer, audience, and signature policy before using the claims.
- **[Verifying tokens with a local public key set](./ai-docs/src/01_jose/20_public-key-sets.ts)**:
  Provide an immutable public-key snapshot to verify asymmetric tokens without
  an HTTP client. Replace the layer when the trusted key generation changes.
- **[Encrypting payloads with fresh IVs](./ai-docs/src/01_jose/30_encrypted-payloads.ts)**:
  Import a 32-byte direct-encryption key and provide the runtime Crypto layer.
  Plaintext stays redacted through authenticated encryption and decryption.

# Cryptography services

Select explicit backends for HMAC, authenticated encryption, signatures, and
password derivation. Effect's `Crypto` service supplies entropy and digests.
Keys and derived secrets stay redacted; applications own key rotation, nonces,
credential serialization, and password policy.

- **[Signing with an imported HMAC key](./ai-docs/src/02_crypto/10_scoped-hmac.ts)**:
  Import a key for one scope and sign bytes with an explicit WebCrypto backend.
  The handle cannot be reused after that scope closes.
- **[Sharing password-derivation admission](./ai-docs/src/02_crypto/20_bounded-derivation.ts)**:
  Provide the backend once at the application's service lifetime so concurrent
  password operations share the same admission limit. Supply a fresh random
  salt and store the derivation parameters with each credential.

# OAuth and OpenID Connect

Use trusted provider metadata and keep each client's owning scope open until
its work is complete. Applications own callback registration, one-use login
transactions, grant persistence, and identity decisions. Token exchanges are
not retried automatically when their outcome is unknown.

- **[Preparing an authorization redirect with PKCE](./ai-docs/src/03_oauth/10_authorization.ts)**:
  Return the private state and verifier with the authorization URL. Store them
  in a one-use login transaction before redirecting. The caller supplies Effect
  Crypto and a nonretrying, nonredirecting HttpClient.