# experimental-plugins

A repo to test and experiment with plugins for Lume

## Relations

Plugin to create automatically relations between different pages and use them in
your layouts. For example:

```yml
# /authors/oscar-otero.md
---
title: Oscar Otero
type: author
id: 1
---
Hello, I'm Oscar
```

```yml
# /articles/working-with-lume.md
---
title: Working with Lume
type: article
id: 23
author_id: 1
---
This is an article from Oscar
```

```njk
<header>
  <h1>{{ title }}</h1>
  <p>Created by {{ author.name }}</p>
</header>
```

## Multilanguage

A plugin to create multiple language versions of the same page and include the
`<link rel="alternate" hreflang="{lang}" href="{url}" />`. Example of
multilanguage page:

```yml
---
lang: [en, gl]

title: This is the default title for all languages
title.gl: Este é o título específico en galego
---
```

## Remark

Use [Remark](https://github.com/remarkjs/remark) and
[Rehype](https://github.com/rehypejs/rehype) as an alternative markdown
processor.

## NanoJSX

To use [Nano JSX](https://nanojsx.io/) to render JSX pages.

## Preact JSX

To use [Preact](https://preactjs.com/) to render JSX pages.

## i18n

To use [i18next](https://www.i18next.com/) library for translations.

## Windi CSS

Use [Windi CSS](https://windicss.org/) in your website.

## Minify

Minify HTML, CSS, JS and JSON files using
[minifier](https://github.com/sno2/minifier).

- To minify JS, it's recommended to use the plugin Terser, already provided by
  Lume.
- To minify CSS, it's recommended to use the plugin ParcelCSS, already provided
  by Lume.

## Minify-HTML

Minify HTML, CSS and JS using
[minify-html](https://github.com/wilsonzlin/minify-html).

- To minify JS, it's recommended to use the plugin Terser, already provided by
  Lume.
- To minify CSS, it's recommended to use the plugin ParcelCSS, already provided
  by Lume.

## Jimp

To transform image files using [Jimp](https://github.com/oliver-moran/jimp).

## Google Analytics

Middleware to integrate Google Analytics in backend, using
[g_a](https://deno.land/x/g_a@0.1.2/mod.ts)

## Basic Auth

Middleware to implement a Basic Authentication

## Sitemap

To generate a sitemap.xml from html files after build.

- Maybe needs to be tested with various URL plugins enabled (I used it with
  `slugify_urls` enabled)
