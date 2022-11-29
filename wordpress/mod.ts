import { merge } from "lume/core/utils.ts";
import type { Site } from "lume/core.ts";
import {
  WP_REST_API_Category,
  WP_REST_API_Post,
  WP_REST_API_Tag,
} from "npm:wp-types@3.61.0";

export type WP_Post = WP_REST_API_Post;
export type WP_Page = WP_REST_API_Post;
export type WP_Category = WP_REST_API_Category;
export type WP_Tag = WP_REST_API_Tag;
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
  async *posts(): AsyncGenerator<WP_Post> {
    yield* this.#fetchAll<WP_Post>("posts");
  }

  /** Returns all pages of the site */
  async *pages(): AsyncGenerator<WP_Page> {
    yield* this.#fetchAll<WP_Page>("pages");
  }

  /** Returns all categories of the site */
  async *categories(): AsyncGenerator<WP_Category> {
    yield* this.#fetchAll<WP_Category>("categories");
  }

  /** Returns all tags of the site */
  async *tags(): AsyncGenerator<WP_Tag> {
    yield* this.#fetchAll<WP_Tag>("tags");
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
