# Minify-HTML

Minify HTML, CSS & JavaScript files.

## Installation

Import this plugin in your `_config.ts` file to use it:

```js
import lume from "lume/mod.ts";
import minifyHTML from "lume/plugins/minify_html.ts";

const site = lume();

site.use(minifyHTML({/* your config here */}));

export default site;
```

## Description

The `minify-html` plugin minifies HTML, CSS & JavaScript files using
[minify-html](https://github.com/wilsonzlin/minify-html).

By default minification of `.html` files is enabled and all `minifyOptions` are
set to `false`. You can override this by passing an `minifyOptions` object with
the minify-html options. To enable minification for CSS or JavaScript files, the
`minify_css` and `minify_js` flags just need to be set to `true`. There is no
need to add additional extensions to the `extensions` option.

To enable minification of inline `<style>` tags, both HTML and CSS needs to be
enabled.

### Note

[minify-html](https://github.com/wilsonzlin/minify-html) uses
[minify-js](https://github.com/wilsonzlin/minify-js) for super fast JS
minification. The library is pretty new and has many in progress features. If it
does not fit your requirements, use the Lume
[Terser plugin](https://lume.land/plugins/terser/) as an alternative.

## Configuration

This plugin accepts a configuration object. The available options are:

- `extensions`: Array with the extensions of the files that this plugin will
  load. By default is `[".html"]`.
- `minifyHTML`: Enable HTML minification. By default is `true`.
- `minifyOptions`: The options passed to minify-html. If any are not set, by
  default is `false`. See the
  [minify-html cfg fields](https://docs.rs/minify-html/latest/minify_html/struct.Cfg.html)
  for available config options.

## Usage

### Example with the default configuration:

```js
import lume from "lume/mod.ts";
import minifyHTML from "lume/plugins/minify_html.ts";

const site = lume();

site.use(minifyHTML({
  extensions: [".html"],
  minifyHTML: true,
  minifyOptions: {
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
}));

export default site;
```
