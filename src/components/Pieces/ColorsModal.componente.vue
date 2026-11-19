<template>
  <div class="colors">
    <div class="color" v-for="color in colors" :key="color.color_id">
      <div
        class="color-box"
        :style="{ 'background-color': `#${color.color_rgb}` }"
      ></div>
      <span
        class="text-base hover:underline cursor-pointer capitalize"
        @click="changeColorValue(color)"
        >{{ color.color_name }}</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColorElement } from "@/interfaces/color.interface";
import type { DynamicDialogInstance } from "primevue/dynamicdialogoptions";
import { computed, inject, type Ref } from "vue";

const dialogRef = inject<Ref<DynamicDialogInstance>>("dialogRef");
const colors = computed<ColorElement[]>(() => {
  return dialogRef?.value.data;
});

function changeColorValue(color: ColorElement) {
  dialogRef?.value.close({ color });
}
</script>

<style scoped>
.colors {
  display: grid;
  grid-template-columns: repeat(5, 200px);
  gap: 10px;
}

.color {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-box {
  width: 20px;
  height: 20px;
  border: 1px solid #000000;
  border-radius: 6px;
}
</style>
