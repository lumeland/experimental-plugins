import lume from "lume/mod.ts";
import googleFonts from "../mod.ts";

const site = lume();
site.use(googleFonts({
  fonts:
    "https://fonts.google.com/share?selection.family=Edu+AU+VIC+WA+NT+Guides:wght@400..700|Sixtyfour+Convergence",
}));

export default site;
