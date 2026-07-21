import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, sep } from 'path';

const SRC_DIR = join(process.cwd(), 'src');
let issues = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(extname(full))) {
      if (full.includes(`${sep}ui${sep}`)) continue;
      const content = readFileSync(full, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, i) => {
        const importMatch = line.match(/^import\s+(?:\*\s+as\s+\w+|\w+|\{([^}]+)\})\s+from\s+['"]/);
        if (!importMatch) return;

        const imported = importMatch[1]
          ? importMatch[1].split(',').map(s => {
              const trimmed = s.trim().replace(/^type\s+/, '');
              const parts = trimmed.split(/\s+as\s+/);
              return parts[parts.length - 1].trim();
            })
          : [line.match(/^import\s+(\w+)/)?.[1]].filter(Boolean);

        for (const name of imported) {
          if (!name) continue;
          const usageRe = new RegExp(`\\b${name}\\b`, 'g');
          const count = (content.match(usageRe) || []).length;
          if (count <= 1) {
            issues.push(`${full}:${i + 1} unused import: ${name}`);
          }
        }
      });
    }
  }
}

walk(SRC_DIR);

if (issues.length > 0) {
  console.warn(`\n${issues.length} warning(s) found:\n`);
  issues.forEach(e => console.warn(`  ${e}`));
  console.error('check:quality failed â€” unused imports found.');
  process.exit(1);
} else {
  console.log('check:quality passed â€” no unused imports found.');
}
