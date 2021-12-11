import { Engine, Loader, Site } from "lume/core.ts";
import { checkExtensions, searchByExtension } from "lume/core/utils.ts";
import { Component, ComponentLoader, Components } from "./types.ts";
import { join } from "lume/deps/path.ts";

export default class ComponentsLoader {
  site: Site;
  components: Components;
  directory: string;
  loaders = new Map<string, ComponentLoader>();

  constructor(site: Site, components: Components, directory: string) {
    this.site = site;
    this.components = components;
    this.directory = directory;
  }

  /** Add a loader for some extensions */
  addLoader(extensions: string[], engine: Engine, loader: Loader) {
    checkExtensions(extensions);
    extensions.forEach((extension) =>
      this.loaders.set(extension, createLoader(engine, loader))
    );
  }

  /** Load all components and subcomponents recursively */
  async load(
    subdir = "/",
    components: Components = this.components,
  ): Promise<Components> {
    const path = this.site.src(this.directory, subdir);

    for await (const entry of Deno.readDir(path)) {
      if (entry.isFile) {
        const component = await this.loadComponent(path, entry.name);

        if (component) {
          components.components.set(component.name, component);
        }
        continue;
      }

      if (entry.isDirectory) {
        const subComponents = await this.load(
          join(subdir, entry.name),
          {
            components: new Map(),
            subComponents: new Map(),
            proxies: new Map(),
          },
        );

        if (subComponents.components.size > 0) {
          components.subComponents.set(entry.name, subComponents);
        }
      }
    }

    return components;
  }

  /** Load and return a component */
  async loadComponent(
    path: string,
    filename: string,
  ): Promise<Component | undefined> {
    const file = join(path, filename);
    const info = searchByExtension(file, this.loaders);

    if (info) {
      const [ext, loader] = info;
      const component = await this.site.source.readFile(
        file,
        loader as unknown as Loader,
      ) as unknown as Component;

      if (!component.name) {
        component.name = filename.slice(0, -ext.length).toLowerCase();
      }

      return component;
    }
  }
}

export function createLoader(engine: Engine, loader: Loader): ComponentLoader {
  return async function (path: string): Promise<Component> {
    const data = await loader(path);
    const { content } = data;

    return {
      name: data.name ?? "",
      render(data) {
        return engine.renderSync(content, data, path);
      },
      css: data.css,
      js: data.js,
    } as Component;
  };
}
