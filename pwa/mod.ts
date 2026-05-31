import { merge } from "lume/core/utils/object.ts";
import { getDataValue, getPlainDataValue } from "lume/core/utils/data_values.ts";

import "lume/types.ts";

export interface AppData {
  name: string,
  id?: string,
  search_params?: string,
  short_name?: string,
  description?: string,
  icon?: string,
  display?: string | string[],
  color?: string,
  background?: string,
  categories?: string[],
}

export interface Options {
  output?: string,
}

// Default options
export const defaults: Options = {
  output: "/manifest.json",
};

export default function (userOptions?: Partial<Options>): Lume.Plugin {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    site.process([".html"], async (pages) => {
      const manifest: Partial<Manifest> = {};

      for (const page of pages) {
        const { data } = page;
        const app = data.app as AppData | undefined;

        if (app) {
          const url = site.url(page.data.url, true);
          const search_params =  getPlainDataValue(data, app.search_params);

          manifest.start_url = search_params ? `${url}?${search_params}` : url;
          manifest.id = getPlainDataValue(data, app.id) ?? search_params ? url : undefined;
          manifest.name = getPlainDataValue(data, app.name);
          manifest.short_name = getPlainDataValue(data, app.short_name);
          manifest.description = getPlainDataValue(data, app.description);
          manifest.theme_color = getDataValue(data, app.color);
          manifest.background_color = getDataValue(data, app.background);
          manifest.categories = getDataValue(data, app.categories);
          manifest.display = getDataValue(data, app.display);
        }
      }

      const manifestFile = await site.getOrCreatePage(options.output);
      manifestFile.text = JSON.stringify(manifest, null, 2);
    })
  };
}

export interface Icon {
  src: string,
  sizes: string,
  type: string,
  purpose?: "monochrome" | "maskable" | "any"
}
export interface Screenshot {
  src: string,
  sizes: string,
  type: string,
  label: string,
  form_factor: "narrow" | "wide",
  platform: "android" | "chromeos" | "ios" | "ipados" | "kaios" | "windows" | "xbox" | "chrome_web_store" | "itunes" | "microsoft-inbox" | "microsoft-store" | "play",
}

export type DisplayMode = "fullscreen" | "standalone" | "minimal-ui" | "browser" | "tabbed" | "window-controls-overlay";

export type ClientMode = "auto" | "focus-existing" | "navigate-existing" | "navigate-new";

export type Orientation = "any" | "natural" | "portrait" | "portrait-primary" | "portrait-secondary" | "landscape" | "landscape-primary" | "landscape-secondary";

export interface FileHandler {
  action: string,
  accept: Record<string, string[]>,
}

export interface ProtocolHandler {
  protocol: string,
  url: string,
}

export interface File {
  name: string,
  accept: string | string[]
}

export interface Shortcut {
  name: string,
  short_name: string,
  description: string,
  url: string,
  icons: Icon[],
}

export interface Manifest {
  id: string,
  name: string,
  short_name: string,
  description: string,
  start_url: string,
  scope: string,
  display: DisplayMode,
  display_override: DisplayMode[],
  theme_color: string,
  background_color: string,
  categories: string[],
  icons: Icon[],
  screenshots: Screenshot[],
  file_handlers: FileHandler[],
  protocol_handlers: ProtocolHandler[],
  launch_handler: {
    client_mode: ClientMode[],
  },
  share_target: {
    action: string,
    enctype: string,
    method: "GET" | "POST",
    params: {
      title: string,
      text: string,
      url: string,
      files: File | File[],
    }
  },
  shortcuts: Shortcut[],
}
