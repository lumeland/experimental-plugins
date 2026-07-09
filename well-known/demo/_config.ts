import lume from "lume/mod.ts";
import wellKnown from "../mod.ts";

const site = lume();

site.use(wellKnown({
  atProto: "1234",
  security: {
    contact: "mailto:security@example.com",
    expires: new Date(),
    preferredLanguages: ["en", "gl"],
    policy: "https://example.com/security-policy.txt",
  },
  gpc: true,
  trust: {
    contact: "mailto:info@example.com",
    social: "https://mastodon.gal/@misteroom",
    dataTrainingAllowed: false,
  },
  migratePWA: "https://old-domain.com/pwa"
}));

export default site;
