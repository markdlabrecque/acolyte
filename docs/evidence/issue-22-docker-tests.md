# Issue 22 Docker test evidence

Candidate `a479bee`, based on `001b1ba`, adds the Dockerfile, build-context
allowlist, executable runner and README instructions. No source or test files
changed.

## Verification

Parent and independent reviewer each ran `./scripts/test-docker.sh` successfully:

```text
tests 114
pass 114
fail 0
cancelled 0
skipped 0
todo 0
npm run typecheck -> tsc --noEmit -> exit 0
```

The suite exercised SQLite, loopback HTTP, Unix sockets and SIGKILL recovery
inside the unprivileged container with `--network none`. The parent also passed
`bash -n scripts/test-docker.sh` and `git diff --check`.

A fresh isolated reviewer approved candidate `a479bee` against `001b1ba` with
no blocking findings. The reviewer confirmed the four-file scope, pinned image
and runtime versions, locked dependency installation, context exclusions and
image-ID execution, then independently repeated the container tests and static
checks. There were no rejected review rounds or deferred findings.

A second fresh reviewer read issue 22's complete Done when checklist and
independently approved the same candidate with no must-fix findings. It repeated
the container run with 114 passing tests, zero failures/skips and passing
typecheck, and checked the installed Mill 1.1.1 contract. Cached build layers
were reused, so this second review did not independently test cold dependency
installation. This review preceded the evidence commit and publication; the
initial implementation commit already existed when the owner added the
pre-commit review requirement.

## Mill contract and limitations

Inspected `mill --help`, `mill build --help`, installed Mill 1.1.1 documentation,
`~/.config/sawmill/default.yaml` and installed config validation code.
`tests.command` runs automated tests; `test_harness: docker` describes browser
site testing and does not execute a Dockerfile. The local, uncommitted main
millyard config now uses `./scripts/test-docker.sh` as `tests.command`.
Its existing `test_harness: docker` remains unchanged, and its missing
`test_url` still blocks Mill config validation. No placeholder site was added.
The README explains the separate browser-site requirement and suite-only
opt-out. The reviewer did not independently verify Mill behavior or this local
configuration change.

Cold builds need registry access for the pinned image and npm dependencies;
test execution needs no external network. Validation used Linux amd64 and did
not exercise other architectures or a complete Mill ticket run. No real
credentials, live inference, production access or 1Password were used.
TD-002 live acceptance remains blocked and is outside this change.
