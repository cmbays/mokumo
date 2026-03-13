// src/domain/__tests__/support/world.ts
import { setWorldConstructor, QuickPickleWorld } from 'quickpickle'
import type { QuickPickleWorldInterface } from 'quickpickle'

export class MokumoWorld extends QuickPickleWorld implements QuickPickleWorldInterface {
  // Domain-specific state for acceptance tests
  result: string | number | undefined = undefined
  error: Error | undefined = undefined

  async init() {
    await super.init()
    this.result = undefined
    this.error = undefined
  }
}

setWorldConstructor(MokumoWorld)
