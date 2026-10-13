import * as path from "node:path"
import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config"

const isDeno = process.versions.deno !== undefined
const isBun = process.versions.bun !== undefined
const isNode = typeof process !== "undefined" &&
  process.release.name === "node" &&
  !isDeno &&
  !isBun
const project = (
  name: string,
  directory: string,
  include: boolean = true,
  config: ViteUserConfig = {},
  projectExclude?: ReadonlyArray<string>,
  projectInclude?: ReadonlyArray<string>
) => {
  if (!include) {
    return []
  }

  const cfg = mergeConfig({
    root: directory,
    test: { name }
  }, config)

  const merged = mergeConfig(shared, cfg)
  if (projectExclude !== undefined) {
    merged.test!.exclude = [...projectExclude]
  }
  if (projectInclude !== undefined) {
    merged.test!.include = [...projectInclude]
  }
  return [merged]
}

export const exclude = [
  "**/.*/**",
  "**/node_modules/**",
  "**/dist/**",
  "**/benchmark/**",
  "**/bundle/**",
  "**/typetest/**",
  "**/coverage/**",
  "**/test/utils/**",
  "**/*.d.ts",
  "**/*.config.*",
  "**/vitest.*"
]

const shared: ViteUserConfig = {
  server: {
    watch: {
      ignored: exclude
    }
  },
  resolve: {
    tsconfigPaths: true
  },
  test: {
    exclude,
    passWithNoTests: true,
    setupFiles: [path.join(import.meta.dirname, "vitest.setup.ts")],
    sequence: {
      concurrent: true
    },
    include: ["test/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["html"],
      reportsDirectory: "coverage",
      exclude
    }
  }
}

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      ...project("@yielded/jose", "packages/jose"),
      ...project("@effect/api-diff", "packages/tools/api-diff"),
      ...project("@effect/bundle", "packages/tools/bundle", true, {}, [
        ...exclude.filter((pattern) => pattern !== "**/bundle/**"),
        // This upstream regression test requires Effect's own source checkout.
        "test/HttpRouterEsbuild.test.ts"
      ]),
      ...project("@effect/doctest", "packages/tools/doctest"),
      ...project("@effect/docgen", "packages/tools/docgen"),
      ...project("@effect/jsdocs", "packages/tools/jsdocs"),
      ...project("@effect/npm-promote", "packages/tools/npm-promote"),
      ...project("@effect/utils", "packages/tools/utils", isNode),
      ...project("@effect/oxc", "packages/tools/oxc")
    ]
  }
})
