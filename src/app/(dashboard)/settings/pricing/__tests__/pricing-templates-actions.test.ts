import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

// ---------------------------------------------------------------------------
// Hoist mocks
// ---------------------------------------------------------------------------

const {
  mockVerifySession,
  mockListTemplates,
  mockGetDefaultTemplate,
  mockGetTemplateById,
  mockUpsertTemplate,
  mockUpsertMatrixCells,
  mockGetMarkupRules,
  mockUpsertMarkupRules,
  mockGetRushTiers,
  mockUpsertRushTiers,
  mockDeleteTemplate,
  mockSetDefaultTemplate,
} = vi.hoisted(() => {
  return {
    mockVerifySession: vi.fn(),
    mockListTemplates: vi.fn(),
    mockGetDefaultTemplate: vi.fn(),
    mockGetTemplateById: vi.fn(),
    mockUpsertTemplate: vi.fn(),
    mockUpsertMatrixCells: vi.fn(),
    mockGetMarkupRules: vi.fn(),
    mockUpsertMarkupRules: vi.fn(),
    mockGetRushTiers: vi.fn(),
    mockUpsertRushTiers: vi.fn(),
    mockDeleteTemplate: vi.fn(),
    mockSetDefaultTemplate: vi.fn(),
  }
})

vi.mock('@infra/auth/session', () => ({ verifySession: mockVerifySession }))

vi.mock('@infra/repositories/pricing-templates', () => ({
  listTemplates: mockListTemplates,
  getDefaultTemplate: mockGetDefaultTemplate,
  getTemplateById: mockGetTemplateById,
  upsertTemplate: mockUpsertTemplate,
  upsertMatrixCells: mockUpsertMatrixCells,
  getMarkupRules: mockGetMarkupRules,
  upsertMarkupRules: mockUpsertMarkupRules,
  getRushTiers: mockGetRushTiers,
  upsertRushTiers: mockUpsertRushTiers,
  deleteTemplate: mockDeleteTemplate,
  setDefaultTemplate: mockSetDefaultTemplate,
}))

vi.mock('@shared/lib/logger', () => ({
  logger: { child: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }) },
}))

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import {
  listPricingTemplates,
  getDefaultPricingTemplate,
  getPricingTemplate,
  createPricingTemplate,
  updatePricingTemplate,
  deletePricingTemplate,
  savePricingMatrix,
  setDefaultPricingTemplate,
  getMarkupRules,
  saveMarkupRules,
  getRushTiers,
  saveRushTiers,
} from '../pricing-templates-actions'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const SHOP_ID = '00000000-0000-4000-8000-000000004e6b'
const OTHER_SHOP_ID = '00000000-0000-4000-8000-000000009999'
const TEMPLATE_ID = '00000000-0000-4000-8000-000000000001'
const SESSION = { userId: 'user-1', role: 'owner', shopId: SHOP_ID }

const TEMPLATE_ROW = {
  id: TEMPLATE_ID,
  shopId: SHOP_ID,
  name: 'Standard Screen Print',
  serviceType: 'screen_print',
  interpolationMode: 'linear' as const,
  setupFeePerColor: 15,
  sizeUpchargeXxl: 2,
  standardTurnaroundDays: 7,
  isDefault: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const TEMPLATE_WITH_MATRIX = { ...TEMPLATE_ROW, cells: [] }

const CREATE_DATA = {
  name: 'New',
  serviceType: 'screen_print',
  interpolationMode: 'linear' as const,
  setupFeePerColor: 15,
  sizeUpchargeXxl: 2,
  standardTurnaroundDays: 7,
  isDefault: false,
}

// ---------------------------------------------------------------------------
// Helper to reset mocks with a valid session by default
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  mockVerifySession.mockResolvedValue(SESSION)
})

// ---------------------------------------------------------------------------
// listPricingTemplates
// ---------------------------------------------------------------------------

describe('listPricingTemplates', () => {
  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await listPricingTemplates()
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
    expect(mockListTemplates).not.toHaveBeenCalled()
  })

  it('calls listTemplates with shopId from session', async () => {
    mockListTemplates.mockResolvedValueOnce([TEMPLATE_ROW])
    const result = await listPricingTemplates()
    expect(mockListTemplates).toHaveBeenCalledWith(SHOP_ID, undefined)
    expect(result).toEqual({ data: [TEMPLATE_ROW], error: null })
  })

  it('passes serviceType filter when provided', async () => {
    mockListTemplates.mockResolvedValueOnce([TEMPLATE_ROW])
    await listPricingTemplates('screen_print')
    expect(mockListTemplates).toHaveBeenCalledWith(SHOP_ID, 'screen_print')
  })

  it('returns error envelope when repo throws', async () => {
    mockListTemplates.mockRejectedValueOnce(new Error('DB error'))
    const result = await listPricingTemplates()
    expect(result).toEqual({ data: null, error: 'Failed to load pricing templates' })
  })
})

