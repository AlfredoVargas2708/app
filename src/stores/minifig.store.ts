import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";

const URL = `${import.meta.env.VITE_API_URL}`;

export const useMinifigStore = defineStore("minifigs", () => {
  const partsLoading = ref<boolean>(false);
  const partsError = ref<unknown | null>(null);

  async function getMinifigParts(set_num: string, page = 1, page_size = 5) {
    partsLoading.value = true;
    partsError.value = null;

    try {
      const { data } = await axios.get(`${URL}/minifigs/parts`, {
        params: { set_num, page, page_size },
      });

      return data.results;
    } catch (error) {
      partsError.value = error;
    } finally {
      partsLoading.value = false;
    }
  }

  return {
    partsLoading,
    partsError,
    getMinifigParts,
  };
});
