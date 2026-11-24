import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  build: {
    rolldownOptions: {
      onLog(level, log, defaultHandler) {
        // 依赖包里保留的 "use client" 对 TanStack Start 无意义，屏蔽这条警告
        if (
            log.code === 'MODULE_LEVEL_DIRECTIVE' &&
            log.message.includes('"use client"')
        ) {
          return
        }
        defaultHandler(level, log)
      },
    },
  },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  nitro: {},
})

export default config
