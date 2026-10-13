# @yielded/oauth

Effect OAuth authorization-code and refresh flows, PKCE S256, and signed OpenID
Connect. Runtime dependencies are Effect and `@yielded/jose`; applications own
registered callbacks, provider configuration, permissions, identity, and grant storage.

Use `OAuth.make` for an installed client and `Oidc.makeVerifier` for its OIDC
verifier. Both require `HttpClient` and an owning `Scope`; keep that scope open
for their lifetime. `Pkce` and OIDC token-hash verification require Effect `Crypto`; JOSE
signature verification uses the native Web Crypto API directly. `Oidc.discover` retrieves metadata from the
exact trusted issuer, or from an explicit `metadataUrl`. A discovered issuer
may use a `{tenantid}` path segment when that template matches the configured
authority. A concrete GUID pinned from that document keeps its token issuer
and requires a matching signing-key issuer. Commercial
`consumers` pins the personal-account issuer. A tenant domain does not match
that template. `common` and `organizations` stay multi-tenant.
Verification then substitutes the verified `tid` and checks the
selected signing key's issuer. Generic issuers still require an exact match. Closing a factory's scope cancels its work and prevents reuse.

`client.codeGrant` and `client.refreshGrant` return private `TokenReceipt` values.
Check the provider-specific receipt, then call `OAuth.tokens`. A JSON null
refresh token is omitted, and an array scope is joined with spaces. A receipt
alone does not establish a successful grant or authenticated identity. Tokens
stay redacted. Profile fetches default to GET; POST and a JSON body are
available, and identity can instead be taken from the token receipt. JSON token
requests reject a repeated parameter name before the request is sent. Authorization
defaults to `response_mode=query`; `form_post` is available when the issuer POSTs
the callback. `client_secret_post` may omit its stored secret and take `clientSecret` on that token request. For initial OIDC sign-in, require an ID token and call `verifier.verify`
with the captured verification time, nonce, access token, and authorization code.
On refresh, verify any returned ID token against the previous identity; accepting
an omitted ID token is application policy.

Each exchange, refresh, or revocation makes one request. An uncertain outcome
requires application recovery, not an automatic retry. Provider endpoints require
HTTPS. Custom HttpClients must preserve cancellation and disable retries,
redirects, and ambient cookies. Bound the complete workflow as well as individual
requests; keep token receipts out of logs and telemetry.

Each verifier owns a scoped JWKS cache. It never takes a key endpoint from a token
or serves expired keys after refresh failure. Configure the issuer's advertised
code flow and signing algorithms. HS256 is accepted only with a client secret of
at least 32 bytes. Keep S256 PKCE enabled unless the issuer cannot
support it. Other OAuth grants are outside this package's profile.

See the [public API comments](src/OAuth.ts), [OIDC options](src/Oidc.ts), and
[third-party notices](THIRD_PARTY_NOTICES.md).

```ts
import * as NodeCrypto from "@effect/platform-node/NodeCrypto"
import { OAuth, Pkce } from "@yielded/oauth"
import * as Effect from "effect/Effect"
import * as FetchHttpClient from "effect/http/FetchHttpClient"

const authorization = Effect.gen(function*() {
  const client = yield* OAuth.make({
    metadata: {
      issuer: "https://issuer.example",
      authorization_endpoint: "https://issuer.example/authorize",
      token_endpoint: "https://issuer.example/token"
    },
    clientId: "registered-client",
    authentication: { method: "none", publicClient: true },
    timeoutMs: 5000
  })
  const state = yield* Pkce.random()
  const pkce = yield* Pkce.make()
  const url = yield* client.authorizationUrl({
    redirectUri: "https://app.example/callback",
    scopes: ["profile"],
    state,
    codeChallenge: pkce.challenge
  })
  // Store state and pkce.verifier privately with a one-use transaction before
  // redirecting to url. Keep the client scope open for any later grant call.
  return { state, pkce, url }
}).pipe(
  Effect.scoped,
  Effect.provide(FetchHttpClient.layer),
  Effect.provide(NodeCrypto.layer)
)
```

The package exports `Errors`, `OAuth`, `Oidc`, and `Pkce` namespaces from its
root and matching subpaths. Public APIs are unstable. Sources ship alongside
ES modules and TypeScript declarations.
