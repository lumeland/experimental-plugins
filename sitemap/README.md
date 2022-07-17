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

This plugin accepts a configuration object. It uses the `query` and `sort`
functions from the [Search plugin](https://lume.land/plugins/search/). The
available options are:

- `query`: The query to search pages included in the sitemap. See
  [Searching pages](https://lume.land/plugins/search/#searching-pages)
- `sort`: The values to sort the sitemap. By default is `["url=asc"]`. See
  [Sort pages](https://lume.land/plugins/search/#sort-pages)

You can define multiple `querys` (`["type=post", "tag=javascript"]`) and
multiple `sort` options.

If you use a custom `query`, make sure to include `["url=/"]` to include the
index page (home page).

### Example with the default configuration:

```js
import lume from "lume/mod.ts";
import sitemap from "lume/plugins/sitemap.ts";

const site = lume();

site.use(sitemap({
  query: [],
  sort: ["url=asc"],
}));

export default site;
```
