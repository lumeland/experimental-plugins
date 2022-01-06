# experimental-plugins

A repo to test and experiment with plugins for Lume

## Windi CSS

Use [Windi CSS](https://windicss.org/) in your website.

## SASS

Add (very limited) support for [SASS](https://sass-lang.com/).

- It uses [deno_sass2](https://github.com/littledivy/deno_sass2) library, but it
  has not support for `@import`

## Minify

Minify HTML, CSS, JS and JSON files using
[minifier](https://github.com/sno2/minifier).

- To minify JS, it's recommended to use the plugin Terser, already provided by
  Lume.

## esbuild

To bundle/minify js files using [esbuild](https://esbuild.github.io/).

## Imagick

To transform image files using [ImageMagick](https://github.com/lumeland/imagemagick-deno).
