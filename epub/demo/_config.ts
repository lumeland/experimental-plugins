import lume from "lume/mod.ts";
import epub from "../mod.ts"

const site = lume({
  prettyUrls: false,
});
site.use(epub({
  output: "book.epub",
  keepPages: true,
  metadata: {
    identifier: "urn:isbn:978-91-986762-1-2",
    cover: "/images/cover/front.png",
    title: "Why Cryptocurrencies?",
    creator: ["Jonas Hietala"],
    publisher: "Jonas Hietala",
    language: "en-US",
    date: new Date("2023-03-02T12:18:28Z")
  }
}));
site.add("css")

export default site;
