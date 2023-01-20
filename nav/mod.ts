import { merge } from "lume/core/utils.ts";

import type { Data, Site } from "lume/core.ts";

export interface Options {
  /** The helper name */
  name: string;
}

export const defaults: Options = {
  name: "nav",
};

/** Register the plugin to enable the `search` helpers */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.data(options.name, new Nav(site));
  };
}

/** Search helper */
export class Nav {
  #site: Site;
  #nav?: NavData;

  constructor(site: Site) {
    this.#site = site;
    site.addEventListener("beforeUpdate", () => this.#nav = undefined);
  }

  menu(): NavData {
    if (!this.#nav) {
      this.#nav = this.#buildNav();
    }
    return this.#nav;
  }

  breadcrumb(url: string): NavData[] {
    let nav = searchData(url, this.menu());
    const breadcrumb: NavData[] = [];

    while (nav) {
      breadcrumb.unshift(nav);
      nav = nav.parent;
    }
    return breadcrumb;
  }

  #buildNav(): NavData {
    const nav: NavData = {
      title: "index",
    };

    const page404 = this.#site.options.server.page404;

    const pages = this.#site.pages.filter((page) =>
      page.outputPath?.endsWith(".html") &&
      page.data.url != page404
    );

    for (const page of pages) {
      const url = page.outputPath;

      if (!url) {
        continue;
      }

      const parts = url.split("/").filter((part) => part !== "");
      let part = parts.shift();
      let current = nav;

      while (part) {
        if (part === "index.html") {
          if (page.data.title) {
            current.title = page.data.title;
          }
          current.url = page.data.url as string;
          current.data = page.data;
          break;
        }
        if (!current.children) {
          current.children = {};
        }

        if (!current.children[part]) {
          current = current.children[part] = {
            title: part,
            parent: current,
          };
        } else {
          current = current.children[part];
        }
        part = parts.shift();
      }
    }
    return nav;
  }
}

export interface NavData {
  title: string;
  url?: string;
  data?: Data;
  children?: Record<string, NavData>;
  parent?: NavData;
}

function searchData(url: string, menu: NavData): NavData | undefined {
  if (menu.url === url) {
    return menu;
  }
  if (menu.children) {
    for (const child of Object.values(menu.children)) {
      const result = searchData(url, child);
      if (result) {
        return result;
      }
    }
  }
}
