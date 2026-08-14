import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: "http://apiserver:3000/openapi.json",
  output: {
    // No `lint: "eslint"`: the generated client is in eslint's ignore list, so
    // handing those paths back to eslint fails, and openapi-ts 0.99 propagates
    // a post-processor's exit code where 0.78 swallowed it. Prettier still runs,
    // which is what keeps the output diffable.
    postProcess: ["prettier"],
    path: "./src/client"
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "./src/hey-api.ts"
    },
    {
      name: "@tanstack/react-query"
    }
  ]
})