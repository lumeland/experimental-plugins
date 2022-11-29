export const layout = "post.njk";

export default async function* ({ wp }) {
  for await (const post of wp.posts()) {
    yield {
      url: `/posts/${post.slug}/`,
      title: post.title.rendered,
      content: post.content.rendered,
    };
  }
}
