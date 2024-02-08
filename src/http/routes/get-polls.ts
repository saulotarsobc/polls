import z from "zod";
import { prisma } from "../../lib/prisma";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { redis } from "../../lib/redis";

export async function getPoll(app: FastifyInstance) {
  app.get(
    "/polls/:pollId",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const getPollParams = z.object({
        pollId: z.string().uuid(),
      });

      const { pollId } = getPollParams.parse(req.params);

      const poll = await prisma.poll
        .findUnique({
          where: { id: pollId },
          include: { options: { select: { title: true, id: true } } },
        })
        .then((data) => {
          reply.status(200).send(data);
          return data;
        })
        .catch((e: Error) => {
          reply.status(404).send({ msg: e.message });
        });

      const result = await redis.zrange(pollId, 0, -1, "WITHSCORES");

      console.log(result);
    }
  );
}
