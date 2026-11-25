<script setup lang="ts">
import { computed, ref } from "vue";
import { FilterMatchMode } from "@primevue/core/api";
import DataTable, {
  type DataTableFilterEvent,
  type DataTableFilterMetaData,
  type DataTableSortEvent,
} from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Image from "primevue/image";
import Checkbox from "primevue/checkbox";
import InputNumber from "primevue/inputnumber";
import type { Operation } from "@/interfaces/database.interface";
import { Pencil, Check, ShoppingCart, Trash } from "@primeicons/vue";
import { storeToRefs } from "pinia";
import { useDatabaseStore } from "@/stores/database.store";
import { useDebounceFn } from "@vueuse/core";

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
    e: "updateStatus",
    payload: {
      id: number;
      field: string;
      value: boolean;
    },
  ): void;
  (e: "sort"): void;
  (e: "filter"): void;
}>();

/* ---------- Responsive ---------- */

const isMobile = ref(false);

const updateView = () => {
  isMobile.value = window.innerWidth < 1024;
};

if (typeof window !== "undefined") {
  window.addEventListener("resize", updateView);
  updateView();
}

/* ---------- Selección y Store ---------- */

const selected = ref<Operation[]>([]);
const hasSelection = computed(() => selected.value.length > 0);
const single = computed(() => selected.value.length === 1);
const { sortField, sortOrder, columnFilters } = storeToRefs(useDatabaseStore());

/* ---------- Filtros por columna ---------- */

const filterFields = [
  "element_id",
  "element_name",
  "color_name",
  "name",
  "set_num",
  "cantidad",
  "theme_name",
  "part_cat_name",
  "num_parts",
  "task",
] as const;

const filters = ref(
  Object.fromEntries(
    filterFields.map((f) => [
      f,
      {
        value: (columnFilters.value[f] ?? null) as unknown,
        matchMode: FilterMatchMode.CONTAINS,
      },
    ]),
  ),
);

const isMetaData = (model: unknown): model is DataTableFilterMetaData =>
  typeof model === "object" && model !== null && "value" in model;

const emitFilter = useDebounceFn((event: DataTableFilterEvent) => {
  const next: Record<string, string | { min?: number; max?: number }> = {};

  for (const [field, model] of Object.entries(event.filters ?? {})) {
    if (field === "global") continue;
    if (!isMetaData(model)) continue;

    const raw: unknown = model.value;
    if (raw == null) continue;

    // Los filtros de rango (num_parts) llegan como { min, max }
    if (typeof raw === "object") {
      const { min, max } = raw as { min?: number | null; max?: number | null };
      const range: { min?: number; max?: number } = {};
      if (min != null) range.min = min;
      if (max != null) range.max = max;
      if (Object.keys(range).length > 0) next[field] = range;
      continue;
    }

    const value = String(raw).trim();
    if (value) next[field] = value;
  }

  if (JSON.stringify(next) === JSON.stringify(columnFilters.value)) return;

  columnFilters.value = next;
  emit("filter");
}, 500);

/* ---------- Acciones ---------- */

const onToggleSelection = (item: Operation) => {
  const index = selected.value.findIndex(
    (s) => s.operation_id === item.operation_id,
  );
  if (index > -1) {
    selected.value.splice(index, 1);
  } else {
    selected.value.push(item);
  }
};

const isSelected = (item: Operation) => {
  return selected.value.some((s) => s.operation_id === item.operation_id);
};

const onRowDblClick = (e: { data: Operation }) => {};

const onSort = (event: DataTableSortEvent) => {
  if (
    typeof event.sortField === "string" &&
    typeof event.sortOrder === "number"
  ) {
    sortField.value = event.sortField;
    sortOrder.value =
      event.sortOrder === 1 ? "ASC" : event.sortOrder === -1 ? "DESC" : null;

    emit("sort");
  }
};

