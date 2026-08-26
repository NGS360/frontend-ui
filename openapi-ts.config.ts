import { defineConfig } from '@hey-api/openapi-ts';

/**
 * FastAPI >= 0.139 emits OpenAPI 3.1, which describes an upload field as
 * `{type: "string", contentMediaType: "application/octet-stream"}` rather than
 * 3.0's `{type: "string", format: "binary"}`. This generator version only maps
 * `format: binary` to `Blob | File`, so without the patch below every upload
 * field regenerates as `string` — which type-checks at the call sites only if
 * they cast, and then sends the filename instead of the file.
 *
 * Add any new upload request body to this list; the patch has to be keyed by
 * schema name because the generator has no catch-all hook for schemas.
 */
const UPLOAD_BODY_SCHEMAS = [
  'Body_post_run_samplesheet',
  'Body_upload_manifest',
  'Body_upload_samples_file',
];

const restoreBinaryFormat = (schema: {
  properties?: Record<string, unknown>;
}) => {
  for (const property of Object.values(schema.properties ?? {})) {
    const field = property as { contentMediaType?: string; format?: string };
    if (field.contentMediaType === 'application/octet-stream') {
      field.format = 'binary';
    }
  }
};

export default defineConfig({
  input: "http://apiserver:3000/openapi.json",
  parser: {
    patch: {
      schemas: Object.fromEntries(
        UPLOAD_BODY_SCHEMAS.map((name) => [name, restoreBinaryFormat]),
      ),
    },
  },
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
