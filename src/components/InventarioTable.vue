<script setup lang="ts">
import { computed, ref } from "vue";
import { FilterMatchMode } from "@primevue/core/api";
import DataTable, { type DataTableSortEvent } from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Image from "primevue/image";
import type { Operation } from "@/interfaces/database.interface";
import { Pencil, Check, ShoppingCart, Trash, Search } from "@primeicons/vue";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";

const props = defineProps<{
  items: Operation[];
  rows: number;
  total: number;
  first: number;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "edit", item: Operation): void;
  (e: "delete", items: Operation[]): void;
  (
    e: "update-status",
    items: Operation[],
    patch: Partial<Pick<Operation, "pedido" | "completo">>,
  ): void;
}>();

/* ---------- Selección ---------- */

const selected = ref<Operation[]>([]);
const hasSelection = computed(() => selected.value.length > 0);
const single = computed(() => selected.value.length === 1);

/* ---------- Filtro global ---------- */

const filters = ref({
  global: { value: null as string | null, matchMode: FilterMatchMode.CONTAINS },
});
const globalFields = [
  "element_name",
  "name",
  "set_num",
  "element_id",
  "color_name",
  "theme_name",
  "part_cat_name",
  "num_parts",
];

/* ---------- Estado ---------- */

const status = (i: Operation) => {
  if (i.completo) return { label: "Completo", severity: "success" as const };
  if (i.pedido) return { label: "Pedido", severity: "info" as const };
  return { label: "Sin pedir", severity: "secondary" as const };
};

/* ---------- Acciones ---------- */

const onEdit = () => {
  const item = selected.value[0];
  if (single.value && item) emit("edit", item);
};
const onDelete = () => emit("delete", [...selected.value]);
const onStatus = (patch: Partial<Pick<Operation, "pedido" | "completo">>) =>
  emit("update-status", [...selected.value], patch);

// El diálogo de edición también se abre con doble clic en la fila
const onRowDblClick = (e: { data: Operation }) => emit("edit", e.data);

const onSort = (event: DataTableSortEvent) => {
  console.log(event);
};
</script>

<template>
  <div class="op-table w-full">
    <!-- Barra de acciones -->
    <div class="op-toolbar">
      <div class="op-toolbar-left">
        <Button :disabled="!single" @click="onEdit">
          <span class="text-base">Editar</span>
          <Pencil :size="20" />
        </Button>
        <Button
          severity="secondary"
          outlined
          :disabled="!hasSelection"
          @click="onStatus({ pedido: true })"
          class="text-base"
        >
          <span class="text-base">Marcar Pedido</span>
          <ShoppingCart :size="20" />
        </Button>
        <Button
          label="Marcar completo"
          severity="secondary"
          outlined
          :disabled="!hasSelection"
          @click="onStatus({ pedido: true, completo: true })"
          class="text-base"
        >
          <span class="text-base">Marcar Completo</span>
          <Check :size="20"
        /></Button>
        <Button
          severity="danger"
          outlined
          :disabled="!hasSelection"
          @click="onDelete"
          class="text-base"
        >
          <span class="text-base">Eliminar</span>
          <Trash :size="20" />
        </Button>
      </div>

      <div class="op-toolbar-right">
        <InputGroup :style="{ 'max-width': '250px' }">
          <InputGroupAddon>
            <Search :size="20" />
          </InputGroupAddon>
          <InputText v-model="filters.global.value" placeholder="Buscar" />
        </InputGroup>
      </div>
    </div>

    <DataTable
      v-model:selection="selected"
      v-model:filters="filters"
      :value="items"
      :loading="loading"
      :global-filter-fields="globalFields"
      data-key="operation_id"
      selection-mode="multiple"
      :meta-key-selection="false"
      paginator
      :rows="rows"
      :first="first"
      :total-records="total"
      :rows-per-page-options="[5, 10, 15, 30, 50]"
      row-hover
      size="small"
      removable-sort
      @row-dblclick="onRowDblClick"
      @sort="onSort($event)"
    >
      <template #empty>No hay piezas que coincidan con tu búsqueda.</template>

      <Column selection-mode="multiple" header-style="width: 3rem" />

      <Column header="Pieza" field="element_name" style="min-width: 18rem">
        <template #body="{ data }">
          <div class="op-cell">
            <span @click.stop>
              <Image
                :src="data.element_img_url"
                :alt="data.element_name"
                preview
                image-class="op-thumb"
              />
            </span>
            <div class="op-cell-text">
              <a
                :href="data.part_url"
                target="_blank"
                rel="noopener"
                class="op-link"
                @click.stop
              >
                {{ data.element_name }}
              </a>
              <span class="op-muted">{{ data.element_id }}</span>
            </div>
          </div>
        </template>
      </Column>

      <Column
        header="Color"
        field="color_name"
        sortable
        style="min-width: 11rem"
      >
        <template #body="{ data }">
          <span
            class="op-swatch"
            :style="{ backgroundColor: `#${data.color_rgb}` }"
          />
          {{ data.color_name }}
        </template>
      </Column>

      <Column header="Set" field="name" sortable style="min-width: 16rem">
        <template #body="{ data }">
          <div class="op-cell">
            <span @click.stop>
              <Image
                :src="data.set_img_url"
                :alt="data.name"
                preview
                image-class="op-set-thumb"
              />
            </span>
            <div class="op-cell-text">
              <a
                :href="data.set_url"
                target="_blank"
                rel="noopener"
                class="op-link"
                @click.stop
              >
                {{ data.name }}
              </a>
              <span class="op-muted">{{ data.set_num }}</span>
            </div>
          </div>
        </template>
      </Column>

      <Column
        header="Cant."
        field="cantidad"
        sortable
        style="width: 6rem"
        body-class="op-num"
      />

      <Column
        header="Tema Set"
        field="theme_name"
        sortable
        style="width: 8rem"
      />

      <Column
        header="Categoría Pieza"
        field="part_cat_name"
        sortable
        style="width: 12rem"
      />

      <Column
        header="N° Pieza Set"
        field="num_parts"
        sortable
        style="width: 8rem"
        body-class="op-num"
      />

      <Column header="Estado" style="width: 8rem">
        <template #body="{ data }">
          <Tag :value="status(data).label" :severity="status(data).severity" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.op-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.op-toolbar-left,
.op-toolbar-right {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-width: 450px;
}

.op-toolbar-right {
  justify-content: end;
}

.op-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}
.op-cell-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}
.op-link {
  color: var(--p-text-color);
  font-weight: 500;
  text-decoration: none;
}
.op-link:hover {
  color: var(--p-primary-color);
  text-decoration: underline;
}
.op-muted {
  font-size: 1rem;
  color: var(--p-text-muted-color);
  font-variant-numeric: tabular-nums;
}

:deep(.op-thumb) {
  width: 2.75rem;
  height: 2.75rem;
  object-fit: contain;
  border-radius: 0.375rem;
  background: var(--p-surface-100);
  padding: 0.125rem;
  cursor: zoom-in;
}
:global(.p-dark) :deep(.op-thumb) {
  background: var(--p-surface-800);
}
:deep(.op-set-thumb) {
  width: 2.75rem;
  height: 2.75rem;
  object-fit: cover;
  border-radius: 0.375rem;
  cursor: zoom-in;
}

.op-swatch {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  margin-right: 0.4rem;
  border-radius: 50%;
  border: 1px solid var(--p-content-border-color);
  vertical-align: -0.1rem;
}

:deep(.op-num) {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
</style>
