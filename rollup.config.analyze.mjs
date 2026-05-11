import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import baseConfig from './rollup.config.mjs';

export default baseConfig.input.map((input) => {
  const name = input === 'src/index.ts' ? 'core' : input.replace('src/plugins', 'plugins/').replace('/index.ts', '');
  return {
    input,
    output: [{ dir: `temp/${name}`, format: 'es', name: 'index' }],
    plugins: [typescript({ clean: true, useTsconfigDeclarationDir: true }), terser()]
  };
});
