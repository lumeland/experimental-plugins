import { merge } from "lume/core/utils.ts";
import { Client } from "npm:@notionhq/client@2.2.3";
import { NotionToMarkdown } from "npm:notion-to-md@2.5.5";

import type { PageData, Site } from "lume/core.ts";

// infer types from Notion Client because they are not exported.
type GetPageResponse = Awaited<ReturnType<Client["pages"]["retrieve"]>>;
type PageObjectResponse = Extract<GetPageResponse, { parent: any }>;
type PartialPageObjectResponse = Exclude<GetPageResponse, PageObjectResponse>;
type PageProperties = PageObjectResponse["properties"];
type QueryFilter = Parameters<Client["databases"]["query"]>[0]["filter"];

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
    filter?: QueryFilter
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
      if (!isCompletePageObject(row)) continue;
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
        title: "title" in database ? database.title[0].plain_text : null,
        id: database.id,
      };
    }
  }
}

function isCompletePageObject(
  page: PageObjectResponse | PartialPageObjectResponse
): page is PageObjectResponse {
  return "parent" in page;
}

function plainDatabaseProperties(properties: PageProperties) {
  const result: Record<string, any> = {};
  for (const [name, value] of Object.entries(properties)) {
    const key = name.toLocaleLowerCase().replace(" ", "_");
    result[key] = getPropertyValue(value);
  }
  return result;
}

function getPropertyValue(value: PageProperties[string]) {
  switch (value.type) {
    case "multi_select":
      return value.multi_select.map((item) => item.name);
  }

  const val: unknown = value[value.type as keyof typeof value];

  if (Array.isArray(val)) {
    return val.map((item) => item.plain_text).join("\n");
  } else {
    return val;
  }
}
