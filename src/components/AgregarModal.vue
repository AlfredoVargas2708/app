<template>
  <div class="flex flex-column align-items-center w-full h-full">
    <div class="info-container">
      <div class="element-info">
        <h2 class="my-0 w-full">Información Pieza</h2>
        <div class="element-inputs">
          <div class="element-input" v-for="elementField in elementFields">
            <label :for="elementField" class="capitalize pl-1">{{
              getElementLabel(elementField)
            }}</label>
            <InputText :model-value="getElementField(elementField)" disabled />
          </div>
        </div>
      </div>
      <div class="set-info">
        <h2 class="my-0 w-full">Información Set</h2>
        <div class="set-inputs">
          <div class="set-input" v-for="setField in setFields">
            <label :for="setField" class="capitalize pl-1">{{
              getSetLabel(setField)
            }}</label>
            <InputGroup>
              <InputText
                :model-value="getSetField(setField)"
                :disabled="
                  setField !== 'set_num' && getSetField(setField) !== ''
                "
                @input="onSetInput(setField, $event)"
              />
              <InputGroupAddon
                v-if="
                  setField === 'set_num' &&
                  getSetField(setField) !== '' &&
                  setSearchLoading
                "
              >
                <Spinner :size="24" spin
              /></InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>
    </div>
    <Divider layout="vertical" class="section-divider divider-vertical" />
    <Divider class="divider-horizontal" />
    <div class="extra-info">
      <div class="imagenes-container">
        <h2 class="my-0 w-full">Imágenes Elementos</h2>
        <div class="imagenes">
          <div class="element-img">
            <img :src="getElementImg()" alt="" />
          </div>
          <div class="set-img">
            <img :src="getSetImg()" alt="" />
          </div>
        </div>
      </div>
      <div class="extra-container">
        <h2 class="my-0 w-full">Información Pedido</h2>
        <div class="extra-inputs">
          <div class="task-input">
            <label class="pl-1" for="task">N° Task</label>
            <InputNumber
              v-model="taskValue"
              placeholder="Ingresar Número Task"
            />
          </div>
          <div class="pedido-input">
            <label class="pl-1" for="pedido">Orden Pedida</label>
            <Select
              placeholder="Seleccione Opción"
              v-model="isPedidoValue"
              :options="selectOptions"
              show-clear
            />
          </div>
          <div class="quantity-input">
            <label class="pl-1" for="task">Cantidad Pedida</label>
            <InputNumber
              v-model="quantityValue"
              placeholder="Ingresar Cantidad Pieza Pedida"
            />
          </div>
          <div class="completo-input">
            <label class="pl-1" for="pedido">Pedido Completo</label>
            <Select
              placeholder="Seleccione Opción"
              v-model="isAppearedValue"
              :options="selectOptions"
              show-clear
            />
          </div>
        </div>
        <div class="actions-container">
          <Button
            severity="danger"
            outlined
            aria-label="Cancelar"
            @click="cancelOperation"
          >
            <span>Cancelar</span>
            <Times :size="24" />
          </Button>
          <Button
            severity="success"
            outlined
            aria-label="Aceptar"
            @click="createOperation"
          >
            <span>Aceptar</span>
            <Check />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DynamicDialogInstance } from "primevue/dynamicdialogoptions";
import { inject, ref, type Ref } from "vue";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Select from "primevue/select";
import Button from "primevue/button";
import Times from "@primeicons/vue/times";
import Check from "@primeicons/vue/check";
import Divider from "primevue/divider";
import { useDebounceFn } from "@vueuse/core";
import { useSetsStore } from "@/stores/sets.store";
import { storeToRefs } from "pinia";
import type { SetInterface } from "@/interfaces/set.interface";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import Spinner from "@primeicons/vue/spinner";
import { useToast } from "primevue/usetoast";

const dialogRef = inject<Ref<DynamicDialogInstance>>("dialogRef");
const extraData = ref<unknown | null>(dialogRef?.value.data.extra);
const setsStore = useSetsStore();
const { setSearch, setSearchError, setSearchLoading } = storeToRefs(setsStore);
const toast = useToast();

