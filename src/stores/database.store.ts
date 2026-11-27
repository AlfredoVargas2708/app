import type { Operation } from "@/interfaces/database.interface";
import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";

const URL = import.meta.env.VITE_API_URL;
type FilterValue =
  | string
  | number
  | boolean
  | { min?: number | null; max?: number | null };

export const useDatabaseStore = defineStore("database", () => {
  const createError = ref<unknown | null>(null);
  const createSuccess = ref<boolean>(false);
  const editSucces = ref<boolean>(false);
  const inventario = ref<Operation[]>([]);
  const inventarioLoading = ref<boolean>(false);
  const inventarioError = ref<unknown | null>(null);
  const inventarioRows = ref<number>(5);
  const inventarioFisrt = ref<number>(0);
  const inventarioTotal = ref<number>(1);
  const sortField = ref<string | null>(null);
  const sortOrder = ref<string | null>(null);
  const columnFilters = ref<Record<string, FilterValue>>({});
  const editError = ref<unknown | null>(null);
  const deleteError = ref<unknown | null>(null);
  const deleteSucces = ref<boolean>(false);

  async function createOperation(body: unknown) {
    createSuccess.value = false;
    try {
      await axios.post(`${URL}/database/create`, body);
      createSuccess.value = true; // ✅ Éxito
    } catch (error) {
      createError.value = error;
    }
  }

  async function getOperations() {
    inventarioError.value = null;
    inventarioLoading.value = true;

    try {
      // Limpiar filtros vacíos antes de enviar
      const activeFilters: Record<string, FilterValue> = {};

      for (const [key, val] of Object.entries(columnFilters.value)) {
        if (val === "" || val == null) continue;

        // Si es un objeto de rango { min, max }, solo incluirlo si al menos uno tiene valor
        if (typeof val === "object" && !Array.isArray(val)) {
          const cleanRange: { min?: number; max?: number } = {};
          if (val.min != null) cleanRange.min = Number(val.min);
          if (val.max != null) cleanRange.max = Number(val.max);

          if (Object.keys(cleanRange).length > 0) {
            activeFilters[key] = cleanRange;
          }
        } else {
          activeFilters[key] = val;
        }
      }

      const hasFilters = Object.keys(activeFilters).length > 0;

      const { data } = await axios.get(`${URL}/database`, {
        params: {
          page: inventarioFisrt.value + 1,
          rows: inventarioRows.value,
          sortField: sortField.value ?? undefined,
          sortOrder: sortOrder.value ?? undefined,
          filter: hasFilters ? JSON.stringify(activeFilters) : undefined,
        },
      });

      inventario.value = data.rows;
      inventarioTotal.value = data.count;
    } catch (error) {
      inventarioError.value = error;
    } finally {
      inventarioLoading.value = false;
    }
  }

  async function editStatus(
    id: number,
    body: { field: string; value: boolean },
  ) {
    editSucces.value = false;
    editError.value = null;

    try {
      await axios.put(`${URL}/database/status/${id}`, body);
      editSucces.value = true;
    } catch (error) {
      editError.value = error;
    }
  }

  async function editOperation(operation: Operation, field: keyof Operation) {
    editError.value = null;
    editSucces.value = false;

    try {
      const { data } = await axios.put<Element>(
        `${URL}/database/edit-operation/${operation.operation_id}`,
        { field, value: operation[field] },
      );

      editSucces.value = true;
      return data;
    } catch (error) {
      editError.value = error;
      return null;
    }
  }

  async function deleteOperation(id: number) {
    deleteError.value = null;
    deleteSucces.value = false;

    try {
      await axios.delete(`${URL}/database/delete-operation/${id}`);
      deleteSucces.value = true;
    } catch (error) {
      deleteError.value = error;
    }
  }

  return {
    createError,
    createOperation,
    createSuccess,
    inventario,
    inventarioError,
    inventarioLoading,
    getOperations,
    inventarioRows,
    inventarioFisrt,
    inventarioTotal,
    sortField,
    sortOrder,
    columnFilters,
    editError,
    editStatus,
    editOperation,
    editSucces,
    deleteError,
    deleteSucces,
    deleteOperation
  };
});
