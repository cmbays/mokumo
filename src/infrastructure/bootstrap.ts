// src/infrastructure/bootstrap.ts
//
// Composition Root — wires domain ports to infrastructure implementations.
// Phase 1: All ports resolve to mock providers.
// Phase 2: env-based switch (process.env.DATA_PROVIDER === 'supabase' ? ... : mock).

// PHASE 2 DECISION REQUIRED: Currently no app-layer consumer imports from @infra/bootstrap.
// All consumers import directly from @infra/repositories/{domain}. Before Phase 4 ESLint
// boundary rules are added, Phase 2 must decide:
//   A) Make bootstrap.ts the enforced single entry point (ESLint: no direct repo imports)
//   B) Deprecate bootstrap.ts in favour of named repository imports (remove this file)
// Also: settings.ts has 3 mutable functions not re-exported here (getBrandPreferencesMutable,
// getAutoPropagationConfigMutable, getDtfSheetTiersSync) — add them before choosing option A.

import type {
  ICustomerRepository,
  IQuoteRepository,
  IJobRepository,
  IInvoiceRepository,
  IArtworkRepository,
  IColorRepository,
  IGarmentRepository,
  IScreenRepository,
  ISettingsRepository,
  ISupplierPricingRepository,
} from '@domain/ports'

export {
  getCustomers,
  getCustomerById,
  getCustomerQuotes,
  getCustomerJobs,
  getCustomerContacts,
  getCustomerNotes,
  getCustomerArtworks,
  getCustomerInvoices,
} from './repositories/customers'

export { getQuotes, getQuoteById } from './repositories/quotes'

export {
  getJobs,
  getJobById,
  getJobsByLane,
  getJobsByServiceType,
  getJobTasks,
} from './repositories/jobs'

export {
  getInvoices,
  getInvoiceById,
  getInvoicePayments,
  getInvoiceCreditMemos,
  getQuoteInvoice,
} from './repositories/invoices'

export {
  getGarmentCatalog,
  getGarmentById,
  getAvailableBrands,
  getGarmentCatalogMutable,
} from './repositories/garments'

export { getScreens, getScreensByJobId } from './repositories/screens'

export { getArtworks, getArtworkById } from './repositories/artworks'

export { getColors, getColorById, getColorsMutable } from './repositories/colors'

export {
  getMockupTemplates,
  getBrandPreferences,
  getDisplayPreference,
  getAutoPropagationConfig,
  getDtfSheetTiers,
} from './repositories/settings'

export { getStylePricing, getStylesPricing } from './repositories/supplier-pricing'

// -- Compile-time assertions --------------------------------------------------
// Verify that concrete implementations satisfy their port contracts.
// These objects are never called — they exist only for TypeScript structural
// type-checking. If a mock function's return type diverges from a port method's
// signature, tsc catches it here rather than at the call site.

import {
  getCustomers,
  getCustomerById,
  getCustomerQuotes,
  getCustomerJobs,
  getCustomerContacts,
  getCustomerNotes,
  getCustomerArtworks,
  getCustomerInvoices,
} from './repositories/customers'
import { getQuotes, getQuoteById } from './repositories/quotes'
import {
  getJobs,
  getJobById,
  getJobsByLane,
  getJobsByServiceType,
  getJobTasks,
  getJobNotes,
  getQuoteCards,
  getScratchNotes,
} from './repositories/jobs'
import {
  getInvoices,
  getInvoiceById,
  getInvoicePayments,
  getInvoiceCreditMemos,
  getQuoteInvoice,
} from './repositories/invoices'
import { getArtworks, getArtworkById } from './repositories/artworks'
import { getColors, getColorById } from './repositories/colors'
import { getGarmentCatalog, getGarmentById, getAvailableBrands } from './repositories/garments'
import { getScreens, getScreensByJobId } from './repositories/screens'
import {
  getMockupTemplates,
  getBrandPreferences,
  getDisplayPreference,
  getAutoPropagationConfig,
  getDtfSheetTiers,
} from './repositories/settings'
import { getStylePricing, getStylesPricing } from './repositories/supplier-pricing'

const _portChecks = {
  customer: {
    getAll: getCustomers,
    getById: getCustomerById,
    getQuotes: getCustomerQuotes,
    getJobs: getCustomerJobs,
    getContacts: getCustomerContacts,
    getNotes: getCustomerNotes,
    getArtworks: getCustomerArtworks,
    getInvoices: getCustomerInvoices,
  } satisfies ICustomerRepository,

  quote: {
    getAll: getQuotes,
    getById: getQuoteById,
  } satisfies IQuoteRepository,

  job: {
    getAll: getJobs,
    getById: getJobById,
    getByLane: getJobsByLane,
    getByServiceType: getJobsByServiceType,
    getTasks: getJobTasks,
    getNotes: getJobNotes,
    getQuoteCards: getQuoteCards,
    getScratchNotes: getScratchNotes,
  } satisfies IJobRepository,

  invoice: {
    getAll: getInvoices,
    getById: getInvoiceById,
    getPayments: getInvoicePayments,
    getCreditMemos: getInvoiceCreditMemos,
    getByQuoteId: getQuoteInvoice,
  } satisfies IInvoiceRepository,

  artwork: {
    getAll: getArtworks,
    getById: getArtworkById,
  } satisfies IArtworkRepository,

  color: {
    getAll: getColors,
    getById: getColorById,
  } satisfies IColorRepository,

  garment: {
    getAll: getGarmentCatalog,
    getById: getGarmentById,
    getAvailableBrands: getAvailableBrands,
  } satisfies IGarmentRepository,

  screen: {
    getAll: getScreens,
    getByJobId: getScreensByJobId,
  } satisfies IScreenRepository,

  settings: {
    getMockupTemplates: getMockupTemplates,
    getBrandPreferences: getBrandPreferences,
    getDisplayPreference: getDisplayPreference,
    getAutoPropagationConfig: getAutoPropagationConfig,
    getDtfSheetTiers: getDtfSheetTiers,
  } satisfies ISettingsRepository,

  supplierPricing: {
    getStylePricing: getStylePricing,
    getStylesPricing: getStylesPricing,
  } satisfies ISupplierPricingRepository,
}

void _portChecks
