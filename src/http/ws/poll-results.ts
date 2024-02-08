import { FastifyInstance } from "fastify";

export async function getPoll(app: FastifyInstance) {
  app.get("/polls/:pollId/results", { websocket: true });
}
