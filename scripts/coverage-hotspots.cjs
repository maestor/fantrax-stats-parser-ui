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

function printMissingDetails(row, { maxFuncs = 10, maxBranches = 15 } = {}) {
  const { rel, entry } = row;
  const fnMap = entry.fnMap || {};
  const f = entry.f || {};
  const missingFnIds = Object.keys(f).filter((id) => f[id] === 0);

  const branchMap = entry.branchMap || {};
  const b = entry.b || {};
  const missingBranches = [];
  for (const [id, hits] of Object.entries(b)) {
    if (!Array.isArray(hits)) continue;
    hits.forEach((h, idx) => {
      if (h === 0) missingBranches.push({ id, idx });
    });
  }

  if (missingFnIds.length === 0 && missingBranches.length === 0) return;

  console.log(`\nDetails for: ${rel}`);

  if (missingFnIds.length) {
    console.log(`  Missing functions (${missingFnIds.length}):`);
    for (const id of missingFnIds.slice(0, maxFuncs)) {
      const meta = fnMap[id] || {};
      const loc = meta.loc && meta.loc.start ? `${meta.loc.start.line}:${meta.loc.start.column}` : '?:?';
      const name = meta.name ? ` ${meta.name}` : '';
      console.log(`    f${id}${name} @ ${loc}`);
    }
    if (missingFnIds.length > maxFuncs) console.log('    ...');
  }

  if (missingBranches.length) {
    console.log(`  Missing branches (${missingBranches.length}):`);
    for (const mb of missingBranches.slice(0, maxBranches)) {
      const meta = branchMap[mb.id] || {};
      const locObj =
        (Array.isArray(meta.locations) && meta.locations[mb.idx]) || meta.loc || {};
      const loc = locObj.start ? `${locObj.start.line}:${locObj.start.column}` : '?:?';
      const type = meta.type ? ` ${meta.type}` : '';
      console.log(`    b${mb.id}[${mb.idx}]${type} @ ${loc}`);
    }
    if (missingBranches.length > maxBranches) console.log('    ...');
  }
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

// Help target fixes quickly: print exact uncovered locations for a few biggest offenders.
const detailSet = new Map();
for (const r of topBy('branchesMissing', 5)) detailSet.set(r.rel, r);
for (const r of topBy('funcsMissing', 5)) detailSet.set(r.rel, r);
for (const r of detailSet.values()) {
  printMissingDetails(r);
}
