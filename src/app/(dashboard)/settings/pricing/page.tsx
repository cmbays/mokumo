'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@shared/lib/cn'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import { PricingTemplateCard } from '@features/pricing/components/PricingTemplateCard'
import { Tabs, TabsList, TabsTrigger } from '@shared/ui/primitives/tabs'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import { Badge } from '@shared/ui/primitives/badge'
import { Plus, Tag, Search } from 'lucide-react'
import { SERVICE_TYPE_ICONS } from '@shared/ui/organisms/ServiceTypeBadge'
import { SERVICE_TYPE_COLORS } from '@domain/constants'
import { SetupWizard } from './_components/SetupWizard'
import { TagTemplateMapper } from './_components/TagTemplateMapper'
import { CatalogPricingOverrides } from './_components/CatalogPricingOverrides'
import {
  allScreenPrintTemplates,
  allDTFTemplates,
  tagTemplateMappings,
} from '@infra/repositories/pricing'
import type { TagTemplateMapping } from '@domain/entities/tag-template-mapping'
import { getCustomersMutable } from '@infra/repositories/customers-mutable'
import {
  calculateTemplateHealth,
  calculateDTFTemplateHealth,
} from '@domain/services/pricing.service'
import type { PricingTemplate } from '@domain/entities/price-matrix'
import type { DTFPricingTemplate } from '@domain/entities/dtf-pricing'
import type { MarginIndicator } from '@domain/entities/price-matrix'

// Phase 1 mock — getCustomersMutable() returns static in-memory data that does not change
// at runtime, so module-scope initialization is safe here. Replace with a hook in Wave 2C
// when customer data is server-driven.
const customers = getCustomersMutable()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ServiceTypeTab = 'screen-print' | 'dtf' | 'catalog'

function countCustomersUsingTemplate(
  templateId: string,
  serviceType: ServiceTypeTab,
  currentMappings: TagTemplateMapping[]
): number {
  // Count customers whose type tags map to this template
  const mappedTags = currentMappings
    .filter((m) =>
      serviceType === 'screen-print'
        ? m.screenPrintTemplateId === templateId
        : m.dtfTemplateId === templateId
    )
    .map((m) => m.customerTypeTag)

  return customers.filter((c) => c.typeTags.some((tag) => mappedTags.includes(tag))).length
}