const updateCheckbox = (value: boolean, id: number, field: keyof Operation) => {
  console.log("updateCheckbox fired:", { value, id, field });
  emit("updateStatus", {
    id,
    field,
    value,
  });
};
</script>

<template>
  <div class="op-table w-full">
    <!-- Barra de acciones -->
    <div class="op-toolbar">
      <div class="op-toolbar-left">
        <Button :disabled="!single" severity="success" size="small">
          <Pencil :size="16" />
          <span class="font-medium">Editar</span>
        </Button>
        <Button
          severity="danger"
          outlined
          :disabled="!hasSelection"
          size="small"
        >
          <Trash :size="16" />
          <span class="font-medium">
            Eliminar{{ hasSelection ? ` (${selected.length})` : "" }}
          </span>
        </Button>
      </div>

      <div v-if="hasSelection" class="op-toolbar-right">
        <span class="op-selection-badge">
          {{ selected.length }}
          {{ selected.length === 1 ? "seleccionado" : "seleccionados" }}
        </span>
      </div>
    </div>

    <!-- Vista de Tabla (Desktop) -->
    <div v-if="!isMobile" class="op-table-container">
      <DataTable
        v-model:selection="selected"
        v-model:filters="filters"
        :value="props.items"
        :loading="loading"
        data-key="operation_id"
        selection-mode="multiple"
        :meta-key-selection="false"
        paginator
        :rows="rows"
        :first="first"
        :total-records="total"
        :rows-per-page-options="[5, 10, 15, 30, 50]"
        row-hover
        striped-rows
        size="small"
        scrollable
        class="op-datatable"
        @row-dblclick="onRowDblClick"
        @sort="onSort($event)"
        @filter="emitFilter"
        lazy
        :sort-field="sortField ?? ''"
        :sort-order="sortOrder === 'ASC' ? 1 : sortOrder === 'DESC' ? -1 : 0"
        filter-display="row"
      >
        <template #empty>
          <div class="op-empty-table">
            No hay piezas que coincidan con tu búsqueda.
          </div>
        </template>

        <!-- Selección -->
        <Column
          selection-mode="multiple"
          header-style="width: 3rem"
          body-class="op-center"
        />

        <!-- Código (se ajusta al contenido) -->
        <Column
          sortable
          header="Código"
          field="element_id"
          style="min-width: 7rem"
          header-class="op-fit"
          body-class="op-mono op-fit"
          filter
          :show-filter-menu="false"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              :model-value="filterModel.value"
              @update:model-value="
                (value) => {
                  filterModel.value = value;
                  filterCallback();
                }
              "
              size="small"
              placeholder="Filtrar"
              fluid
            />
          </template>
        </Column>

        <!-- Pieza (flexible) -->
        <Column
          header="Pieza"
          field="element_name"
          sortable
          sort-field="element_name"
          style="min-width: 18rem"
          filter
          :show-filter-menu="false"
        >
          <template #body="{ data }">
            <div class="op-cell">
              <span @click.stop @dblclick.stop>
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
                <span class="op-subtext">#{{ data.element_id }}</span>
              </div>
            </div>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              :model-value="filterModel.value"
              @update:model-value="
                (value) => {
                  filterModel.value = value;
                  filterCallback();
                }
              "
              size="small"
              placeholder="Filtrar"
              fluid
            />
          </template>
        </Column>

        <!-- Color (se ajusta al contenido) -->
        <Column
          header="Color"
          field="color_name"
          sortable
          style="min-width: 8rem"
          header-class="op-fit"
          body-class="op-fit"
          filter
          :show-filter-menu="false"
        >
          <template #body="{ data }">
            <div class="op-color-cell">
              <span
                class="op-swatch"
                :style="{ backgroundColor: `#${data.color_rgb}` }"
              />
              <span class="op-truncate">{{ data.color_name }}</span>
            </div>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              :model-value="filterModel.value"
              @update:model-value="
                (value) => {
                  filterModel.value = value;
                  filterCallback();
                }
              "
              size="small"
              placeholder="Filtrar"
              fluid
            />
          </template>
        </Column>

        <!-- Set (flexible) -->
        <Column
          header="Set"
          field="name"
          sortable
          sort-field="name"
          style="min-width: 18rem"
          filter
          :show-filter-menu="false"
        >
          <template #body="{ data }">
            <div class="op-cell">
              <span @click.stop @dblclick.stop>
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
                <span class="op-subtext">{{ data.set_num }}</span>
              </div>
            </div>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              :model-value="filterModel.value"
              @update:model-value="
                (value) => {
                  filterModel.value = value;
                  filterCallback();
                }
              "
              size="small"
              placeholder="Filtrar"
              fluid
            />
          </template>
        </Column>

        <!-- Cód. Set (se ajusta al contenido) -->
        <Column
          header="Cód. Set"
          field="set_num"
          sortable
          style="min-width: 7rem"
          header-class="op-fit"
          body-class="op-mono op-fit"
          filter
          :show-filter-menu="false"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              :model-value="filterModel.value"
              @update:model-value="
                (value) => {
                  filterModel.value = value;
                  filterCallback();
                }
              "
              size="small"
              placeholder="Filtrar"
              fluid
            />
          </template>
        </Column>

        <!-- Cant. (se ajusta al contenido) -->
        <Column
          header="Cant."
          field="cantidad"
          sortable
          style="min-width: 7rem"
          header-class="op-right-header op-fit"
          body-class="op-num op-right op-fit"
          filter
          :show-filter-menu="false"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              :model-value="filterModel.value"
              @update:model-value="
                (value) => {
                  filterModel.value = value;
                  filterCallback();
                }
              "
              size="small"
              placeholder="Filtrar"
              fluid
            />
          </template>
        </Column>

        <!-- N° Task (se ajusta al contenido) -->
        <Column
          sortable
          header="N° Task"
          field="task"
          style="min-width: 7rem"
          header-class="op-right-header op-fit"
          body-class="op-num op-right op-fit"
          filter
          :show-filter-menu="false"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputNumber
              :model-value="filterModel.value"
              @update:model-value="
                (value) => {
                  filterModel.value = value;
                  filterCallback();
                }
              "
              :use-grouping="false"
              size="small"
              placeholder="Filtrar"
              fluid
            />
          </template>
        </Column>

        <!-- Tema (se ajusta al contenido) -->
        <Column
          header="Tema"
          field="theme_name"
          sortable
          style="min-width: 8rem"
          header-class="op-fit"
          body-class="op-fit"
          filter
          :show-filter-menu="false"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              :model-value="filterModel.value"
              @update:model-value="
                (value) => {
                  filterModel.value = value;
                  filterCallback();
                }
              "
              size="small"
              placeholder="Filtrar"
              fluid
            />
          </template>
        </Column>

        <!-- Categoría (se ajusta al contenido) -->
        <Column
          header="Categoría"
          field="part_cat_name"
          sortable
          style="min-width: 8rem"
          header-class="op-fit"
          body-class="op-fit"
          filter
          :show-filter-menu="false"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              :model-value="filterModel.value"
              @update:model-value="
                (value) => {
                  filterModel.value = value;
                  filterCallback();
                }
              "
              size="small"
              placeholder="Filtrar"
              fluid
            />
          </template>
        </Column>

        <!-- N° Piezas (se ajusta al contenido, mínimo para el filtro de rango) -->
        <Column
          header="N° Piezas"
          field="num_parts"
          sortable
          style="min-width: 10rem"
          header-class="op-right-header op-fit"
          body-class="op-num op-right op-fit"
          filter
          :show-filter-menu="false"
        >
          <template #filter="{ filterModel, filterCallback }">
            <div class="op-range-filter">
              <InputNumber
                :model-value="filterModel.value?.min ?? null"
                @input="
                  (e) => {
                    filterModel.value = {
                      ...(filterModel.value ?? {}),
                      min: e.value,
                    };
                    filterCallback();
                  }
                "
                placeholder="Mín"
                :min="0"
                :useGrouping="false"
                size="small"
                fluid
              />
              <InputNumber
                :model-value="filterModel.value?.max ?? null"
                @input="
                  (e) => {
                    filterModel.value = {
                      ...(filterModel.value ?? {}),
                      max: e.value,
                    };
                    filterCallback();
                  }
                "
                placeholder="Máx"
                :min="0"
                :useGrouping="false"
                size="small"
                fluid
              />
            </div>
          </template>
        </Column>

        <!-- Pedido -->
        <Column
          header="Pedido"
          field="pedido"
          sortable
          style="min-width: 6rem"
          header-class="op-center-header op-fit"
          body-class="op-center op-fit"
        >
          <template #body="{ data }">
            <span @click.stop @dblclick.stop>
              <Checkbox
                :model-value="Boolean(data.pedido)"
                :binary="true"
                @update:model-value="
                  (val: boolean) =>
                    updateCheckbox(val, data['operation_id'], 'pedido')
                "
              />
            </span>
          </template>
        </Column>

        <!-- Completo -->
        <Column
          header="Completo"
          field="completo"
          sortable
          style="min-width: 7rem"
          header-class="op-center-header op-fit"
          body-class="op-center op-fit"
        >
          <template #body="{ data }">
            <span @click.stop @dblclick.stop>
              <Checkbox
                :model-value="Boolean(data.completo)"
                :binary="true"
                @update:model-value="
                  (val: boolean) =>
                    updateCheckbox(val, data['operation_id'], 'completo')
                "
              />
            </span>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Vista de Cards (Mobile) -->
    <div v-if="isMobile" class="op-cards-container">
      <div v-if="props.items.length === 0" class="op-empty-state">
        No hay piezas que coincidan con tu búsqueda.
      </div>

      <div
        v-for="item in props.items"
        :key="item.operation_id"
        class="op-card"
        :class="{ 'op-card-selected': isSelected(item) }"
      >
        <div class="op-card-header">
          <div class="op-card-select">
            <Checkbox
              :model-value="isSelected(item)"
              :binary="true"
              @update:model-value="() => onToggleSelection(item)"
            />
            <span class="op-card-id">#{{ item.element_id }}</span>
          </div>

          <div class="op-card-statuses">
            <label class="op-status-toggle">
              <Checkbox
                :model-value="Boolean(item.pedido)"
                :binary="true"
                @update:model-value="
                  (val: boolean) =>
                    updateCheckbox(val, item.operation_id, 'pedido')
                "
              />
              <span>Pedido</span>
            </label>
            <label class="op-status-toggle">
              <Checkbox
                :model-value="Boolean(item.completo)"
                :binary="true"
                @update:model-value="
                  (val: boolean) =>
                    updateCheckbox(val, item.operation_id, 'completo')
                "
              />
              <span>Completo</span>
            </label>
          </div>
        </div>

        <div class="op-card-content">
          <div class="op-card-section">
            <h4 class="op-card-label">Pieza</h4>
            <div class="op-card-item-row">
              <span class="op-card-image" @click.stop>
                <Image
                  :src="item.element_img_url"
                  :alt="item.element_name"
                  preview
                  image-class="op-card-thumb"
                />
              </span>
              <div class="op-card-item-text">
                <a
                  :href="item.part_url"
                  target="_blank"
                  rel="noopener"
                  class="op-card-link"
                  @click.stop
                >
                  {{ item.element_name }}
                </a>
                <span class="op-subtext">Código: {{ item.element_id }}</span>
              </div>
            </div>
          </div>

          <div class="op-card-section">
            <h4 class="op-card-label">Set</h4>
            <div class="op-card-item-row">
              <span class="op-card-image" @click.stop>
                <Image
                  :src="item.set_img_url"
                  :alt="item.name"
                  preview
                  image-class="op-card-set-thumb"
                />
              </span>
              <div class="op-card-item-text">
                <a
                  :href="item.set_url"
                  target="_blank"
                  rel="noopener"
                  class="op-card-link"
                  @click.stop
                >
                  {{ item.name }}
                </a>
                <span class="op-subtext">{{ item.set_num }}</span>
              </div>
            </div>
          </div>

          <div class="op-card-details">
            <div class="op-card-detail">
              <span class="op-card-label">Color</span>
              <div class="op-card-color-row">
                <span
                  class="op-swatch"
                  :style="{ backgroundColor: `#${item.color_rgb}` }"
                />
                <span>{{ item.color_name }}</span>
              </div>
            </div>
            <div class="op-card-detail">
              <span class="op-card-label">Cant.</span>
              <span class="op-num">{{ item.cantidad }}</span>
            </div>
            <div class="op-card-detail">
              <span class="op-card-label">Tema Set</span>
              <span>{{ item.theme_name }}</span>
            </div>
            <div class="op-card-detail">
              <span class="op-card-label">N° Piezas Set</span>
              <span class="op-num">{{ item.num_parts }}</span>
            </div>
            <div class="op-card-detail op-card-detail-full">
              <span class="op-card-label">Categoría Pieza</span>
              <span>{{ item.part_cat_name }}</span>
            </div>
          </div>
        </div>

        <div class="op-card-actions">
          <Button severity="success" outlined size="small">
            <Pencil :size="15" />
            <span>Editar</span>
          </Button>
          <Button severity="secondary" outlined size="small">
            <ShoppingCart :size="15" />
            <span>Pedido</span>
          </Button>
          <Button severity="secondary" outlined size="small">
            <Check :size="15" />
            <span>Completo</span>
          </Button>
          <Button severity="danger" outlined size="small">
            <Trash :size="15" />
            <span>Eliminar</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== Barra de acciones ========== */

