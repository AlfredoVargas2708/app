<template>
  <div class="flex flex-column align-items-center gap-3 px-2 md:px-4">
    <h1 class="page-title text-center">Inventario Piezas LEGO</h1>
    <div class="flex flex-row align-items-start w-full">
      <Tabs v-model:value="tabValue" class="w-full">
        <TabList>
          <Tab
            v-for="tab in tabs"
            :key="tab.id"
            :value="tab.id"
            :disabled="tab.disabled"
            :style="{ 'min-width': '100px' }"
            ><span class="text-base md:text-xl">{{ tab.title }}</span></Tab
          >
        </TabList>
        <TabPanels class="tab-panel">
          <TabPanel v-for="tab in tabs" :key="tab.id" :value="tab.id">
            <div class="flex flex-column w-full gap-3">
              <div class="flex flex-row justify-content-start w-full">
                <Button outlined aria-label="Ver Inventario" severity="info" @click="openInventario">
                  <Box :size="24" />
                  <span class="text-base">Ver Inventario</span>
                </Button>
              </div>
              <component :is="tab.content" :tab-value="tabValue" />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import Tabs from "primevue/tabs";
import TabList from "primevue/tablist";
import Tab from "primevue/tab";
import TabPanels from "primevue/tabpanels";
import TabPanel from "primevue/tabpanel";
import { markRaw, ref } from "vue";
import PieceContent from "@/components/Pieces/Piece.content.vue";
import SetContent from "@/components/Sets/Set.content.vue";
import MinifigContent from "@/components/Minifigs/Minifig.content.vue";
import Button from "primevue/button";
import Box from "@primeicons/vue/box";
import { useRouter } from "vue-router";

const tabs = ref([
  {
    id: "pieza",
    title: "Pieza",
    content: markRaw(PieceContent),
    disabled: false,
  },
  {
    id: "set",
    title: "Set",
    content: markRaw(SetContent),
    disabled: false,
  },
  {
    id: "minifig",
    title: "Minifiguras",
    content: markRaw(MinifigContent),
    disabled: false,
  },
]);
const tabValue = ref<string>("pieza");
const router = useRouter();

function openInventario() {
  router.push({ path: "/inventario" });
}
</script>

<style scoped>
.tab-panel {
  box-shadow:
    rgba(0, 0, 0, 0.12) 0px 1px 3px,
    rgba(0, 0, 0, 0.24) 0px 1px 2px;
}

/* Móvil */
@media (max-width: 767px) {
  .tab-panel {
    padding: 0.25rem;
  }
}
</style>
