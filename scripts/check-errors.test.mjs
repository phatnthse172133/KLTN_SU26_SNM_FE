import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const TMP_DIR = join(process.cwd(), '__check_errors_fixture__');
const SRC_FIXTURE = join(TMP_DIR, 'src');
const SCRIPT = join(process.cwd(), 'scripts', 'check-errors.mjs');

function setupFixture(files) {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  mkdirSync(SRC_FIXTURE, { recursive: true });
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = join(SRC_FIXTURE, relPath);
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, content);
  }
}

function runScanner() {
  try {
    execSync(`node "${SCRIPT}"`, { cwd: TMP_DIR, stdio: 'pipe', encoding: 'utf8' });
    return { exitCode: 0, stdout: '', stderr: '' };
  } catch (err) {
    return { exitCode: err.status, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
}

function cleanup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
}

const tests = [
  {
    name: 'catches setError(response.message)',
    files: { 'presentation/Foo.tsx': `export function Foo({ response }) { setError(response.message); }` },
    expectFail: true,
  },
  {
    name: 'catches showToast("error", response.message)',
    files: { 'presentation/Bar.tsx': `export function Bar({ response }) { showToast("error", response.message); }` },
    expectFail: true,
  },
  {
    name: 'catches setNotice(response.message)',
    files: { 'presentation/Baz.tsx': `export function Baz({ response }) { setNotice(response.message); }` },
    expectFail: true,
  },
  {
    name: 'catches const message = response.message',
    files: { 'presentation/Qux.tsx': `export function Qux({ response }) { const message = response.message; }` },
    expectFail: true,
  },
  {
    name: 'catches single-line JSX text with technical keyword',
    files: { 'presentation/Single.tsx': `export function Single() { return <p>Backend API is unavailable.</p>; }` },
    expectFail: true,
  },
  {
    name: 'catches multi-line JSX text with technical keyword',
    files: { 'presentation/Multi.tsx': `export function Multi() {\n  return (\n    <p>\n      Backend API is unavailable.\n    </p>\n  );\n}` },
    expectFail: true,
  },
  {
    name: 'passes clean file with no issues',
    files: { 'presentation/Clean.tsx': `export function Clean() { return <p>Something went wrong. Please try again.</p>; }` },
    expectFail: false,
  },
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  setupFixture(test.files);
  const result = runScanner();
  const actualFailed = result.exitCode !== 0;
  if (actualFailed === test.expectFail) {
    console.log(`  PASS: ${test.name}`);
    passed++;
  } else {
    console.error(`  FAIL: ${test.name} â€” expected ${test.expectFail ? 'failure' : 'success'} but got ${actualFailed ? 'failure' : 'success'}`);
    if (result.stderr) console.error(`    stderr: ${result.stderr.slice(0, 200)}`);
    failed++;
  }
}

cleanup();

console.log(`\n${passed}/${tests.length} tests passed.`);
if (failed > 0) {
  console.error(`${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('All check-errors scanner tests passed.');
  process.exit(0);
}
