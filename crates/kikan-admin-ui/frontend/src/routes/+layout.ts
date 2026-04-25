// SPA-only: the admin UI is shipped via adapter-static + composed `/admin`
// mount. Any prerender pass would attempt to hit `/api/platform/v1/...`,
// which doesn't exist at build time.
export const ssr = false;
export const prerender = false;
export const csr = true;
