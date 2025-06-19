import fp from 'fastify-plugin'
import {FastifyInstance, FastifyRequest} from 'fastify'
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export default fp(async function (fastify: FastifyInstance) {

    fastify.decorate('verifyToken', async function (this: FastifyInstance,request: FastifyRequest): Promise<boolean> {
        try {
            await request.jwtVerify();

            const userId = request.user?.userId;
            if (!userId) return false;

            await prisma.user.findUniqueOrThrow({
                where: { id: userId },
                select: { id: true }
            });
            return true;
        } catch (err) {
            console.error('❌ Erreur de vérification du token :', err);
            return false;
        }
    });

    fastify.decorate('checkAccessProject', async function (request: FastifyRequest, projectId: number): Promise<boolean> {
        const userId = request.user?.userId;
        const count = await prisma.userProject.count({
            where: {userId, projectId},
        });
        return count > 0;
    });

    fastify.decorate('requireRole', async function (request: FastifyRequest, roles: string[], projectId: number): Promise<boolean> {
        const userId = request.user?.userId;
        const relation = await prisma.userProject.findFirst({
            where: { userId, projectId },
            select: {roleId: true}
        });
        if (!relation) return false;
        const role = await prisma.role.findUnique({
            where:{id: relation.roleId}
        });
        if (!role) return false;
        return roles.includes(role.name);
    });
});