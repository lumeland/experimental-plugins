import lume from "lume/mod.ts";
import typst from "../mod.ts";

const site = lume();

site.remoteFile(
  "/fonts/Pacifico-Regular.ttf",
  "https://cdn.jsdelivr.net/gh/google/fonts@refs/heads/main/ofl/pacifico/Pacifico-Regular.ttf",
);

site.use(typst({
  fonts: [
    "/fonts",
  ],
  lumeData: (defaults, _data) => {
    return {
      ...defaults,
      customTestProperty: "Hello from _config.ts!",
      formattedYear: defaults.date ? defaults.date.getFullYear() : 2026,
    };
  },
}));

export default site;
