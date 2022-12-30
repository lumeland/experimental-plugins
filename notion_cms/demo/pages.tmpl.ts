export const layout = "post.njk";

export default async function* ({ notion }) {
  for await (const page of notion.database("blog")) {
    yield page;
  }
}
