import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');
const VIETNAMESE_RE = /[\u00C0-\u00C5\u00C8-\u00CF\u00D2-\u00D6\u00D9-\u00DC\u00E0-\u00E5\u00E8-\u00EF\u00F2-\u00F6\u00F9-\u00FC\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u1EA0-\u1EF9]/;
const VI_VN_RE = /vi-VN/i;
const ALERT_RE = /\balert\s*\(/g;
const CONFIRM_RE = /(?<![\w.])confirm\s*\(/g;

let errors = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(extname(full))) {
      const content = readFileSync(full, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, i) => {
        const lineNum = i + 1;
        if (VIETNAMESE_RE.test(line)) errors.push(`${full}:${lineNum} Vietnamese character detected`);
        if (VI_VN_RE.test(line)) errors.push(`${full}:${lineNum} vi-VN locale found`);
        ALERT_RE.lastIndex = 0;
        if (ALERT_RE.test(line)) errors.push(`${full}:${lineNum} alert() call found`);
        CONFIRM_RE.lastIndex = 0;
        if (CONFIRM_RE.test(line) && !/ConfirmDialog|onConfirm|confirmLabel|confirmStyle|isConfirm|setConfirm|showConfirm|confirmPassword/.test(line)) {
          errors.push(`${full}:${lineNum} raw confirm() call found`);
        }
      });
    }
  }
}

walk(SRC_DIR);

if (errors.length > 0) {
  console.error(`\n${errors.length} issue(s) found:\n`);
  errors.forEach(e => console.error(`  ${e}`));
  process.exit(1);
} else {
  console.log('check:english passed - no Vietnamese, vi-VN, alert(), or confirm() found.');
}
