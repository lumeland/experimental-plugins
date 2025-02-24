import { ConfigData, formatterFactory, HtmlValidate, Report, Reporter } from "npm:html-validate@9.4.0";
import "lume/types.ts";
import { merge } from "lume/core/utils/object.ts";
import { log } from "lume/core/utils/log.ts";

// HTML Validation Plugin, by dish
// version 1.0.1

export const defaults: ConfigData = {
  extends: ["html-validate:recommended", "html-validate:document"],
  rules: {
    "doctype-style": "off",
    "attr-quotes": "off",
    "no-trailing-whitespace": "off",
    "void-style": "warn",
    "require-sri": ["error", { target: "crossorigin" }],
  },
};

export default function (userOptions?: ConfigData) {
  const options = merge(defaults, userOptions);
  const htmlvalidate = new HtmlValidate(options);
  const format = formatterFactory("text");

  return (site: Lume.Site) => {
    site.process([".html"], validatePages);

    async function validatePages(pages: Lume.Page[]) {
      let reports: Array<Report> = [];
      for (const page of pages) {
        const report = await htmlvalidate.validateString(page.content as string, page.outputPath);
        reports.push(report);
      }
      const merged: Report | Promise<Report> = Reporter.merge(reports);
      // Clear the reports table to ensure we don't get duplicates
      reports = [];

      if (merged.valid) {
        log.info("[validateHTML] Validation successful!");
      }

      if (!merged.valid) {
        log.error("[validateHTML]:\n" + format(merged.results));
      }
    }
  };
}
