import Server from "lume/core/server.ts";
import Router from "./mod.ts";

const server = new Server();
const router = new Router({
  location: "http://localhost:8000",
});

router.get("/", () =>
  Response.json({
    message: "Hello, world!",
  }));

router.get("/hello/:name", ({ name }) =>
  Response.json({
    message: `Hello, ${name}!`,
  }));

server.use(router.middleware());

server.start();
