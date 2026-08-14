//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    // Generated output, not ours to style. The client tripped ~200
    // naming-convention errors on the ThrowOnError type parameter that
    // @hey-api emits; openapi-ts 0.99 propagates its post-processor's exit code
    // where 0.78 swallowed it, so linting it now fails generation outright.
    ignores: ['**/routeTree.gen.ts', 'src/client/**'],
  },
]
