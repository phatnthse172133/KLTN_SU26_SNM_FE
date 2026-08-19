import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, sep } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

const RAW_ERROR_PATTERNS = [
  /(?:error|err|e)\s+instanceof\s+Error\s*\?\s*\w+\.message/g,
  /(?:error|err)\?\.response\?\.data\?\.message/g,
  /(?:error|err)\?\.message\s*\|\|/g,
  /(?:error|err)\.message\s*\|\|/g,
  /setError\s*\(\s*(?:response|resp|res|error|err)\.message\s*\)/g,
  /showToast\s*\(\s*['"`]error['"`]\s*,\s*(?:response|resp|res)\.message\s*\)/g,
  /setNotice\s*\(\s*(?:response|resp|res)\.message\s*\)/g,
];

const RESPONSE_MSG_PATTERN = /\b(?:response|resp|res)\.message\b/g;

const TECHNICAL_KEYWORDS = /\b(?:backend|server|database|localhost|stack trace|exception|HRESULT|Entity Framework|DbContext|SqlException)\b/i;
const EXCLUDE_PATHS = [
  `${'infrastructure'}${sep}api`,
  `${'shared'}${sep}config`,
  `${'shared'}${sep}utils`,
];
const EXCLUDE_FILES = ['errorMapper', 'errorMessages', 'AppError'];

let issues = [];

function shouldExclude(full) {
  if (EXCLUDE_FILES.some(f => full.includes(f))) return true;
  if (EXCLUDE_PATHS.some(p => full.includes(p))) return true;
  return false;
}

function isCommentLine(trimmed) {
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
}

function checkLine(full, line, lineNum) {
  const trimmed = line.trim();
  if (isCommentLine(trimmed)) return;
  if (/^import\s/.test(trimmed)) return;

  for (const pattern of RAW_ERROR_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(line)) {
      issues.push(`${full}:${lineNum} raw error.message pattern: ${trimmed.slice(0, 80)}`);
    }
  }

  RESPONSE_MSG_PATTERN.lastIndex = 0;
  if (RESPONSE_MSG_PATTERN.test(line)) {
    issues.push(`${full}:${lineNum} raw response.message usage: ${trimmed.slice(0, 80)}`);
  }

  const stringLiterals = line.match(/["'`][^"'`]*["'`]/g) || [];
  for (const str of stringLiterals) {
    if (TECHNICAL_KEYWORDS.test(str)) {
      issues.push(`${full}:${lineNum} technical keyword in UI string: ${trimmed.slice(0, 80)}`);
    }
  }

  const jsxTextMatch = line.match(/>([^<>{}]+)</);
  if (jsxTextMatch && TECHNICAL_KEYWORDS.test(jsxTextMatch[1])) {
    issues.push(`${full}:${lineNum} technical keyword in JSX text: ${trimmed.slice(0, 80)}`);
  }
}

function checkMultilineJsxText(full, content) {
  const jsxTextBlocks = content.matchAll(/>(\s*\n[^<>{}]+\n\s*)</g);
  for (const match of jsxTextBlocks) {
    const text = match[1].trim();
    if (text && TECHNICAL_KEYWORDS.test(text)) {
      const pos = match.index;
      const lineNum = content.slice(0, pos).split('\n').length;
      issues.push(`${full}:${lineNum} technical keyword in multiline JSX text: ${text.slice(0, 80)}`);
    }
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(extname(full))) {
      if (shouldExclude(full)) continue;
      const content = readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => checkLine(full, line, i + 1));
      checkMultilineJsxText(full, content);
    }
  }
}

walk(SRC_DIR);

if (issues.length > 0) {
  console.error(`\n${issues.length} issue(s) found:\n`);
  issues.forEach(e => console.error(`  ${e}`));
  process.exit(1);
} else {
  console.log('check:errors passed - no raw error messages or technical keywords found.');
}