// ---------------------------------------------------------------------------
// getDefaultPricingTemplate
// ---------------------------------------------------------------------------

describe('getDefaultPricingTemplate', () => {
  it('returns error for empty service type', async () => {
    const result = await getDefaultPricingTemplate('')
    expect(result).toEqual({ data: null, error: 'Invalid service type' })
    expect(mockVerifySession).not.toHaveBeenCalled()
  })

  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await getDefaultPricingTemplate('screen_print')
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
    expect(mockGetDefaultTemplate).not.toHaveBeenCalled()
  })

  it('calls getDefaultTemplate with shopId from session', async () => {
    mockGetDefaultTemplate.mockResolvedValueOnce(TEMPLATE_WITH_MATRIX)
    const result = await getDefaultPricingTemplate('screen_print')
    expect(mockGetDefaultTemplate).toHaveBeenCalledWith(SHOP_ID, 'screen_print')
    expect(result).toEqual({ data: TEMPLATE_WITH_MATRIX, error: null })
  })

  it('returns null data when no default template exists', async () => {
    mockGetDefaultTemplate.mockResolvedValueOnce(null)
    const result = await getDefaultPricingTemplate('screen_print')
    expect(result).toEqual({ data: null, error: null })
  })

  it('returns error envelope when repo throws', async () => {
    mockGetDefaultTemplate.mockRejectedValueOnce(new Error('DB error'))
    const result = await getDefaultPricingTemplate('screen_print')
    expect(result).toEqual({ data: null, error: 'Failed to load default pricing template' })
  })
})

// ---------------------------------------------------------------------------
// getPricingTemplate
// ---------------------------------------------------------------------------

describe('getPricingTemplate', () => {
  it('returns error for invalid template ID', async () => {
    const result = await getPricingTemplate('not-a-uuid')
    expect(result).toEqual({ data: null, error: 'Invalid template ID' })
    expect(mockVerifySession).not.toHaveBeenCalled()
  })

  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await getPricingTemplate(TEMPLATE_ID)
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
  })

  it('returns template with cells', async () => {
    mockGetTemplateById.mockResolvedValueOnce(TEMPLATE_WITH_MATRIX)
    const result = await getPricingTemplate(TEMPLATE_ID)
    expect(result).toEqual({ data: TEMPLATE_WITH_MATRIX, error: null })
  })

  it('returns null data when template not found', async () => {
    mockGetTemplateById.mockResolvedValueOnce(null)
    const result = await getPricingTemplate(TEMPLATE_ID)
    expect(result).toEqual({ data: null, error: null })
  })

  it('returns not found when template belongs to a different shop', async () => {
    mockGetTemplateById.mockResolvedValueOnce({ ...TEMPLATE_WITH_MATRIX, shopId: OTHER_SHOP_ID })
    const result = await getPricingTemplate(TEMPLATE_ID)
    expect(result).toEqual({ data: null, error: 'Template not found' })
  })
})

// ---------------------------------------------------------------------------
// createPricingTemplate
// ---------------------------------------------------------------------------

describe('createPricingTemplate', () => {
  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await createPricingTemplate(CREATE_DATA)
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
    expect(mockUpsertTemplate).not.toHaveBeenCalled()
  })

  it('injects shopId from session — never from caller', async () => {
    mockUpsertTemplate.mockResolvedValueOnce(TEMPLATE_ROW)
    await createPricingTemplate(CREATE_DATA)
    expect(mockUpsertTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ shopId: SHOP_ID })
    )
  })

  it('returns created template', async () => {
    mockUpsertTemplate.mockResolvedValueOnce(TEMPLATE_ROW)
    const result = await createPricingTemplate(CREATE_DATA)
    expect(result).toEqual({ data: TEMPLATE_ROW, error: null })
  })
})

// ---------------------------------------------------------------------------
// updatePricingTemplate
// ---------------------------------------------------------------------------

const UPDATE_DATA = {
  name: 'Updated Name',
  serviceType: 'screen_print',
  interpolationMode: 'linear' as const,
  setupFeePerColor: 20,
  sizeUpchargeXxl: 3,
  standardTurnaroundDays: 5,
  isDefault: false,
}

describe('updatePricingTemplate', () => {
  it('returns error for invalid template ID', async () => {
    const result = await updatePricingTemplate('bad', UPDATE_DATA)
    expect(result).toEqual({ data: null, error: 'Invalid template ID' })
    expect(mockVerifySession).not.toHaveBeenCalled()
  })

  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await updatePricingTemplate(TEMPLATE_ID, UPDATE_DATA)
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
  })

  it('passes id and shopId from session to upsertTemplate', async () => {
    mockUpsertTemplate.mockResolvedValueOnce(TEMPLATE_ROW)
    await updatePricingTemplate(TEMPLATE_ID, UPDATE_DATA)
    expect(mockUpsertTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ id: TEMPLATE_ID, shopId: SHOP_ID, name: 'Updated Name' })
    )
  })
})