.op-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.875rem;
}

.op-toolbar-left,
.op-toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.op-selection-badge {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
  background: var(--p-surface-100);
  border: 1px solid var(--p-content-border-color);
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
}

:global(.p-dark) .op-selection-badge {
  background: var(--p-surface-800);
}

/* ========== Contenedor y tabla (Desktop) ========== */

.op-table-container {
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.625rem;
  background: var(--p-surface-0);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

:global(.p-dark) .op-table-container {
  background: var(--p-surface-900);
  box-shadow: none;
}

/* Layout automático: el navegador calcula el ancho según el contenido */
:deep(.op-datatable .p-datatable-table) {
  table-layout: auto;
  width: 100%;
  min-width: 100%;
}

/* Columnas que se ajustan al contenido: lo más angostas posible, sin saltos.
   El min-width de cada Column evita que el filtro quede diminuto. */
:deep(.op-fit) {
  width: 1%;
  white-space: nowrap;
}

/* Pieza y Set absorben el espacio sobrante y pueden envolver texto */
:deep(.op-link) {
  white-space: normal;
}

:deep(.p-datatable-thead > tr > th) {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--p-text-color);
  background: var(--p-surface-50);
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
  vertical-align: middle;
}

:global(.p-dark) :deep(.p-datatable-thead > tr > th) {
  background: var(--p-surface-800);
}

