import { merge } from "lume/core/utils.ts";
import { Client } from "npm:@notionhq/client@2.2.3";
import { NotionToMarkdown } from "npm:notion-to-md@2.5.5";

import type { PageData, Site } from "lume/core.ts";

export interface Options {
  token: string;
  databases: Record<string, string>;
}

export const defaults: Options = {
  token: "",
  databases: {},
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const notion = new NotionAPI(options);
    notion.prettyUrls = site.options.prettyUrls;
    site.data("notion", notion);
  };
}

export class NotionAPI {
  #client: Client;
  #options: Options;
  #toMarkdown: NotionToMarkdown;
  prettyUrls = true;

  constructor(options: Options) {
    this.#options = options;
    this.#client = new Client({ auth: options.token });
    this.#toMarkdown = new NotionToMarkdown({ notionClient: this.#client });
  }

  async *database(
    name: string,
    filter?: Record<string, unknown>,
  ): AsyncGenerator<Partial<PageData>> {
    const id = this.#options.databases[name];
    if (!id) {
      throw new Error(`Database ${name} not found`);
    }

    const result = await this.#client.databases.query({
      database_id: id,
      filter,
    });

    for (const row of result.results) {
      const mdBlocks = await this.#toMarkdown.pageToMarkdown(row.id);
      let url = new URL(row.url).pathname;
      if (this.prettyUrls) {
        url += "/";
      } else {
        url += ".html";
      }

      yield {
        id: row.id,
        url,
        date: new Date(row.created_time),
        author_id: row.created_by.id,
        ...plainDatabaseProperties(row.properties),
        content: this.#toMarkdown.toMarkdownString(mdBlocks),
        templateEngine: "md",
      };
    }
  }

  async *databases(query?: string) {
    const result = await this.#client.search({
      query,
      filter: {
        property: "object",
        value: "database",
      },
    });
    for (const database of result.results) {
      yield {
        title: database.title[0].plain_text,
        id: database.id,
      };
    }
  }
}

function plainDatabaseProperties(properties: Record<string, unknown>) {
  const result = {};
  for (const [name, value] of Object.entries(properties)) {
    const key = name.toLocaleLowerCase().replace(" ", "_");
    result[key] = getPropertyValue(value);
  }
  return result;
}

function getPropertyValue(value: Record<string, unknown>) {
  switch (value.type) {
    case "multi_select":
      return value.multi_select.map((item) => item.name);
  }

  const val = value[value.type];

  if (Array.isArray(val)) {
    return val.map((item) => item.plain_text).join("\n");
  } else {
    return val;
  }
}
