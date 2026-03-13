import 'server-only'
import { Client, Receiver } from '@upstash/qstash'

let _client: Client | null = null
let _receiver: Receiver | null = null

/**
 * Returns a lazily-initialized QStash client, or null when QSTASH_TOKEN is
 * not configured (local dev, CI without Upstash).
 *
 * Callers must handle the null case — job dispatching silently degrades to a
 * no-op rather than hard-failing in environments without QStash.
 */
export function getQStashClient(): Client | null {
  if (!process.env.QSTASH_TOKEN) {
    return null
  }
  if (!_client) {
    _client = new Client({ token: process.env.QSTASH_TOKEN })
  }
  return _client
}

/**
 * Returns a lazily-initialized QStash signature verifier, or null when
 * signing keys are not configured.
 *
 * Used in job webhook handlers to verify incoming requests are from QStash.
 */
export function getQStashReceiver(): Receiver | null {
  if (
    !process.env.QSTASH_CURRENT_SIGNING_KEY ||
    !process.env.QSTASH_NEXT_SIGNING_KEY
  ) {
    return null
  }
  if (!_receiver) {
    _receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    })
  }
  return _receiver
}
