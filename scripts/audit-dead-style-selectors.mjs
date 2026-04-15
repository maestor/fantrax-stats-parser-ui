import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';
import postcss from 'postcss';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(projectRoot, 'src');
const loadPaths = [sourceRoot, projectRoot, path.join(projectRoot, 'node_modules')];
const ignoredClassPrefixes = ['mat-', 'mdc-', 'cdk-', 'ng-', 'fa-', 'material-icons', 'slick-'];
const ignoredDynamicClassNames = new Set([
  'slide-in-left',
  'slide-in-right',
  'slide-out-left',
  'slide-out-right',
]);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isIgnoredClassName = (className) =>
  ignoredDynamicClassNames.has(className) ||
  ignoredClassPrefixes.some((prefix) => className.startsWith(prefix));

const collectFiles = (dir, matcher, results = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, matcher, results);
      continue;
    }

    if (matcher(fullPath, entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
};

const stylesheetFiles = collectFiles(
  sourceRoot,
  (fullPath, name) => name.endsWith('.scss') && !name.startsWith('_'),
);
const runtimeFiles = collectFiles(
  sourceRoot,
  (fullPath) =>
    fullPath.endsWith('.html') ||
    (fullPath.endsWith('.ts') && !fullPath.endsWith('.spec.ts')),
);
const runtimeText = runtimeFiles
  .map((filePath) => fs.readFileSync(filePath, 'utf8'))
  .join('\n');

const selectorDefinitions = new Map();
const compileErrors = [];

for (const filePath of stylesheetFiles) {
  try {
    const compiledCss = sass.compile(filePath, {
      loadPaths,
      style: 'expanded',
    }).css;
    const cssRoot = postcss.parse(compiledCss, { from: filePath });

    cssRoot.walkRules((rule) => {
      const classes = rule.selector.match(/\.([A-Za-z_][A-Za-z0-9_-]*)/g) ?? [];

      for (const rawClass of classes) {
        const className = rawClass.slice(1);
        if (isIgnoredClassName(className)) {
          continue;
        }

        if (!selectorDefinitions.has(className)) {
          selectorDefinitions.set(className, new Set());
        }

        selectorDefinitions.get(className).add(path.relative(projectRoot, filePath));
      }
    });
  } catch (error) {
    compileErrors.push({
      file: path.relative(projectRoot, filePath),
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

if (compileErrors.length > 0) {
  console.error('Style audit failed to compile one or more stylesheets.\n');

  for (const failure of compileErrors) {
    console.error(`- ${failure.file}`);
    console.error(`  ${failure.message}`);
  }

  process.exit(1);
}

const hasRuntimeReference = (className) =>
  new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegex(className)}([^A-Za-z0-9_-]|$)`).test(runtimeText);

const candidates = [...selectorDefinitions.entries()]
  .filter(([className]) => !hasRuntimeReference(className))
  .map(([className, filePaths]) => ({
    className,
    filePaths: [...filePaths].sort(),
  }))
  .sort((left, right) => left.className.localeCompare(right.className));

console.log(`Checked ${selectorDefinitions.size} app-owned class selectors.`);

if (candidates.length === 0) {
  console.log('No dead-style selector candidates found.');
  process.exit(0);
}

console.log(`Found ${candidates.length} potential dead-style selector candidates:\n`);

for (const candidate of candidates) {
  console.log(`- .${candidate.className}`);
  for (const filePath of candidate.filePaths) {
    console.log(`  ${filePath}`);
  }
}

console.log('\nReview note: this audit is text-based and intentionally ignores a small set of known dynamic class names.');
