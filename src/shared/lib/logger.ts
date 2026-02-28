/**
 * Isomorphic structured logger.
 *
 * Server-side  → JSON lines (suitable for log aggregators)
 * Client-side  → formatted console output (never raw JSON in DevTools)
 *
 * No third-party deps — pure TypeScript over console.*.
 * Pino / Winston will replace this in Phase 2 once a real server exists.
 *
 * Request context injection: call `setLogContextGetter()` once at server startup
 * (see `@shared/lib/request-context`) and every log entry will automatically
 * include the current request's `requestId`, `userId`, etc.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

// ---------------------------------------------------------------------------
// Request context injection
// ---------------------------------------------------------------------------

// Default no-op: no extra fields until request-context registers its getter.
// On the client this stays a no-op permanently (AsyncLocalStorage is server-only).
let _contextGetter: () => LogContext = () => ({})

/**
 * Register a function that returns ambient per-request context (e.g. requestId,
 * userId). Called once at server startup from `@shared/lib/request-context`.
 * The getter is invoked on every `emit()` call and its output is merged at the
 * lowest priority — bound context and per-call context always win.
 */
export function setLogContextGetter(fn: () => LogContext): void {
  _contextGetter = fn
}

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const isServer = typeof window === 'undefined'
const isDev = process.env.NODE_ENV !== 'production'

/** Minimum numeric level to emit. Suppresses debug in production. */
const MIN_LEVEL = isDev ? LEVELS.debug : LEVELS.info

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= MIN_LEVEL
}

// --- Server-side: structured JSON ---

function logJson(level: LogLevel, message: string, context: LogContext): void {
  const entry = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  })

  if (level === 'error') {
    console.error(entry)
  } else if (level === 'warn') {
    console.warn(entry)
  } else {
    console.log(entry)
  }
}

// --- Client-side: formatted console output ---

const CLIENT_STYLES: Record<LogLevel, string> = {
  debug: 'color: #6b7280; font-weight: normal',
  info: 'color: #2ab9ff; font-weight: bold',
  warn: 'color: #ffc663; font-weight: bold',
  error: 'color: #d23e08; font-weight: bold',
}

function logFormatted(level: LogLevel, message: string, context: LogContext): void {
  const prefix = `[${level.toUpperCase()}]`
  const args: unknown[] = [`%c${prefix}%c ${message}`, CLIENT_STYLES[level], '']

  if (Object.keys(context).length > 0) {
    args.push(context)
  }

  if (level === 'error') {
    console.error(...args)
  } else if (level === 'warn') {
    console.warn(...args)
  } else if (level === 'debug') {
    console.debug(...args)
  } else {
    console.info(...args)
  }
}

/**
 * Safely invoke `_contextGetter` and return the ambient context.
 *
 * Uses a direct `console.error` write (not the logger itself) on failure to
 * avoid infinite recursion through `emit()`. A throwing getter must never
 * swallow the log entry that triggered the emit call.
 */
function getAmbientContext(): LogContext {
  try {
    return _contextGetter()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Log context getter threw — ambient context fields missing from this entry',
        timestamp: new Date().toISOString(),
        err: Error.isError(err) ? err.message : String(err),
      })
    )
    return {}
  }
}

function emit(level: LogLevel, message: string, context: LogContext): void {
  if (!shouldLog(level)) return

  // Merge ambient request context at lowest priority so bound context and
  // per-call fields always win. On the client _contextGetter returns {}.
  const merged = { ...getAmbientContext(), ...context }

  if (isServer) {
    logJson(level, message, merged)
  } else {
    logFormatted(level, message, merged)
  }
}

// --- Logger type ---

type Logger = {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  /** Returns a new logger with bound context merged into every log entry. */
  child(bindings: LogContext): Logger
}

function createLogger(boundContext: LogContext = {}): Logger {
  return {
    debug(message, context = {}) {
      emit('debug', message, { ...boundContext, ...context })
    },
    info(message, context = {}) {
      emit('info', message, { ...boundContext, ...context })
    },
    warn(message, context = {}) {
      emit('warn', message, { ...boundContext, ...context })
    },
    error(message, context = {}) {
      emit('error', message, { ...boundContext, ...context })
    },
    child(bindings) {
      return createLogger({ ...boundContext, ...bindings })
    },
  }
}

export const logger = createLogger()
