# Sitemap

Generate a XML sitemap from your pages.

## Installation

Import this plugin in your `_config.ts` file to use it:

```js
import lume from "lume/mod.ts";
import sitemap from "lume/plugins/sitemap.ts";

const site = lume();

site.use(sitemap({/* your config here */}));

export default site;
```

## Description

The `Sitemap` plugin generates a `sitemap.xml` file from pages.

## Configuration

This plugin accepts a configuration object. It uses the `filter` and `sort` functions from the [Search plugin](https://lume.land/plugins/search/). The available options are:

- `filters`: The filters to search pages included in the sitemap. See [Searching pages](https://lume.land/plugins/search/#searching-pages)
- `sort`:  The values to sort the sitemap. By default is `["url=asc"]`. See [Sort pages](https://lume.land/plugins/search/#sort-pages)
- `defaultFilters`: The default filters including the index page (only if custom `filters` are defined). By default is `["url=/"]` (Index page).
- `keepDefaultFilters`: Set `true` append your filters to the defaults (only if custom `filters` are defined).

You can define multiple `filters` (`["type=post", "tag=javascript"]`) and multiple `sort` options.

### Example with the default configuration:

```js
import lume from "lume/mod.ts";
import sitemap from "lume/plugins/sitemap.ts";

const site = lume();

site.use(sitemap({
  filters: [],
  sort: ["url=asc"],
  defaultFilters: ["url=/"],
  keepDefaultFilters: true,
}));

export default site;
```
