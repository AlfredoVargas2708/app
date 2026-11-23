<template>
  <div class="flex flex-column align-items-center w-full">
    <div
      v-if="partsLoading"
      class="flex flex-column gap-3 w-full"
      aria-label="Cargando minifiguras"
      aria-busy="true"
    >
      <Skeleton v-for="value in 4" :key="value" height="4rem" />
    </div>
    <Table
      :value="data"
      :paginator="true"
      table-class="pieces-table"
      :first="first"
      :rows="rows"
      :total="total"
      @page="changePartsPage"
      v-else
    />
  </div>
  <Toast />
</template>

<script setup lang="ts">
import type { Element } from "@/interfaces/element.interface";
import type { DynamicDialogInstance } from "primevue/dynamicdialogoptions";
import { computed, inject, ref, type Ref } from "vue";
import Table from "../Table.vue";
import type { DataTablePageEvent } from "primevue/datatable";
import { useMinifigStore } from "@/stores/minifig.store";
import { storeToRefs } from "pinia";
import Skeleton from "primevue/skeleton";
import type Toast from "primevue/toast";

const dialogRef = inject<Ref<DynamicDialogInstance>>("dialogRef");
const data = ref<Element[]>(dialogRef?.value.data.parts ?? []);
const setNum = computed<string>(() => dialogRef?.value.data.set_num);
const minifigsStore = useMinifigStore();
const { partsLoading } = storeToRefs(minifigsStore);

const first = ref<number>(0);
const rows = ref<number>(5);
const total = computed<number>(() => dialogRef?.value.data.total);

async function changePartsPage(event: DataTablePageEvent) {
  first.value = event.first;
  rows.value = event.rows;

  data.value =
    (await useMinifigStore().getMinifigParts(
      setNum.value,
      event.first / event.rows + 1,
      rows.value,
    )) ?? [];
}
</script>

<style scoped></style>
