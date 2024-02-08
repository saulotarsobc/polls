import z from "zod";
import { prisma } from "../../lib/prisma";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { redis } from "../../lib/redis";

export async function voteOnPoll(app: FastifyInstance) {
  app.post(
    "/polls/:pollId/votes",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const votePollBody = z.object({
        pollOptionId: z.string().uuid(),
      });

      const votePollParams = z.object({
        pollId: z.string().uuid(),
      });

      const { pollId } = votePollParams.parse(req.params);
      const { pollOptionId } = votePollBody.parse(req.body);

      let { sessionId } = req.cookies;

      if (sessionId) {
        const userPreviousVoteOnPoll = await prisma.vote.findUnique({
          where: {
            sessionId_pollId: {
              sessionId,
              pollId,
            },
          },
        });

        if (
          userPreviousVoteOnPoll &&
          userPreviousVoteOnPoll.pollOptionId != pollOptionId
        ) {
          // apagar o voto anterior
          await prisma.vote.delete({
            where: {
              id: userPreviousVoteOnPoll.id,
            },
          });

          await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId);
        } else if (userPreviousVoteOnPoll) {
          return reply
            .status(400)
            .send({ message: "You alredy voted on this poll!" });
        }
      }

      if (!sessionId) {
        sessionId = randomUUID();

        reply.setCookie("sessionId", sessionId, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 dias
          signed: true,
          httpOnly: true,
        });
      }

      await redis.zincrby(pollId, 1, pollOptionId);

      return await prisma.vote
        .create({
          data: {
            sessionId,
            pollId,
            pollOptionId,
          },
        })
        .then((data) => {
          reply.status(201).send(data);
        })
        .catch((e: Error) => {
          reply.status(404).send({ msg: e.message });
        });
    }
  );
}
