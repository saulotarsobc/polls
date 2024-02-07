import z from "zod";
import { prisma } from "../../lib/prisma";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function getPoll(app: FastifyInstance) {
  app.get(
    "/polls/:pollId",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const getPollParams = z.object({
        pollId: z.string().uuid(),
      });

      const { pollId } = getPollParams.parse(req.params);

      await prisma.poll
        .findUnique({
          where: { id: pollId },
          include: { options: { select: { title: true, id: true } } },
        })
        .then((data) => {
          reply.status(200).send(data);
        });
    }
  );
}
