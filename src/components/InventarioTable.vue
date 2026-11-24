<script setup lang="ts">
import { computed, ref } from "vue";
import { FilterMatchMode } from "@primevue/core/api";
import DataTable, { type DataTableSortEvent } from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Image from "primevue/image";
import Checkbox from "primevue/checkbox";
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

/* ---------- Responsive ---------- */

const isMobile = ref(false);

const updateView = () => {
  isMobile.value = window.innerWidth < 1024;
};

if (typeof window !== "undefined") {
  window.addEventListener("resize", updateView);
  updateView();
}

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

/* ---------- Filtrado de items ---------- */

const filteredItems = computed(() => {
  if (!filters.value.global.value) return props.items;

  const searchTerm = filters.value.global.value.toLowerCase();
  return props.items.filter((item) =>
    globalFields.some((field) => {
      const value = item[field as keyof Operation];
      return value && String(value).toLowerCase().includes(searchTerm);
    }),
  );
});

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

const onEditCard = (item: Operation) => {
  emit("edit", item);
};

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
        <Button :disabled="!single" @click="onEdit" severity="success">
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

    <!-- Vista de Tabla (Desktop) -->
    <div v-if="!isMobile" class="op-table-container">
      <DataTable
        v-model:selection="selected"
        v-model:filters="filters"
        :value="props.items"
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
            <Tag
              :value="status(data).label"
              :severity="status(data).severity"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Vista de Cards (Mobile) -->
    <div v-if="isMobile" class="op-cards-container">
      <div v-if="filteredItems.length === 0" class="op-empty-state">
        No hay piezas que coincidan con tu búsqueda.
      </div>

      <div
        v-for="item in filteredItems"
        :key="item.operation_id"
        class="op-card"
        :class="{ 'op-card-selected': isSelected(item) }"
      >
        <!-- Encabezado con checkbox y estado -->
        <div class="op-card-header">
          <div class="op-card-select">
            <Checkbox
              :model-value="isSelected(item)"
              :binary="true"
              @update:model-value="() => onToggleSelection(item)"
            />
          </div>
          <Tag :value="status(item).label" :severity="status(item).severity" />
        </div>

        <!-- Contenido principal -->
        <div class="op-card-content">
          <!-- Pieza -->
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
                <span class="op-muted">{{ item.element_id }}</span>
              </div>
            </div>
          </div>

          <!-- Set -->
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
                <span class="op-muted">{{ item.set_num }}</span>
              </div>
            </div>
          </div>

          <!-- Detalles en dos columnas -->
          <div class="op-card-details">
            <div class="op-card-detail">
              <span class="op-card-label">Color</span>
              <div class="op-card-color-row">
                <span
                  class="op-swatch"
                  :style="{ backgroundColor: `#${item.color_rgb}` }"
                />
                {{ item.color_name }}
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
              <span class="op-card-label">N° Pieza Set</span>
              <span class="op-num">{{ item.num_parts }}</span>
            </div>
            <div class="op-card-detail">
              <span class="op-card-label">Categoría Pieza</span>
              <span>{{ item.part_cat_name }}</span>
            </div>
          </div>
        </div>

        <!-- Acciones del card -->
        <div class="op-card-actions">
          <Button
            icon="pi pi-pencil"
            severity="success"
            outlined
            size="small"
            @click="onEditCard(item)"
          >
            <Pencil />
            <span class="text-base pl-2">Editar</span></Button
          >
          <Button
            severity="secondary"
            outlined
            size="small"
            @click="
              () => {
                selected = [item];
                onStatus({ pedido: true });
              }
            "
          >
            <ShoppingCart />
            <span class="text-base pl-2">Marcar como pedido</span></Button
          >
          <Button
            severity="secondary"
            outlined
            size="small"
            @click="
              () => {
                selected = [item];
                onStatus({ pedido: true, completo: true });
              }
            "
          >
            <Check />
            <span class="text-base">Marcar como completo</span></Button
          >
          <Button
            severity="danger"
            outlined
            size="small"
            @click="
              () => {
                selected = [item];
                onDelete();
              }
            "
          >
            <Trash />
            <span class="text-base">Eliminar</span></Button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== Vista Desktop (Tabla) ========== */

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

/* ========== Vista Mobile (Cards) ========== */

.op-cards-container {
  display: none;
  gap: 1rem;
  flex-direction: column;
}

.op-empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--p-text-muted-color);
  font-size: 1rem;
}

.op-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.5rem;
  background: var(--p-surface-card);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
}

.op-card-selected {
  border-color: var(--p-primary-color);
  box-shadow: 0 0 0 1px var(--p-primary-color);
}

.op-card:active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:global(.p-dark) .op-card:active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.op-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--p-content-border-color);
  background: var(--p-surface-50);
}

:global(.p-dark) .op-card-header {
  background: var(--p-surface-800);
}

.op-card-select {
  display: flex;
  align-items: center;
}

.op-card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  flex: 1;
}

.op-card-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.op-card-label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
  letter-spacing: 0.5px;
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
  cursor: pointer;
}

:deep(.op-card-thumb) {
  width: 3rem;
  height: 3rem;
  object-fit: contain;
  border-radius: 0.375rem;
  background: var(--p-surface-100);
  padding: 0.125rem;
}

:global(.p-dark) :deep(.op-card-thumb) {
  background: var(--p-surface-700);
}

:deep(.op-card-set-thumb) {
  width: 3rem;
  height: 3rem;
  object-fit: cover;
  border-radius: 0.375rem;
}

.op-card-item-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
  flex: 1;
}

.op-card-link {
  color: var(--p-text-color);
  font-weight: 600;
  text-decoration: none;
  word-break: break-word;
}

.op-card-link:active {
  color: var(--p-primary-color);
  text-decoration: underline;
}

.op-card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--p-content-border-color);
}

.op-card-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.op-card-color-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  word-break: break-word;
}

.op-card-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--p-content-border-color);
  background: var(--p-surface-50);
  justify-content: space-between;
}

:global(.p-dark) .op-card-actions {
  background: var(--p-surface-800);
}

:deep(.op-card-actions .p-button) {
  flex: 1;
}

/* ========== Media Queries ========== */

@media (max-width: 1023px) {
  .op-table-container {
    display: none;
  }

  .op-cards-container {
    display: flex;
  }

  .op-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    min-width: auto;
  }

  .op-toolbar-left,
  .op-toolbar-right {
    min-width: unset;
    width: 100%;
  }

  .op-toolbar-left {
    flex-direction: column;
  }

  .op-toolbar-right {
    justify-content: stretch;
  }

  :deep(.op-toolbar-right .p-inputgroup) {
    width: 100%;
  }

  :deep(.op-toolbar-right .p-inputtext) {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .op-card-header {
    padding: 0.5rem 0.75rem;
  }

  .op-card-content {
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .op-card-actions {
    padding: 0.5rem 0.75rem;
    flex-wrap: wrap;
  }

  :deep(.op-card-actions .p-button) {
    min-width: calc(50% - 0.25rem);
  }
}
</style>
