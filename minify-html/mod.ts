import { init, minify as minifyHTML } from "./deps.ts";
import { merge } from "lume/core/utils.ts";
import { Exception } from "lume/core/errors.ts";

import type { Page, Site } from "lume/core.ts";

export interface Options {
  /** The list of extensions this plugin applies to. */
  extensions: Array<".html" | ".css" | ".js">;
  /**
   * Default options for minify-html library
   * Opened an issue with a request of adding an export for the options type definitions so we can use `minifyOptions: Partial<CFG>`.
   * https://github.com/wilsonzlin/minify-html/issues/97
   * until then we define them manually.
   */
  options: {
    /** Do not minify DOCTYPEs. Minified DOCTYPEs may not be spec compliant. */
    do_not_minify_doctype?: boolean;
    /** Ensure all unquoted attribute values in the output do not contain any characters prohibited by the WHATWG specification. */
    ensure_spec_compliant_unquoted_attribute_values?: boolean;
    /** Do not omit closing tags when possible. */
    keep_closing_tags?: boolean;
    /** Do not omit `<html>` and `<head>` opening tags when they don't have attributes. */
    keep_html_and_head_opening_tags?: boolean;
    /** Keep spaces between attributes when possible to conform to HTML standards. */
    keep_spaces_between_attributes?: boolean;
    /** Keep all comments. */
    keep_comments?: boolean;
    /** If enabled, content in `<script>` tags with a JS or no [MIME type](https://mimesniff.spec.whatwg.org/#javascript-mime-type) will be minified using [minify-js](https://github.com/wilsonzlin/minify-js). */
    minify_js?: boolean;
    /** If enabled, CSS in `<style>` tags and `style` attributes will be minified. */
    minify_css?: boolean;
    /** Remove all bangs. */
    remove_bangs?: boolean;
    /** Remove all processing_instructions. */
    remove_processing_instructions?: boolean;
  };
}

// Default options
export const defaults: Options = {
  extensions: [".html", ".css", ".js"],
  options: {
    do_not_minify_doctype: false,
    ensure_spec_compliant_unquoted_attribute_values: false,
    keep_closing_tags: false,
    keep_html_and_head_opening_tags: false,
    keep_spaces_between_attributes: false,
    keep_comments: false,
    minify_js: false,
    minify_css: false,
    remove_bangs: false,
    remove_processing_instructions: false,
  },
};

// Init minify-html
await init();

/** A plugin to minify HTML, CSS & JavaScript files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  const { extensions } = options;

  // Validate supported file extensions
  if (extensions.some((ext) => ![".html", ".css", ".js"].includes(ext))) {
    throw new Exception("Unsupported extensions configuration.", {
      name: "Plugin minify-html",
      extensions,
    });
  }

  // When `extensions` includes `.css` and `.js`, minify-html will minify CSS and JavaScript files, even when `minify_css` and `minify_js` defaults set to `false`, since lume passes them to process
  // To make this work with inline `<style>` tags in HTML files, following is necessary when `minify_css` is not set to `true`
  const minifyOptions = { ...options.options };

  if (extensions.includes(".css")) {
    minifyOptions.minify_css = true;
  }

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, minify);

    function minify(page: Page) {
      const content = page.content as string;

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      page.content = decoder.decode(
        minifyHTML(encoder.encode(content), minifyOptions),
      );
    }
  };
}
