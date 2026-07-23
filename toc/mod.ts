import { merge } from "lume/core/utils/object.ts";
import type Site from "lume/core/site.ts";
import createSlugifier from "lume/core/slugifier.ts";

export interface Options {
  /** Slugify function */
  slugify?: (x: string) => string;

  /** Value of the tabindex attribute on headings, set to false to disable. */
  tabIndex?: number | false;
}

export const defaults = {
  slugify: createSlugifier(),
  tabIndex: -1,
} satisfies Options;

const STARTS_WITH_LETTER = /^[a-z]/i;

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process([".html"], (pages) => {
      for (const { document } of pages) {
        for (const element of document.querySelectorAll("[toc]")) {
          buildToc(document, element);
        }
      }
    });
  };

  function buildToc(document: Document, element: Element) {
    const id = element.getAttribute("toc");
    if (!id) {
      console.error("Empty toc attribute");
      return;
    }
    const target = document.getElementById(id);

    if (!target) {
      console.error("Target not found");
      return;
    }

    const toc = scanToc(target);
    const ol = document.createElement("ol");
    ol.innerHTML = renderToc(toc);
    element.appendChild(ol);
    element.removeAttribute("toc");
  }

  function scanToc(element: Element) {
    const uniqueIds = new Set<string>();
    const ast: Node = { level: 0, text: "", id: "", children: [] };
    const stack = [ast];

    for (const header of element.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
      const level = parseInt(header.tagName.slice(1), 10);
      const text = header.textContent;
      let id = header.getAttribute("id") || options.slugify(text);

      // Make sure the id starts with a letter
      if (!STARTS_WITH_LETTER.test(id)) {
        id = `h_${id}`;
      }

      // Make sure the id is unique
      while (uniqueIds.has(id)) {
        id += "-1";
      }
      uniqueIds.add(id);
      header.setAttribute("id", id);

      if (options.tabIndex !== false && !header.hasAttribute("tabindex")) {
        header.setAttribute("tabindex", `${options.tabIndex}`);
      }

      const node: Node = {
        level,
        text,
        id,
        children: [],
      };

      if (node.level > stack[0].level) {
        stack[0].children.push(node);
        stack.unshift(node);
        continue;
      }

      if (node.level === stack[0].level) {
        stack[1].children.push(node);
        stack[0] = node;
        continue;
      }

      while (node.level <= stack[0].level) {
        stack.shift();
      }
      stack[0].children.push(node);
      stack.unshift(node);
    }

    return ast.children;
  }
}

interface Node {
  level: number;
  text: string;
  id: string;
  // url: string;
  children: Node[];
}

function renderToc(nodes: Node[]): string {
  const code: string[] = [];
  for (const node of nodes) {
    code.push("<li>");
    code.push(`<a href="#${node.id}">${node.text}</a>`);
    if (node.children.length) {
      code.push("<ol>");
      code.push(renderToc(node.children));
      code.push("</ol>");
    }
    code.push("</li>");
  }
  return code.join("\n");
}
