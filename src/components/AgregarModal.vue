<template>
  <div class="flex flex-column align-items-center w-full h-full">
    <div class="info-container" :class="{ piece: !isMinifigura }">
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
        <div
          class="set-inputs"
          :class="{ minifigura: !getSetField('theme_name') }"
        >
          <template v-if="!isMinifigura">
            <div
              class="set-input"
              v-for="setField in setFields"
              :key="setField"
            >
              <label :for="setField" class="capitalize pl-1">{{
                getSetLabel(setField)
              }}</label>
              <InputGroup>
                <InputText
                  :model-value="getSetField(setField)"
                  :disabled="disabledInput(setField)"
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
          </template>
          <template  v-if="isMinifigura">
            <div class="set-input">
              <label class="pl-1" for="set-select">Set a agregar</label>
              <Select
                input-id="set-select"
                v-model="selectedSet"
                :options="setOptions"
                option-label="set_num"
                placeholder="Seleccione el set"
                :disabled="setOptions.length === 1"
                :show-clear="setOptions.length > 1"
                filter
                @change="onSetSelected($event.value)"
              >
                <template #option="{ option }">{{
                  getSetLabelText(option)
                }}</template>
                <template #value="{ value, placeholder }">
                  <span v-if="value">{{ getSetLabelText(value) }}</span>
                  <span v-else>{{ placeholder }}</span>
                </template>
              </Select>
              <small v-if="!setOptions.length"
                >Esta minifigura no aparece en ningún set.</small
              >
            </div>
            <div class="set-input">
              <label class="pl-1">Theme</label>
              <InputText :model-value="getSetField('theme_name')" disabled />
            </div>
          </template>
        </div>
      </div>
      <div class="minifig-info" v-if="isMinifigura">
        <h2 class="my-0 w-full">Información Minifigura</h2>
        <div
          class="minifig-inputs"
          :class="{ minifigura: !getSetField('theme_name') }"
        >
          <div class="minifig-input" v-for="minifigField in minifigFields">
            <label :for="minifigField" class="capitalize pl-1">{{
              getSetLabel(minifigField)
            }}</label>
            <InputText
              :model-value="getMinifigField(minifigField)"
              :disabled="disabledInput(minifigField)"
            />
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
          <div class="minifig-img" v-if="isMinifigura">
            <img :src="getMinifigImg()" alt="" />
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
              :useGrouping="false"
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
          <div class="quantity-input relative">
            <label class="pl-1" for="quantity">Cantidad Pedida</label>
            <InputGroup>
              <InputNumber
                v-model="quantityValue"
                input-id="quantity"
                :placeholder="`Ingresar Cantidad Pieza Pedida. ${setPartQuantity ? `Máx: ${setPartQuantity}` : ''}`"
                :disabled="setPartQuantityLoading"
                @input="onQuantityInput"
              />
              <InputGroupAddon v-if="setPartQuantityLoading">
                <Spinner spin :size="24" />
              </InputGroupAddon>
            </InputGroup>
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
import { inject, onMounted, ref, type Ref } from "vue";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import type { InputNumberInputEvent } from "primevue/inputnumber";
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
import type { Element } from "@/interfaces/element.interface";
import type { MinifigInterface } from "@/interfaces/minifig.interface";

const dialogRef = inject<Ref<DynamicDialogInstance>>("dialogRef");
const extraData = ref<SetInterface | null>(dialogRef?.value.data.extra ?? null);
const minifigData = ref<MinifigInterface | null>(
  dialogRef?.value.data.minifigData ?? null,
);
const isMinifigura = ref<boolean | undefined>(dialogRef?.value.data.minifigura);
const setOptions = ref<SetInterface[]>(dialogRef?.value.data.setOptions ?? []);
const selectedSet = ref<SetInterface | null>(extraData.value);

const setsStore = useSetsStore();
const {
  setSearch,
  setSearchError,
  setSearchLoading,
  setPartQuantity,
  setPartQuantityError,
  setPartQuantityLoading,
} = storeToRefs(setsStore);
const toast = useToast();

const elementFields = [
  "element_id",
  "element_name",
  "color_name",
  "part_cat_name",
] as const;

