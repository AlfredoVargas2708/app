<script setup lang="ts">
import { RouterView } from "vue-router";
import DynamicDialog from "primevue/dynamicdialog";
import Toast from "primevue/toast";
</script>

<template>
  <RouterView> </RouterView>
  <DynamicDialog />
  <Toast />
</template>

<style scoped></style>
