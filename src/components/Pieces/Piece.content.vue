<template>
  <div class="flex flex-column align-items-center gap-2 w-full">
    <div class="flex flex-row align-items-start gap-3 w-full">
      <InputGroup class="w-full md:w-20rem">
        <InputText
          placeholder="Ingresar Código Pieza..."
          size="large"
          v-model="searchValue"
          @input="onSearch"
        />
        <InputGroupAddon v-if="elementLoading">
          <Spinner spin :size="26" />
        </InputGroupAddon>
      </InputGroup>
    </div>
    <div class="flex flex-column align-items-center w-full">
      <template v-if="element && !elementLoading">
        <Table
          :value="[element]"
          table-class="pieces-table"
          :paginator="false"
          @add_element="openAddModal($event)"
        />
      </template>
      <Divider class="section-divider mb-0 mt-5" />
      <div class="extra-container w-full">
        <div class="flex flex-column align-items-start w-full gap-2">
          <template v-if="element && !elementLoading">
            <h2 class="underline section-title">Pieza Otros Colores</h2>
            <div
              v-if="elementColorsLoading"
              class="flex flex-column gap-3 w-full"
              aria-label="Cargando colores"
              aria-busy="true"
            >
              <Skeleton v-for="value in 4" :key="value" height="4rem" />
            </div>
            <div
              class="flex flex-column align-items-start gap-3 w-full"
              v-else-if="elementColors && elementColorsSelect"
            >
              <Select
                v-model="colorSelected"
                placeholder="Buscar Color..."
                :options="elementColorsSelect.slice(0, 10)"
                show-clear
                class="w-full sm:w-full"
                :style="{ 'min-width': '180px' }"
                @change="searchColor()"
                size="large"
              >
                <template #value="slotProps">
                  <div
                    v-if="slotProps.value"
                    class="flex align-items-center gap-2"
                  >
                    <div
                      class="color-box"
                      :style="{
                        'background-color': `#${slotProps.value.color_rgb}`,
                      }"
                    ></div>
                    <div>{{ slotProps.value.color_name }}</div>
                  </div>
                  <span v-else>{{ slotProps.placeholder }}</span>
                </template>
                <template #option="slotProps">
                  <div class="flex align-items-center gap-2">
                    <div
                      class="color-box"
                      :style="{
                        'background-color': `#${slotProps.option.color_rgb}`,
                      }"
                    ></div>
                    <div>{{ slotProps.option.color_name }}</div>
                  </div>
                </template>
                <template #footer>
                  <div class="p-3">
                    <Button
                      fluid
                      severity="info"
                      outlined
                      size="small"
                      @click="openMoreColors()"
                    >
                      Buscar Más Colores
                    </Button>
                  </div>
                </template>
              </Select>
              <Table
                :value="elementColors"
                table-class="colors-table"
                :paginator="true"
                :total="elementColorsTotal"
                :first="elementColorsFirst"
                :rows="elementColorsRows"
                @page="onElementColorsPage"
                @change_element="changeSearchValue($event)"
              />
            </div>
          </template>
        </div>

        <!-- Divisor vertical en escritorio, horizontal en tablet/móvil -->
        <Divider layout="vertical" class="section-divider divider-vertical" />
        <Divider class="divider-horizontal" />

        <div class="flex flex-column align-items-start w-full gap-2">
          <template v-if="element && !elementLoading">
            <h2 class="underline section-title">Sets Con Pieza</h2>
            <div
              v-if="elementSetsLoading"
              class="flex flex-column gap-3 w-full"
              aria-label="Cargando sets"
              aria-busy="true"
            >
              <Skeleton v-for="value in 4" :key="value" height="4rem" />
            </div>
            <div
              class="flex flex-column align-items-start gap-3 w-full"
              v-else-if="elementSets"
            >
              <div
                class="inputs-container flex xl:flex-row sm:flex-column align-items-stretch sm:align-items-start gap-3 w-full"
              >
                <InputGroup class="w-full sm:w-full">
                  <InputText
                    placeholder="Ingresar Código Set..."
                    size="large"
                    v-model="setCodeSearch"
                    @input="
                      changeLoadingState();
                      onSearchSet($event);
                    "
                  />
                  <InputGroupAddon v-if="setSearchLoading">
                    <Spinner spin :size="26" />
                  </InputGroupAddon>
                </InputGroup>
                <div class="w-full sm:w-full">
                  <AutoComplete
                    fluid
                    size="large"
                    placeholder="Buscar Temática Set..."
                    v-model="themeSearch"
                    :suggestions="filteredThemes ?? []"
                    option-label="name"
                    @option-select="searchByTheme"
                    @complete="search($event)"
                    :show-clear="true"
                  />
                </div>
              </div>
              <Table
                :value="elementSets"
                table-class="sets-piece-table"
                :paginator="true"
                :total="elementSetsTotal"
                :first="elementSetsFirst"
                :rows="elementSetsRows"
                @page="onElementSetsPage"
                @add_element="openAddModal($event)"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElementStore } from "@/stores/element.store";
