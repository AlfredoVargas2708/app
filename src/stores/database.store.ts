import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";

const URL = import.meta.env.VITE_API_URL;

export const useDatabaseStore = defineStore("database", () => {
  const createError = ref<unknown | null>(null);

  async function createOperation(body: unknown) {
    try {
      await axios.post(`${URL}/database/create`, body);
    } catch (error) {
      createError.value = error;
    }
  }

  return {
    createError,
    createOperation,
  };
});
