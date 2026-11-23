<template>
  <div class="flex flex-column align-items-center gap-2 w-full">
    <div class="flex flex-row align-items-start gap-3 w-full">
      <InputGroup class="w-full md:w-20rem">
        <InputText
          placeholder="Ingresar Código Set..."
          size="large"
          v-model="searchValue"
          @input="onSearch"
        />
        <InputGroupAddon v-if="setLoading">
          <Spinner spin :size="26" />
        </InputGroupAddon>
      </InputGroup>
    </div>
    <div class="flex flex-column align-items-center w-full">
      <template v-if="setData && !setLoading">
        <Table :value="[setData]" table-class="set-table" :paginator="false" />
      </template>
      <Divider class="section-divider mb-0 mt-5" />
      <div class="extra-container w-full">
        <div class="flex flex-column align-items-start w-full gap-2">
          <template v-if="setData && !setLoading">
            <h2 class="underline section-title">Minifiguras En Set</h2>
            <div
              v-if="setMinifigsLoading"
              class="flex flex-column gap-3 w-full"
              aria-label="Cargando minifiguras"
              aria-busy="true"
            >
              <Skeleton v-for="value in 4" :key="value" height="4rem" />
            </div>
            <div
              class="flex flex-column align-items-start gap-3 w-full"
              v-else-if="setMinifigs"
            >
              <Table
                :value="setMinifigs"
                :paginator="true"
                :total="setMinifigsTotal"
                :first="setMinifigsFirst"
                :rows="setMinifigsRows"
                table-class="minifigs-table"
                @minifig_parts="openMinifigParts($event)"
                @page="onSetMinifigsPage($event)"
              />
            </div>
          </template>
        </div>
        <Divider layout="vertical" class="section-divider divider-vertical" />
        <Divider class="divider-horizontal" />
        <div class="flex flex-column align-items-start w-full gap-2">
          <template v-if="setData && !setLoading">
            <h2 class="underline section-title">Piezas En Set</h2>
            <div
              v-if="setPartsLoading"
              class="flex flex-column gap-3 w-full"
              aria-label="Cargando piezas"
              aria-busy="true"
            >
              <Skeleton v-for="value in 4" :key="value" height="4rem" />
            </div>
            <div
              class="flex flex-column align-items-start gap-3 w-full"
              v-else-if="setParts"
            >
              <div
                class="inputs-container flex xl:flex-row sm:flex-column align-items-stretch sm:align-items-start gap-3 w-full"
              >
                <InputText
                  placeholder="Buscar Código Pieza..."
                  size="large"
                  class="w-full sm:w-full"
                  v-model="elementIdSearch"
                  @input="onSearchByElement"
                />
                <Select
                  v-model="colorSelected"
                  placeholder="Buscar Color..."
                  :options="setColors ?? []"
                  show-clear
                  size="large"
                  @change="searchColor"
                  class="w-full sm:w-full"
                >
                  <template #value="slotProps">
                    <div
                      v-if="slotProps.value"
                      class="flex align-items-center gap-2"
                    >
                      <div
                        class="color-box"
                        :style="{
                          'background-color': `#${slotProps.value.rgb}`,
                        }"
                      ></div>
                      <div>{{ slotProps.value.name }}</div>
                    </div>
                    <span v-else>{{ slotProps.placeholder }}</span>
                  </template>
                  <template #option="slotProps">
                    <div class="flex align-items-center gap-2">
                      <div
                        class="color-box"
                        :style="{
                          'background-color': `#${slotProps.option.rgb}`,
                        }"
                      ></div>
                      <div>{{ slotProps.option.name }}</div>
                    </div>
                  </template>
                </Select>
                <Select
                  placeholder="Buscar Categoría Pieza"
                  size="large"
                  :options="partCategories ?? []"
                  option-label="name"
                  option-value="id"
                  show-clear
                  @change="searchPartCategory"
                  v-model="partCatIdSelected"
                  class="w-full sm:w-full"
                />
              </div>
              <Table
                :value="setParts"
                :paginator="true"
                :total="setPartsTotal"
                :first="setPartsFirst"
                :rows="setPartsRows"
                table-class="pieces-table"
                @page="onSetPartsPage"
                @add_element="openAddModal"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSetsStore } from "@/stores/sets.store";
import { useDebounceFn } from "@vueuse/core";
import { storeToRefs } from "pinia";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import InputText from "primevue/inputtext";
import { ref, watch } from "vue";
import Spinner from "@primeicons/vue/spinner";
import Table from "../Table.vue";
import Divider from "primevue/divider";
import Skeleton from "primevue/skeleton";
import type { DataTablePageEvent } from "primevue/datatable";
import type { Element } from "@/interfaces/element.interface";
import { useDialog } from "primevue/usedialog";
import MinifigPartsComponente from "./MinifigParts.componente.vue";
import Select from "primevue/select";
import { type ColorSet } from "@/interfaces/color.interface";
import { useElementStore } from "@/stores/element.store";
import AgregarModal from "../AgregarModal.vue";
import type { DynamicDialogCloseOptions } from "primevue/dynamicdialogoptions";
import { useDatabaseStore } from "@/stores/database.store";

const props = defineProps<{
  tabValue: string;
}>();

const setStore = useSetsStore();
const {
  setData,
  setLoading,
  setMinifigs,
  setMinifigsLoading,
  setMinifigsRows,
  setMinifigsFirst,
  setMinifigsTotal,
  setParts,
  setPartsFirst,
  setPartsLoading,
  setPartsRows,
  setPartsTotal,
  setColors,
} = storeToRefs(setStore);
const elementStore = useElementStore();
const { partCategories } = storeToRefs(elementStore);
const databaseStore = useDatabaseStore();

