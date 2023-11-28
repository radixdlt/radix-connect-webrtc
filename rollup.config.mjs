import typescript from '@rollup/plugin-typescript'
import { dts } from 'rollup-plugin-dts'

export default [
  {
    input: 'src/radix-connect-webrtc.ts',
    output: [
      {
        file: 'dist/radix-connect-webrtc.mjs',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'dist/radix-connect-webrtc.js',
        format: 'umd',
        sourcemap: true,
        name: 'radixConnectWebrtc',
      },
    ],
    plugins: [typescript()],
  },
  {
    input: 'dist/types/radix-connect-webrtc.d.ts',
    output: [{ file: 'dist/radix-connect-webrtc.d.ts', format: 'es' }],
    plugins: [dts()],
  },
]
