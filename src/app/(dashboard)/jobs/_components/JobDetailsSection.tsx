import { Package, MapPin, Shirt, CheckCircle2, XCircle, Printer } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Badge } from '@shared/ui/primitives/badge'
import { SERVICE_TYPE_LABELS, BURN_STATUS_LABELS } from '@domain/constants'
import { getGarmentById, getColorById } from '@domain/rules/garment.rules'
import { getScreensByJobId } from '@domain/rules/screen.rules'
import { getGarmentCatalogMutable } from '@infra/repositories/garments-phase1'
import { getColorsMutable } from '@infra/repositories/colors'
import { getScreensMutable } from '@infra/repositories/screens'
import { GarmentMockup } from '@features/quotes/components/mockup'
import type { Job } from '@domain/entities/job'

type JobDetailsSectionProps = {
  job: Job
}

export function JobDetailsSection({ job }: JobDetailsSectionProps) {
  const allScreens = getScreensMutable()
  const allGarments = getGarmentCatalogMutable()
  const allColors = getColorsMutable()
  const jobScreens = getScreensByJobId(job.id, allScreens)

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Production Details
        </h2>
      </div>

      <div className="space-y-4 p-4">
        {/* Quantity + Service Type */}
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {job.quantity.toLocaleString()}
              <span className="ml-2 text-xs text-muted-foreground">
                {SERVICE_TYPE_LABELS[job.serviceType]}
              </span>
            </p>
          </div>
        </div>

        {/* Garment Details */}
        {job.garmentDetails.length > 0 && (
          <div className="flex items-start gap-3">
            <Shirt className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-2">
              {job.garmentDetails.map((gd) => {
                const garment = getGarmentById(gd.garmentId, allGarments)
                const color = getColorById(gd.colorId, allColors)
                return (
                  <div key={`${gd.garmentId}:${gd.colorId}`} className="flex flex-col gap-2">
                    {garment && color && (
                      <GarmentMockup
                        garmentCategory={garment.baseCategory}
                        colorHex={color.hex}
                        size="xs"
                        className="w-full h-auto aspect-[5/6]"
                      />
                    )}
                    <div>
                      <p className="text-sm text-foreground">
                        {garment ? `${garment.brand} ${garment.sku}` : gd.garmentId}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {color ? color.name : gd.colorId}
                        </span>
                        {color && (
                          <span
                            className="ml-1.5 inline-block h-3 w-3 rounded-sm align-middle"
                            style={{ backgroundColor: color.hex }}
                            aria-hidden="true"
                          />
                        )}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {Object.entries(gd.sizes).map(([size, count]) => (
                          <span
                            key={size}
                            className="inline-flex items-center rounded bg-surface px-1.5 py-0.5 text-xs text-muted-foreground"
                          >
                            {size}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Print Locations */}
        {job.printLocations.length > 0 && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-1.5">
              {job.printLocations.map((loc) => (
                <div key={loc.position} className="flex items-center gap-2 text-sm">
                  <span className="text-foreground">{loc.position}</span>
                  <span className="text-xs text-muted-foreground">
                    {loc.colorCount} {loc.colorCount === 1 ? 'color' : 'colors'}
                  </span>
                  {loc.artworkApproved ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="size-3" />
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-warning">
                      <XCircle className="size-3" />
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screens */}
        {jobScreens.length > 0 && (
          <div className="flex items-start gap-3">
            <Printer className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-1.5">
              {jobScreens.map((screen) => (
                <div key={screen.id} className="flex items-center gap-2 text-sm">
                  <span className="text-foreground">{screen.meshCount} mesh</span>
                  <span className="text-xs text-muted-foreground">{screen.emulsionType}</span>
                  <Badge
                    variant="ghost"
                    className={cn(
                      'text-xs',
                      screen.burnStatus === 'burned' &&
                        'bg-success/10 text-success border border-success/20',
                      screen.burnStatus === 'pending' &&
                        'bg-warning/10 text-warning border border-warning/20',
                      screen.burnStatus === 'reclaimed' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {BURN_STATUS_LABELS[screen.burnStatus]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complexity */}
        <div className="flex flex-wrap gap-3 border-t border-border/30 pt-3">
          <DetailChip label="Locations" value={String(job.complexity.locationCount)} />
          {job.complexity.screenCount != null && (
            <DetailChip label="Screens" value={String(job.complexity.screenCount)} />
          )}
          <DetailChip label="Garment Varieties" value={String(job.complexity.garmentVariety)} />
        </div>
      </div>
    </section>
  )
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 text-xs')}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  )
}