:deep(.p-datatable-tbody > tr > td) {
  padding-top: 0.55rem;
  padding-bottom: 0.55rem;
  vertical-align: middle;
  font-size: 0.875rem;
}

:deep(.op-center-header .p-datatable-column-header-content) {
  justify-content: center;
}

:deep(.op-right-header .p-datatable-column-header-content) {
  justify-content: flex-end;
}

:deep(.op-center) {
  text-align: center;
}

:deep(.op-right) {
  text-align: right;
}

:deep(.op-mono) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  color: var(--p-text-muted-color);
}

.op-empty-table {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--p-text-muted-color);
  font-size: 0.9375rem;
}

.op-range-filter {
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

/* ========== Celdas ========== */

.op-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.op-cell-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  line-height: 1.3;
}

.op-link {
  color: var(--p-text-color);
  font-weight: 500;
  text-decoration: none;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.op-link:hover {
  color: var(--p-primary-color);
  text-decoration: underline;
}

.op-subtext {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  font-variant-numeric: tabular-nums;
}

.op-color-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.op-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.op-thumb) {
  width: 2.75rem;
  height: 2.75rem;
  object-fit: contain;
  border-radius: 0.375rem;
  background: var(--p-surface-100);
  border: 1px solid var(--p-content-border-color);
  padding: 0.125rem;
  cursor: zoom-in;
  flex-shrink: 0;
}

