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

export interface Options {
  baseUrl: string;
  auth?: string | `${string}:${string}`; // Base64 | 'user:pass'
  maxPerCollection: number;
  maxPerPage: number;
  collections: Record<string, string>; // API full path, ex: /namespace/path
  transform: Record<string, Transformer | Transformer[]>;
  cache: number;
}

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
  cache: 60 * 60 * 24, // 1 day
  transform: {
    "*": [
      requirementFilter,
    ],
    post: (data, raw) => ({
      ...data,
      title: raw?.title?.rendered,
      content: raw?.content?.rendered,
      excerpt: raw?.excerpt?.rendered,
      tag_id: raw.tags,
      category_id: raw.categories,
      sticky: raw.sticky,
      author_id: raw.author,
    }),
    page: (data, raw) => ({
      ...data,
      title: raw?.title?.rendered,
      content: raw?.content?.rendered,
      excerpt: raw?.excerpt?.rendered,
      author_id: raw.author,
    }),
    tag: termToData,
    category: termToData,
    author: (data, raw) => ({
      ...data,
      name: raw.name,
      description: raw.description,
      avatar_urls: raw.avatar_urls,
    }),
    media: (data, raw) => ({
      ...data,
      caption: raw.caption.rendered,
      alt_text: raw.alt_text,
      media_type: raw.media_type,
      mime_type: raw.mime_type,
      media_details: raw.media_details,
    }),
  },
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const wp = new WordPressAPI(options);

  wp.addTransformers(defaults.transform);
  wp.addTransformers(userOptions?.transform ?? {});

  return (site: Site) => {
    site.data("wp", wp);
    site.hooks.addWordPressTransformer = wp.addTransformer.bind(wp);
  };
}

export class WordPressAPI {
  static #apiRoute = "rest_route";

  #base: URL;
  #pass: string | undefined;
  #cache: number;

  #maxPerCollection: number;
  #maxPerPage: number;

  #collections: Options["collections"];
  #transformers: Record<string, Transformer[]> = {};

  constructor(options: Options) {
    this.#base = new URL(options.baseUrl);
    this.#maxPerCollection = options.maxPerCollection;
    this.#maxPerPage = options.maxPerPage;
    this.#collections = options.collections;
    this.#cache = options.cache;

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
    const transformers: Transformer[] = [
      ...(this.#transformers["*"] ?? []),
      ...(this.#transformers[name] ?? []),
    ];

    const response = this.#fetchAll<WP_REST_API>(
      this.#collections[name],
      limit,
    );
    for await (const raw of response) {
      yield transformers.reduce(
        (data, transform) => transform(data, raw),
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
    const headers = this.#pass
      ? { Authorization: `Basic ${this.#pass}` }
      : undefined;

    return await fetchJSON(new Request(url, { headers }), this.#cache);
  }

  #craftUrl(apiPath: string, query_params: QueryParams = []): URL {
    const params = new URLSearchParams([
      ...query_params,
      [WordPressAPI.#apiRoute, apiPath],
    ]);

    return new URL("/index.php?" + params.toString(), this.#base);
  }

  addTransformers(transformers: Record<string, Transformer | Transformer[]>) {
    for (const [name, transformer] of Object.entries(transformers)) {
      if (Array.isArray(transformer)) {
        this.addTransformer(name, ...transformer);
        continue;
      }

      this.addTransformer(name, transformer);
    }
  }

  addTransformer(name: string, ...transformers: Transformer[]) {
    if (typeof this.#transformers[name] === "undefined") {
      this.#transformers[name] = transformers;
    } else {
      this.#transformers[name].push(...transformers);
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

async function fetchJSON(request: Request, ttl?: number): Promise<any> {
  const cache = await caches.open("lume_remote_files");
  let cached = await cache.match(request);

  if (cached && ttl) {
    const cachedAt = cached.headers.get("x-cached-at");

    if (cachedAt) {
      const cacheTime = new Date(cachedAt);
      const diff = Date.now() - cacheTime.getTime();

      if (diff <= ttl * 1000) {
        return await cached.json();
      }
    }
  }

  const response = await fetch(request);

  if (!response.ok) {
    throw new Error(
      `Unable to fetch the data from ${request.url}: ${response.status}»${response.statusText}`,
    );
  }

  const body = await response.json();
  cached = new Response(JSON.stringify(body));
  cached.headers.set("x-cached-at", new Date().toString());
  cached.headers.set("content-type", "application/json; charset=utf-8");
  await cache.put(request, cached);
  return body;
}
