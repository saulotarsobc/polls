import { FastifyInstance } from "fastify";

export async function pollResults(app: FastifyInstance) {
  app.get("/polls/:pollId/results", { websocket: true }, (connection, req) => {
    connection.socket.on("message", (message: string) => {
      // connection.socket.send("you sent: " + message);
    });
  });
}
