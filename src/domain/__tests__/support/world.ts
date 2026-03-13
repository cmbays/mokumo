// src/domain/__tests__/support/world.ts
import { setWorldConstructor, QuickPickleWorld } from 'quickpickle'

/** Throws with a descriptive message if a step prerequisite is undefined. */
export function need<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`Expected '${name}' to be defined. Did a prior Given/When step set it?`)
  }
  return value
}

export class MokumoWorld extends QuickPickleWorld {
  stringResult: string | undefined = undefined
  numericResult: number | undefined = undefined
  error: Error | undefined = undefined

  async init() {
    await super.init()
    this.stringResult = undefined
    this.numericResult = undefined
    this.error = undefined
  }
}

setWorldConstructor(MokumoWorld)
