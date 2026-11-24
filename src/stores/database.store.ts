import type { Operation } from "@/interfaces/database.interface";
import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";

const URL = import.meta.env.VITE_API_URL;

export const useDatabaseStore = defineStore("database", () => {
  const createError = ref<unknown | null>(null);
  const createSuccess = ref<boolean>(false);
  const inventario = ref<Operation[]>([]);
  const inventarioLoading = ref<boolean>(false);
  const inventarioError = ref<unknown | null>(null);
  const inventarioRows = ref<number>(5);
  const inventarioFisrt = ref<number>(0);
  const inventarioTotal = ref<number>(1);

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
      const { data } = await axios.get<{ count: number; rows: Operation[] }>(
        `${URL}/database`,
      );

      inventario.value = data.rows;
      inventarioTotal.value = data.count;
    } catch (error) {
      inventarioError.value = error;
    } finally {
      inventarioLoading.value = false;
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
  };
});
