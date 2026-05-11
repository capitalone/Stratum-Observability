#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';

const buildDir = 'temp';
const compressedFiles = 'artifact-*.tar.gz';

// Helpers

const getSize = (path) => {
  let size = 0;
  if (statSync(path).isDirectory()) {
    const files = readdirSync(path);
    files.forEach((file) => {
      size += getSize(`${path}/${file}`);
    });
  } else {
    size += statSync(path).size;
  }
  return size;
};

const cleanup = () => {
  execSync(`npx rimraf ${buildDir} ${compressedFiles}`);
};

const analyzeSize = (dir, name) => {
  const file = `artifact-${name}.tar.gz`;
  execSync(`tar -zcf ${file} ${dir}/index.js`);
  return {
    min: getSize(dir),
    compressed: getSize(file)
  };
};

const displaySize = (n) => {
  if (n < 1000) {
    return `${n} B`;
  }
  return `${(n / 1000).toFixed(2)} kB`;
};

const getPlugins = () =>
  readdirSync(`${buildDir}/plugins`).filter((f) => statSync(`${buildDir}/plugins/${f}`).isDirectory());

// Execute
(function () {
  cleanup();

  console.log('Building...\n');
  execSync(`npx rollup -c rollup.config.analyze.mjs --silent --compact`);

  const plugins = [];
  getPlugins().forEach((name) => {
    const size = analyzeSize(`${buildDir}/plugins/${name}`, `plugin-${name}`);
    plugins.push({
      name,
      size
    });
  });

  const core = analyzeSize(`${buildDir}/core`, 'core');

  cleanup();

  console.log(`Core ⏤  ${displaySize(core.compressed)}\n\nPlugins`);
  plugins.forEach((p) => {
    console.log(`  ${p.name} ⏤  ${displaySize(p.size.compressed)}`);
  });
  console.log('');
})();
