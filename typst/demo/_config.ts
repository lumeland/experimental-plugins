import lume from "lume/mod.ts";
import typst from "../mod.ts";

const site = lume();

// Initialize the plugin with a remote font
site.use(typst({
  fonts: [
    "https://cdn.jsdelivr.net/gh/google/fonts@refs/heads/main/ofl/pacifico/Pacifico-Regular.ttf",
  ],
}));

export default site;