const setFields = ["set_num", "name", "theme_name"] as const;
const minifigFields = ["set_num", "name"];

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

const getSetLabelText = (set: SetInterface) =>
  `${set.set_num.replace("-1", "")} - ${set.name}`;

const onSetSelected = async (set: SetInterface | null) => {
  extraData.value = set;
  setPartQuantity.value = null;
  if (!set) return;

  const normalized = set.set_num.includes("-")
    ? set.set_num
    : `${set.set_num}-1`;
  await getQuantity(normalized);
};

const getMinifigField = (field: (typeof minifigFields)[number]): string => {
  const value = (minifigData.value as Record<string, unknown>)?.[field];
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

const getMinifigImg = () => {
  const url = minifigData.value?.set_img_url;
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
  if (!setNum) {
    extraData.value = null;
    return;
  }

  const normalized = setNum.includes("-") ? setNum : `${setNum}-1`;
  await setsStore.getSet(normalized, true);

  if (setSearchError.value) {
    extraData.value = null; // el set no existe: vuelve a habilitar los campos
    return;
  }
  extraData.value = setSearch.value;

  await getQuantity(normalized);
}, 800);

const getQuantity = async (normalized: string) => {
  const elementId = (dialogRef?.value.data.data as Element).element_id;
  await Promise.all([setsStore.getSetPartQuantity(normalized, elementId)]);

  if (setPartQuantityError.value) {
    toast.add({
      severity: "error",
      summary: "Error Al Buscar Cantidad Máxima Pieza En Set",
      detail: "No se encontro el set que contiene la pieza",
    });
    return;
  }
};

const typedQuantity = ref<number | null>(null);

const onQuantityInput = (event: InputNumberInputEvent) => {
  typedQuantity.value = typeof event.value === "number" ? event.value : null;
};

const disabledInput = (setField: string): boolean => {
  if (isMinifigura.value) return true;
  if (!extraData.value) return false;
  return setField !== "set_num";
};

function cancelOperation() {
  extraData.value = null;
  minifigData.value = null;
  setPartQuantity.value = null;
  dialogRef?.value.close();
}

function createOperation() {
  if (
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

  if (isMinifigura.value && !extraData.value) {
    toast.add({
      severity: "error",
      summary: "Falta Set",
      detail: "Debes seleccionar el set donde está la minifigura",
      life: 4000,
    });
    return;
  }

  const data = {
    ...dialogRef?.value.data.data,
    ...(extraData.value ?? {}),
    task: taskValue.value,
    pedido: isPedidoValue.value === "Si" ? true : false,
    completo: isAppearedValue.value === "Si" ? true : false,
    cantidad: quantityValue.value,
  };

  extraData.value = null;
  minifigData.value = null;
  setPartQuantity.value = null;
  dialogRef?.value.close(data);
}

const normalizeSetNum = (n: string) => (n.includes("-") ? n : `${n}-1`);

onMounted(async () => {
  if (!extraData.value) return;
  await getQuantity(normalizeSetNum(extraData.value.set_num));
});
</script>

<style scoped>
.info-container,
.extra-info {
  display: grid;
  width: 100%;
  gap: 1rem;

  &.piece {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

.info-container {
  grid-template-columns: minmax(0, 2.5fr) minmax(0, 1fr) minmax(0, 1fr);
}

.extra-info {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.element-info,
.set-info,
.minifig-info,
.extra-container,
.imagenes-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.element-inputs,
.set-inputs,
.extra-inputs,
.minifig-inputs {
  display: grid;
  align-items: center;
  gap: 2rem;
  width: 100%;
}

.element-inputs,
.set-inputs,
.minifig-inputs {
  grid-template-columns: repeat(2, minmax(0, 1fr));

  &.minifigura {
    grid-template-columns: repeat(1, 1fr);

    div:nth-child(3) {
      display: none;
    }
  }
}

.extra-inputs {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.element-input,
.set-input,
.task-input,
.pedido-input,
.quantity-input,
.completo-input,
.minifig-input {
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
  .set-img,
  .minifig-img {
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

@media (max-width: 1300px) {
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
