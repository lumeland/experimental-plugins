// export default async function* ({ wp }) {
//   for await (const page of wp.posts()) {
//     yield { ...page, layout: "post.njk" };
//   }
//   for await (const page of wp.authors()) {
//     yield { ...page, layout: "author.njk" };
//   }
//   for await (const page of wp.tags()) {
//     yield { ...page, layout: "tag.njk" };
//   }
//   for await (const page of wp.categories()) {
//     yield { ...page, layout: "category.njk" };
//   }
//   for await (const page of wp.pages()) {
//     if (page.url === "/") continue; // Skip the home page (it's already generated)
//     yield { ...page, layout: "page.njk" };
//   }
// }

export default async function* ({ wp }) {
  // api_path: /wp/v2/posts
  for await (const page of wp.collection('posts')) {
    yield { ...page, layout: "post.njk" };
  }

  // api_path: /wp/v2/users
  for await (const page of wp.collection('users')) {
    yield { ...page, layout: "author.njk" };
  }

  // api_path: /wp/v2/tags
  for await (const page of wp.collection('tags')) {
    yield { ...page, layout: "tag.njk" };
  }

  // api_path: /wp/v2/categories
  for await (const page of wp.collection('categories')) {
    yield { ...page, layout: "category.njk" };
  }

  // api_path: /wp/v2/pages
  for await (const page of wp.collection('pages')) {
    if (page.url === "/") continue; // Skip the home page (it's already generated)
    yield { ...page, layout: "page.njk" };
  }
}
