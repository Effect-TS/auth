/**
 * @title Preparing an authorization redirect with PKCE
 *
 * Return the private state and verifier with the authorization URL. Store them
 * in a one-use login transaction before redirecting. The caller supplies Effect
 * Crypto and a nonretrying, nonredirecting HttpClient.
 */
import { OAuth, Pkce } from "@yielded/oauth"
import { Effect } from "effect"

export const beginAuthorization = (
  options: OAuth.ClientOptions,
  redirectUri: string,
  scopes: ReadonlyArray<string>
) =>
  Effect.gen(function*() {
    const client = yield* OAuth.make(options)
    const state = yield* Pkce.random()
    const pkce = yield* Pkce.make()
    const url = yield* client.authorizationUrl({
      redirectUri,
      scopes,
      state,
      codeChallenge: pkce.challenge
    })
    return { url, state, verifier: pkce.verifier }
  }).pipe(Effect.scoped)
