<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import ArrowDownLeft from "@lucide/svelte/icons/arrow-down-left";
  import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";

  // Placeholder data — replaced by real API data in a later milestone
  const mockMessages = [
    {
      id: "m1",
      direction: "outbound" as const,
      channel: "Email",
      subject: "Quote #1042 - Spring Collection",
      preview:
        "Hi Sarah, please find attached the quote for your spring collection order...",
      timestamp: "2026-03-25T14:30:00Z",
    },
    {
      id: "m2",
      direction: "inbound" as const,
      channel: "Email",
      subject: "Re: Quote #1042 - Spring Collection",
      preview: "Looks good! Can we adjust the qty on the polo shirts to 150?",
      timestamp: "2026-03-25T16:45:00Z",
    },
    {
      id: "m3",
      direction: "outbound" as const,
      channel: "Email",
      subject: "Invoice #2089",
      preview: "Please find attached your invoice for the completed order...",
      timestamp: "2026-03-20T09:00:00Z",
    },
    {
      id: "m4",
      direction: "inbound" as const,
      channel: "Portal",
      subject: "Artwork uploaded",
      preview: "Customer uploaded new artwork file: event-tshirt-2026-v2.ai",
      timestamp: "2026-03-18T11:20:00Z",
    },
  ];
</script>

<div class="space-y-3 pt-4">
  {#each mockMessages as message (message.id)}
    <div class="flex items-start gap-3 rounded-lg border p-4">
      <div class="mt-0.5">
        {#if message.direction === "inbound"}
          <ArrowDownLeft class="h-4 w-4 text-blue-500" />
        {:else}
          <ArrowUpRight class="h-4 w-4 text-green-500" />
        {/if}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium truncate">{message.subject}</p>
          <Badge variant="outline" class="text-xs shrink-0"
            >{message.channel}</Badge
          >
        </div>
        <p class="text-sm text-muted-foreground mt-0.5 truncate">
          {message.preview}
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  {/each}
</div>
