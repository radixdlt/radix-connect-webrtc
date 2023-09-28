/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/radix-connect-webrtc.ts'),
      name: 'radix-connect-webrtc',
    },
  },
})
