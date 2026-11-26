<template>
  <div
    class="flex flex-column justify-content-center w-full gap-2 px-2 md:px-4 py-3 md:py-5"
  >
    <div class="back-box" @click="goBack">
      <ArrowLeft :size="24" />
      <span class="text-xl">Volver</span>
    </div>
    <div class="flex flex-column justify-content-start w-full gap-3">
      <h2 class="page-title">Inventario Pedidos</h2>
      <div
        v-if="inventarioLoading && !loaded"
        class="flex flex-column gap-3 w-full"
        aria-label="Cargando inventario"
        aria-busy="true"
      >
        <Skeleton v-for="value in 4" :key="value" height="4rem" />
      </div>
      <div
        class="flex flex-column align-items-start gap-3 w-full"
        v-else-if="inventario"
      >
        <InventarioTable
          :items="inventario"
          :loading="inventarioLoading"
          :first="inventarioFisrt"
          :rows="inventarioRows"
          :total="inventarioTotal"
          @sort="getOperations"
          @filter="filterOperations"
          @update-status="onStatusChange($event)"
          @edit="onEditCell"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDatabaseStore } from "@/stores/database.store";
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";
import ArrowLeft from "@primeicons/vue/arrow-left";
import { useRouter } from "vue-router";
import Skeleton from "primevue/skeleton";
import InventarioTable from "@/components/InventarioTable.vue";
import type { Operation } from "@/interfaces/database.interface";
import { useElementStore } from "@/stores/element.store";
import { useToast } from "primevue/usetoast";
import { elementPick } from "@/helpers/element.helper";
import type { Element } from "@/interfaces/element.interface";

const databaseStore = useDatabaseStore();
const elementStore = useElementStore();
const {
  inventario,
  inventarioLoading,
  inventarioFisrt,
  inventarioRows,
  inventarioTotal,
} = storeToRefs(databaseStore);
const { element } = storeToRefs(elementStore);
const router = useRouter();
const toast = useToast();

const ELEMENT_KEYS = [
  "element_id",
  "part_num",
  "color_id",
  "element_name",
  "element_img_url",
  "color_name",
  "color_rgb",
  "part_url",
  "part_cat_id",
  "part_cat_name",
] as const satisfies readonly (keyof Element & keyof Operation)[];

function goBack() {
  router.back();
}

async function getOperations() {
  await databaseStore.getOperations();
}

async function filterOperations() {
  await getOperations();
}

async function onStatusChange(status: {
  id: number;
  value: boolean;
  field: string;
}) {
  if (!status.id || !status.field) return;

  await databaseStore.editStatus(status.id, {
    field: status.field,
    value: status.value,
  });
}

async function onEditCell(item: Operation, field: keyof Operation) {
  switch (field) {
    case "element_id": {
      const elementProps = elementPick(item, ELEMENT_KEYS);
      await elementStore.getElement(elementProps.element_id);

      if (!element.value) {
        toast.add({
          severity: "warn",
          summary: "Elemento no encontrado",
          life: 3000,
        });
        return;
      }

      await elementStore.createElement(element.value);

      // Solo las propiedades que pertenecen al elemento
      const updated: Operation = {
        ...item,
        element_name: element.value.element_name,
        element_img_url: element.value.element_img_url,
        part_num: element.value.part_num,
        color_id: element.value.color_id,
        color_name: element.value.color_name,
        color_rgb: element.value.color_rgb,
        part_cat_id: element.value.part_cat_id,
        part_cat_name: element.value.part_cat_name,
      };

      // Al backend solo el campo que cambió
      await databaseStore.editOperation(updated, field);
      await databaseStore.getOperations();
      break;
    }

    default:
      break;
  }
}

// Tras la primera carga la tabla permanece montada para conservar los filtros
const loaded = ref(false);

onMounted(async () => {
  await getOperations();
  loaded.value = true;
});
</script>

<style scoped>
.back-box {
  display: flex;
  align-items: center;
  cursor: pointer;
  max-width: 100px;
  gap: 15px;

  &:hover {
    text-decoration: underline;
  }
}
</style>
