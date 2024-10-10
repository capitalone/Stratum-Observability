import { readdirSync, statSync } from 'fs';
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';

const pluginPath = 'src/plugins';
const getPlugins = () => readdirSync(pluginPath).filter((f) => statSync(pluginPath + '/' + f).isDirectory());
const buildConfig = (name, input) => ({
  input,
  output: [
    {
      dir: `temp/${name}`,
      format: 'es',
      name: 'index'
    }
  ],
  plugins: [
    typescript({
      clean: true,
      useTsconfigDeclarationDir: true
    }),
    terser()
  ]
});

export default [
  buildConfig('core', 'src/index.ts'),
  ...getPlugins().map((p) => buildConfig(`plugins/${p}`, `${pluginPath}/${p}/index.ts`))
];
