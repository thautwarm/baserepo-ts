# fetch-remote-resources

Use NoMake 0.2.0 download and repository targets as dependencies of the work that
consumes them. Declaring them performs no network I/O; the runner fetches missing
inputs.

## Download and clone targets

```ts
import * as NM from "@nomake/core";

const archive = NM.webArchive(
  "https://example.org/releases/tool-1.2.3.tar.gz",
  { directory: ".nomake_files/downloads" },
);

const source = NM.repoTarget({
  repo: "owner/project",
  gitOptions: { branch: "v1.2.3" },
  storageDir: ".nomake_files/git/v1.2.3",
});

NM.target({
  name: "vendor-inputs",
  virtual: true,
  deps: { archive, source },
});
```

- `webArchive()` returns a downloaded-file target. Its name is derived from the
  URL under `directory` (default `tmp/web`). It uses `rebuild: "never"` and does
  not unpack archives; declare extraction as a dependent target.
- `repoTarget()` returns a cloned-directory target at `<storageDir>/<repo>`
  (default storage directory `tmp/gitdeps`). It also defaults to `"never"`.
  `gitOptions.branch` is passed to `git checkout` after cloning; existing clones
  are reused without fetching updates.
- Use versioned URLs and Git refs for repeatable inputs. Changing the Git ref
  does not change the target's path; include the revision in `storageDir` when
  keeping separate snapshots. `rebuild: "always"` reclones rather than pulling.

Dependent `build` callbacks receive `deps.archive` as the downloaded file's path
and `deps.source` as the clone's directory path, both inferred as `string`.
Track individual files when consumers need changes inside the clone to
invalidate their targets; directory metadata alone is not recursive.

## Direct operations inside a custom target

`await NM.Web.download({ url, path: new NM.Path(target) })` downloads immediately
and creates parent directories. `await NM.Repo.clone(repo, target, gitOptions)`
clones immediately and requires Git. These operations do not create targets or
cache records themselves; call them from a target's `build` when custom behavior
is needed.

In 0.2.0, `Web.download()` buffers the response body and writes it without checking
`response.ok`; `webArchive()` inherits that behavior. A target that must reject
HTTP error responses should use `fetch`, check the status, and then write its
output. Download helpers do not perform checksum verification.

Sources: [download operations and targets](https://github.com/thautwarm/nomake/blob/v0.2.0/source/web.ts#L6-L59),
[clone operation](https://github.com/thautwarm/nomake/blob/v0.2.0/source/repo.ts#L90-L121),
[repository target](https://github.com/thautwarm/nomake/blob/v0.2.0/source/repo.ts#L221-L258).
