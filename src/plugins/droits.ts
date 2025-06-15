import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default fp(async function (fastify: FastifyInstance) {
    fastify.register(jwt, {
        secret: process.env.JWT as string,
    });

    fastify.decorate('verifyToken', async function (request: FastifyRequest): Promise<boolean> {
        try {
            await request.jwtVerify();
            const userId = request.user?.userId;
            if (!userId) return false;

            const user = await prisma.user.findUnique({
                where: {id: userId},
            });
            if (!user) return false;

            return true;
        } catch {
            return false;
        }
    });
});