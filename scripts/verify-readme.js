#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'specmatic-readme-'));
const image = process.env.SPECMATIC_LINTER_IMAGE || 'specmatic/enterprise';
let passed = 0;

function replace(file, from, to) {
  const text = fs.readFileSync(file, 'utf8');
  assert.equal(text.split(from).length, 2, `Expected one match in ${file}: ${from}`);
  fs.writeFileSync(file, text.replace(from, to));
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  if (result.error) throw result.error;
  return { ...result, output: `${result.stdout}${result.stderr}` };
}

function findFile(dir, name) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(file, name);
      if (found) return found;
    } else if (entry.name === name) return file;
  }
}

function verify(name, source, expected, args = [], edit, ruleIds = []) {
  const work = path.join(tempRoot, name.replaceAll(' ', '-'));
  fs.cpSync(path.join(root, source), work, { recursive: true });
  fs.rmSync(path.join(work, 'build'), { recursive: true, force: true });
  fs.rmSync(path.join(work, '.specmatic-linter'), { recursive: true, force: true });
  if (edit) edit(path.join(work, 'specmatic-linter.yaml'));

  const dockerArgs = ['run', '--rm'];
  if (process.getuid) dockerArgs.push('--user', `${process.getuid()}:${process.getgid()}`);
  if (process.env.CENTRAL_CONFIG_REPO_TOKEN) dockerArgs.push('-e', 'CENTRAL_CONFIG_REPO_TOKEN');
  dockerArgs.push('-v', `${work}:/usr/src/app`, image, 'lint', 'openapi.yaml', ...args);
  const result = run('docker', dockerArgs, root);
  assert.equal(result.status, 1, `${name}: expected lint violations\n${result.output}`);
  assert.ok(result.output.includes(`Maturity Level: ${expected.maturity}`), `${name}: maturity changed\n${result.output}`);
  assert.ok(result.output.includes(`Errors: ${expected.totals.errors}, Warnings: ${expected.totals.warnings}, Ignored: ${expected.totals.ignored}`), `${name}: totals changed\n${result.output}`);
  assert.match(result.output, /Status: FAILED/, `${name}: status changed`);

  if (args.includes('--format=html')) {
    assert.ok(findFile(work, 'lint-report-openapi.html'), `${name}: HTML report missing`);
  } else {
    const reportFile = findFile(work, 'lint-report-openapi.json');
    assert.ok(reportFile, `${name}: JSON report missing\n${result.output}`);
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    assert.deepEqual(report.totals, expected.totals, `${name}: JSON totals changed`);
    assert.equal(report.maturity.level, expected.maturity, `${name}: JSON maturity changed`);
    for (const ruleId of ruleIds) {
      assert.ok(report.problems.some(problem => problem.ruleId === ruleId), `${name}: ${ruleId} missing`);
    }
  }
  console.log(`PASS ${name}`);
  passed++;
}

const totals = (errors, warnings, ignored = 0) => ({ errors, warnings, ignored });
const recommended = file => replace(file, '        - starter', '        - recommended');
const configurable = file => {
  recommended(file);
  replace(file,
    '#      include:\n#        - rule/no-error-param\n#        - rule/parameter-description-required\n#        - rule/force-oidc-auth',
    '      include:\n        - rule/no-error-param\n        - rule/parameter-description-required\n        - rule/force-oidc-auth');
};
const examples = file => replace(file, '#    types:\n#      - examples', '    types:\n      - examples');

