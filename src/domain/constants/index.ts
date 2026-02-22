import type { ProductionState, Priority, Lane, RiskLevel } from '@domain/entities/job'
import type { BurnStatus } from '@domain/entities/screen'
import type { QuoteStatus, ServiceType } from '@domain/entities/quote'
import type {
  CustomerTag,
  LifecycleStage,
  HealthStatus,
  CustomerTypeTag,
  PaymentTerms,
  PricingTier,
} from '@domain/entities/customer'
import type { ContactRole } from '@domain/entities/contact'
import type { NoteChannel } from '@domain/entities/note'
import type { ArtworkTag } from '@domain/entities/artwork'
import type { GarmentCategory } from '@domain/entities/garment'
import type { InvoiceStatus, PaymentMethod, InvoiceLineItemType } from '@domain/entities/invoice'
import type { CreditMemoReason } from '@domain/entities/credit-memo'

export const PRODUCTION_STATE_LABELS: Record<ProductionState, string> = {
  design: 'Design',
  approval: 'Approval',
  burning: 'Burning',
  press: 'Press',
  finishing: 'Finishing',
  shipped: 'Shipped',
}

export const PRODUCTION_STATE_COLORS: Record<ProductionState, string> = {
  design: 'text-muted-foreground',
  approval: 'text-warning',
  burning: 'text-action',
  press: 'text-action',
  finishing: 'text-success',
  shipped: 'text-success',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  rush: 'Rush',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'text-muted-foreground',
  medium: 'text-foreground',
  high: 'text-warning',
  rush: 'text-error',
}

export const BURN_STATUS_LABELS: Record<BurnStatus, string> = {
  pending: 'Pending',
  burned: 'Burned',
  reclaimed: 'Reclaimed',
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  revised: 'Revised',
}

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'text-muted-foreground',
  sent: 'text-action',
  accepted: 'text-success',
  declined: 'text-error',
  revised: 'text-warning',
}

export const QUOTE_STATUS_BADGE_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-action/10 text-action border border-action/20',
  accepted: 'bg-success/10 text-success border border-success/20',
  declined: 'bg-error/10 text-error border border-error/20',
  revised: 'bg-warning/10 text-warning border border-warning/20',
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  'screen-print': 'Screen Print',
  dtf: 'DTF',
  embroidery: 'Embroidery',
}

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  'screen-print': 'text-action',
  dtf: 'text-brown',
  embroidery: 'text-lime',
}

export const CUSTOMER_TAG_LABELS: Record<CustomerTag, string> = {
  new: 'New',
  repeat: 'Repeat',
  contract: 'Contract',
}

export const CUSTOMER_TAG_COLORS: Record<CustomerTag, string> = {
  new: 'text-action',
  repeat: 'text-success',
  contract: 'text-warning',
}

export const GARMENT_CATEGORY_LABELS: Record<GarmentCategory, string> = {
  't-shirts': 'T-Shirts',
  polos: 'Polos',
  fleece: 'Fleece',
  'knits-layering': 'Knits & Layering',
  outerwear: 'Outerwear',
  pants: 'Pants',
  shorts: 'Shorts',
  headwear: 'Headwear',
  activewear: 'Activewear',
  accessories: 'Accessories',
  wovens: 'Wovens',
  other: 'Other',
}

export const ARTWORK_TAG_LABELS: Record<ArtworkTag, string> = {
  corporate: 'Corporate',
  event: 'Event',
  seasonal: 'Seasonal',
  promotional: 'Promotional',
  sports: 'Sports',
  custom: 'Custom',
}

// ---------------------------------------------------------------------------
// Customer Management — Lifecycle, Health, Type Tags, Financial
// ---------------------------------------------------------------------------

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  prospect: 'Prospect',
  new: 'New',
  repeat: 'Repeat',
  contract: 'Contract',
}

