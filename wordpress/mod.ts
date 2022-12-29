import { merge } from "lume/core/utils.ts";
import type { PageData, Site } from "lume/core.ts";
import {
  WP_REST_API_Attachment,
  WP_REST_API_Post,
  WP_REST_API_Term,
  WP_REST_API_User,
} from "npm:wp-types@3.61.0";

export interface WP_Info {
  name: string;
  description: string;
  url: string;
  home: string;
  gmt_offset: string;
  timezone_string: string;
}

export interface Options {
  wp_url: string;
  limit: number;
}

export const defaults: Options = {
  wp_url: "https://localhost",
  limit: Infinity,
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const wp = new WordPressAPI(options);

  return (site: Site) => {
    site.data("wp", wp);
  };
}

export class WordPressAPI {
  #main_endpoint: URL;
  #api_endpoint: URL;
  #limit: number;
  // deno-lint-ignore no-explicit-any
  #cache = new Map<string, any>();

  constructor(options: Options) {
    this.#main_endpoint = new URL(options.wp_url);
    this.#api_endpoint = new URL("./wp-json/wp/v2/", options.wp_url);
    this.#limit = options.limit;
  }

  async info(): Promise<WP_Info> {
    const res = await fetch(new URL("meta", this.#main_endpoint));
    return await res.json() as WP_Info;
  }

  /** Returns all posts of the site */
  async *posts(limit?: number): AsyncGenerator<Partial<PageData>> {
    for await (const post of this.#fetchAll<WP_REST_API_Post>("posts", limit)) {
      yield postToData(post);
    }
  }

  /** Returns all pages of the site */
  async *pages(limit?: number): AsyncGenerator<Partial<PageData>> {
    for await (const page of this.#fetchAll<WP_REST_API_Post>("pages", limit)) {
      yield pageToData(page);
    }
  }

  /** Returns all categories of the site */
  async *categories(limit?: number): AsyncGenerator<Partial<PageData>> {
    for await (
      const category of this.#fetchAll<WP_REST_API_Term>("categories", limit)
    ) {
      yield termToData(category);
    }
  }

  /** Returns all tags of the site */
  async *tags(limit?: number): AsyncGenerator<Partial<PageData>> {
    for await (const tag of this.#fetchAll<WP_REST_API_Term>("tags", limit)) {
      yield termToData(tag);
    }
  }

  /** Returns all authors of the site */
  async *authors(limit?: number): AsyncGenerator<Partial<PageData>> {
    for await (const user of this.#fetchAll<WP_REST_API_User>("users", limit)) {
      yield userToData(user);
    }
  }

  /** Returns all media of the site */
  async *media(limit?: number): AsyncGenerator<Partial<PageData>> {
    for await (
      const media of this.#fetchAll<WP_REST_API_Attachment>("media", limit)
    ) {
      yield mediaToData(media);
    }
  }

  async *#fetchAll<T>(path: string, limit = this.#limit): AsyncGenerator<T> {
    const max_per_page = 100;
    let page = 1;
    let counter = 0;

    while (limit > counter) {
      const per_page = Math.min(limit - counter, max_per_page);
      counter += per_page;
      const posts = await this.#fetch<T>(
        `${path}?per_page=${per_page}&page=${page++}`,
      );

      for (const post of posts) {
        yield post;
      }

      if (posts.length < max_per_page) {
        break;
      }
    }
  }

  async #fetch<T>(path: string): Promise<T[]> {
    const url = new URL(path, this.#api_endpoint);
    const cacheKey = url.toString();

    if (this.#cache.has(cacheKey)) {
      return this.#cache.get(cacheKey);
    }

    const res = await fetch(url);
    const data = await res.json() as T[];
    this.#cache.set(cacheKey, data);
    return data;
  }
}

function postToData(post: WP_REST_API_Post): Partial<PageData> {
  return {
    id: post.id,
    url: new URL(post.link).pathname,
    slug: post.slug,
    date: new Date(post.date),
    title: post.title.rendered,
    content: post.content.rendered,
    excerpt: post.excerpt.rendered,
    category_id: post.categories,
    tag_id: post.tags,
    sticky: post.sticky,
    author_id: post.author,
    type: "post",
  };
}

function pageToData(post: WP_REST_API_Post): Partial<PageData> {
  return {
    id: post.id,
    url: new URL(post.link).pathname,
    slug: post.slug,
    date: new Date(post.date),
    title: post.title.rendered,
    content: post.content.rendered,
    excerpt: post.excerpt.rendered,
    author_id: post.author,
    type: "page",
  };
}

function termToData(term: WP_REST_API_Term): Partial<PageData> {
  return {
    id: term.id,
    url: new URL(term.link).pathname,
    slug: term.slug,
    title: term.name,
    name: term.name,
    count: term.count,
    type: term.taxonomy === "category" ? "category" : "tag",
  };
}

function userToData(term: WP_REST_API_User): Partial<PageData> {
  return {
    id: term.id,
    url: new URL(term.link).pathname,
    slug: term.slug,
    title: term.name,
    name: term.name,
    avatar_urls: term.avatar_urls,
    type: "author",
  };
}

function mediaToData(
  media: WP_REST_API_Attachment,
): Partial<PageData> {
  return {
    id: media.id,
    url: new URL(media.source_url).pathname,
    slug: media.slug,
    title: media.title.rendered,
    caption: media.caption.rendered,
    alt_text: media.alt_text,
    media_type: media.media_type,
    mime_type: media.mime_type,
    media_details: media.media_details,
    type: "media",
  };
}
