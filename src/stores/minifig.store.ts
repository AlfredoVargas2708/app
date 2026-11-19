import { type Element } from "@/interfaces/element.interface";
import { type MinifigInterface } from "@/interfaces/minifig.interface";
import { type SetInterface } from "@/interfaces/set.interface";
import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";

const URL = import.meta.env.VITE_API_URL;

export const useMinifigStore = defineStore("minifigs", () => {
  const partsLoading = ref<boolean>(false);
  const partsError = ref<unknown | null>(null);
  const minifigParts = ref<Element[] | null>(null);
  const minifig = ref<MinifigInterface | null>(null);
  const minifigError = ref<unknown | null>(null);
  const minigifLoading = ref<boolean>(false);
  const partsFirst = ref<number>(0);
  const partsRows = ref<number>(5);
  const partsTotal = ref<number>(1);
  const minifigSets = ref<SetInterface[] | null>(null);
  const setsLoading = ref<boolean>(false);
  const setsError = ref<unknown | null>(null);
  const setsFirst = ref<number>(0);
  const setsRows = ref<number>(5);
  const setsTotal = ref<number>(1);

  async function getMinifigParts(set_num: string, page = 1, page_size = 5) {
    partsLoading.value = true;
    partsError.value = null;

    try {
      const { data } = await axios.get<{ results: Element[]; count: number }>(
        `${URL}/minifigs/parts`,
        {
          params: { set_num, page, page_size },
        },
      );

      partsTotal.value = data.count;
      minifigParts.value = data.results;
      return data.results;
    } catch (error) {
      partsError.value = error;
    } finally {
      partsLoading.value = false;
    }
  }

  async function getMinifig(set_num: string) {
    minigifLoading.value = true;
    minifigError.value = null;

    try {
      const { data } = await axios.get<MinifigInterface>(`${URL}/minifigs`, {
        params: { set_num },
      });

      minifig.value = data;
    } catch (error) {
      minifigError.value = error;
    } finally {
      minigifLoading.value = false;
    }
  }

  async function getMinifigSets(set_num: string, page = 1, page_size = 5) {
    setsLoading.value = true;
    setsError.value = null;

    try {
      const { data } = await axios.get<{
        results: SetInterface[];
        count: number;
      }>(`${URL}/minifigs/sets`, {
        params: { set_num, page, page_size },
      });

      setsTotal.value = data.count;
      minifigSets.value = data.results;
    } catch (error) {
      setsError.value = error;
    } finally {
      setsLoading.value = false;
    }
  }

  return {
    partsLoading,
    partsError,
    partsFirst,
    partsRows,
    partsTotal,
    getMinifigParts,
    minifig,
    minifigError,
    minigifLoading,
    getMinifig,
    getMinifigSets,
    minifigSets,
    minifigParts,
    setsError,
    setsFirst,
    setsLoading,
    setsRows,
    setsTotal,
  };
});
