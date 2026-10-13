/**
 * @title Signing and verifying application claims
 *
 * Import an algorithm-bound secret, sign schema-checked claims, and verify an
 * explicit issuer, audience, and signature policy before using the claims.
 */
import { Jwk, Jwt } from "@yielded/jose"
import { Effect, type Redacted, Schema } from "effect"

const Claims = Schema.Struct({
  sub: Schema.String,
  iss: Schema.String,
  aud: Schema.String,
  role: Schema.Literals(["reader", "editor"])
})

// Supply a securely generated secret from application configuration.
export const signedClaims = (secret: Redacted.Redacted<Jwk.SecretJwk>) =>
  Effect.gen(function*() {
    const key = yield* Jwk.importSecret(secret, "HS256")
    const token = yield* Jwt.sign(
      Claims,
      { sub: "user-123", iss: "https://issuer.example", aud: "example-api", role: "reader" },
      key,
      { alg: "HS256", typ: "JWT" }
    )
    const verified = yield* Jwt.verify(Claims, token, key, {
      algorithms: ["HS256"],
      issuer: "https://issuer.example",
      audience: "example-api",
      typ: "JWT",
      requiredClaims: ["sub", "iss", "aud"]
    })
    return verified.claims
  })
