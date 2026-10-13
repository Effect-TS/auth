import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["packages/jose/src/**/*.ts"],
      reporter: ["text", "html"]
    },
    projects: [{
      test: {
        name: "@yielded/jose",
        root: "packages/jose",
        include: ["test/**/*.test.ts"],
        setupFiles: [new URL("./vitest.setup.ts", import.meta.url).pathname],
        sequence: { concurrent: true }
      }
    }]
  }
})
