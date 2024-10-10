#!/usr/bin/env node

const fs = require('fs');
const shell = require('shelljs');

const buildDir = 'temp';
const compressedFiles = 'artifact-*.tar.gz';

// Helpers

const getSize = (path) => {
  let size = 0;
  if (fs.statSync(path).isDirectory()) {
    const files = fs.readdirSync(path);
    files.forEach((file) => {
      size += getSize(`${path}/${file}`);
    });
  } else {
    size += fs.statSync(path).size;
  }
  return size;
};

const cleanup = () => {
  shell.exec(`npx rimraf ${buildDir} ${compressedFiles}`);
};

const analyzeSize = (dir, name) => {
  const file = `artifact-${name}.tar.gz`;
  shell.exec(`tar -zcf ${file} ${dir}/index.js`);
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
  fs.readdirSync(`${buildDir}/plugins`).filter((f) => fs.statSync(`${buildDir}/plugins/${f}`).isDirectory());

// Execute
(function () {
  cleanup();

  console.log('Building...\n');
  shell.exec(`npx rollup -c rollup.config.analyze.js --silent --compact --bundleConfigAsCjs`);

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
