<script setup lang="ts">
defineProps<{ caption: string }>()
</script>
<template>
  <div class="text-center text-sm text-gray-400 border border-dashed border-gray-600 rounded p-4 my-2">
    Screenshot pending: {{ caption }}
  </div>
</template>
