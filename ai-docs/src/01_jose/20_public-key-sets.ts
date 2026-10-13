/**
 * @title Verifying tokens with a local public key set
 *
 * Provide an immutable public-key snapshot to verify asymmetric tokens without
 * an HTTP client. Replace the layer when the trusted key generation changes.
 */
import { Jwks, Jwt } from "@yielded/jose"
import { Effect, type Redacted, Schema } from "effect"

const Claims = Schema.Struct({ sub: Schema.String })

export const verifyFromKeys = (
  trustedKeys: Jwks.KeySet,
  token: Redacted.Redacted<string>
) =>
  Jwt.verifyWithKeySet(Claims, token, {
    algorithms: ["ES256"],
    issuer: "https://issuer.example",
    audience: "example-api",
    requiredClaims: ["sub", "iss", "aud", "exp"]
  }).pipe(Effect.provide(Jwks.layerLocal(trustedKeys)))
