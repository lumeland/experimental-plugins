import lume from "lume/mod.ts";
import notion from "../mod.ts";

const site = lume();
site.use(notion({
  token: "secret_BCijuDCe2TsDJBMDHxXw0KAmv2MnMstbIrmIyAORdB9",
  databases: {
    blog: "9ded3242-17df-4aca-8905-57e9c90a4b0d",
  },
}));

export default site;
