import sharp, { create } from "lume/deps/sharp.ts";
import { merge } from "lume/core/utils/object.ts";
import {
  getDataValue,
  getPlainDataValue,
} from "lume/core/utils/data_values.ts";
import { Page } from "lume/core/file.ts";
import { log } from "lume/core/utils/log.ts";

import type Cache from "lume/core/cache.ts";
import "lume/types.ts";

export interface AppData {
  name: string;
  id?: string;
  search_params?: string;
  short_name?: string;
  description?: string;
  icon?: string;
  display?: string | string[];
  color?: string;
  background?: string;
  categories?: string[];
}
export interface ShortcutData {
  name: string;
  search_params?: string;
  short_name: string;
  description: string;
}

export interface Options {
  output?: string;
}

// Default options
export const defaults: Options = {
  output: "/manifest.json",
};

export default function (userOptions?: Partial<Options>): Lume.Plugin {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    const { cache } = site;

    /* Copied from favicon */
    async function getContent(
      file: string,
    ): Promise<Uint8Array | string | undefined> {
      const content = file.endsWith(".svg")
        ? await site.getContent(file, false)
        : await site.getContent(file, true);

      if (!content) {
        log.warn(`[pwa plugin] Input file not found: ${file}`);
      }

      return content;
    }

    site.process([".html"], async (pages) => {
      const manifest: Partial<Manifest> = {};

      for (const page of pages) {
        const { data } = page;
        const app = data.app as AppData | undefined;

        if (app) {
          const url = site.url(page.data.url, true);
          const search_params = getPlainDataValue(data, app.search_params);
          const displayModes = getDataValue(data, app.display) ??
            ["standalone", "minimal-ui"];

          manifest.start_url = search_params ? `${url}?${search_params}` : url;
          manifest.scope = site.url("/");
          manifest.id = getPlainDataValue(data, app.id) ?? search_params
            ? url
            : undefined;
          manifest.name = getPlainDataValue(data, app.name);
          manifest.short_name = getPlainDataValue(data, app.short_name);
          manifest.description = getPlainDataValue(data, app.description);
          manifest.display_override = displayModes;
          manifest.display = "browser";
          manifest.theme_color = getDataValue(data, app.color);
          manifest.background_color = getDataValue(data, app.background);
          manifest.categories = getDataValue(data, app.categories);
          const icon = getDataValue(data, app.icon);
          const content = icon ? await getContent(icon) : undefined;

          if (content) {
            manifest.icons = [{
              sizes: "512x512",
              src: "/pwa-icon-512.png",
              type: "image/png",
            }];

            Page.create({
              url: "/pwa-icon-512.png",
              content: await buildIco(
                content,
                "png",
                512,
                cache,
              ),
            });
          }
          continue;
        }

        const shortcut = data.shortcut as ShortcutData | undefined;
        if (shortcut) {
          const url = site.url(page.data.url, true);
          const search_params = getPlainDataValue(data, shortcut.search_params);

          manifest.shortcuts ??= [];

          manifest.shortcuts.push({
            name: getPlainDataValue(data, shortcut.name),
            short_name: getPlainDataValue(data, shortcut.short_name),
            description: getPlainDataValue(data, shortcut.description),
            url: search_params ? `${url}?${search_params}` : url,
          });
        }
      }

      const manifestFile = await site.getOrCreatePage(options.output);
      manifestFile.text = JSON.stringify(manifest, null, 2);
    });
  };
}

export interface Icon {
  src: string;
  sizes: string;
  type: string;
  purpose?: "monochrome" | "maskable" | "any";
}
export interface Screenshot {
  src: string;
  sizes: string;
  type: string;
  label: string;
  form_factor: "narrow" | "wide";
  platform:
    | "android"
    | "chromeos"
    | "ios"
    | "ipados"
    | "kaios"
    | "windows"
    | "xbox"
    | "chrome_web_store"
    | "itunes"
    | "microsoft-inbox"
    | "microsoft-store"
    | "play";
}

export type DisplayMode =
  | "fullscreen"
  | "standalone"
  | "minimal-ui"
  | "browser"
  | "tabbed"
  | "window-controls-overlay";

export type ClientMode =
  | "auto"
  | "focus-existing"
  | "navigate-existing"
  | "navigate-new";

export type Orientation =
  | "any"
  | "natural"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape"
  | "landscape-primary"
  | "landscape-secondary";

export interface FileHandler {
  action: string;
  accept: Record<string, string[]>;
}

export interface ProtocolHandler {
  protocol: string;
  url: string;
}

export interface File {
  name: string;
  accept: string | string[];
}

export interface Shortcut {
  name: string;
  url: string;
  short_name?: string;
  description?: string;
  icons?: Icon[];
}

export interface Manifest {
  id: string;
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: DisplayMode;
  display_override: DisplayMode[];
  theme_color: string;
  background_color: string;
  categories: string[];
  icons: Icon[];
  screenshots: Screenshot[];
  file_handlers: FileHandler[];
  protocol_handlers: ProtocolHandler[];
  launch_handler: {
    client_mode: ClientMode[];
  };
  share_target: {
    action: string;
    enctype: string;
    method: "GET" | "POST";
    params: {
      title: string;
      text: string;
      url: string;
      files: File | File[];
    };
  };
  shortcuts: Shortcut[];
}

/* Copied from favicon plugin */
async function buildIco(
  content: Uint8Array | string,
  format: keyof sharp.FormatEnum,
  size: number,
  cache?: Cache,
): Promise<Uint8Array> {
  if (cache) {
    const result = await cache.getBytes([content, format, size]);

    if (result) {
      return result;
    }
  }

  const svgOptions = {
    fitTo: { mode: "width", value: size },
  } as const;

  const image = await create(content, undefined, svgOptions)
    .resize(size, size)
    .toFormat(format)
    .toBuffer();

  if (cache) {
    cache.set([content, format, size], image);
  }

  return image;
}
