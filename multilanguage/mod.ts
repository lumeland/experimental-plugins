import { Page } from "lume/core/filesystem.ts";
import { isPlainObject } from "lume/core/utils.ts";

import type { Data, Plugin } from "lume/core.ts";

type Alternates = Record<string, Page>;

export default function multilanguage(): Plugin {
  return (site) => {
    site.preprocess("*", (page, pages) => {
      const { lang } = page.data;

      if (!Array.isArray(lang)) {
        return;
      }

      const languageData: Record<string, Data> = {};
      lang.forEach((key) => {
        const data = { ...page.data };

        for (const [name, value] of Object.entries(data)) {
          if (lang.includes(name)) {
            if (name === key) {
              Object.assign(data, value);
            } else {
              delete data[name];
            }
          }
        }
        languageData[key] = filterLanguage(lang, key, data);
      });

      const alternates: Alternates = {};

      // Create new pages
      const newPages: Page[] = [];

      for (const [l, data] of Object.entries(languageData)) {
        data.alternates = alternates;
        data.lang = l;

        const newPage = page.duplicate(l);
        newPage.data = data;
        newPage.updateDest({
          path: `/${l}${newPage.dest.path}`,
        });
        alternates[l] = newPage;
        newPages.push(newPage);
      }

      // Replace the current page with the multiple languages
      pages.splice(pages.indexOf(page), 1, ...newPages);
    });

    site.process([".html"], (page) => {
      const { document } = page;
      const alternates = page.data.alternates as
        | Alternates
        | undefined;
      const lang = page.data.lang as string | undefined;

      if (!document || !alternates || !lang) {
        return;
      }

      for (const [altLang, altPage] of Object.entries(alternates)) {
        if (altLang === lang) {
          continue;
        }
        const meta = document.createElement("link");
        meta.setAttribute("rel", "alternate");
        meta.setAttribute("hreflang", altLang);
        meta.setAttribute("href", altPage.data.url);
        document.head.appendChild(meta);
        document.head.appendChild(document.createTextNode("\n"));
      }
    });
  };
}

function filterLanguage(langs: string[], lang: string, data: Data): Data {
  for (let [name, value] of Object.entries(data)) {
    if (isPlainObject(value)) {
      data[name] = value = filterLanguage(langs, lang, {
        ...value as Record<string, unknown>,
      });
    } else if (Array.isArray(value)) {
      data[name] = value = value.map((item) => {
        return isPlainObject(item)
          ? filterLanguage(langs, lang, { ...item as Record<string, unknown> })
          : item;
      });
    }

    const parts = name.match(/^(.*)\.([^.]+)$/);

    if (parts) {
      const [, key, l] = parts;

      if (langs.includes(l)) {
        if (lang === l) {
          data[key] = value;
        }

        delete data[name];
      }
    }
  }

  return data;
}