// Default garment base cost for margin calculations (avg t-shirt cost)
const DEFAULT_GARMENT_COST = 3.5

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PricingHubPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ServiceTypeTab>('screen-print')
  const [searchQuery, setSearchQuery] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [tagMapperOpen, setTagMapperOpen] = useState(false)
  const [mappings, setMappings] = useState<TagTemplateMapping[]>(tagTemplateMappings)

  // Mutable template state (for Phase 1 client-side operations)
  const [spTemplates, setSpTemplates] = useState<PricingTemplate[]>(allScreenPrintTemplates)
  const [dtfTemplates, setDtfTemplates] = useState<DTFPricingTemplate[]>(allDTFTemplates)

  // Filter templates by search
  const filteredSPTemplates = useMemo(
    () => spTemplates.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [spTemplates, searchQuery]
  )

  const filteredDTFTemplates = useMemo(
    () => dtfTemplates.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [dtfTemplates, searchQuery]
  )

  // Template actions
  const handleEditSP = (id: string) => {
    router.push(`/settings/pricing/screen-print/${id}`)
  }

  const handleEditDTF = (id: string) => {
    router.push(`/settings/pricing/dtf/${id}`)
  }

  const handleDuplicateSP = (template: PricingTemplate) => {
    const newId = crypto.randomUUID()
    const duplicate: PricingTemplate = {
      ...template,
      id: newId,
      name: `${template.name} (Copy)`,
      isDefault: false,
      isIndustryDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setSpTemplates((prev) => [...prev, duplicate])
  }

  const handleDuplicateDTF = (template: DTFPricingTemplate) => {
    const newId = crypto.randomUUID()
    const duplicate: DTFPricingTemplate = {
      ...template,
      id: newId,
      name: `${template.name} (Copy)`,
      isDefault: false,
      isIndustryDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setDtfTemplates((prev) => [...prev, duplicate])
  }

  const handleDeleteSP = (id: string) => {
    setSpTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const handleDeleteDTF = (id: string) => {
    setDtfTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const handleSetDefaultSP = (id: string) => {
    setSpTemplates((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })))
  }

  const handleSetDefaultDTF = (id: string) => {
    setDtfTemplates((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })))
  }

  const handleWizardSave = (template: PricingTemplate | DTFPricingTemplate) => {
    // SetupWizard discriminates the union via serviceType before calling onSave,
    // so the cast is safe. TODO(Wave2C): align PricingTemplate | DTFPricingTemplate
    // into a single discriminated union to enable proper type narrowing here.
    if (template.serviceType === 'screen-print') {
      setSpTemplates((prev) => [...prev, template as PricingTemplate])
    } else {
      setDtfTemplates((prev) => [...prev, template as DTFPricingTemplate])
    }
  }

  // Health indicators (memoized)
  const spHealthMap = useMemo(() => {
    const map = new Map<string, MarginIndicator>()
    spTemplates.forEach((t) => {
      map.set(t.id, calculateTemplateHealth(t, DEFAULT_GARMENT_COST))
    })
    return map
  }, [spTemplates])

  const dtfHealthMap = useMemo(() => {
    const map = new Map<string, MarginIndicator>()
    dtfTemplates.forEach((t) => {
      map.set(t.id, calculateDTFTemplateHealth(t))
    })
    return map
  }, [dtfTemplates])

  // Customer counts per template (memoized)
  const spCustomerCountMap = useMemo(() => {
    const map = new Map<string, number>()
    spTemplates.forEach((t) => {
      map.set(t.id, countCustomersUsingTemplate(t.id, 'screen-print', mappings))
    })
    return map
  }, [spTemplates, mappings])

  const dtfCustomerCountMap = useMemo(() => {
    const map = new Map<string, number>()
    dtfTemplates.forEach((t) => {
      map.set(t.id, countCustomersUsingTemplate(t.id, 'dtf', mappings))
    })
    return map
  }, [dtfTemplates, mappings])

  // Total template count per tab
  const spCount = spTemplates.length
  const dtfCount = dtfTemplates.length

  // Canonical service type icons
  const SPIcon = SERVICE_TYPE_ICONS['screen-print']
  const DTFIcon = SERVICE_TYPE_ICONS['dtf']

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.settings, { label: 'Pricing' })} />

      <div className="flex flex-col gap-6 p-6">
        {/* Page header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Pricing Templates</h1>
            <p className="hidden text-sm text-muted-foreground md:block">
              Configure pricing matrices for screen print and DTF services
            </p>
          </div>
          {activeTab !== 'catalog' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 md:flex-initial"
                onClick={() => setTagMapperOpen(true)}
              >
                <Tag className="size-4" />
                <span className="hidden md:inline">Manage Mappings</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setWizardOpen(true)}
                className="flex-1 md:flex-initial bg-action text-black font-semibold border-2 border-current shadow-brutal shadow-action hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-brutal-sm transition-all"
              >
                <Plus className="size-4" />
                New Template
              </Button>
            </div>
          )}
        </div>

        {/* Tabs + Search row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ServiceTypeTab)}>
            <TabsList>
              <TabsTrigger value="screen-print" className="gap-1.5">
                <SPIcon
                  className={cn(
                    'size-3.5',
                    activeTab === 'screen-print' && SERVICE_TYPE_COLORS['screen-print']
                  )}
                />
                Screen Print
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                  {spCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="dtf" className="gap-1.5">
                <DTFIcon
                  className={cn('size-3.5', activeTab === 'dtf' && SERVICE_TYPE_COLORS['dtf'])}
                />
                DTF
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                  {dtfCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="catalog">Catalog</TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab !== 'catalog' && (
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          )}
        </div>

        {/* Template grid */}
        {activeTab === 'screen-print' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSPTemplates.map((template) => (
              <PricingTemplateCard
                key={template.id}
                template={{
                  id: template.id,
                  name: template.name,
                  // TODO(Wave2C): replace with real entity — old mock uses 'screen-print'
                  serviceType: 'screen_print' as const,
                  isDefault: template.isDefault,
                  updatedAt: new Date(template.updatedAt ?? 0),
                }}
                healthIndicator={spHealthMap.get(template.id) ?? 'caution'}
                customersUsing={spCustomerCountMap.get(template.id) ?? 0}
                onEdit={() => handleEditSP(template.id)}
                onDuplicate={() => handleDuplicateSP(template)}
                onDelete={() => handleDeleteSP(template.id)}
                onSetDefault={() => handleSetDefaultSP(template.id)}
              />
            ))}
            {filteredSPTemplates.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
                <SPIcon className="size-12 text-action/30" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No templates match your search' : 'No screen print templates yet'}
                </p>
                {!searchQuery && (
                  <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
                    <Plus className="size-4" />
                    Create Template
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dtf' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDTFTemplates.map((template) => (
              <PricingTemplateCard
                key={template.id}
                template={{
                  id: template.id,
                  name: template.name,
                  // TODO(Wave2C): replace with real entity
                  serviceType: 'dtf' as const,
                  isDefault: template.isDefault,
                  updatedAt: new Date(template.updatedAt ?? 0),
                }}
                healthIndicator={dtfHealthMap.get(template.id) ?? 'caution'}
                customersUsing={dtfCustomerCountMap.get(template.id) ?? 0}
                onEdit={() => handleEditDTF(template.id)}
                onDuplicate={() => handleDuplicateDTF(template)}
                onDelete={() => handleDeleteDTF(template.id)}
                onSetDefault={() => handleSetDefaultDTF(template.id)}
              />
            ))}
            {filteredDTFTemplates.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
                <DTFIcon className="size-12 text-brown/30" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No templates match your search' : 'No DTF templates yet'}
                </p>
                {!searchQuery && (
                  <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
                    <Plus className="size-4" />
                    Create Template
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'catalog' && <CatalogPricingOverrides />}

      <SetupWizard open={wizardOpen} onOpenChange={setWizardOpen} onSave={handleWizardSave} />

      <TagTemplateMapper
        open={tagMapperOpen}
        onOpenChange={setTagMapperOpen}
        spTemplates={spTemplates}
        dtfTemplates={dtfTemplates}
        mappings={mappings}
        onSave={setMappings}
      />
    </>
  )
}
