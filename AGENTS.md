This is the Effect Auth workspace. Use pnpm from the repository root.

- Read `node_modules/effect/AGENTS.md` before writing Effect code and consult its source for API details.
- Packages live in `packages/*`, with `src`, `test`, and `typetest` directories.
- Preserve the existing JOSE public module names, schemas, typed errors, and wire behavior.
- Use Effect module namespace imports and `.ts` extensions for relative source imports.
- Run `pnpm lint`, `pnpm check`, targeted `pnpm test --run <file>`, and `pnpm build` for source changes.
- Run `pnpm test-types` when public types or schema inference change.
- Use `pnpm lint-fix` for formatting. Do not edit generated `dist` output.
- Tests use `@effect/vitest`; compiler contracts belong in TSTyche `typetest/*.tst.ts` files.
- Native crypto failures must remain typed and must not expose inputs or native causes.
