/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const workspaceRoot = process.cwd();
const coveragePath = path.join(
  workspaceRoot,
  'coverage',
  'fantrax-stats-parser-ui',
  'coverage-final.json'
);

const raw = fs.readFileSync(coveragePath, 'utf8');
const coverage = JSON.parse(raw);

function toRel(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const rootNorm = workspaceRoot.replace(/\\/g, '/');
  if (normalized.startsWith(rootNorm + '/')) {
    return normalized.slice(rootNorm.length + 1);
  }
  return normalized;
}

function summarize(entry) {
  const s = entry.s || {};
  const f = entry.f || {};
  const b = entry.b || {};

  const stmtsTotal = Object.keys(s).length;
  const funcsTotal = Object.keys(f).length;
  const branchesTotal = Object.values(b).reduce(
    (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  const stmtsCovered = Object.values(s).filter(Boolean).length;
  const funcsCovered = Object.values(f).filter(Boolean).length;
  const branchesCovered = Object.values(b).reduce(
    (acc, arr) =>
      acc + (Array.isArray(arr) ? arr.filter(Boolean).length : 0),
    0
  );

  return {
    stmtsTotal,
    funcsTotal,
    branchesTotal,
    stmtsCovered,
    funcsCovered,
    branchesCovered,
    stmtsMissing: stmtsTotal - stmtsCovered,
    funcsMissing: funcsTotal - funcsCovered,
    branchesMissing: branchesTotal - branchesCovered,
  };
}

const rows = Object.entries(coverage)
  .map(([file, entry]) => {
    const rel = toRel(file);
    return { file, rel, entry, ...summarize(entry) };
  })
  .filter((r) => r.rel.startsWith('src/'))
  .filter((r) => !r.rel.endsWith('.spec.ts'));

function topBy(key, n = 20) {
  return [...rows]
    .sort((a, b) => b[key] - a[key])
    .slice(0, n)
    .filter((r) => r[key] > 0);
}

console.log('Coverage hotspots (src/, excluding *.spec.ts)');
console.log('Coverage file:', coveragePath);

console.log('\nTop missing branches:');
for (const r of topBy('branchesMissing', 25)) {
  console.log(
    `${String(r.branchesMissing).padStart(4)}/${String(r.branchesTotal).padEnd(
      4
    )}  ${r.rel}`
  );
}

console.log('\nTop missing statements:');
for (const r of topBy('stmtsMissing', 25)) {
  console.log(
    `${String(r.stmtsMissing).padStart(4)}/${String(r.stmtsTotal).padEnd(
      4
    )}  ${r.rel}`
  );
}

console.log('\nTop missing functions:');
for (const r of topBy('funcsMissing', 25)) {
  console.log(
    `${String(r.funcsMissing).padStart(4)}/${String(r.funcsTotal).padEnd(
      4
    )}  ${r.rel}`
  );
}