const searchValue = ref<string | null>(null);
const dialog = useDialog();
const colorSelected = ref<ColorSet | null>(null);
const partCatIdSelected = ref<number | null>(null);
const elementIdSearch = ref<string | null>(null);

const onSearch = useDebounceFn(async () => {
  if (!searchValue.value) {
    setData.value = null;
    return;
  }

  await setStore.getSet(searchValue.value, false);

  await Promise.all([
    setStore.getMinifigsSet(searchValue.value),
    setStore.getPartsSet(
      searchValue.value,
      undefined,
      undefined,
      null,
      null,
      null,
    ),
    setStore.getColorsSet(searchValue.value),
    elementStore.getPartCategories(),
  ]);
}, 800);

const onSearchByElement = useDebounceFn(async () => {
  if (!elementIdSearch.value && setData.value) {
    setStore.getPartsSet(
      setData.value.set_num,
      1,
      setPartsRows.value,
      colorSelected.value?.id ?? null,
      partCatIdSelected.value,
      null,
    );
    return;
  }

  if (!setData.value) return;

  const elementId = elementIdSearch.value;
  const colorId = colorSelected.value?.id ?? null;
  const partCategorySelected = partCatIdSelected.value;
  const setNum = setData.value.set_num;
  setPartsFirst.value = 0;

  setTimeout(() => {
    setStore.getPartsSet(
      setNum,
      1,
      setPartsRows.value,
      colorId,
      partCategorySelected,
      elementId,
    );
  }, 600);
}, 800);

async function onSetPartsPage(event: DataTablePageEvent) {
  const currentElement = setData.value;
  if (!currentElement) return;

  setPartsFirst.value = event.first;
  setPartsRows.value = event.rows;
  await setStore.getPartsSet(
    currentElement.set_num,
    event.page + 1,
    event.rows,
    colorSelected.value?.id ?? null,
    partCatIdSelected.value ?? null,
    elementIdSearch.value,
  );
}

async function onSetMinifigsPage(event: DataTablePageEvent) {
  const currentElement = setData.value;
  if (!currentElement) return;

  setMinifigsFirst.value = event.first;
  setMinifigsRows.value = event.rows;
  await setStore.getMinifigsSet(
    currentElement.set_num,
    event.page + 1,
    event.rows,
  );
}

function openMinifigParts(event: {
  parts: Element[];
  total: number;
  set_num: string;
}) {
  dialog.open(MinifigPartsComponente, {
    props: {
      header: "Piezas Minifigura",
      style: {
        width: "80vw",
      },
      breakpoints: {
        "960px": "75vw",
        "640px": "90vw",
      },
      modal: true,
    },
    data: { parts: event.parts, total: event.total, set_num: event.set_num },
  });
}

async function searchColor() {
  if (!colorSelected.value && setData.value) {
    setStore.getPartsSet(
      setData.value.set_num,
      1,
      setPartsRows.value,
      null,
      partCatIdSelected.value,
      elementIdSearch.value,
    );
    return;
  }

  if (!setData.value) return;

  const colorId = colorSelected.value?.id ?? null;
  const partCategorySelected = partCatIdSelected.value;
  const setNum = setData.value.set_num;
  const elementId = elementIdSearch.value;
  setPartsFirst.value = 0;

  setTimeout(() => {
    setStore.getPartsSet(
      setNum,
      1,
      setPartsRows.value,
      colorId,
      partCategorySelected,
      elementId,
    );
  }, 600);
}

async function searchPartCategory() {
  if (!partCatIdSelected.value && setData.value) {
    setStore.getPartsSet(
      setData.value.set_num,
      1,
      setPartsRows.value,
      colorSelected.value?.id ?? null,
      null,
      elementIdSearch.value,
    );
    return;
  }

  if (!setData.value) return;

  const colorId = colorSelected.value?.id;
  const partCatId = partCatIdSelected.value ?? undefined;
  const setNum = setData.value.set_num;
  setPartsFirst.value = 0;

  setTimeout(() => {
    setStore.getPartsSet(
      setNum,
      1,
      setPartsRows.value,
      colorId ?? null,
      partCatId ?? null,
      elementIdSearch.value,
    );
  }, 600);
}

function openAddModal(data: unknown) {
  let dialogData: any = {};
  if (data && typeof data === "object" && "element_id" in data) {
    dialogData["extra"] = setData.value;
    dialogData["data"] = data;
    dialogData["set_editable"] = false;
  } else {
    dialogData["data"] = data;
    dialogData["set_editable"] = true;
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
    onClose: async (data: DynamicDialogCloseOptions) => {
      if (data.data) {
        console.log("Creando pedido...");

        await databaseStore.createOperation(data.data);
      }
    },
  });
}

watch(
  () => props.tabValue,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      setData.value = null;
      searchValue.value = null;
      setMinifigs.value = null;
      setParts.value = null;
    }
  },
);
</script>

<style scoped>
.extra-container {
  display: grid;
  /* minmax(0, ...) evita que las tablas anchas desborden la grilla */
  grid-template-columns: minmax(0, 1.5fr) 40px minmax(0, 2fr);
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

.select-input {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid gray;
  padding: 5px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.color-box {
  width: 20px;
  height: 20px;
  border: 1px solid #000000;
  border-radius: 6px;
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

  .inputs-container {
    flex-direction: column;
  }
}
</style>