// ---------------------------------------------------------------------------
// deletePricingTemplate
// ---------------------------------------------------------------------------

describe('deletePricingTemplate', () => {
  it('returns error for invalid template ID', async () => {
    const result = await deletePricingTemplate('bad')
    expect(result).toEqual({ data: null, error: 'Invalid template ID' })
    expect(mockVerifySession).not.toHaveBeenCalled()
  })

  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await deletePricingTemplate(TEMPLATE_ID)
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
    expect(mockDeleteTemplate).not.toHaveBeenCalled()
  })

  it('passes shopId from session — not from caller', async () => {
    mockDeleteTemplate.mockResolvedValueOnce(undefined)
    await deletePricingTemplate(TEMPLATE_ID)
    expect(mockDeleteTemplate).toHaveBeenCalledWith(TEMPLATE_ID, SHOP_ID)
  })

  it('returns ok envelope on success', async () => {
    mockDeleteTemplate.mockResolvedValueOnce(undefined)
    const result = await deletePricingTemplate(TEMPLATE_ID)
    expect(result).toEqual({ data: null, error: null })
  })

  it('returns error envelope when repo throws', async () => {
    mockDeleteTemplate.mockRejectedValueOnce(new Error('DB error'))
    const result = await deletePricingTemplate(TEMPLATE_ID)
    expect(result).toEqual({ data: null, error: 'Failed to delete pricing template' })
  })
})

// ---------------------------------------------------------------------------
// savePricingMatrix
// ---------------------------------------------------------------------------

describe('savePricingMatrix', () => {
  it('returns error for invalid template ID', async () => {
    const result = await savePricingMatrix('bad', [])
    expect(result).toEqual({ data: null, error: 'Invalid template ID' })
  })

  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await savePricingMatrix(TEMPLATE_ID, [])
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
  })

  it('returns not found when template does not exist', async () => {
    mockGetTemplateById.mockResolvedValueOnce(null)
    const result = await savePricingMatrix(TEMPLATE_ID, [])
    expect(result).toEqual({ data: null, error: 'Template not found' })
    expect(mockUpsertMatrixCells).not.toHaveBeenCalled()
  })

  it('returns not found when template belongs to a different shop', async () => {
    mockGetTemplateById.mockResolvedValueOnce({ ...TEMPLATE_WITH_MATRIX, shopId: OTHER_SHOP_ID })
    const result = await savePricingMatrix(TEMPLATE_ID, [])
    expect(result).toEqual({ data: null, error: 'Template not found' })
    expect(mockUpsertMatrixCells).not.toHaveBeenCalled()
  })

  it('calls upsertMatrixCells with templateId and cells', async () => {
    mockGetTemplateById.mockResolvedValueOnce(TEMPLATE_WITH_MATRIX)
    mockUpsertMatrixCells.mockResolvedValueOnce(undefined)
    const cells = [{ templateId: TEMPLATE_ID, qtyAnchor: 24, colorCount: 2, costPerPiece: 5.5 }]
    await savePricingMatrix(TEMPLATE_ID, cells)
    expect(mockUpsertMatrixCells).toHaveBeenCalledWith(TEMPLATE_ID, cells)
  })

  it('returns ok null on success', async () => {
    mockGetTemplateById.mockResolvedValueOnce(TEMPLATE_WITH_MATRIX)
    mockUpsertMatrixCells.mockResolvedValueOnce(undefined)
    const result = await savePricingMatrix(TEMPLATE_ID, [])
    expect(result).toEqual({ data: null, error: null })
  })
})

// ---------------------------------------------------------------------------
// setDefaultPricingTemplate
// ---------------------------------------------------------------------------

describe('setDefaultPricingTemplate', () => {
  it('returns error for invalid template ID', async () => {
    const result = await setDefaultPricingTemplate('bad', 'screen_print')
    expect(result).toEqual({ data: null, error: 'Invalid template ID' })
    expect(mockVerifySession).not.toHaveBeenCalled()
  })

  it('returns error for empty service type', async () => {
    const result = await setDefaultPricingTemplate(TEMPLATE_ID, '')
    expect(result).toEqual({ data: null, error: 'Invalid service type' })
    expect(mockVerifySession).not.toHaveBeenCalled()
  })

  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await setDefaultPricingTemplate(TEMPLATE_ID, 'screen_print')
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
    expect(mockSetDefaultTemplate).not.toHaveBeenCalled()
  })

  it('passes shopId from session — never from caller', async () => {
    mockSetDefaultTemplate.mockResolvedValueOnce(undefined)
    await setDefaultPricingTemplate(TEMPLATE_ID, 'screen_print')
    expect(mockSetDefaultTemplate).toHaveBeenCalledWith(SHOP_ID, TEMPLATE_ID, 'screen_print')
  })

  it('returns ok null on success', async () => {
    mockSetDefaultTemplate.mockResolvedValueOnce(undefined)
    const result = await setDefaultPricingTemplate(TEMPLATE_ID, 'screen_print')
    expect(result).toEqual({ data: null, error: null })
  })

  it('returns error envelope when repo throws', async () => {
    mockSetDefaultTemplate.mockRejectedValueOnce(new Error('TX error'))
    const result = await setDefaultPricingTemplate(TEMPLATE_ID, 'screen_print')
    expect(result).toEqual({ data: null, error: 'Failed to set default template' })
  })
})

