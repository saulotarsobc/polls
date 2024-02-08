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
        .catch((e: Error) => {
          reply.status(404).send({ msg: e.message });
        });

      const result = await redis.zrange(pollId, 0, -1, "WITHSCORES");
      const votes = result.reduce((obj, line, index) => {
        if (index % 2 == 0) {
          const score = result[index + 1];

          Object.assign(obj, { [line]: Number(score) });
        }

        return obj;
      }, {} as Record<string, number>);

      return reply.status(200).send({
        poll: {
          id: poll?.id,
          title: poll?.title,
          options: poll?.options.map((options) => {
            return {
              id: options.id,
              title: options.title,
              score: options.id in votes ? votes[options.id] : 0,
            };
          }),
        },
      });
    }
  );
}
