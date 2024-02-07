import z from "zod";
import { prisma } from "../../lib/prisma";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function createPoll(app: FastifyInstance) {
  app.post("/polls", async (req: FastifyRequest, reply: FastifyReply) => {
    const createPollBody = z.object({
      title: z.string(),
      options: z.array(z.string()),
    });

    const { title, options } = createPollBody.parse(req.body);

    await prisma.poll
      .create({
        data: {
          title,
          options: {
            createMany: {
              data: options.map((option) => {
                return { title: option };
              }),
            },
          },
        },
      })
      .then((data) => {
        reply.status(201).send({ pollId: data.id });
      });
  });
}
