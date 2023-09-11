/**
 * Reference
 *
 * - https://developer.wordpress.org/rest-api/key-concepts
 */

import { merge } from "lume/core/utils.ts";
import type { PageData, Site } from "lume/core.ts";
import {
  WP_REST_API_Attachment,
  WP_REST_API_Post,
  WP_REST_API_Term,
  WP_REST_API_User,
} from "npm:wp-types@3.61.0";

type QueryParams = Iterable<string[]>;
export type WP_REST_API =
  | WP_REST_API_Attachment
  | WP_REST_API_Post
  | WP_REST_API_Term
  | WP_REST_API_User;

export interface Options {
  wp_url: string;
  api_namespace: string;
  // auth?: string | `${string}:${string}`; // Base64 | 'user:pass'
  limit: number;
  max_per_page: number;
  transform: {
    [key: string]: (raw: WP_REST_API) => Partial<PageData>;
  };
}

export const defaults: Options = {
  wp_url: "https://localhost",
  api_namespace: "/wp/v2",
  // auth: undefined,
  limit: Infinity,
  max_per_page: 100,
  transform: {
    "*": collectionToData,
  },
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const wp = new WordPressAPI(options);

  return (site: Site) => {
    site.data("wp", wp);
  };
}

export class WordPressAPI {
  static #api_route = "rest_route";

  #base: URL;
  #api_ns: string;
  // #pass: string | undefined;

  #limit: number;
  #max_per_page: number;

  #transform: {
    [key: string]: (raw: WP_REST_API) => Partial<PageData>;
  };
  #cache = new Map<string, unknown>();

  constructor(options: Options) {
    this.#base = new URL(options.wp_url);
    this.#api_ns = options.api_namespace;
    this.#limit = options.limit;
    this.#max_per_page = options.max_per_page;

    this.#transform = options.transform;

    // if (options.auth) {
    //     this.#pass = options.auth.includes(':') ? btoa(options.auth) : options.auth;
    // }
  }

  async *collection(
    api_path: string,
    limit: number = this.#limit,
    api_namespace: string = this.#api_ns,
  ): AsyncGenerator<Partial<PageData>> {
    for await (
      const raw of this.#fetchAll<WP_REST_API>(api_path, limit, api_namespace)
    ) {
      const useDefaultNs = this.#transform[api_path];
      if (typeof useDefaultNs === "function") {
        yield useDefaultNs.call(this, raw);
        continue;
      }

      const longNs = this.#transform[`${api_namespace}/${api_path}`];
      if (typeof longNs === "function") {
        yield longNs.call(this, raw);
        continue;
      }

      // Fallback for anything left
      yield this.#transform["*"].call(this, raw);
    }
  }

  async *#fetchAll<T>(
    api_path: string,
    limit: number,
    api_namespace: string,
  ): AsyncGenerator<T> {
    let page_index = 1;
    let counter = 0;

    while (limit > counter) {
      const page_size = Math.min(limit - counter, this.#max_per_page);
      counter += page_size;

      const posts = await this.#fetch<T>(`${api_namespace}/${api_path}`, [
        ["page", `${page_index++}`],
        ["per_page", `${page_size}`],
      ]);

      for (const post of posts) {
        yield post;
      }

      if (posts.length < this.#max_per_page) {
        break;
      }
    }
  }

  async #fetch<T>(api_path: string, query: QueryParams = []): Promise<T[]> {
    const url = this.#craftUrl(api_path, query);
    const cacheKey = url.toString();

    if (this.#cache.has(cacheKey)) {
      return this.#cache.get(cacheKey) as T[];
    }

    // const headers = { Authorization: this.#pass ? `Basic ${this.#pass}` : '' }

    const res = await fetch(url);
    const data = await res.json();
    this.#cache.set(cacheKey, data);
    return data;
  }

  #craftUrl(api_path: string, query_params: QueryParams = []): URL {
    const params = new URLSearchParams([
      ...query_params,
      [WordPressAPI.#api_route, api_path],
    ]);

    return new URL("/index.php?" + params.toString(), this.#base);
  }
}

function collectionToData(raw: WP_REST_API): Partial<PageData> {
  return {
    ...raw,
    url: new URL(raw?.source_url || raw?.link).pathname,
    date: new Date(raw?.date),
    title: raw?.title?.rendered,
    content: raw?.content?.rendered,
    excerpt: raw?.excerpt?.rendered,
    author_id: raw?.author,
  };
}
