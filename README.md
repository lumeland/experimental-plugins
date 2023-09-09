# Experimental Plugins

A repo to test and experiment with plugins for Lume

## Contributing

If you use Deno plugins for vscode and you don't enable Deno on user scope. Your
vscode will not able to use the correct `deno.json` file. While it is ok during
build/test, this can cause a productivy trouble (ex. type checking suggestion).
To avoid this, you need to:

1. create `.vscode/setting.json` in the plugin dir, that you plan to work on, by
   cloning `.vsode` from top repo to the plugin dir (copy&paste).
2. Then open the plugin dir in new workspace.

Aside from `/.vscode` in top level repo, the rest `.vscode` are ignored by Git

## Experimental List

### CSP

Middleware to add csp headers.

### Nav

To build navigation menus and breadcrumbs.

### NanoJSX

To use [Nano JSX](https://nanojsx.io/) to render JSX pages.

### i18n

To use [i18next](https://www.i18next.com/) library for translations.

### Jimp

To transform image files using [Jimp](https://github.com/oliver-moran/jimp).

### Google Analytics

Middleware to integrate Google Analytics in backend, using
[g_a](https://deno.land/x/g_a@0.1.2/mod.ts)

### Reading Time

Estimated reading time for markdown pages.

### WebC

To use [WebC](https://github.com/11ty/webc) components in the templates.

### Favicon

To generate automatically the site's favicon.