import { storeToRefs } from "pinia";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import InputText from "primevue/inputtext";
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import Spinner from "@primeicons/vue/spinner";
import { useToast } from "primevue/usetoast";
import Table from "../Table.vue";
import Divider from "primevue/divider";
import Skeleton from "primevue/skeleton";
import type { DataTablePageEvent } from "primevue/datatable";
import Select from "primevue/select";
import Button from "primevue/button";
import type { ColorElement } from "@/interfaces/color.interface";
import { useDialog } from "primevue/usedialog";
import ColorsModalComponente from "./ColorsModal.componente.vue";
import type { DynamicDialogCloseOptions } from "primevue/dynamicdialogoptions";
import { useSetsStore } from "@/stores/sets.store";
import type { ThemeInterface } from "@/interfaces/theme.interface";
import AutoComplete, {
  type AutoCompleteCompleteEvent,
} from "primevue/autocomplete";
import type { SetInterface } from "@/interfaces/set.interface";
import type { Element } from "@/interfaces/element.interface";
import AgregarModal from "../AgregarModal.vue";

const props = defineProps<{
  tabValue: string;
}>();

const elementStore = useElementStore();
const {
  elementLoading,
  elementError,
  element,
  elementColorsLoading,
  elementColors,
  elementSets,
  elementSetsLoading,
  elementColorsError,
  elementSetsError,
  elementColorsTotal,
  elementSetsTotal,
  elementColorsFirst,
  elementColorsRows,
  elementSetsFirst,
  elementSetsRows,
  elementColorsSelect,
} = storeToRefs(elementStore);
const setsStore = useSetsStore();
const { themesSet, themesError } = storeToRefs(setsStore);
const filteredThemes = ref<ThemeInterface[] | null>(null);

const searchValue = ref<string | null>(null);
const toast = useToast();
const colorSelected = ref<ColorElement>();
const dialog = useDialog();
const themeSearch = ref<ThemeInterface | null>(null);
const setCodeSearch = ref<string | null>(null);
const setSearchLoading = ref<boolean>(false);

const onSearch = useDebounceFn(async () => {
  if (!searchValue.value) {
    element.value = undefined;
    elementColors.value = null;
    elementSets.value = null;
    return;
  }

  await elementStore.getElement(searchValue.value);

  if (!element.value) return;

  const elementValue = element.value;

  await Promise.all([
    elementStore.getElementColors(elementValue.part_num),
    elementStore.getElementSets(elementValue.part_num, elementValue.color_id),
    setsStore.getThemes(),
  ]);
}, 800);

const search = (event: AutoCompleteCompleteEvent) => {
  if (!event.query.trim().length) {
    filteredThemes.value = [...(themesSet.value ?? [])];
  } else {
    const query = event.query.toLowerCase();
    filteredThemes.value =
      themesSet.value ??
      []
        .filter((item: ThemeInterface) => {
          return item.name.toLowerCase().includes(query);
        })
        .sort((a: ThemeInterface, b: ThemeInterface) => {
          const aStarts = a.name.toLowerCase().startsWith(query);
          const bStarts = b.name.toLowerCase().startsWith(query);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
        });
  }
};

const changeLoadingState = useDebounceFn(() => {
  if (setCodeSearch.value) {
    setSearchLoading.value = true;
  }
}, 400);

const onSearchSet = useDebounceFn(async (query: InputEvent) => {
  try {
    const target = query.target as HTMLInputElement;

    const value = target.value;

    if (!element.value) return;

    const elementValue = element.value;

    await elementStore.getElementSets(
      elementValue.part_num,
      elementValue.color_id,
      elementSetsFirst.value + 1,
      elementSetsRows.value,
      themeSearch.value?.id,
      value,
    );
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error Al Buscar Set",
      detail: "Hubo un error al intentar buscar el set por código",
      life: 4000,
    });
  } finally {
    setSearchLoading.value = false;
  }
}, 800);

