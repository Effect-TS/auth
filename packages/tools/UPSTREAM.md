# Effect tooling

The `ai-docgen`, `api-diff`, `bundle`, `docgen`, `doctest`, `jsdocs`, `oxc`, and `utils`
implementations and tests are vendored from
[Effect commit 74d19304da077d98cc6dcb294c71e253365f272f](https://github.com/Effect-TS/effect/tree/74d19304da077d98cc6dcb294c71e253365f272f/packages/tools).
The upstream MIT license is retained in [LICENSE](./LICENSE).

Source and test implementations are unchanged. Package manifests mark every tool
private and resolve Effect, platform-node, and Vitest integration through their
published `4.0.3` packages. Project references use this workspace's package
inventory. The compiler API tools retain upstream TypeScript 6 dependencies while
the root build uses TypeScript 7 with `@effect/tsgo`.

The `npm-promote` tool comes from the same revision. It selects `@yielded/jose`
as the primary package and omits Effect's website deployment. Registry checks,
promotion, retries, and tracking issues retain the upstream behavior; its tests
cover the adapted release flow.

The bundle fixtures measure built JOSE modules. They import `packages/jose/dist`
because the upstream bundle resolver redirects only `effect` and `@effect/*`
package imports from source to built output. Run `pnpm build` before a direct
bundle report; the root bundle scripts build first.

The upstream `HttpRouterEsbuild.test.ts` is retained but excluded from local
execution and checking: it tests tree shaking of the absent Effect source
checkout. JOSE and the other vendored test suites run on Node, Bun, and Deno,
except `@effect/utils`, which uses upstream's Node-only project selection.

The root scripts and configuration follow the same commit with package inventory
and published-dependency substitutions. The bundle wrappers additionally report
current sizes when the selected base predates the package, without inventing a
comparison baseline.

The API comparison tool supports generic comparisons of public package
exports. Select explicit Git refs containing the JOSE package and request its
JSON snapshots and Markdown report:

```sh
pnpm api-diff --base-ref <base-ref> --head-ref <head-ref> --output tmp/api-diff/run
```

It builds disposable worktrees using each revision's native build. The exact
upstream defaults and migration commands are retained: the default `v3` base
and `--check` / `--write-doc` annotation workflows belong to Effect's v3-to-v4
migration. They are not JOSE validation gates.
