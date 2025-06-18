import {FastifyRequest, FastifyReply} from 'fastify'

export const useVerifyToken = async (req: FastifyRequest, reply:FastifyReply ) => {
    const isValid = await req.server.verifyToken(req);
    if (!isValid) {
        return reply.code(401).send({ error: 'Token invalide' });
    }
};
