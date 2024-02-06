import fastify from "fastify";

const app = fastify();

app.get("/hello", () => {
  return { msg: "relou" };
});

app.listen({ port: 3333 }).then(() => {
  console.log("HTTP Server running!");
});
