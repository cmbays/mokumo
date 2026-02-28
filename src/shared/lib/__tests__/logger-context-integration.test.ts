import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, setLogContextGetter } from '../logger'

// logger.ts is isomorphic — tests run in Node.js where isServer = true,
// so logJson() is called which outputs JSON to console.log / console.error.

describe('setLogContextGetter()', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Reset to no-op getter before each test
    setLogContextGetter(() => ({}))
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    // Reset to no-op so other test suites are unaffected
    setLogContextGetter(() => ({}))
  })

  it('adds no extra fields when getter returns empty object', () => {
    logger.info('baseline message')

    expect(consoleSpy).toHaveBeenCalledOnce()
    const entry = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(entry.requestId).toBeUndefined()
  })

  it('merges context getter fields into log entries at lowest priority', () => {
    setLogContextGetter(() => ({ requestId: 'test-req-123' }))

    logger.info('instrumented message')

    const entry = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(entry.requestId).toBe('test-req-123')
    expect(entry.level).toBe('info')
    expect(entry.message).toBe('instrumented message')
  })

  it('bound context from child() overrides context getter fields', () => {
    setLogContextGetter(() => ({ requestId: 'from-als', domain: 'ambient' }))

    const child = logger.child({ domain: 'quotes' })
    child.info('child log')

    const entry = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    // domain from child() wins over domain from getter
    expect(entry.domain).toBe('quotes')
    // requestId from getter still present
    expect(entry.requestId).toBe('from-als')
  })

  it('per-call context overrides both getter and bound context', () => {
    setLogContextGetter(() => ({ requestId: 'from-als', tag: 'ambient' }))

    const child = logger.child({ tag: 'bound' })
    child.info('override test', { tag: 'per-call' })

    const entry = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(entry.tag).toBe('per-call')
    expect(entry.requestId).toBe('from-als')
  })

  it('works for all log levels', () => {
    setLogContextGetter(() => ({ requestId: 'multi-level' }))

    logger.info('info line')
    logger.error('error line')
    logger.warn('warn line')

    const infoEntry = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    const errorEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string)
    const warnEntry = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string)

    expect(infoEntry.requestId).toBe('multi-level')
    expect(errorEntry.requestId).toBe('multi-level')
    expect(warnEntry.requestId).toBe('multi-level')
  })

  it('switching getters takes effect immediately on the next log call', () => {
    setLogContextGetter(() => ({ requestId: 'first' }))
    logger.info('first call')
    const firstEntry = JSON.parse(consoleSpy.mock.calls[0][0] as string)

    setLogContextGetter(() => ({ requestId: 'second' }))
    logger.info('second call')
    const secondEntry = JSON.parse(consoleSpy.mock.calls[1][0] as string)

    expect(firstEntry.requestId).toBe('first')
    expect(secondEntry.requestId).toBe('second')
  })

  it('still emits the log entry when the context getter throws', () => {
    setLogContextGetter(() => {
      throw new Error('getter blew up')
    })

    // The original log message must not be swallowed even though the getter threw
    logger.info('survived getter failure', { safeField: 'present' })

    // The original log entry was written (ambient context missing, but message preserved)
    expect(consoleSpy).toHaveBeenCalledOnce()
    const entry = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(entry.message).toBe('survived getter failure')
    expect(entry.safeField).toBe('present')
    // requestId is absent because getter failed, but that is acceptable
    expect(entry.requestId).toBeUndefined()

    // The getter failure itself was reported directly to console.error
    expect(consoleErrorSpy).toHaveBeenCalledOnce()
    const errorOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string)
    expect(errorOutput.message).toContain('Log context getter threw')
  })
})
