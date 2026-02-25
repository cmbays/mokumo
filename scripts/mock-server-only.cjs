/**
 * Preload hook — makes `server-only` a no-op so infrastructure files can run
 * outside of Next.js (e.g. local CLI scripts).
 *
 * Usage: npx tsx -r ./scripts/mock-server-only.cjs scripts/run-catalog-sync.ts
 */
const Module = require('module')
const origLoad = Module._load.bind(Module)

Module._load = function (request, parent, isMain) {
  if (request === 'server-only') return {}
  return origLoad(request, parent, isMain)
}
