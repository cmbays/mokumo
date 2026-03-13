// src/domain/lib/__tests__/money.steps.ts
import { Given, Then } from 'quickpickle'
import { money } from '../money'
import type { MokumoWorld } from '../../__tests__/support/world'

Given('a monetary value of {int}', (world: MokumoWorld, value: number) => {
  world.result = money(value).toFixed(2)
})

Then('the value exists', (world: MokumoWorld) => {
  expect(world.result).toBeDefined()
})
