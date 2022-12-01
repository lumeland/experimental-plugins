export default async function* ({ wp }) {
  for await (const page of wp.posts()) {
    yield { ...page, layout: "post.njk" };
  }
  for await (const page of wp.authors()) {
    yield { ...page, layout: "author.njk" };
  }
  for await (const page of wp.tags()) {
    yield { ...page, layout: "tag.njk" };
  }
  for await (const page of wp.categories()) {
    yield { ...page, layout: "category.njk" };
  }
  for await (const page of wp.pages()) {
    yield { ...page, layout: "page.njk" };
  }
}