// ---------------------------------------------------------------------------
// getMarkupRules
// ---------------------------------------------------------------------------

describe('getMarkupRules', () => {
  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await getMarkupRules()
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
  })

  it('calls getMarkupRules with shopId from session', async () => {
    const rules = [{ id: 'r1', shopId: SHOP_ID, garmentCategory: 'tshirt', markupMultiplier: 2.0 }]
    mockGetMarkupRules.mockResolvedValueOnce(rules)
    const result = await getMarkupRules()
    expect(mockGetMarkupRules).toHaveBeenCalledWith(SHOP_ID)
    expect(result).toEqual({ data: rules, error: null })
  })
})

// ---------------------------------------------------------------------------
// saveMarkupRules
// ---------------------------------------------------------------------------

describe('saveMarkupRules', () => {
  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await saveMarkupRules([])
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
    expect(mockUpsertMarkupRules).not.toHaveBeenCalled()
  })

  it('calls upsertMarkupRules with shopId from session', async () => {
    mockUpsertMarkupRules.mockResolvedValueOnce(undefined)
    const rules = [{ shopId: SHOP_ID, garmentCategory: 'tshirt', markupMultiplier: 2.0 }]
    await saveMarkupRules(rules)
    expect(mockUpsertMarkupRules).toHaveBeenCalledWith(SHOP_ID, rules)
  })

  it('returns ok null on success', async () => {
    mockUpsertMarkupRules.mockResolvedValueOnce(undefined)
    const result = await saveMarkupRules([])
    expect(result).toEqual({ data: null, error: null })
  })

  it('returns error envelope when repo throws', async () => {
    mockUpsertMarkupRules.mockRejectedValueOnce(new Error('DB error'))
    const result = await saveMarkupRules([])
    expect(result).toEqual({ data: null, error: 'Failed to save markup rules' })
  })
})

// ---------------------------------------------------------------------------
// getRushTiers
// ---------------------------------------------------------------------------

describe('getRushTiers', () => {
  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await getRushTiers()
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
  })

  it('calls getRushTiers with shopId from session', async () => {
    const tiers = [
      { id: 't1', shopId: SHOP_ID, name: 'Next Day', daysUnderStandard: 6, flatFee: 30, pctSurcharge: 0.1, displayOrder: 1 },
    ]
    mockGetRushTiers.mockResolvedValueOnce(tiers)
    const result = await getRushTiers()
    expect(mockGetRushTiers).toHaveBeenCalledWith(SHOP_ID)
    expect(result).toEqual({ data: tiers, error: null })
  })
})

// ---------------------------------------------------------------------------
// saveRushTiers
// ---------------------------------------------------------------------------

describe('saveRushTiers', () => {
  it('returns Unauthorized when session is null', async () => {
    mockVerifySession.mockResolvedValueOnce(null)
    const result = await saveRushTiers([])
    expect(result).toEqual({ data: null, error: 'Unauthorized' })
    expect(mockUpsertRushTiers).not.toHaveBeenCalled()
  })

  it('calls upsertRushTiers with shopId from session', async () => {
    mockUpsertRushTiers.mockResolvedValueOnce(undefined)
    const tiers = [
      { shopId: SHOP_ID, name: 'Rush', daysUnderStandard: 3, flatFee: 50, pctSurcharge: 0.2, displayOrder: 1 },
    ]
    await saveRushTiers(tiers)
    expect(mockUpsertRushTiers).toHaveBeenCalledWith(SHOP_ID, tiers)
  })

  it('returns ok null on success', async () => {
    mockUpsertRushTiers.mockResolvedValueOnce(undefined)
    const result = await saveRushTiers([])
    expect(result).toEqual({ data: null, error: null })
  })

  it('returns error envelope when repo throws', async () => {
    mockUpsertRushTiers.mockRejectedValueOnce(new Error('DB error'))
    const result = await saveRushTiers([])
    expect(result).toEqual({ data: null, error: 'Failed to save rush tiers' })
  })
})
