<template>
  <div class="flex flex-column align-items-center gap-2 w-full">
    <div class="flex flex-row align-items-start gap-3 w-full">
      <InputGroup :style="{ 'max-width': '300px' }">
        <InputText
          placeholder="Ingresar Código Minifigura..."
          size="large"
          v-model="searchValue"
          @input="onSearch"
        />
        <InputGroupAddon v-if="minigifLoading">
          <Spinner spin :size="26" />
        </InputGroupAddon>
      </InputGroup>
    </div>
    <div class="flex flex-column align-items-center w-full">
      <template v-if="minifig && !minigifLoading">
        <Table
          :value="[minifig]"
          table-class="minifigs-table-principal"
          :paginator="false"
        />
      </template>
      <Divider class="section-divider mb-0 mt-5" />
      <div class="extra-container w-full">
        <div class="flex flex-column align-items-start w-full gap-2">
          <template v-if="minifig && !minigifLoading">
            <h2 class="underline">Pieza Minifigura</h2>
            <div
              v-if="partsLoading"
              class="flex flex-column gap-3 w-full"
              aria-label="Cargando colores"
              aria-busy="true"
            >
              <Skeleton v-for="value in 4" :key="value" height="4rem" />
            </div>
            <div
              class="flex flex-column align-items-start gap-3 w-full"
              v-else-if="minifigParts"
            >
              <!--               <div class="flex flex-row align-items-center gap-2 w-full">
                <Select
                  v-model="colorSelected"
                  placeholder="Buscar Color..."
                  :options="elementColorsSelect.slice(0, 10)"
                  show-clear
                  :style="{ 'min-width': '180px' }"
                  @change="searchColor()"
                  size="large"
                >
                  <template #value="slotProps">
                    <div
                      v-if="slotProps.value"
                      class="flex align-items-center gap-2"
                    >
                      <div
                        class="color-box"
                        :style="{
                          'background-color': `#${slotProps.value.color_rgb}`,
                        }"
                      ></div>
                      <div>{{ slotProps.value.color_name }}</div>
                    </div>
                    <span v-else>{{ slotProps.placeholder }}</span>
                  </template>
                  <template #option="slotProps">
                    <div class="flex align-items-center gap-2">
                      <div
                        class="color-box"
                        :style="{
                          'background-color': `#${slotProps.option.color_rgb}`,
                        }"
                      ></div>
                      <div>{{ slotProps.option.color_name }}</div>
                    </div>
                  </template>
                  <template #footer>
                    <div class="p-3">
                      <Button
                        fluid
                        severity="info"
                        outlined
                        size="small"
                        @click="openMoreColors()"
                      >
                        Buscar Más Colores
                      </Button>
                    </div>
                  </template>
                </Select>
                                
                @page="onElementColorsPage"
                @change_element="changeSearchValue($event)"
              </div> -->
              <Table
                :value="minifigParts"
                table-class="pieces-table"
                :paginator="true"
                :total="partsTotal"
                :first="partsFirst"
                :rows="partsRows"
              />
            </div>
          </template>
        </div>
        <Divider layout="vertical" class="section-divider" />
        <div class="flex flex-column align-items-start w-full gap-2">
          <template v-if="minifig && !minigifLoading">
            <h2 class="underline">Sets Con Minifigura</h2>
            <div
              v-if="setsLoading"
              class="flex flex-column gap-3 w-full"
              aria-label="Cargando sets"
              aria-busy="true"
            >
              <Skeleton v-for="value in 4" :key="value" height="4rem" />
            </div>
            <div
              class="flex flex-column align-items-start gap-3 w-full"
              v-else-if="minifigSets"
            >
              <!--               <div class="flex flex-row align-items-center gap-3 w-full">
                <InputGroup :style="{ 'max-width': '300px' }">
                  <InputText
                    placeholder="Ingresar Código Set..."
                    size="large"
                    v-model="setCodeSearch"
                    @input="
                      changeLoadingState();
                      onSearchSet($event);
                    "
                  />
                  <InputGroupAddon v-if="setSearchLoading">
                    <Spinner spin :size="26" />
                  </InputGroupAddon>
                </InputGroup>
                <AutoComplete
                  size="large"
                  placeholder="Buscar Temática Set..."
                  v-model="themeSearch"
                  :suggestions="filteredThemes ?? []"
                  option-label="name"
                  @option-select="searchByTheme"
                  @complete="search($event)"
                  :show-clear="true"
                />
              </div> -->
              <Table
                :value="minifigSets"
                table-class="sets-table"
                :paginator="true"
                :total="setsTotal"
                :first="setsFirst"
                :rows="setsRows"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
  <Toast />
</template>

<script setup lang="ts">
import InputGroup from "primevue/inputgroup";
import InputText from "primevue/inputtext";
import Spinner from "@primeicons/vue/spinner";
import { ref, watch } from "vue";
import { useMinifigStore } from "@/stores/minifig.store";
import { storeToRefs } from "pinia";
import { useDebounceFn } from "@vueuse/core";
import InputGroupAddon from "primevue/inputgroupaddon";
import { useToast } from "primevue/usetoast";
import Toast from "primevue/toast";
import Table from "../Table.vue";
import Divider from "primevue/divider";
import Skeleton from "primevue/skeleton";

const minifigStore = useMinifigStore();
const {
  minifig,
  minifigError,
  minigifLoading,
  partsError,
  partsLoading,
  partsFirst,
  partsRows,
  partsTotal,
  minifigParts,
  minifigSets,
  setsError,
  setsFirst,
  setsLoading,
  setsRows,
  setsTotal,
} = storeToRefs(minifigStore);
const props = defineProps<{
  tabValue: string;
}>();

const searchValue = ref<string | null>(null);
const toast = useToast();

const onSearch = useDebounceFn(async () => {
  if (!searchValue.value) {
    minifig.value = null;
    return;
  }

  await minifigStore.getMinifig(searchValue.value);

  if (!minifig.value) return;

  await Promise.all([
    minifigStore.getMinifigParts(searchValue.value),
    minifigStore.getMinifigSets(searchValue.value),
  ]);
}, 600);

watch(
  () => [minifigError.value, partsError.value],
  ([error, partsError], [previousError, previousPartError]) => {
    if (error && error !== previousError) {
      toast.add({
        severity: "error",
        summary: "Error Al Buscar Código",
        detail: "No existe minifigura con el código ingresado",
        life: 4000,
      });
    }
    if (partsError && partsError !== previousPartError) {
      toast.add({
        severity: "error",
        summary: "Error Al Buscar Piezas",
        detail: "Hubo un error al buscar las piezas de la minifigura",
        life: 4000,
      });
    }
  },
);

watch(
  () => props.tabValue,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      searchValue.value = null;
      minifig.value = null;
      minifigParts.value = null;
    }
  },
);
</script>

<style scoped>
.extra-container {
  display: grid;
  grid-template-columns: 3.5fr 40px 2.5fr;
  gap: 15px;
  align-items: baseline;
}

.section-divider {
  align-self: stretch;
}

.section-divider::before {
  border-inline-start-width: 3px;
}
</style>
