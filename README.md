# Effect Auth

Authentication building blocks for Effect, ported from Yielded Auth with their
public modules, schemas, wire formats, and tagged errors preserved:

- [`@yielded/jose`](packages/jose): schema-based JWTs, JWS, JWE, and JWKS.
- [`@yielded/oauth`](packages/oauth): OAuth, signed OpenID Connect, and S256 PKCE.
- [`@yielded/crypto`](packages/crypto): HMAC, AEAD, signatures, and bounded password
  derivation with explicit native, portable, and Workers backends.

OAuth uses JOSE and Effect's `Crypto` service. The crypto package supplies the
operations beyond Effect's entropy and digest APIs; applications select its
backend explicitly. The core `@yielded/auth` package is not part of this port yet.

Development follows
[Effect at 74d19304](https://github.com/Effect-TS/effect/tree/74d19304da077d98cc6dcb294c71e253365f272f):
pnpm, TypeScript project references with the Effect compiler, Effect's Oxlint
plugin, dprint, `@effect/vitest`, TSTyche, documentation tools, bundle analysis,
and Changesets. The shared tools are vendored under
[`packages/tools`](packages/tools/UPSTREAM.md), including their tests and license.
Source imports use `.ts` extensions; published exports point to ESM JavaScript
and declarations in `dist`.

```sh
pnpm install
pnpm lint
pnpm jsdocs --check
pnpm circular
pnpm check
pnpm test --run
pnpm test-types
pnpm doctest --run
pnpm ai-docgen
pnpm build
pnpm check-dist-types
```

Use `pnpm lint-fix` to apply formatting and lint fixes, and
`pnpm test --run packages/jose/test/protocols.test.ts` for a focused runtime check.
`pnpm coverage` produces a coverage report. `pnpm codegen` regenerates the public
barrel, `pnpm run docs` builds API documentation, and `pnpm bundle-compare` compares
built package sizes with `main`. Until the package exists on `main`, the bundle
check reports current sizes without a comparison.

CI uses Effect's pinned actions, Node 26.4.0, Bun 1.4.0, Deno 2.9.4, Namespace
runner profiles, and separate static, types, build, bundle, runtime, and doctest
jobs. Run `bun run --bun vitest run`, `deno task test --run`, and `deno check .`
to exercise the additional runtimes locally. Public packages and the vendored tooling tests
use the same runtime selection as Effect; only `@effect/utils` requires Node.

Release, snapshot, release queue, bundle comment, and npm promotion workflows
follow the same upstream revision. Changes are limited to this repository's
package inventory, release branches (`next-minor` and `next-major`), and the
absence of Effect's website and product-specific integration jobs. Releases use
the `staging` npm tag before promotion; prereleases are never promoted to `latest`.

Repository administration must provide the same external integrations:
Namespace profiles `linux-small` and `linux-default`, protected `fork` and
`npm-promote` environments, `CHANGESET_GITHUB_TOKEN` and `EFFECT_BOT_GH`, and the
pkg-pr-new GitHub app. Configure npm trusted publishers for `@yielded/jose`,
`@yielded/oauth`, and `@yielded/crypto` in
`Effect-TS/auth`: `release.yml` for publication and `npm-promote.yml` with the
`npm-promote` environment for dist-tag updates. See the
[promotion tool](packages/tools/npm-promote/README.md) for details.
