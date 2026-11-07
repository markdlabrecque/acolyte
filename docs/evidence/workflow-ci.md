# CI workflow evidence

This change adds GitHub Actions workflow `CI`, with independent `tests` and `typecheck` jobs. Both run on every `pull_request` and every branch push; neither event uses path filters. Push jobs expose required check names `tests` and `typecheck`. PR jobs use `PR tests` and `PR typecheck` to avoid duplicate required-check names. Each installs the lockfile with `npm ci` on Node 24.20.0 and runs the corresponding package script. Checkout and setup-node are pinned to full action commit SHAs; the workflow grants only `contents: read` and limits each job to 15 minutes. Checkout does not persist credentials and explicitly selects the PR head SHA, or the pushed SHA. The gate accepts only push-triggered CI at the exact reviewed head, whose workflow definition comes from that same immutable commit. It pins the workflow blob at that head and the current main base, then proves the head contains that base. PR merge-ref runs cannot establish required CI provenance, even when their current PR associations match after retargeting.

The current suite uses Node's built-in `node:sqlite` rather than a separate SQLite native module; Node 24 supplies it. The lockfile's install scripts belong to other packages. The Ubuntu runner supplies the platform; no separate SQLite package installation is specified.

## Local regression check

Run the following from the repository root with Python 3 and PyYAML installed. This checks the workflow contract, including the absence of path/event-type filters. It does not emulate GitHub Actions or verify action commit provenance.

```sh
python - <<'PY'
import yaml

with open('.github/workflows/ci.yml', encoding='utf-8') as f:
    w = yaml.load(f, Loader=yaml.BaseLoader)
assert w['name'] == 'CI'
assert w['on'] == {'pull_request': '', 'push': ''}
assert w['permissions'] == {'contents': 'read'}
assert set(w['jobs']) == {'tests', 'typecheck'}
for name, command in [('tests', 'npm test'), ('typecheck', 'npm run typecheck')]:
    job = w['jobs'][name]
    assert job['name'] == "${{ github.event_name == 'pull_request' && 'PR " + name + "' || '" + name + "' }}"
    assert job['runs-on'] == 'ubuntu-24.04'
    assert 0 < int(job['timeout-minutes']) <= 15
    assert job['steps'] == [
        {'uses': 'actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683', 'with': {'persist-credentials': 'false', 'ref': '${{ github.event.pull_request.head.sha || github.sha }}'}},
        {'uses': 'actions/setup-node@49933edd5288caeca8642d1e84afbd3f7d6820020', 'with': {'node-version': '24.20.0'}},
        {'run': 'npm ci'},
        {'run': command},
    ]
print('workflow contract passed')
PY
```

Local validation with Node 24.20.0/npm 11.19.0: `npm ci`, `npm test` (114 passed), `npm run typecheck`, and `git diff --check` passed. The test suite used local synthetic fixtures; no live inference or credentials were used.

## Integration limits

The original CI-only worker ran the 114-test product baseline. Integration has since expanded the shared test script and TypeScript configuration to include `.sandcastle` tests and types. The workflow deliberately calls those shared scripts rather than maintaining a second test list.

Remote Actions execution and action availability cannot be established by local validation. Main required-check protection has separately been installed and read back with strict up-to-date enforcement and administrator enforcement. No remote CI pass is claimed before publication. The first independent CI/gate review rejected the candidate; its findings and corrected re-review are recorded in [delivery evidence](workflow-delivery.md). TD-002 live acceptance remains blocked.
