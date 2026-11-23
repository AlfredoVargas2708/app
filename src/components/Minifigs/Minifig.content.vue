<template>
  <div class="flex flex-column align-items-center gap-2 w-full">
    <div class="flex flex-row align-items-start gap-3 w-full">
      <InputGroup class="w-full md:w-20rem">
        <InputText
          placeholder="Ingresar Código Minifigura..."
          size="large"
          v-model="searchValue"
          @input="onSearch"
        />
        <InputGroupAddon v-if="minigifLoading">
          <Spinner spin :size="26" />
        </InputGroupAddon>
      </InputGroup>
    </div>
    <div class="flex flex-column align-items-center w-full">
      <template v-if="minifig && !minigifLoading">
        <Table
          :value="[minifig]"
          table-class="minifigs-table-principal"
          :paginator="false"
        />
      </template>
      <Divider class="section-divider mb-0 mt-5" />
      <div class="extra-container w-full">
        <div class="flex flex-column align-items-start w-full gap-2">
          <template v-if="minifig && !minigifLoading">
            <h2 class="underline section-title">Pieza Minifigura</h2>
            <div
              v-if="partsLoading"
              class="flex flex-column gap-3 w-full"
              aria-label="Cargando colores"
              aria-busy="true"
            >
              <Skeleton v-for="value in 4" :key="value" height="4rem" />
            </div>
            <div
              class="flex flex-column align-items-start gap-3 w-full"
              v-else-if="minifigParts"
            >
              <Table
                :value="minifigParts"
                table-class="pieces-minifigura-table"
                :paginator="true"
                :total="partsTotal"
                :first="partsFirst"
                :rows="partsRows"
                @add_element="openAddModal"
                @page="onSetPartsPage"
              />
            </div>
          </template>
        </div>
        <Divider layout="vertical" class="section-divider divider-vertical" />
        <Divider class="divider-horizontal" />
        <div class="flex flex-column align-items-start w-full gap-2">
          <template v-if="minifig && !minigifLoading">
            <h2 class="underline section-title">Sets Con Minifigura</h2>
            <div
              v-if="setsLoading"
              class="flex flex-column gap-3 w-full"
              aria-label="Cargando sets"
              aria-busy="true"
            >
              <Skeleton v-for="value in 4" :key="value" height="4rem" />
            </div>
            <div
              class="flex flex-column align-items-start gap-3 w-full"
              v-else-if="minifigSets"
            >
              <Table
                :value="minifigSets"
                table-class="sets-table"
                :paginator="true"
                :total="setsTotal"
                :first="setsFirst"
                :rows="setsRows"
                @page="onElementSetsPage"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import InputGroup from "primevue/inputgroup";
import InputText from "primevue/inputtext";
import Spinner from "@primeicons/vue/spinner";
import { ref, watch } from "vue";
import { useMinifigStore } from "@/stores/minifig.store";
import { storeToRefs } from "pinia";
import { useDebounceFn } from "@vueuse/core";
import InputGroupAddon from "primevue/inputgroupaddon";
import Table from "../Table.vue";
import Divider from "primevue/divider";
import Skeleton from "primevue/skeleton";
import AgregarModal from "../AgregarModal.vue";
import type { DynamicDialogCloseOptions } from "primevue/dynamicdialogoptions";
import { useDialog } from "primevue/usedialog";
import type { DataTablePageEvent } from "primevue/datatable";

const minifigStore = useMinifigStore();
const {
  minifig,
  minigifLoading,
  partsLoading,
  partsFirst,
  partsRows,
  partsTotal,
  minifigParts,
  minifigSets,
  setsFirst,
  setsLoading,
  setsRows,
  setsTotal,
} = storeToRefs(minifigStore);
const props = defineProps<{
  tabValue: string;
}>();

const searchValue = ref<string | null>(null);
const dialog = useDialog();

const onSearch = useDebounceFn(async () => {
  if (!searchValue.value) {
    minifig.value = null;
    return;
  }

  await minifigStore.getMinifig(searchValue.value);

  if (!minifig.value) return;

  await Promise.all([
    minifigStore.getMinifigParts(searchValue.value),
    minifigStore.getMinifigSets(searchValue.value),
  ]);
}, 600);

async function onSetPartsPage(event: DataTablePageEvent) {
  const currentElement = minifig.value;
  if (!currentElement) return;

  partsFirst.value = event.first;
  partsRows.value = event.rows;
  await minifigStore.getMinifigParts(
    currentElement.set_num,
    event.page + 1,
    event.rows,
  );
}

async function onElementSetsPage(event: DataTablePageEvent) {
  const currentElement = minifig.value;
  if (!currentElement) return;

  setsFirst.value = event.first;
  setsRows.value = event.rows;
  await minifigStore.getMinifigSets(
    currentElement.set_num,
    event.page + 1,
    event.rows,
  );
}

function openAddModal(data: unknown) {
  let dialogData: any = {};
  if (data && typeof data === "object" && "element_id" in data) {
    dialogData["extra"] = minifig.value;
    dialogData["data"] = data;
    dialogData["set_editable"] = false;
    dialogData["minifigura"] = true;
  }

  dialog.open(AgregarModal, {
    props: {
      header: "Agregar Pedido",
      style: {
        width: "80vw",
        height: "90vh",
      },
      breakpoints: {
        "960px": "75vw",
        "640px": "90vw",
      },
      modal: true,
    },
    data: dialogData,
    onClose: (data: DynamicDialogCloseOptions) => {
      if (data) {
        console.log(data.data);
      }
    },
  });
}

watch(
  () => props.tabValue,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      searchValue.value = null;
      minifig.value = null;
      minifigParts.value = null;
    }
  },
);
</script>

<style scoped>
.extra-container {
  display: grid;
  /* minmax(0, ...) evita que las tablas anchas desborden la grilla */
  grid-template-columns: minmax(0, 1.75fr) 40px minmax(0, 2fr);
  gap: 15px;
  align-items: baseline;
}

.extra-container > div {
  min-width: 0;
}

.section-divider {
  align-self: stretch;
}

.section-divider::before {
  border-inline-start-width: 3px;
}

/* El divisor horizontal solo aparece cuando la grilla pasa a 1 columna */
.divider-horizontal {
  display: none;
}

/* Tablet y móvil: una sola columna */
@media (max-width: 991px) {
  .extra-container {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }

  .divider-vertical {
    display: none;
  }

  .divider-horizontal {
    display: flex;
    margin: 0.5rem 0;
  }
}

@media (max-width: 767px) {
  .section-title {
    font-size: 1.25rem;
  }
}
</style>
