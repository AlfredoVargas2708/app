import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import "primeflex/primeflex.min.css";
import ToastService from 'primevue/toastservice';
import DialogService from 'primevue/dialogservice';
import ConfirmationService from 'primevue/confirmationservice';

const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
  license: import.meta.env.VITE_PRIME_KEY,
});

app.use(createPinia());
app.use(router);
app.use(ToastService);
app.use(DialogService);
app.use(ConfirmationService);

app.mount("#app");
