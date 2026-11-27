import { undoNormalizeSet } from "@/helpers/helper";
import { type ColorSet } from "@/interfaces/color.interface";
import type { Element } from "@/interfaces/element.interface";
import type { MinifigInterface } from "@/interfaces/minifig.interface";
import type { SetInterface } from "@/interfaces/set.interface";
import type { ThemeInterface } from "@/interfaces/theme.interface";
import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";

const URL = import.meta.env.VITE_API_URL;

export const useSetsStore = defineStore("sets", () => {
  const instructions = ref<{ URL: string; description: string }[] | null>(null);
  const instructionsError = ref<unknown | null>(null);
  const instructionsLoading = ref<boolean>(false);
  const themesSet = ref<ThemeInterface[] | null>(null);
  const themesError = ref<unknown | null>(null);
  const setData = ref<SetInterface | null>(null);
  const setError = ref<unknown | null>(null);
  const setLoading = ref<boolean>(false);
  const setMinifigs = ref<MinifigInterface[] | null>(null);
  const setMinifigsLoading = ref<boolean>(false);
  const setMinifigsError = ref<unknown | null>(null);
  const setMinifigsTotal = ref<number>(0);
  const setMinifigsFirst = ref<number>(0);
  const setMinifigsRows = ref<number>(5);
  const setParts = ref<Element[] | null>(null);
  const setPartsLoading = ref<boolean>(false);
  const setPartsError = ref<unknown | null>(null);
  const setPartsTotal = ref<number>(0);
  const setPartsFirst = ref<number>(0);
  const setPartsRows = ref<number>(5);
  const setColors = ref<ColorSet[] | null>(null);
  const setColorsError = ref<unknown | null>(null);
  const setSearch = ref<SetInterface | null>(null);
  const setSearchLoading = ref<boolean>(false);
  const setSearchError = ref<unknown | null>(null);
  const setPartQuantity = ref<number | null>(null);
  const setPartQuantityError = ref<unknown | null>(null);
  const setPartQuantityLoading = ref<boolean>(false);
  const createSetError = ref<unknown | null>(null);

  async function getInstructions(set_num: string) {
    instructionsLoading.value = true;
    instructionsError.value = null;

    try {
      const { data } = await axios.get<
        {
          URL: string;
          description: string;
        }[]
      >(`${URL}/sets/instructions`, {
        params: { set_num },
      });

      instructions.value = data;
    } catch (error) {
      instructionsError.value = error;
      instructions.value = null;
    } finally {
      instructionsLoading.value = false;
    }
  }

  async function getThemes() {
    themesError.value = null;

    try {
      const { data } = await axios.get(`${URL}/themes`);

      themesSet.value = data.results;
    } catch (error) {
      themesError.value = error;
    }
  }

  async function getSet(set_num: string, in_modal: boolean) {
    const target = in_modal
      ? { loading: setSearchLoading, error: setSearchError, data: setSearch }
      : { loading: setLoading, error: setError, data: setData };

    target.loading.value = true;
    target.error.value = null;

    try {
      const { data } = await axios.get(`${URL}/sets/set`, {
        params: { set_num },
      });
      target.data.value = { ...data, set_num: undoNormalizeSet(data.set_num) };
    } catch (error) {
      target.data.value = null;
      target.error.value = error;
    } finally {
      target.loading.value = false;
    }
  }

  async function getMinifigsSet(set_num: string, page = 1, page_size = 5) {
    setMinifigsError.value = null;
    setMinifigsLoading.value = true;

    try {
      const { data } = await axios.get(`${URL}/sets/minifigs`, {
        params: { set_num, page, page_size },
      });

      setMinifigs.value = data.results;
      setMinifigsTotal.value = data.count;
    } catch (error) {
      setMinifigsError.value = error;
    } finally {
      setMinifigsLoading.value = false;
    }
  }

  async function getPartsSet(
    set_num: string,
    page = 1,
    page_size = 5,
    color_id: number | null,
    part_cat_id: number | null,
    element_id: string | null,
  ) {
    setPartsError.value = null;
    setPartsLoading.value = true;

    try {
      const { data } = await axios.get(`${URL}/sets/parts`, {
        params: { set_num, page, page_size, color_id, part_cat_id, element_id },
      });

      setParts.value = data.results;
      setPartsTotal.value = data.count;
    } catch (error) {
      setPartsError.value = error;
    } finally {
      setPartsLoading.value = false;
    }
  }

  async function getColorsSet(set_num: string) {
    setColorsError.value = null;

    try {
      const { data } = await axios.get<ColorSet[]>(`${URL}/sets/set-colors`, {
        params: { set_num },
      });

      setColors.value = data;
    } catch (error) {
      setColorsError.value = error;
    }
  }

  async function getSetPartQuantity(set_num: string, element_id: string) {
    setPartQuantityError.value = null;
    setPartQuantityLoading.value = true;

    try {
      const { data } = await axios.get<{ quantityElement: number }>(
        `${URL}/sets/quantity-part`,
        {
          params: { set_num, element_id },
        },
      );

      setPartQuantity.value = data.quantityElement;
    } catch (error) {
      setPartQuantityError.value = error;
    } finally {
      setPartQuantityLoading.value = false;
    }
  }

  async function createSet(set: SetInterface): Promise<SetInterface | void> {
    try {
      const { data } = await axios.put(`${URL}/sets/create`, set);
      return data;
    } catch (error) {
      createSetError.value = error;
    }
  }

  return {
    instructions,
    instructionsError,
    instructionsLoading,
    getInstructions,
    themesError,
    themesSet,
    getThemes,
    setData,
    setError,
    setLoading,
    getSet,
    setMinifigs,
    setMinifigsError,
    setMinifigsFirst,
    setMinifigsLoading,
    setMinifigsRows,
    setMinifigsTotal,
    getMinifigsSet,
    setParts,
    setPartsError,
    setPartsFirst,
    setPartsLoading,
    setPartsRows,
    setPartsTotal,
    getPartsSet,
    setColors,
    setColorsError,
    getColorsSet,
    setSearch,
    setSearchError,
    setSearchLoading,
    setPartQuantity,
    setPartQuantityError,
    setPartQuantityLoading,
    getSetPartQuantity,
    createSet,
    createSetError,
  };
});
