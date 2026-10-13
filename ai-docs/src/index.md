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
