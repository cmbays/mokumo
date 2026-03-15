// src/domain/lib/__tests__/money.steps.ts
import { expect } from 'vitest'
import { Given, When, Then } from 'quickpickle'
import { money, round2, toNumber, toFixed2, formatCurrency, formatCurrencyCompact } from '../money'
import { need } from '../../__tests__/support/world'
import type { MokumoWorld } from '../../__tests__/support/world'
import Big from 'big.js'

// State extensions for money scenarios
type MoneyWorld = {
  moneyA?: Big
  moneyB?: Big
  formattedResult?: string
} & MokumoWorld

Given('a monetary value of {float}', (world: MoneyWorld, value: number) => {
  world.moneyA = money(value)
})

Given('another monetary value of {float}', (world: MoneyWorld, value: number) => {
  world.moneyB = money(value)
})

When('I convert to a fixed decimal', (world: MoneyWorld) => {
  world.stringResult = toFixed2(need(world.moneyA, 'moneyA'))
})

When('I convert to a number', (world: MoneyWorld) => {
  world.numericResult = toNumber(need(world.moneyA, 'moneyA'))
})

When('I add the two values', (world: MoneyWorld) => {
  const a = need(world.moneyA, 'moneyA')
  const b = need(world.moneyB, 'moneyB')
  world.stringResult = a.plus(b).toFixed(2)
})

When('I subtract the second from the first', (world: MoneyWorld) => {
  const a = need(world.moneyA, 'moneyA')
  const b = need(world.moneyB, 'moneyB')
  world.stringResult = a.minus(b).toFixed(2)
})

When('I round to two decimal places', (world: MoneyWorld) => {
  world.stringResult = round2(need(world.moneyA, 'moneyA')).toFixed(2)
})

When('I format as currency', (world: MoneyWorld) => {
  world.formattedResult = formatCurrency(toNumber(need(world.moneyA, 'moneyA')))
})

When('I format as compact currency', (world: MoneyWorld) => {
  world.formattedResult = formatCurrencyCompact(toNumber(need(world.moneyA, 'moneyA')))
})

Then('the result is {string}', (world: MoneyWorld, expected: string) => {
  expect(world.stringResult).toBe(expected)
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
  const formatted = need(world.formattedResult, 'formattedResult')
  expect(formatted.startsWith(prefix)).toBe(true)
})
