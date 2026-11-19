<template>
  <div class="w-full">
    <DataTable
      :value="value"
      :paginator="paginator"
      :lazy="paginator"
      :first="first"
      :rows="rows"
      :total-records="total"
      @page="emit('page', $event)"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
      :rowsPerPageOptions="[5, 10, 15, 20]"
      :class="tableClass"
      striped-rows
    >
      <template #empty>
        <span class="text-2xl">No Se Encontraron Elementos</span>
      </template>
      <Column
        v-for="column in tableColumns"
        :field="column.field"
        :style="{ 'max-width': '200px' }"
      >
        <template #header>
          <span class="capitalize text-xl font-bold">{{
            column.field === "pieces" ? "Num Pieces" : column.header
          }}</span>
        </template>
        <template #body="{ data }">
          <div class="img-container" v-if="isImageField(column.field)">
            <img :src="data[column.field]" alt="" />
          </div>
          <div
            v-else-if="column.field === 'part_ids'"
            class="flex flex-wrap align-items-center"
          >
            <span
              v-for="element in data[column.field]"
              class="text-base pr-2 cursor-pointer hover:underline"
              @click="changeElementSearch(element)"
              >{{ element }}</span
            >
          </div>
          <div
            v-else-if="column.field === 'color_name'"
            class="color-container"
          >
            <div
              class="color-box"
              :style="{ 'background-color': `#${data['color_rgb']}` }"
            ></div>
            <span class="text-base capitalize">{{ data[column.field] }}</span>
          </div>
          <div v-else-if="isLinkField(column.field)">
            <Button
              outlined
              link
              severity="info"
              @click="openLink(data[column.field], data['color_id'] ?? '')"
            >
              <Link :size="24" />
            </Button>
          </div>
          <div v-else-if="column.field === 'pieces'">
            <span class="text-base">{{ data["pieces"].count }}</span>
          </div>
          <span class="text-base capitalize" v-else>{{
            normalizeValue(data[column.field])
          }}</span>
        </template>
      </Column>
      <Column
        v-if="tableClass !== 'colors-table' && tableClass !== 'minifigs-table-principal'"
        :style="{
          'max-width':
            tableClass === 'pieces-table' || tableClass === 'set-table'
              ? '100px'
              : '200px',
        }"
      >
        <template #header>
          <span class="capitalize text-xl font-bold">acciones</span>
        </template>
        <template #body="{ data }">
          <div class="buttons-container">
            <Button
              outlined
              severity="success"
              class="w-full"
              v-if="tableClass === 'pieces-table'"
            >
              <div class="button-container">
                <PlusCircle :size="24" />
                <span class="ml-2 text-base">Agregar</span>
              </div>
            </Button>
            <Button
              outlined
              severity="secondary"
              class="w-full"
              v-if="tableClass.includes('set')"
              @click="openInstructions(data['set_num'], $event)"
            >
              <div class="button-container">
                <Book :size="24" />
                <span class="ml-2 text-base">Instrucciones</span>
              </div>
            </Button>
            <Button
              outlined
              severity="info"
              class="w-full"
              v-if="tableClass === 'minifigs-table'"
              @click="
                emit('minifig_parts', {
                  parts: data['pieces'].results,
                  total: data['pieces'].count,
                  set_num: data['set_num'],
                })
              "
            >
              <div class="button-container">
                <List :size="24" />
                <span class="ml-2 text-base">Piezas</span>
              </div>
            </Button>
          </div>
        </template>
      </Column>
    </DataTable>
    <Toast />
    <Popover ref="op" :style="{ width: '200px', padding: '5px' }">
      <template #container>
        <div
          v-if="instructionsLoading"
          class="flex flex-row align-items-center gap-3 w-full"
        >
          <Skeleton height="2rem" />
          <Skeleton height="2rem" />
        </div>
        <div v-else-if="instructionsError" class="flex flex-column gap-3">
          <div class="flex justify-content-end w-full">
            <Times :size="16" @click="hide()" class="cursor-pointer" />
          </div>
          <div class="instructions-empty">
            <span class="text-sm text-center">
              No hay instrucciones disponibles
            </span>
          </div>
        </div>
        <div
          v-else-if="instructions && instructions.length > 0"
          class="flex flex-column gap-3"
        >
          <div class="flex justify-content-end w-full">
            <Times :size="16" @click="hide()" class="cursor-pointer" />
          </div>
          <div
            class="instructions-container"
            :class="{ 'two-columns': instructions && instructions.length > 1 }"
          >
            <a
              :href="instruction.URL"
              target="_blank"
              class="text-center instruction-link"
              v-for="(instruction, index) in instructions"
              :key="index"
              >Página {{ index + 1 }}</a
            >
          </div>
        </div>
        <div v-else class="flex flex-column gap-3">
          <div class="flex justify-content-end w-full">
            <Times :size="16" @click="hide()" class="cursor-pointer" />
          </div>
          <div class="instructions-empty">
            <span class="text-sm text-center">
              Sin instrucciones disponibles
            </span>
          </div>
        </div>
      </template>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import DataTable, { type DataTablePageEvent } from "primevue/datatable";
