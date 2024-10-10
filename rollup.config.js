import { readdirSync, statSync } from 'fs';
import typescript from 'rollup-plugin-typescript2';
import replace from '@rollup/plugin-replace';
import pkg from './package.json' assert { type: 'json' };

const pluginPath = 'src/plugins';
const getPlugins = () => readdirSync(pluginPath).filter((f) => statSync(pluginPath + '/' + f).isDirectory());

export default {
  input: ['src/index.ts', ...getPlugins().map((p) => `${pluginPath}/${p}/index.ts`)],
  output: [
    {
      dir: `dist/cjs`,
      format: 'cjs',
      name: 'index',
      exports: 'auto',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
    {
      dir: `dist/esm`,
      format: 'es',
      name: 'index',
      preserveModules: true,
      preserveModulesRoot: 'src'
    }
  ],
  plugins: [
    replace({
      preventAssignment: true,
      __stratumLibraryVersion__: pkg.version
    }),
    typescript({
      clean: true,
      useTsconfigDeclarationDir: true
    })
  ]
};