export const LIFECYCLE_STAGE_COLORS: Record<LifecycleStage, string> = {
  prospect: 'bg-action/10 text-action border border-action/20',
  new: 'bg-muted text-muted-foreground',
  repeat: 'bg-success/10 text-success border border-success/20',
  contract: 'bg-warning/10 text-warning border border-warning/20',
}

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  active: 'Active',
  'potentially-churning': 'Needs Attention',
  churned: 'Inactive',
}

export const HEALTH_STATUS_COLORS: Record<HealthStatus, string> = {
  active: '',
  'potentially-churning': 'bg-warning/10 text-warning border border-warning/20',
  churned: 'bg-error/10 text-error border border-error/20',
}

export const CUSTOMER_TYPE_TAG_LABELS: Record<CustomerTypeTag, string> = {
  retail: 'Retail',
  'sports-school': 'Sports/School',
  corporate: 'Corporate',
  'storefront-merch': 'Storefront/Merch',
  wholesale: 'Wholesale',
}

export const CUSTOMER_TYPE_TAG_COLORS: Record<CustomerTypeTag, string> = {
  retail: 'bg-muted text-muted-foreground',
  'sports-school': 'bg-action/10 text-action border border-action/20',
  corporate: 'bg-success/10 text-success border border-success/20',
  'storefront-merch': 'bg-warning/10 text-warning border border-warning/20',
  wholesale: 'bg-muted text-foreground border border-border',
}

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  ordering: 'Ordering',
  'art-approver': 'Art Approver',
  billing: 'Billing',
  owner: 'Owner',
  other: 'Other',
}

export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  cod: 'COD',
  upfront: 'Payment Upfront',
  'net-15': 'Net 15',
  'net-30': 'Net 30',
  'net-60': 'Net 60',
}

export const PRICING_TIER_LABELS: Record<PricingTier, string> = {
  standard: 'Standard',
  preferred: 'Preferred',
  contract: 'Contract',
  wholesale: 'Wholesale',
}

export const NOTE_CHANNEL_LABELS: Record<NoteChannel, string> = {
  phone: 'Phone',
  email: 'Email',
  text: 'Text',
  social: 'Social',
  'in-person': 'In Person',
}

// ---------------------------------------------------------------------------
// Invoicing — Status, Payment Methods, Line Item Types, Credit Memos
// ---------------------------------------------------------------------------

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial',
  paid: 'Paid',
  void: 'Void',
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'text-muted-foreground',
  sent: 'text-action',
  partial: 'text-warning',
  paid: 'text-success',
  void: 'text-error',
}

export const INVOICE_STATUS_BADGE_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-action/10 text-action border border-action/20',
  partial: 'bg-warning/10 text-warning border border-warning/20',
  paid: 'bg-success/10 text-success border border-success/20',
  void: 'bg-error/10 text-error border border-error/20',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  check: 'Check',
  cash: 'Cash',
  square: 'Square',
  venmo: 'Venmo',
  zelle: 'Zelle',
  credit_card: 'Credit Card',
  ach: 'ACH',
  other: 'Other',
}

export const INVOICE_LINE_ITEM_TYPE_LABELS: Record<InvoiceLineItemType, string> = {
  garment: 'Garment',
  setup: 'Setup',
  artwork: 'Artwork',
  rush: 'Rush',
  other: 'Other',
}

export const CREDIT_MEMO_REASON_LABELS: Record<CreditMemoReason, string> = {
  shortage: 'Shortage',
  misprint: 'Misprint',
  defect: 'Defect',
  overcharge: 'Overcharge',
  return: 'Return',
  other: 'Other',
}

export const DEPOSIT_DEFAULTS_BY_TIER: Record<PricingTier, number> = {
  standard: 50,
  preferred: 50,
  contract: 0,
  wholesale: 100,
}

// ---------------------------------------------------------------------------
// Jobs & Production — Lane Status
// ---------------------------------------------------------------------------

export const LANE_LABELS: Record<Lane, string> = {
  ready: 'Ready',
  in_progress: 'In Progress',
  review: 'Review',
  blocked: 'Blocked',
  done: 'Done',
}

