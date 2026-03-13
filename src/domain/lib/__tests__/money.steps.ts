// src/domain/lib/__tests__/money.steps.ts
import { Given, When, Then } from 'quickpickle'
import { money, round2, toNumber, toFixed2, formatCurrency, formatCurrencyCompact } from '../money'
import type { MokumoWorld } from '../../__tests__/support/world'
import Big from 'big.js'

// State extensions for money scenarios
interface MoneyWorld extends MokumoWorld {
  moneyA?: Big
  moneyB?: Big
  formattedResult?: string
  numericResult?: number
}

Given('a monetary value of {float}', (world: MoneyWorld, value: number) => {
  world.moneyA = money(value)
})

Given('another monetary value of {float}', (world: MoneyWorld, value: number) => {
  world.moneyB = money(value)
})

When('I convert to a fixed decimal', (world: MoneyWorld) => {
  world.result = toFixed2(world.moneyA!)
})

When('I convert to a number', (world: MoneyWorld) => {
  world.numericResult = toNumber(world.moneyA!)
})

When('I add the two values', (world: MoneyWorld) => {
  world.result = world.moneyA!.plus(world.moneyB!).toFixed(2)
})

When('I subtract the second from the first', (world: MoneyWorld) => {
  world.result = world.moneyA!.minus(world.moneyB!).toFixed(2)
})

When('I round to two decimal places', (world: MoneyWorld) => {
  world.result = round2(world.moneyA!).toFixed(2)
})

When('I format as currency', (world: MoneyWorld) => {
  world.formattedResult = formatCurrency(toNumber(world.moneyA!))
})

When('I format as compact currency', (world: MoneyWorld) => {
  world.formattedResult = formatCurrencyCompact(toNumber(world.moneyA!))
})

Then('the result is {string}', (world: MoneyWorld, expected: string) => {
  expect(world.result).toBe(expected)
})

Then('the numeric result is {float}', (world: MoneyWorld, expected: number) => {
  expect(world.numericResult).toBe(expected)
})

Then('the value exists', (world: MoneyWorld) => {
  expect(world.moneyA).toBeDefined()
})

Then('the formatted value is {string}', (world: MoneyWorld, expected: string) => {
  expect(world.formattedResult).toBe(expected)
})

Then('the formatted value starts with {string}', (world: MoneyWorld, prefix: string) => {
  expect(world.formattedResult).toBeDefined()
  expect(world.formattedResult!.startsWith(prefix)).toBe(true)
})
