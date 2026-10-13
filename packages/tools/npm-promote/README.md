# npm promote

`@effect/npm-promote` moves the `latest` dist-tag to a release that
`changeset publish` put under `staging`. It waits until npm's abbreviated
metadata lists the target version of every public workspace package, before updating the public `@yielded/jose` package.

Preview what it would do from the repository root:

```sh
node packages/tools/npm-promote/src/bin.ts --dry-run
```

Each run:

1. Lists the non-private workspace packages and their versions at the
   checked-out revision.
2. Fetches each package's abbreviated metadata from `registry.npmjs.org`. If any
   target version is missing, nothing is promoted.
3. Runs `npm dist-tag add <name>@<version> latest`, `@yielded/jose` first, for every
   package whose `latest` is lower than the target. The CDN caches the
   abbreviated metadata for minutes, so it only decides visibility; each
   package is decided from its live `latest` on the dist-tags endpoint. A
   higher `latest` is never moved back, so a run that failed halfway is
   finished by the next one. A failed read or write stops the run, so no
   package moves ahead of `@yielded/jose`.
4. Closes the tracking issue if one is open. A release that a newer one
   superseded still closes it; a failure to close is logged and retried.

When the version bump commit is older than `--overdue-after-hours` (12 by
default) and the release is still not visible or cannot be promoted, the tool
opens or updates a single tracking issue. For versions that are not visible it
checks each version's own registry document and lists versions missing from npm
(404), versions published but not visible yet, and versions whose check failed.
Failed `npm dist-tag add` writes are listed separately, and a registry read
that fails during promotion lists its version as unchecked. Prerelease versions are
never promoted.

`--dry-run` reads the registry and prints the plan. It never moves dist-tags
or touches GitHub issues. Real runs need `GITHUB_REPOSITORY` and `GITHUB_TOKEN`.

## Workflow

`.github/workflows/npm-promote.yml` runs every 10 minutes and after each
`Release` run on `main`. Setting the `NPM_PROMOTE_PAUSED` repository variable
to `true` skips new runs, which keeps a bad release on `staging`.

The job moves dist-tags with npm trusted publishing over OIDC, so no npm token
is stored anywhere. It runs in the `npm-promote` environment with
`id-token: write` and npm 11.21.0 or later. `@yielded/jose` needs two trusted publisher configurations:

- `release.yml`: publishing allowed, "Allow npm dist-tag" off.
- `npm-promote.yml` in environment `npm-promote`: publishing not allowed,
  "Allow npm dist-tag" on.

With no tokens involved, packages can also turn on "Require two-factor
authentication and disallow tokens".

## Other writers of `latest`

Only this workflow is expected to move `latest`. `changeset publish` uses the
`staging` tag; npm sets `latest` itself only on the first publish of a new
package, which leaves it at the target. npm has no compare-and-set for
dist-tags, so the live read narrows but cannot close the window between reading
and writing a tag.

To change `latest` by hand, set `NPM_PROMOTE_PAUSED=true`, then wait until no
`npm promote` run is in progress: pausing only skips runs that have not started.
Unpause once the manual change is done. To roll back a bad release, stay paused
until `main` has a fixed version: once unpaused, the tool moves `latest` back
to the version at HEAD.

## Source

Adapted from Effect commit `74d19304da077d98cc6dcb294c71e253365f272f` under
the included MIT license. Website deployment is omitted, and release selection
uses `@yielded/jose`; registry visibility, promotion, retry, and tracking-issue
behavior are retained.
