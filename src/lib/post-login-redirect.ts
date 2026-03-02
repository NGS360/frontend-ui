const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect'

export function resolvePostLoginRedirect(redirect: string | null | undefined): string {
  if (!redirect) {
    return '/'
  }

  try {
    const parsed = new URL(redirect, window.location.origin)
    if (parsed.origin !== window.location.origin) {
      return '/'
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/'
  } catch {
    return redirect.startsWith('/') ? redirect : '/'
  }
}

export function storePostLoginRedirect(redirect: string | null | undefined): void {
  sessionStorage.setItem(
    POST_LOGIN_REDIRECT_KEY,
    resolvePostLoginRedirect(redirect)
  )
}

export function consumePostLoginRedirect(): string {
  const redirect = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
  return resolvePostLoginRedirect(redirect)
}