import Column from "primevue/column";
import type { Element } from "@/interfaces/element.interface";
import { computed, ref } from "vue";
import type { ColorElement } from "@/interfaces/color.interface";
import Button from "primevue/button";
import Link from "@primeicons/vue/link";
import PlusCircle from "@primeicons/vue/plus-circle";
import Book from "@primeicons/vue/book";
import { useSetsStore } from "@/stores/sets.store";
import { storeToRefs } from "pinia";
import { useToast } from "primevue/usetoast";
import Toast from "primevue/toast";
import Popover from "primevue/popover";
import Skeleton from "primevue/skeleton";
import Times from "@primeicons/vue/times";
import type { SetInterface } from "@/interfaces/set.interface";
import type { MinifigInterface } from "@/interfaces/minifig.interface";
import List from "@primeicons/vue/list";

const props = defineProps<{
  value: Element[] | ColorElement[] | SetInterface[] | MinifigInterface[];
  tableClass: string;
  paginator: boolean;
  total?: number;
  first?: number;
  rows?: number;
}>();

const emit = defineEmits<{
  page: [event: DataTablePageEvent];
  change_element: [element_id: string];
  minifig_parts: [{ parts: Element[]; total: number; set_num: string }];
}>();

const setsStore = useSetsStore();
const { instructions, instructionsError, instructionsLoading } =
  storeToRefs(setsStore);
const toast = useToast();
const op = ref();

const columnsToHide = ref<string[]>([
  "part_num",
  "color_rgb",
  "color_id",
  "part_cat_id",
  "num_sets",
  "num_set_parts",
  "year",
  "theme_id",
  "num_parts",
  "last_modified_dt",
  "name_en",
  "id",
  "set_name",
  "element_name",
  props.tableClass === "minifigs-table" ? "name" : "",
]);

const tableColumns = computed<{ field: string; header: string }[]>(() => {
  return Object.keys(props.value[0] ?? {})
    .map((key) => ({
      field: key,
      header: key
        .split("_")
        .join(" ")
        .replace("set", "")
        .replace("element", "")
        .replace("part", ""),
    }))
    .filter((column) => !columnsToHide.value.includes(column.field));
});

const isImageField = (field: string) => {
  return (
    field === "element_img_url" ||
    field === "part_img_url" ||
    field === "set_img_url"
  );
};

const isLinkField = (field: string) => {
  return field === "part_url" || field === "set_url";
};

const normalizeValue = (value: string | number) => {
  return typeof value === "string"
    ? value.includes("-1")
      ? value.replace("-1", "")
      : value.includes("fig-")
        ? value.replace("fig-", "")
        : value
    : (value ?? "Sin Valor");
};

const toggle = (event: PointerEvent) => {
  op.value.toggle(event);
};

const hide = () => {
  op.value.hide();
};

function openLink(link: string, color_id?: number) {
  window.open(`${link}/${color_id}`, "blank");
}

async function openInstructions(set_num: string, event: PointerEvent) {
  toggle(event);

  try {
    await setsStore.getInstructions(String(normalizeValue(set_num)));

    if (setsStore.instructionsError) {
      toast.add({
        severity: "error",
        summary: "Error Al Obtener Instrucciones",
        detail: "No se pudieron cargar las instrucciones del set",
        life: 4000,
      });
      setsStore.instructionsError = null;
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error Al Obtener Instrucciones",
      detail: "No se pudieron cargar las instrucciones del set",
      life: 4000,
    });
  }
}

function changeElementSearch(element_id: string) {
  emit("change_element", element_id);
}
</script>

<style scoped>
.img-container {
  width: 90px;
  height: 90px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    box-shadow:
      rgba(0, 0, 0, 0.16) 0px 3px 6px,
      rgba(0, 0, 0, 0.23) 0px 3px 6px;
  }

  &:hover img,
  &:active img {
    object-fit: contain;
  }
}

.color-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-box {
  width: 30px;
  height: 30px;
  border: 1px solid #000000;
  border-radius: 6px;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  gap: 10px;
}

.button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.instructions-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  &.two-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

.instruction-link {
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #f0f0f0;
  text-decoration: none;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e0e0e0;
    text-decoration: underline;
  }
}

.instructions-empty {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
}

.p-datatable {
  &:deep(td) {
    border-width: 1px 0px 0px 0px;
  }
}

:deep(.p-paginator-current) {
  margin-left: 25px;
}
</style>
