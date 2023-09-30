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
export type CollectionPath = string;
export type WP_REST_API =
  | WP_REST_API_Attachment
  | WP_REST_API_Post
  | WP_REST_API_Term
  | WP_REST_API_User;

type Transformer = (
  data: Partial<PageData>,
  raw: WP_REST_API,
) => Partial<PageData>;
export interface Transform {
  [collectionName: string]: Transformer;
}
export interface StackableTransform {
  [collectionName: string]: Transformer[];
}

export interface Options {
  baseUrl: string;
  auth?: string | `${string}:${string}`; // Base64 | 'user:pass'
  maxPerCollection: number;
  maxPerPage: number;
  collections: {
    [name: string]: string; // API full path, ex: /namespace/path
  };
  transform: Transform;
}

export const presetRelation: Record<string, unknown> = {
  post: {
    foreignKey: "post_id",
    pluralRelationKey: "posts",
  },
  tag: {
    foreignKey: "tag_id",
    pluralRelationKey: "tags",
  },
  author: {
    foreignKey: "author_id",
    pluralRelationKey: "authors",
  },
  category: {
    foreignKey: "category_id",
    pluralRelationKey: "categories",
  },
  page: {
    foreignKey: "page_id",
    pluralRelationKey: "pages",
  },
};

const presetTransform: Transform = {
  "post": (data, raw) => ({
    ...data,
    title: raw?.title?.rendered,
    content: raw?.content?.rendered,
    excerpt: raw?.excerpt?.rendered,
    tag_id: raw.tags,
    category_id: raw.categories,
    sticky: raw.sticky,
    author_id: raw.author,
  }),
  "page": (data, raw) => ({
    ...data,
    title: raw?.title?.rendered,
    content: raw?.content?.rendered,
    excerpt: raw?.excerpt?.rendered,
    author_id: raw.author,
  }),
  "tag": termToData,
  "category": termToData,
  "author": (data, raw) => ({
    ...data,
    name: raw.name,
    description: raw.description,
    avatar_urls: raw.avatar_urls,
  }),
  "media": (data, raw) => ({
    ...data,
    caption: raw.caption.rendered,
    alt_text: raw.alt_text,
    media_type: raw.media_type,
    mime_type: raw.mime_type,
    media_details: raw.media_details,
  }),
};

export const defaults: Options = {
  baseUrl: "https://localhost",
  // auth: undefined,
  maxPerCollection: Infinity,
  maxPerPage: 100,
  collections: {
    "author": "/wp/v2/users",
    "post": "/wp/v2/posts",
    "page": "/wp/v2/pages",
    "tag": "/wp/v2/tags",
    "category": "/wp/v2/categories",
    "media": "/wp/v2/media",
  },
  transform: {
    "*": (data) => data,
  },
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const wp = new WordPressAPI(options);

  return (site: Site) => {
    site.data("wp", wp);
    site.hooks.addWordPressTransformer = wp.addTransformer.bind(wp);
  };
}

export class WordPressAPI {
  static #apiRoute = "rest_route";

  #base: URL;
  #pass: string | undefined;

  #maxPerCollection: number;
  #maxPerPage: number;

  #collections: Options["collections"];
  #customStackTransform: StackableTransform = {};

  #cache = new Map<string, unknown>();

  constructor(options: Options) {
    this.#base = new URL(options.baseUrl);
    this.#maxPerCollection = options.maxPerCollection;
    this.#maxPerPage = options.maxPerPage;
    this.#collections = options.collections;

    this.addTransformer(options.transform);

    if (options.auth) {
      this.#pass = options.auth.includes(":")
        ? btoa(options.auth)
        : options.auth;
    }
  }

  async *collection(
    name: string,
    limit: number = this.#maxPerCollection,
  ): AsyncGenerator<Partial<PageData>> {
    const filterList: Transformer[] = [
      requirementFilter,
      presetTransform[name] || this.#customStackTransform["*"],
      ...(this.#customStackTransform[name] ?? []),
    ];

    const response = this.#fetchAll<WP_REST_API>(
      this.#collections[name],
      limit,
    );
    for await (const raw of response) {
      yield filterList.reduce(
        (data, transform) =>
          typeof transform === "function" ? transform(data, raw) : data,
        { type: name } as Partial<PageData>,
      );
    }
  }

  async *#fetchAll<T>(
    apiPath: string,
    limit: number,
  ): AsyncGenerator<T> {
    let pageIndex = 1;
    let counter = 0;

    while (limit > counter) {
      const pageSize = Math.min(limit - counter, this.#maxPerPage);
      counter += pageSize;

      const posts = await this.#fetch<T>(
        apiPath,
        [
          ["page", `${pageIndex++}`],
          ["per_page", `${pageSize}`],
        ],
      );

      for (const post of posts) {
        yield post;
      }

      if (posts.length < this.#maxPerPage) {
        break;
      }
    }
  }

  async #fetch<T>(apiPath: string, query: QueryParams = []): Promise<T[]> {
    const url = this.#craftUrl(apiPath, query);
    const cacheKey = url.toString();

    if (this.#cache.has(cacheKey)) {
      return this.#cache.get(cacheKey) as T[];
    }

    const headers = this.#pass
      ? { Authorization: `Basic ${this.#pass}` }
      : undefined;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(
        `Unable to fetch the data: ${res.status}»${res.statusText}`,
      );
    }

    const data = await res.json();
    this.#cache.set(cacheKey, data);
    return data;
  }

  #craftUrl(apiPath: string, query_params: QueryParams = []): URL {
    const params = new URLSearchParams([
      ...query_params,
      [WordPressAPI.#apiRoute, apiPath],
    ]);

    return new URL("/index.php?" + params.toString(), this.#base);
  }

  addTransformer(transform: Transform) {
    for (const [name, transformer] of Object.entries(transform)) {
      if (typeof this.#customStackTransform[name] === "undefined") {
        this.#customStackTransform[name] = [transformer];
      } else {
        this.#customStackTransform[name].push(transformer);
      }
    }
  }
}

function requirementFilter(
  data: Partial<PageData>,
  raw: WP_REST_API,
): Partial<PageData> {
  return {
    ...data,
    id: raw.id,
    slug: raw.slug,
    url: new URL(raw?.source_url || raw?.link).pathname,
    date: raw?.date ? new Date(raw?.date) : undefined,
  };
}

function termToData(data: Partial<PageData>, raw: WP_REST_API) {
  return {
    ...data,
    name: raw.name,
    description: raw.description,
    count: raw.count,
  };
}
