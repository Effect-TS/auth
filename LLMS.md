# Effect Auth documentation

Effect Auth provides `@yielded/jose`, an Effect library for schema-based JWTs,
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