const elementFields = [
  "element_id",
  "element_name",
  "color_name",
  "part_cat_name",
] as const;

const setFields = ["set_num", "name", "theme_name"] as const;

const getElementField = (field: (typeof elementFields)[number]): string => {
  const value = (dialogRef?.value.data.data as Record<string, unknown>)?.[
    field
  ];
  return value == null ? "" : String(value);
};

const getSetField = (field: (typeof setFields)[number]): string => {
  const value = (extraData.value as Record<string, unknown>)?.[field];
  return value == null ? "" : String(value).replace("-1", "");
};

const getElementLabel = (field: string) => {
  return field
    .split("_")
    .join(" ")
    .replace("element", "")
    .replace("color", "")
    .replace("part", "");
};

const getSetLabel = (field: string) => {
  return field.split("_").join(" ");
};

const getElementImg = () => {
  return dialogRef?.value.data.data["element_img_url"];
};

const getSetImg = () => {
  const url = (extraData.value as SetInterface | null)?.set_img_url;
  return url || "/one_missing_brick.png";
};

const taskValue = ref<number | null>(null);
const isPedidoValue = ref<string | null>(null);
const isAppearedValue = ref<string | null>(null);
const quantityValue = ref<number | null>(null);
const selectOptions = ref<string[]>(["Si", "No"]);

const onSetInput = (field: (typeof setFields)[number], event: Event) => {
  if (field !== "set_num") return;
  searchExtraData((event.target as HTMLInputElement).value);
};

const searchExtraData = useDebounceFn(async (setNum: string) => {
  if (!setNum) return;

  const normalized = setNum.includes("-") ? setNum : `${setNum}-1`;
  await setsStore.getSet(normalized, true);

  if (setSearchError.value) return; // no pises extraData si falló
  extraData.value = setSearch.value;
}, 800);

function cancelOperation() {
  dialogRef?.value.close();
}

function createOperation() {
  if (
    !extraData.value ||
    !taskValue.value ||
    !isPedidoValue.value ||
    !isAppearedValue.value ||
    !quantityValue.value
  ) {
    toast.removeAllGroups();
    toast.add({
      severity: "error",
      summary: "Faltan Campos",
      detail: "Faltan valores para agregar el pedido al inventario",
      life: 4000,
    });
    return;
  }

  const data = {
    ...dialogRef?.value.data.data,
    ...extraData.value,
    task: taskValue.value,
    pedido: isPedidoValue.value === "Si" ? true : false,
    completo: isAppearedValue.value === "Si" ? true : false,
    cantidad: quantityValue.value,
  };

  dialogRef?.value.close(data);
}
</script>

<style scoped>
.info-container,
.extra-info {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  width: 100%;
  gap: 1rem;
}

.element-info,
.set-info,
.extra-container,
.imagenes-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.element-inputs,
.set-inputs,
.extra-inputs {
  display: grid;
  align-items: center;
  gap: 2rem;
  width: 100%;
}

.element-inputs,
.set-inputs {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.extra-inputs {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.element-input,
.set-input,
.task-input,
.pedido-input,
.quantity-input,
.completo-input {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 5px;
  width: 100%;

  .p-inputtext,
  .p-select,
  .p-inputnumber {
    width: 100%;
  }
}

.actions-container {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 1rem;
  margin-bottom: 10px;
}

.imagenes {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;

  .element-img,
  .set-img {
    width: 150px;
    height: 150px;

    img {
      width: 100%;
      height: 100%;
    }
  }
}

.section-divider {
  align-self: stretch;
}

.section-divider::before {
  border-inline-start-width: 3px;
}

/* El divisor horizontal solo aparece cuando la grilla pasa a 1 columna */
.divider-vertical {
  display: none;
}

@media (max-width: 960px) {
  .info-container,
  .extra-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .divider-vertical {
    display: none;
  }

  .divider-horizontal {
    display: flex;
    margin: 0.5rem 0;
  }
}
</style>
