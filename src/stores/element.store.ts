import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import type { Element } from "@/interfaces/element.interface";
import type { ColorElement } from "@/interfaces/color.interface";
import type { SetInterface } from "@/interfaces/set.interface";
import type { PartCategory } from "@/interfaces/part-categories.interface";

const URL = import.meta.env.VITE_API_URL;

export const useElementStore = defineStore("element", () => {
  const element = ref<Element | null>(null);
  const elementError = ref<unknown | null>(null);
  const elementLoading = ref<boolean>(false);
  const elementColors = ref<ColorElement[] | null>(null);
  const elementColorsSelect = ref<ColorElement[] | null>(null);
  const elementColorsError = ref<unknown | null>(null);
  const elementColorsLoading = ref<boolean>(false);
  const elementColorsTotal = ref<number>(0);
  const elementSets = ref<SetInterface[] | null>(null);
  const elementSetsError = ref<unknown | null>(null);
  const elementSetsLoading = ref<boolean>(false);
  const elementSetsTotal = ref<number>(0);
  const elementColorsFirst = ref<number>(0);
  const elementColorsRows = ref<number>(5);
  const elementSetsFirst = ref<number>(0);
  const elementSetsRows = ref<number>(5);
  const partCategories = ref<PartCategory[] | null>(null);
  const partCategoriesError = ref<unknown | null>(null);
  const createElementError = ref<unknown | null>(null);

  async function getElement(element_id: string) {
    element.value = null;
    elementColors.value = null;
    elementColorsSelect.value = null;
    elementSets.value = null;
    elementColorsTotal.value = 0;
    elementSetsTotal.value = 0;
    elementError.value = null;
    elementColorsError.value = null;
    elementSetsError.value = null;
    elementLoading.value = true;
    elementColorsFirst.value = 0;
    elementColorsRows.value = 5;
    elementSetsFirst.value = 0;
    elementSetsRows.value = 5;

    try {
      const { data } = await axios.get<Element>(`${URL}/elements/element`, {
        params: { element_id },
      });

      element.value = data;
    } catch (error) {
      element.value = null;
      elementError.value = error;
    } finally {
      elementLoading.value = false;
    }
  }

  async function getElementColors(
    part_num: string,
    page = 1,
    page_size = 100,
    color_id?: number,
  ) {
    elementColorsError.value = null;
    elementColorsLoading.value = true;
    try {
      const { data } = await axios.get<{
        count: number;
        results: ColorElement[];
      }>(`${URL}/parts/colors`, {
        params: { part_num, page, page_size, color_id },
      });

      elementColors.value = data.results.slice(
        elementColorsFirst.value,
        elementColorsFirst.value + elementColorsRows.value,
      );
      elementColorsSelect.value = data.results;
      elementColorsTotal.value = data.count;
    } catch (error) {
      elementColorsError.value = error;
    } finally {
      elementColorsLoading.value = false;
    }
  }

  async function getElementSets(
    part_num: string,
    color_id: number,
    page = 1,
    page_size = 5,
    theme_id?: number,
    set_num?: string,
  ) {
    elementSetsError.value = null;
    elementSetsLoading.value = true;
    try {
      const { data } = await axios.get<{
        count: number;
        results: [];
      }>(`${URL}/parts/sets`, {
        params: { part_num, color_id, page, page_size, theme_id, set_num },
      });

      elementSets.value = data.results;
      elementSetsTotal.value = data.count;
    } catch (error) {
      elementSetsError.value = error;
    } finally {
      elementSetsLoading.value = false;
    }
  }

  async function getPartCategories() {
    partCategoriesError.value = null;

    try {
      const { data } = await axios.get<{ results: PartCategory[] }>(
        `${URL}/part-categories`,
      );

      partCategories.value = data.results;
    } catch (error) {
      partCategoriesError.value = error;
    }
  }

  async function createElement(element: Element): Promise<Element | void> {
    try {
      const { data } = await axios.put(`${URL}/elements/create`, element);
      return data;
    } catch (error) {
      createElementError.value = error;
    }
  }

  return {
    element,
    elementError,
    elementLoading,
    getElement,
    elementColors,
    elementColorsSelect,
    elementColorsError,
    elementColorsLoading,
    getElementColors,
    elementSets,
    elementSetsLoading,
    elementSetsError,
    getElementSets,
    elementColorsTotal,
    elementSetsTotal,
    elementColorsFirst,
    elementColorsRows,
    elementSetsFirst,
    elementSetsRows,
    partCategories,
    partCategoriesError,
    getPartCategories,
    createElement,
    createElementError
  };
});
