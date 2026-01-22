/// <reference types="vitest/config" />
import { cloudflare } from "@cloudflare/vite-plugin"
import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { resolve } from "path"
import fs from "fs"

const isStorybook = process.argv[1]?.includes("storybook")

export default defineConfig({
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  build: {
    sourcemap: true,
    outDir: 'build', // 指定输出目录为 build
    rollupOptions: {
      plugins: [
        {
          name: 'copy-redirects',
          writeBundle() {
            const src = resolve(__dirname, '_redirects')
            const dest = resolve(__dirname, 'build/_redirects')
            if (fs.existsSync(src)) {
              fs.copyFileSync(src, dest)
              console.log('_redirects 文件已复制到 build 目录')
            } else {
              console.warn('_redirects 文件未找到，请在项目根目录创建它')
            }
          },
        },
      ],
    },
  },
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    ...(!process.env.VITEST && !isStorybook
      ? [cloudflare({ viteEnvironment: { name: "ssr" } }), reactRouter()]
      : []),
    ...(!process.env.CI
      ? [
          visualizer({
            brotliSize: true,
            emitFile: true,
          }),
        ]
      : []),
  ],
  test: {
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      include: ["{apps,packages}/**/*.{ts,tsx}"],
      exclude: ["**/*.stories.tsx"],
      reporter: ["text", "text-summary"],
      reportsDirectory: "./.reports/tests-coverage",
      thresholds: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["{apps,packages}/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "happy-dom",
          include: ["{apps,packages}/**/*.test.tsx"],
          setupFiles: ["./setup.dom.vitest.ts"],
        },
      },
    ],
  },
})
