import { readFile } from "lume/core/utils/read.ts";
import { merge } from "lume/core/utils/object.ts";
import { posix } from "lume/deps/path.ts";

interface Catalog {
  id: string;
  src: string;
  name?: (name: string, variant?: Variant) => string;
  variants?: (Variant | string)[];
}

interface Variant {
  key: string;
  path: string;
}

export const catalogs: Catalog[] = [
  {
    id: "bootstrap",
    src: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/{name}.svg",
  },
  {
    id: "heroicons",
    src: "https://cdn.jsdelivr.net/npm/heroicons@2.1.5/{variant}/{name}.svg",
    variants: [
      { key: "outline", path: "24/outline" },
      { key: "solid", path: "24/solid" },
      { key: "minimal", path: "20/solid" },
      { key: "micro", path: "16/solid" },
    ],
  },
  {
    id: "lucide",
    src: "https://cdn.jsdelivr.net/npm/lucide-static@0.441.0/icons/{name}.svg",
  },
  {
    id: "material-100",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-100@0.23.0/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    id: "material-200",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-200@0.23.0/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    id: "material-300",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-300@0.23.0/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    id: "material-400",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-400@0.23.0/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    id: "material-500",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-500@0.23.0/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    id: "material-600",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-600@0.23.0/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    id: "material-700",
    src:
      "https://cdn.jsdelivr.net/npm/@material-symbols/svg-700@0.23.0/{variant}/{name}.svg",
    variants: ["outlined", "rounded", "sharp"],
  },
  {
    id: "material",
    src:
      "https://cdn.jsdelivr.net/npm/@material-design-icons/svg@0.14.13/{variant}/{name}.svg",
    variants: ["filled", "outlined", "round", "sharp", "two-tone"],
  },
  {
    id: "mingcute",
    src: "https://cdn.jsdelivr.net/gh/Richard9394/MingCute@2.95/svg/{name}.svg",
  },
  {
    id: "phosphor",
    src:
      "https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/{variant}/{name}.svg",
    name(name: string, variant?: Variant) {
      const suffix = variant?.key === "regular" ? "" : `-${variant?.key}`;
      return `${name}${suffix}`;
    },
    variants: ["bold", "duotone", "fill", "light", "regular", "thin"],
  },
  {
    id: "remix",
    src: "https://cdn.jsdelivr.net/npm/remixicon@4.3.0/icons/{name}.svg",
    name: (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(),
  },
  {
    id: "simpleicons",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@13.10.0/icons/{name}.svg",
  },
  {
    id: "tabler",
    src:
      "https://cdn.jsdelivr.net/npm/@tabler/icons@3.16.0/icons/{variant}/{name}.svg",
    variants: ["filled", "outline"],
  },
];

export interface Options {
  folder?: string;
  catalogs: Catalog[];
}
export const defaults: Options = {
  folder: "icons",
  catalogs,
};

export function icons(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    const icons = new Map<string, string>();
    site.filter("icon", icon);

    function icon(key: string, catalogId: string, rest?: string) {
      const catalog = catalogs.find((c) => c.id === catalogId);

      if (!catalog) {
        throw new Error(`Catalog "${catalogId}" not found`);
      }

      const [name, variant] = getNameAndVariant(catalog, key, rest);

      const file = iconPath(options.folder, catalog, name, variant);
      const url = iconUrl(catalog, name, variant);
      icons.set(file, url);
      return file;
    }

    site.addEventListener("afterRender", async () => {
      for (const [file, url] of icons) {
        const content = await readFile(url);
        const page = await site.getOrCreatePage(file);
        page.content = content;
      }
    });
  };
}

export default icons;

function iconPath(
  folder: string,
  catalog: Catalog,
  name: string,
  variant?: Variant,
): string {
  const file = `${catalog.id}/${name}${variant ? `-${variant.key}` : ""}.svg`;
  return posix.join(folder, file);
}

function getNameAndVariant(
  catalog: Catalog,
  name: string,
  variant?: string,
): [string, Variant | undefined] {
  if (!variant) {
    [name, variant] = name.split(":");
  }

  if (!variant) {
    if (catalog.variants) { // Returns the first variant
      const first = catalog.variants[0];
      return [
        name,
        typeof first === "string" ? { key: first, path: first } : first,
      ];
    }

    return [name, undefined];
  }

  if (!catalog.variants) {
    throw new Error(`Catalog "${catalog.id}" does not support variants`);
  }

  const found = catalog.variants.find((v) => {
    return [name, typeof v === "string" ? v === variant : v.key === variant];
  });

  if (!found) {
    throw new Error(
      `Variant "${variant}" not found in catalog "${catalog.id}"`,
    );
  }

  return [
    name,
    typeof found === "string" ? { key: found, path: found } : found,
  ];
}

function iconUrl(catalog: Catalog, name: string, variant?: Variant): string {
  if (catalog.name) {
    name = catalog.name(name, variant);
  }

  return catalog.src.replace("{name}", name).replace(
    "{variant}",
    variant ? variant.path : "",
  );
}
