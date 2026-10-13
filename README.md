# Effect Auth

Authentication packages for Effect. The workspace currently contains
[`@yielded/jose`](packages/jose), ported from Yielded Auth with its module exports,
schemas, token formats, and tagged errors preserved.

Development follows the [Effect monorepo](https://github.com/Effect-TS/effect): pnpm,
TypeScript project references with the Effect compiler, Oxlint, dprint,
`@effect/vitest`, TSTyche, and Changesets. Source imports use `.ts` extensions;
published exports point to ESM JavaScript and declarations in `dist`.

```sh
pnpm install
pnpm lint
pnpm check
pnpm test --run
pnpm test-types
pnpm build
```

Use `pnpm lint-fix` to apply formatting and lint fixes, and
`pnpm test --run packages/jose/test/protocols.test.ts` for a focused runtime check.
`pnpm coverage` produces a coverage report. CI runs lint, type checking, runtime
tests, type tests, the build, and package creation.

The Oxlint configuration uses Effect's native rule settings, with import
restrictions enforcing module imports. Effect's private `@effect/oxc` plugin is
not a published dependency.
