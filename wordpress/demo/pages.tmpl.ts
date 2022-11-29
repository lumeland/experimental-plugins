export const layout = "post.njk";

export default async function* ({ wp }) {
  for await (const page of wp.posts()) {
    yield page;
  }
  for await (const page of wp.authors()) {
    yield page;
  }
  for await (const page of wp.tags()) {
    yield page;
  }
  for await (const page of wp.categories()) {
    yield page;
  }
  for await (const page of wp.pages()) {
    yield page;
  }
}