function searchByTheme() {
  const themeId = themeSearch.value?.id;

  if (!element.value) return;

  const elementValue = element.value;
  elementSetsFirst.value = 0;

  setTimeout(() => {
    elementStore.getElementSets(
      elementValue.part_num,
      elementValue.color_id,
      1,
      elementSetsRows.value,
      themeId,
    );
  }, 600);
}

async function onElementColorsPage(event: DataTablePageEvent) {
  const currentElement = element.value;
  if (!currentElement) return;

  elementColorsFirst.value = event.first;
  elementColorsRows.value = event.rows;
  await elementStore.getElementColors(currentElement.part_num);
}

function changeSearchValue(element_id: string) {
  searchValue.value = element_id;
  onSearch();
}

async function onElementSetsPage(event: DataTablePageEvent) {
  const currentElement = element.value;
  if (!currentElement) return;

  elementSetsFirst.value = event.first;
  elementSetsRows.value = event.rows;
  await elementStore.getElementSets(
    currentElement.part_num,
    currentElement.color_id,
    event.page + 1,
    event.rows,
  );
}

async function searchColor() {
  if (!colorSelected.value && element.value) {
    elementStore.getElementColors(element.value.part_num, 1, undefined);
    return;
  } else if (!element.value || !colorSelected.value) return;

  const colorId = colorSelected.value.color_id;

  const elementValue = element.value;
  elementColorsFirst.value = 0;

  setTimeout(() => {
    elementStore.getElementColors(elementValue.part_num, 1, undefined, colorId);
  }, 600);
}

function openMoreColors() {
  dialog.open(ColorsModalComponente, {
    props: {
      header: "Todos Los Colores De La Pieza",
      style: {
        width: "80vw",
      },
      breakpoints: {
        "960px": "75vw",
        "640px": "90vw",
      },
      modal: true,
    },
    data: elementColorsSelect,
    onClose: (data: DynamicDialogCloseOptions) => {
      colorSelected.value = data.data.color;
      searchColor();
    },
  });
}

function openAddModal(data: Element | SetInterface) {
  let dialogData: any = {};
  if ("set_num" in data) {
    dialogData["extra"] = data;
    dialogData["data"] = element.value;
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
    onClose: (data: DynamicDialogCloseOptions) => {
      if (data) {
        console.log(data.data);
      }
    },
  });
}

watch(
  () => themeSearch.value,
  (newValue) => {
    if (!newValue) {
      setTimeout(() => {
        if (!element.value) return;

        const elementValue = element.value;
        elementStore.getElementSets(
          elementValue.part_num,
          elementValue.color_id,
          elementSetsFirst.value + 1,
          elementSetsRows.value,
        );
      }, 600);
    }
  },
);

watch(
  () => [
    elementError.value,
    elementColorsError.value,
    elementSetsError.value,
    themesError.value,
  ],
  (
    [error, colorsError, setsError, themesError],
    [
      previousError,
      previousColorsError,
      previousSetsError,
      previousThemesError,
    ],
  ) => {
    if (error && error !== previousError) {
      toast.add({
        severity: "error",
        summary: "Error Al Buscar Código",
        detail: "No existe pieza con el código ingresado",
        life: 4000,
      });
    }
    if (colorsError && colorsError !== previousColorsError) {
      elementColors.value = null;
      toast.add({
        severity: "error",
        summary: "Error Al Obtener Colores",
        detail: "Error en la busqueda de colores de la pieza",
        life: 4000,
      });
    }
    if (themesError && themesError !== previousThemesError) {
      themesSet.value = null;
      toast.add({
        severity: "error",
        summary: "Error Al Obtener Colores",
        detail: "Error en la busqueda de colores de la pieza",
        life: 4000,
      });
    }
    if (setsError && setsError !== previousSetsError) {
      elementSets.value = null;
      toast.add({
        severity: "error",
        summary: "Error Al Obtener Set",
        detail: "Error en la busqueda de sets de la pieza",
        life: 4000,
      });
    }
  },
);

watch(
  themesSet,
  (themes) => {
    filteredThemes.value = [...(themes ?? [])];
  },
  { immediate: true },
);

watch(
  () => props.tabValue,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      searchValue.value = null;
      element.value = undefined;
      elementColors.value = null;
      elementSets.value = null;
    }
  },
);
</script>

<style scoped>
.extra-container {
  display: grid;
  /* minmax(0, ...) evita que las tablas anchas desborden la grilla */
  grid-template-columns: minmax(0, 1fr) 40px minmax(0, 2fr);
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
