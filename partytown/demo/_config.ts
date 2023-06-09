import lume from "lume/mod.ts";
import partytown from "../mod.ts";

const site = lume();
site.use(partytown({
  config: {
    forward: ["dataLayer.push"],
  },
}));

export default site;
