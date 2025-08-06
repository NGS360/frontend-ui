import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: "http://apiserver:3000/openapi.json",
  output: {
    format: "prettier",
    lint: "eslint",
    path: "./src/client"
  },
  plugins: [
    {
      name: "@hey-api/client-axios",
      runtimeConfigPath: "./src/hey-api.ts"
    },
    {
      name: "@tanstack/react-query"
    }
  ]
})