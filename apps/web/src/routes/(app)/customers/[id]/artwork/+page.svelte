<script lang="ts">
  import { Card, CardContent } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import Image from "@lucide/svelte/icons/image";

  // Placeholder data — replaced by real API data in a later milestone
  const mockArtwork = [
    {
      id: "a1",
      name: "Company Logo - Full Color",
      type: "Vector (AI)",
      uploadedAt: "2026-02-15",
      dimensions: '4" x 3"',
    },
    {
      id: "a2",
      name: "Event T-Shirt Design 2026",
      type: "Raster (PSD)",
      uploadedAt: "2026-03-01",
      dimensions: '12" x 14"',
    },
    {
      id: "a3",
      name: "Left Chest Logo",
      type: "Vector (SVG)",
      uploadedAt: "2026-01-20",
      dimensions: '3.5" x 3.5"',
    },
    {
      id: "a4",
      name: "Back Print - Team Roster",
      type: "Raster (PNG)",
      uploadedAt: "2026-03-10",
      dimensions: '10" x 14"',
    },
  ];
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4">
  {#each mockArtwork as art (art.id)}
    <Card class="overflow-hidden">
      <div class="flex h-32 items-center justify-center bg-muted">
        <Image class="h-10 w-10 text-muted-foreground" />
      </div>
      <CardContent class="p-3 space-y-1">
        <p class="text-sm font-medium truncate">{art.name}</p>
        <div class="flex items-center justify-between">
          <Badge variant="outline" class="text-xs">{art.type}</Badge>
          <span class="text-xs text-muted-foreground">{art.dimensions}</span>
        </div>
        <p class="text-xs text-muted-foreground">
          Uploaded {new Date(art.uploadedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  {/each}
</div>
