import { Engine, Loader, Site } from "lume/core.ts";
import SiteSource from "lume/core/source.ts";
import LumeRender from "lume/core/renderer.ts";
import { merge, warn } from "lume/core/utils.ts";
import { SitePage } from "lume/core/filesystem.ts";
import ComponentsLoader from "./loader.ts";
import { Components, ProxyComponents } from "./types.ts";
import { extname } from "lume/deps/path.ts";

export interface Options {
  /** The directory where the components are stored */
  directory: string;

  /** The helper name used to access to the components */
  name: string;

  /** List of supported formats */
  formats: Format[];

  /** Css file name */
  cssFile: string;

  /** Javascript file name */
  jsFile: string;
}

export interface Format {
  /** List of extensions to load components */
  extensions: string[];

  /** Template engine used to render the component */
  engine: Engine;

  /** File loader to load the component */
  loader: Loader;
}

const defaults: Options = {
  directory: "_components",
  name: "comp",
  formats: [],
  jsFile: "/components.js",
  cssFile: "/components.css",
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const components: Components = {
      components: new Map(),
      subComponents: new Map(),
      proxies: new Map(),
    };

    const { extraData } = site.renderer;
    const { engines } = site.renderer as LumeRender;
    const { pageLoaders: loaders } = site.source as SiteSource;

    if (options.formats.length === 0) {
      options.formats.push(
        {
          extensions: [".njk"],
          engine: engines.get(".njk")!,
          loader: loaders.get(".njk")!,
        },
        {
          extensions: [".js", ".ts"],
          engine: engines.get(".tmpl.js")!,
          loader: loaders.get(".tmpl.js")!,
        },
      );
    }

    const componentLoader = new ComponentsLoader(
      site,
      components,
      options.directory,
    );

    options.formats.forEach(({ extensions, engine, loader }) => {
      componentLoader.addLoader(extensions, engine, loader);
    });

    // Load the components
    const css = new Map<string, string>();
    const js = new Map<string, string>();
    const proxy: ProxyComponents = toProxy(components);

    // Create a proxy to returns the components
    // as comp.name() instead of comp.getComponent("name").render()
    function toProxy(components: Components): ProxyComponents {
      return new Proxy(components, {
        get: (target, name) => {
          if (typeof name === "string") {
            const key = name.toLowerCase();

            if (target.proxies.has(key)) {
              return target.proxies.get(key);
            }

            const component = target.components.get(key);

            if (component) {
              // Save CSS & JS code for the component
              if (component.css) {
                css.set(key, component.css);
              }

              if (component.js) {
                js.set(key, component.js);
              }

              // Add extra data to the component
              const data: Record<string, unknown> = {
                [options.name]: proxy,
                ...extraData,
              };

              // Return the function to render the component
              return (props: Record<string, unknown>) =>
                component.render({ ...data, ...props });
            }

            const subComponents = target.subComponents.get(key);

            if (subComponents) {
              const proxy = toProxy(subComponents);
              target.proxies.set(key, proxy);
              return proxy;
            }

            warn("Component not found.", { name });
            return () => undefined;
          }
        },
      }) as unknown as ProxyComponents;
    }

    site.data(options.name, proxy);
    site.addEventListener("beforeBuild", () => componentLoader.load());
    site.addEventListener("beforeUpdate", () => componentLoader.load());

    // Render the assets
    site.addEventListener("afterRender", () => {
      if (css.size) {
        const ext = extname(options.cssFile);
        const page = new SitePage();
        page.dest.ext = ext;
        page.dest.path = options.cssFile.slice(0, -ext.length);
        page.content = Array.from(css.values()).join("\n");
        site.pages.push(page);
      }

      if (js.size) {
        const ext = extname(options.jsFile);
        const page = new SitePage();
        page.dest.ext = ext;
        page.dest.path = options.jsFile.slice(0, -ext.length);
        page.content = Array.from(js.values()).join("\n");
        site.pages.push(page);
      }
    });
  };
}
