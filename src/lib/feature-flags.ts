/**
 * Build-time feature flags.
 *
 * Vite inlines `import.meta.env` at build time, so these are constants in the
 * bundle: flipping one needs a rebuild and redeploy, not a restart. Unset means
 * on, so a deployment has to opt *out* — an environment that never sets the
 * variable keeps the feature it had before the flag existed.
 */

/** Whether the AI Assistant is offered at all — header button and chat panel. */
export const AI_CHAT_ENABLED = import.meta.env.VITE_AI_CHAT_ENABLED !== 'false'