export const LANE_COLORS: Record<Lane, string> = {
  ready: 'text-muted-foreground',
  in_progress: 'text-action',
  review: 'text-warning',
  blocked: 'text-error',
  done: 'text-success',
}

export const LANE_BADGE_COLORS: Record<Lane, string> = {
  ready: 'bg-muted text-muted-foreground',
  in_progress: 'bg-action/10 text-action border border-action/20',
  review: 'bg-warning/10 text-warning border border-warning/20',
  blocked: 'bg-error/10 text-error border border-error/20',
  done: 'bg-success/10 text-success border border-success/20',
}

// ---------------------------------------------------------------------------
// Pricing Constants
// ---------------------------------------------------------------------------

/** Sales tax rate (10%) */
export const TAX_RATE = 0.1

/** Contract customer discount rate (7%) */
export const CONTRACT_DISCOUNT_RATE = 0.07

// ---------------------------------------------------------------------------
// Jobs & Production — Risk Indicators
// ---------------------------------------------------------------------------

export const RISK_LABELS: Record<RiskLevel, string> = {
  on_track: 'On Track',
  getting_tight: 'Getting Tight',
  at_risk: 'At Risk',
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  on_track: '',
  getting_tight: 'text-warning',
  at_risk: 'text-error',
}

// ---------------------------------------------------------------------------
// Jobs & Production — Service Type Visual Encoding
// ---------------------------------------------------------------------------

export const SERVICE_TYPE_BORDER_COLORS: Record<ServiceType, string> = {
  'screen-print': 'border-action',
  dtf: 'border-warning',
  embroidery: 'border-lime',
}

export const SERVICE_TYPE_LEFT_BORDER_COLORS: Record<ServiceType, string> = {
  'screen-print': 'border-l-action',
  dtf: 'border-l-warning',
  embroidery: 'border-l-lime',
}

// ---------------------------------------------------------------------------
// Card Type — Visual Encoding (neobrutalist accent: left border)
// ---------------------------------------------------------------------------
// Canonical entity labels, colors, and border colors in ENTITY_STYLES.
// Icons (LucideIcon) are a UI concern — import ENTITY_ICONS from
// @shared/constants/entity-icons for rendering.
// CARD_TYPE_BORDER_COLORS kept as a convenience alias for board cards.

export { ENTITY_STYLES } from '@domain/constants/entities'

// Derived from ENTITY_STYLES to prevent drift
import { ENTITY_STYLES as _ENTITY_STYLES } from '@domain/constants/entities'
export const CARD_TYPE_BORDER_COLORS = {
  job: _ENTITY_STYLES.job.borderColor,
  quote: _ENTITY_STYLES.quote.borderColor,
  scratch_note: _ENTITY_STYLES.scratch_note.borderColor,
} as const

// ---------------------------------------------------------------------------
// Jobs & Production — Canonical Task Templates
// ---------------------------------------------------------------------------

export const CANONICAL_TASKS: Record<ServiceType, Array<{ label: string; detail?: string }>> = {
  'screen-print': [
    { label: 'Art files finalized' },
    { label: 'Film positives printed' },
    { label: 'Screens burned' },
    { label: 'Screens registered on press' },
    { label: 'Blanks received and counted' },
    { label: 'Press run complete' },
    { label: 'QC inspection passed' },
    { label: 'Packed and labeled' },
  ],
  dtf: [
    { label: 'Art files finalized' },
    { label: 'Gang sheet prepared' },
    { label: 'DTF printed' },
    { label: 'Transfers pressed' },
    { label: 'QC inspection passed' },
    { label: 'Packed and labeled' },
  ],
  embroidery: [
    { label: 'Art files finalized' },
    { label: 'Design digitized', detail: 'Stitch file created' },
    { label: 'Digitizer machine set up' },
    { label: 'Blanks received and counted' },
    { label: 'Embroidery run complete' },
    { label: 'QC inspection passed' },
    { label: 'Packed and labeled' },
  ],
}