:global(.p-dark) :deep(.op-thumb) {
  background: var(--p-surface-800);
}

:deep(.op-set-thumb) {
  width: 2.75rem;
  height: 2.75rem;
  object-fit: cover;
  border-radius: 0.375rem;
  border: 1px solid var(--p-content-border-color);
  cursor: zoom-in;
  flex-shrink: 0;
}

.op-swatch {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
}

:deep(.op-num) {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

/* ========== Vista Mobile (Cards) ========== */

.op-cards-container {
  display: flex;
  gap: 0.875rem;
  flex-direction: column;
}

.op-empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--p-text-muted-color);
  font-size: 0.9375rem;
  border: 1px dashed var(--p-content-border-color);
  border-radius: 0.5rem;
}

.op-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.625rem;
  background: var(--p-surface-0);
  overflow: hidden;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

:global(.p-dark) .op-card {
  background: var(--p-surface-900);
}

.op-card-selected {
  border-color: var(--p-primary-color);
  box-shadow: 0 0 0 1px var(--p-primary-color);
}

.op-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--p-content-border-color);
  background: var(--p-surface-50);
}

:global(.p-dark) .op-card-header {
  background: var(--p-surface-800);
}

.op-card-select {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.op-card-id {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
  font-variant-numeric: tabular-nums;
}

.op-card-statuses {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.op-status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--p-text-color);
  cursor: pointer;
}

