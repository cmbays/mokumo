<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import Mail from "@lucide/svelte/icons/mail";
  import Phone from "@lucide/svelte/icons/phone";

  // Placeholder data — replaced by real API data in a later milestone
  const mockContacts = [
    {
      id: "c1",
      name: "Sarah Johnson",
      role: "Owner",
      email: "sarah@acmeprinting.com",
      phone: "(555) 123-4567",
      isPrimary: true,
    },
    {
      id: "c2",
      name: "Mike Rodriguez",
      role: "Production Manager",
      email: "mike@acmeprinting.com",
      phone: "(555) 234-5678",
      isPrimary: false,
    },
    {
      id: "c3",
      name: "Emily Chen",
      role: "Accounts Payable",
      email: "ap@acmeprinting.com",
      phone: "(555) 345-6789",
      isPrimary: false,
    },
  ];
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
  {#each mockContacts as contact (contact.id)}
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-base">{contact.name}</CardTitle>
          <div class="flex items-center gap-2">
            {#if contact.isPrimary}
              <Badge>Primary</Badge>
            {/if}
            <Badge variant="outline">{contact.role}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-2">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail class="h-4 w-4" />
          <span>{contact.email}</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone class="h-4 w-4" />
          <span>{contact.phone}</span>
        </div>
      </CardContent>
    </Card>
  {/each}
</div>
