import Server from "lume/core/server.ts";
import Router from "./mod.ts";

const server = new Server();
const router = new Router({
  location: "http://localhost:8000",
});

router.get("/", () => {
  return new Response(
    `
    <html>
      <head>
        <title>Router demo</title>
      </head>
      <body>
        <form method="post" action="/say">
          <label for="name">Name:</label>
          <input type="text" name="name" id="name">
          <button type="submit">Say hello</button>
        </form>
      </body>
    `,
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  );
});

router.post("/say", async ({ request }) => {
  const name = (await request.formData()).get("name");
  return new Response(`Hello, ${name}!`);
});

router.get("/hello/:name", ({ name }) =>
  Response.json({
    message: `Hello, ${name}!`,
  }));

server.use(router.middleware());

server.start();