try {
  verify('rules starter', 'demo/rules-intro', { totals: totals(6, 4), maturity: 'Silver' }, ['--config', 'specmatic-linter.yaml']);
  verify('rules starter html', 'demo/rules-intro', { totals: totals(6, 4), maturity: 'Silver' }, ['--config', 'specmatic-linter.yaml', '--format=html']);
  verify('rules recommended', 'demo/rules-intro', { totals: totals(30, 49), maturity: 'Non compliant' }, ['--config', 'specmatic-linter.yaml'], recommended);
  verify('rules configurable', 'demo/rules-intro', { totals: totals(33, 49), maturity: 'Non compliant' }, ['--config', 'specmatic-linter.yaml'], configurable,
    ['rule/no-error-param', 'rule/parameter-description-required', 'rule/force-oidc-auth']);

  verify('maturity baseline', 'demo/maturity', { totals: totals(2, 0), maturity: 'Baseline' }, ['--config', 'specmatic-linter.yaml']);
  verify('maturity bronze', 'demo/maturity', { totals: totals(2, 0), maturity: 'Bronze' }, ['--config', 'specmatic-linter.yaml'],
    file => replace(file, '          maturity: bronze', '          maturity: silver'));
  verify('maturity silver', 'demo/maturity', { totals: totals(1, 1), maturity: 'Silver' }, ['--config', 'specmatic-linter.yaml'], file => {
    replace(file, '          maturity: bronze', '          maturity: silver');
    replace(file, '        operation-summary:\n          severity: error', '        operation-summary:\n          severity: warn');
  });

  verify('types all', 'demo/rule-types', { totals: totals(20, 23), maturity: 'Non compliant' }, ['--config', 'specmatic-linter.yaml']);
  verify('types examples', 'demo/rule-types', { totals: totals(1, 2), maturity: 'Baseline' }, ['--config', 'specmatic-linter.yaml'], examples);
  verify('types examples schema', 'demo/rule-types', { totals: totals(11, 8), maturity: 'Non compliant' }, ['--config', 'specmatic-linter.yaml'], file => {
    examples(file);
    replace(file, '    types:\n      - examples', '    types:\n      - examples\n      - schema');
  });

  verify('profiles default', 'demo/profiles', { totals: totals(9, 12), maturity: 'Non compliant' }, ['--config', 'specmatic-linter.yaml']);
  verify('profiles internal', 'demo/profiles', { totals: totals(9, 12, 2), maturity: 'Non compliant' }, ['--config', 'specmatic-linter.yaml', '--profile', 'internal']);
  verify('profiles public', 'demo/profiles', { totals: totals(13, 11), maturity: 'Non compliant' }, ['--config', 'specmatic-linter.yaml', '--profile', 'public-api']);
  verify('profiles public tweaked', 'demo/profiles', { totals: totals(12, 12), maturity: 'Non compliant' }, ['--config', 'specmatic-linter.yaml', '--profile', 'public-api'],
    file => replace(file, '        operation-summary: error\n        info-contact: error', '        operation-summary: warn\n        info-contact: error'));

  const central = { totals: totals(11, 13), maturity: 'Non compliant' };
  const repo = '--config-repo-url=https://github.com/specmatic/central-linter-config.git';
  verify('central default', 'demo/central-config-repo', central, [repo]);
  verify('central explicit config', 'demo/central-config-repo', central, [repo, '--config=specmatic-linter.yaml']);
  verify('central internal', 'demo/central-config-repo', { totals: totals(15, 14, 2), maturity: 'Non compliant' }, [repo, '--profile=internal-api']);

  if (process.argv.includes('--all')) {
    const work = path.join(tempRoot, 'performance');
    fs.cpSync(path.join(root, 'performance'), work, { recursive: true });
    const command = process.platform === 'win32' ? 'cmd.exe' : 'bash';
    const script = path.join(work, 'scripts', process.platform === 'win32' ? 'run-performance-benchmark.cmd' : 'run-performance-benchmark.sh');
    const result = run(command, process.platform === 'win32' ? ['/c', script] : [script], work);
    assert.equal(result.status, 0, `benchmark failed\n${result.output}`);
    assert.equal(fs.readdirSync(path.join(work, 'results')).filter(file => file.endsWith('-results.json')).length, 50, 'benchmark report count changed');
    assert.match(result.output, /TOTAL ESTATE\s+\|\s+102713\s+\|\s+46918\s+\|\s+118442/, `benchmark totals changed\n${result.output}`);
    console.log('PASS performance benchmark');
    passed++;
  }

  console.log(`\n${passed} README checks passed`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
