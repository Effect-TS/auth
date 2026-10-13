// Type-checks all public packages' built declarations the way a consumer with
// `skipLibCheck: false` does. Run after `pnpm build` with `stripInternal`
// enabled to catch public declarations that reference `@internal` symbols
// (see Effect-TS/effect#6431, #7187, #8161).
import { execFileSync } from "node:child_process"
import * as Fs from "node:fs"
import * as Os from "node:os"
import * as Path from "node:path"
import { fileURLToPath } from "node:url"

const root = Path.resolve(Path.dirname(fileURLToPath(import.meta.url)), "..")
const paths = {}
for (const entry of Fs.readdirSync(Path.join(root, "packages"), { withFileTypes: true })) {
  const pkgDir = Path.join(root, "packages", entry.name)
  const manifest = Path.join(pkgDir, "package.json")
  if (!entry.isDirectory() || !Fs.existsSync(manifest)) continue
  const pkg = JSON.parse(Fs.readFileSync(manifest, "utf8"))
  if (pkg.private) continue
  for (const [key, target] of Object.entries(pkg.publishConfig.exports)) {
    if (target === null || key === "./package.json" || key.includes("*")) continue
    const declaration = Path.resolve(pkgDir, target.replace(/\.js$/, ".d.ts"))
    if (!Fs.existsSync(declaration)) {
      throw new Error(`${declaration} is missing; run \`pnpm build\` first`)
    }
    paths[Path.posix.join(pkg.name, key)] = [declaration]
  }
}
const entrypoints = Object.keys(paths)
const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), "effect-auth-dist-types-"))
try {
  Fs.writeFileSync(
    Path.join(dir, "index.ts"),
    entrypoints.map((entry, i) => `import * as _${i} from "${entry}"\nexport { _${i} }\n`).join("")
  )
  Fs.writeFileSync(
    Path.join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        skipLibCheck: false,
        types: ["node"],
        typeRoots: [Path.join(root, "node_modules", "@types")],
        paths
      },
      files: ["index.ts"]
    })
  )
  execFileSync("pnpm", ["exec", "tsc", "-p", Path.join(dir, "tsconfig.json")], { cwd: root, stdio: "inherit" })
} catch (error) {
  process.exitCode = typeof error.status === "number" ? error.status : 1
} finally {
  Fs.rmSync(dir, { recursive: true, force: true })
}
