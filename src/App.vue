<script setup lang="ts">
import { RouterView } from "vue-router";
import DynamicDialog from "primevue/dynamicdialog";
import Toast from "primevue/toast";
import { watch, type Ref } from "vue";
import { useElementStore } from "./stores/element.store";
import { storeToRefs } from "pinia";
import { useSetsStore } from "./stores/sets.store";
import { useDatabaseStore } from "./stores/database.store";
import { useToast } from "primevue/usetoast";
import { useMinifigStore } from "./stores/minifig.store";
import ConfirmPopup from 'primevue/confirmpopup';

const { elementError, partCategoriesError, createElementError } =
  storeToRefs(useElementStore());
const {
  instructionsError,
  setColorsError,
  setMinifigsError,
  setPartQuantityError,
  setError,
  setPartsError,
  setMinifigs,
  setParts,
  createSetError,
} = storeToRefs(useSetsStore());
const {
  createError,
  inventarioError,
  createSuccess,
  editSucces,
  editError,
  deleteError,
  deleteSucces,
} = storeToRefs(useDatabaseStore());
const { minifigError, partsError, setsError } = storeToRefs(useMinifigStore());

const toast = useToast();

interface ErrorToast {
  error: Ref<unknown>;
  summary: string;
  detail: string;
  onError?: () => void; // limpieza opcional del estado
}

const errorToasts: ErrorToast[] = [
  {
    error: elementError,
    summary: "Error Al Buscar Código",
    detail: "No existe pieza con el código ingresado",
  },
  {
    error: setError,
    summary: "Error Al Buscar Set",
    detail: "No existe set con el código ingresado.",
  },
  {
    error: minifigError,
    summary: "Error Al Buscar Minifigura",
    detail: "No existe minifigura con el código ingresado.",
  },
  {
    error: partsError,
    summary: "Error Al Buscar Piezas De Minifigura",
    detail: "Hubo un error al encontrar las piezas de la minifigura.",
  },
  {
    error: setMinifigsError,
    summary: "Error Al Buscar Sets Con Minifigura",
    detail: "Hubo un error al encontrar los sets con la minifigura.",
  },
  {
    error: setMinifigsError,
    summary: "Error Al Obtener Minifiguras",
    detail: "Hubo un error al encontrar las minifiguras en el set.",
    onError: () => (setMinifigs.value = null),
  },
  {
    error: setPartsError,
    summary: "Error Al Obtener Piezas",
    detail: "Hubo un error al encontrar las piezas en el set.",
    onError: () => (setParts.value = null),
  },
  {
    error: setColorsError,
    summary: "Error Al Obtener Colores Set",
    detail: "Hubo un error al encontrar colores en el set.",
  },
  {
    error: partCategoriesError,
    summary: "Error Al Obtener Categorías",
    detail: "Hubo un error al encontrar las categorías.",
  },
  {
    error: createError,
    summary: "Error Al Crear Pedido",
    detail: "Error en creación de nuevo pedido",
  },
  {
    error: instructionsError,
    summary: "Error Al Obtener Instrucciones",
    detail: "Hubo un error al encontrar las instrucciones del set.",
  },
  {
    error: setPartQuantityError,
    summary: "Error Al Buscar Cantidad Máxima Pieza En Set",
    detail: "No se encontró el set que contiene la pieza",
  },
  {
    error: inventarioError,
    summary: "Error Al Obtener Inventario",
    detail: "No se pudo obtener los pedidos en el inventario",
  },
  {
    error: editError,
    summary: "Error Al Editar Inventario",
    detail: "No se pudo editar el pedidos del inventario",
  },
  {
    error: createElementError,
    summary: "Error Al Crear Pieza",
    detail: "Error en creación de nueva pieza",
  },
  {
    error: createSetError,
    summary: "Error Al Crear Set",
    detail: "Error en creación de nuevo set",
  },
  {
    error: deleteError,
    summary: "Error Al Eliminar Pedido",
    detail: "Error en la eliminación del pedido",
  },
];

errorToasts.forEach(({ error, summary, detail, onError }) => {
  watch(error, (value) => {
    if (!value) return;
    onError?.();
    toast.add({ severity: "error", summary, detail, life: 4000 });
  });
});

watch(createSuccess, (success) => {
  if (success) {
    toast.add({
      severity: "success",
      summary: "Pedido Creado",
      detail: "Se agrego el pedido al inventario correctamente",
      life: 4000,
    });
  }
});

watch(editSucces, (success) => {
  if (success) {
    toast.add({
      severity: "success",
      summary: "Operación Editada",
      detail: "Se edito el pedido del inventario correctamente",
      life: 4000,
    });
  }
});

watch(deleteSucces, (success) => {
  if (success) {
    toast.add({
      severity: "success",
      summary: "Operación Eliminada",
      detail: "Se elimino el pedido del inventario correctamente",
      life: 4000,
    });
  }
});
</script>

<template>
  <RouterView />
  <DynamicDialog />
  <ConfirmPopup />
  <Toast />
</template>

<style>
.page-title {
  font-size: 2.25rem;
  margin: 0.67em 0;
}

@media (max-width: 991px) {
  .page-title {
    font-size: 1.875rem;
  }
}

@media (max-width: 767px) {
  .page-title {
    font-size: 1.5rem;
    margin: 0.5em 0;
  }
}
</style>
