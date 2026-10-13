## Working with JOSE

Use `Jwk` to import keys with explicit algorithm bindings. `Jws` handles arbitrary
payload bytes; `Jwt` applies schemas to JSON claims. `Jwe` requires a 32-byte key
bound to `dir` and uses `Crypto` for fresh IVs. `Jwks.layerLocal` takes an immutable
public-key snapshot. `Jwks.layerRemote` requires a trusted HTTPS URL and an
`HttpClient` whose egress policy rejects redirects.
