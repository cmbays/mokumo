<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";

  // Placeholder data — replaced by real API data in a later milestone
  const mockPricingTemplates = [
    {
      id: "p1",
      name: "Standard Screen Print",
      method: "Screen Print",
      basePrice: "$8.50/unit",
      discount: "10% volume (100+)",
    },
    {
      id: "p2",
      name: "DTG Premium",
      method: "Direct to Garment",
      basePrice: "$15.00/unit",
      discount: "None",
    },
    {
      id: "p3",
      name: "Embroidery - Left Chest",
      method: "Embroidery",
      basePrice: "$6.00/unit",
      discount: "15% repeat order",
    },
  ];
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
  {#each mockPricingTemplates as template (template.id)}
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-base">{template.name}</CardTitle>
          <Badge variant="outline">{template.method}</Badge>
        </div>
      </CardHeader>
      <CardContent class="space-y-2">
        <div>
          <p class="text-sm font-medium text-muted-foreground">Base Price</p>
          <p class="text-lg font-semibold">{template.basePrice}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-muted-foreground">Discount</p>
          <p class="text-sm">{template.discount}</p>
        </div>
      </CardContent>
    </Card>
  {/each}
</div>