.op-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 0.875rem;
}

.op-card-section {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.op-card-label {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
  letter-spacing: 0.04em;
}

.op-card-item-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 0;
}

.op-card-image {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.op-card-thumb) {
  width: 3rem;
  height: 3rem;
  object-fit: contain;
  border-radius: 0.375rem;
  background: var(--p-surface-100);
  border: 1px solid var(--p-content-border-color);
  padding: 0.125rem;
}

:global(.p-dark) :deep(.op-card-thumb) {
  background: var(--p-surface-800);
}

:deep(.op-card-set-thumb) {
  width: 3rem;
  height: 3rem;
  object-fit: cover;
  border-radius: 0.375rem;
  border: 1px solid var(--p-content-border-color);
}

.op-card-item-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  line-height: 1.35;
  flex: 1;
}

.op-card-link {
  color: var(--p-text-color);
  font-weight: 600;
  text-decoration: none;
  word-break: break-word;
}

.op-card-link:hover {
  color: var(--p-primary-color);
  text-decoration: underline;
}

.op-card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding-top: 0.625rem;
  border-top: 1px solid var(--p-content-border-color);
}

.op-card-detail {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.op-card-detail-full {
  grid-column: 1 / -1;
}

.op-card-color-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.op-card-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  border-top: 1px solid var(--p-content-border-color);
  background: var(--p-surface-50);
}

:global(.p-dark) .op-card-actions {
  background: var(--p-surface-800);
}

:deep(.op-card-actions .p-button) {
  justify-content: center;
  gap: 0.375rem;
}

/* ========== Responsive Toolbar ========== */

@media (max-width: 1023px) {
  .op-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .op-toolbar-left {
    flex-direction: column;
  }
}
</style>
