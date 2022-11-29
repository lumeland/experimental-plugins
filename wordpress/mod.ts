import { merge } from "lume/core/utils.ts";
import type { PageData, Site } from "lume/core.ts";
import {
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
}

export const defaults: Options = {
  wp_url: "https://localhost",
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const wp = new WordPressAPI(options.wp_url);

  return (site: Site) => {
    site.data("wp", wp);
  };
}

export class WordPressAPI {
  #main_endpoint: URL;
  #api_endpoint: URL;

  constructor(wp_url: string) {
    this.#main_endpoint = new URL(wp_url);
    this.#api_endpoint = new URL("./wp-json/wp/v2/", wp_url);
  }

  async info(): Promise<WP_Info> {
    const res = await fetch(new URL("meta", this.#main_endpoint));
    return await res.json() as WP_Info;
  }

  /** Returns all posts of the site */
  async *posts(): AsyncGenerator<PageData> {
    for await (const post of this.#fetchAll<WP_REST_API_Post>("posts")) {
      yield postToData(post);
    }
  }

  /** Returns all pages of the site */
  async *pages(): AsyncGenerator<PageData> {
    for await (const page of this.#fetchAll<WP_REST_API_Post>("pages")) {
      yield postToData(page);
    }
  }

  /** Returns all categories of the site */
  async *categories(): AsyncGenerator<PageData> {
    for await (
      const category of this.#fetchAll<WP_REST_API_Term>("categories")
    ) {
      yield termToData(category);
    }
  }

  /** Returns all tags of the site */
  async *tags(): AsyncGenerator<PageData> {
    for await (const tag of this.#fetchAll<WP_REST_API_Term>("tags")) {
      yield termToData(tag);
    }
  }

  /** Returns all authors of the site */
  async *authors(): AsyncGenerator<PageData> {
    for await (const user of this.#fetchAll<WP_REST_API_User>("users")) {
      yield userToData(user);
    }
  }

  async *#fetchAll<T>(path: string): AsyncGenerator<T> {
    let page = 1;
    const per_page = 100;

    while (true) {
      const posts = await this.#fetch<T>(
        `${path}?per_page=${per_page}&page=${page++}`,
      );

      for (const post of posts) {
        yield post;
      }

      if (posts.length < per_page) {
        break;
      }
    }
  }

  async #fetch<T>(path: string): Promise<T[]> {
    const res = await fetch(new URL(path, this.#api_endpoint));
    return await res.json() as T[];
  }
}

function postToData(post: WP_REST_API_Post): PageData {
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
    author: post.author,
    type: post.type,
  };
}

function termToData(term: WP_REST_API_Term): PageData {
  return {
    id: term.id,
    url: new URL(term.link).pathname,
    slug: term.slug,
    title: term.name,
    name: term.name,
    count: term.count,
    type: term.taxonomy,
  };
}

function userToData(term: WP_REST_API_User): PageData {
  return {
    id: term.id,
    url: new URL(term.link).pathname,
    slug: term.slug,
    title: term.name,
    name: term.name,
    type: "author",
    avatar_urls: term.avatar_urls,
  };
}
