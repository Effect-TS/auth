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
