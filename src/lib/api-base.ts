/**
 * Base URL for the API.
 *
 * Empty, meaning every request resolves against the origin the app was loaded
 * from. In every deployed environment nginx serves this bundle and proxies
 * `/api` to FastAPI on the same host, so the API is always same-origin --
 * baking an absolute URL in only made the bundle environment-specific.
 *
 * Keeping it environment-neutral is what lets one build be promoted unchanged
 * from staging to prod, so prod runs the exact artifact staging tested.
 *
 * Local dev is the one place the two are not naturally same-origin (Vite on
 * :8080, FastAPI on :8000). `server.proxy` in vite.config.js forwards the API
 * paths so relative URLs behave identically there.
 */
export const API_BASE_URL = ''
