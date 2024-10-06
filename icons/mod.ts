import { readFile } from "lume/core/utils/read.ts";

interface Catalog {
  id: string;
  src: string;
  name?: (name: string, variant?: string) => string;
  variants?: string[] | ((variant?: string) => string);
}

export const catalogs: Catalog[] = [
  {
    id: "bootstrap",
    src: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/{name}.svg",
  },
  {
    id: "heroicons",
    src: "https://cdn.jsdelivr.net/npm/heroicons@2.1.5/{variant}/{name}.svg",
    variants(variant: string = "outline") {
      switch (variant) {
        case "outline":
          return "24/outline";
        case "solid":
          return "24/solid";
        case "minimal":
          return "20/solid";
        case "micro":
          return "16/solid";
        default:
          throw new Error(
            `Variant "${variant}" not found in catalog "heroicons"`,
          );
      }
    },
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
    name(name: string, variant?: string) {
      const suffix = variant === "regular" ? "" : `-${variant}`;
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

export function icons() {
  return (site: Lume.Site) => {
    site.filter("icon", helper, true);
  };
}

export default icons;

async function helper(name: string, catalogId: string, variant?: string) {
  const catalog = catalogs.find((c) => c.id === catalogId);

  if (!catalog) {
    throw new Error(`Catalog "${catalogId}" not found`);
  }

  if (variant) {
    return await readIcon(catalog, name, variant);
  }

  const [n, v] = name.split(":");
  return await readIcon(catalog, n, v);
}

function readIcon(catalog: Catalog, name: string, variant?: string) {
  if (typeof catalog.variants === "function") {
    variant = catalog.variants(variant);
  } else if (Array.isArray(catalog.variants)) {
    if (!variant) {
      variant = catalog.variants[0];
    } else if (!catalog.variants.includes(variant)) {
      throw new Error(
        `Variant "${variant}" not found in catalog "${catalog.id}"`,
      );
    }
  }

  if (catalog.name) {
    name = catalog.name(name, variant);
  }

  const url = catalog.src.replace("{name}", name).replace(
    "{variant}",
    variant ?? "",
  );
  return readFile(url);
}
