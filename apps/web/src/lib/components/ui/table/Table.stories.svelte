<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TableCaption,
  } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/Table",
    component: Table,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Table>
    <TableCaption>A list of recent orders.</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead class="w-[100px]">Order</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Method</TableHead>
        <TableHead class="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell class="font-medium">ORD001</TableCell>
        <TableCell>Paid</TableCell>
        <TableCell>Credit Card</TableCell>
        <TableCell class="text-right">$250.00</TableCell>
      </TableRow>
      <TableRow>
        <TableCell class="font-medium">ORD002</TableCell>
        <TableCell>Pending</TableCell>
        <TableCell>PayPal</TableCell>
        <TableCell class="text-right">$150.00</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</Story>
