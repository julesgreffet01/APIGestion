import {FastifyRequest, FastifyReply, preHandlerHookHandler} from 'fastify'

export const useVerifyToken = (): preHandlerHookHandler => {
    return async function (req: FastifyRequest, reply: FastifyReply) {
        const isValid = await req.server.verifyToken(req);
        if (!isValid) {
            return reply.apiResponse(405, 'token invalid');
        }
    };
};

export const useCheckAccessProject = (): preHandlerHookHandler => {
    return async function (req: FastifyRequest, reply: FastifyReply) {
        const { projectId } = req.params as { projectId: number };
        if(isNaN(projectId)) return reply.apiResponse(500)
        const isValid = await req.server.checkAccessProject(req, Number(projectId));
        if (!isValid) {
            return reply.apiResponse(401, 'pas accès à ce projet');
        }
    };
};

export const useRequireRole = (roles: string[]): preHandlerHookHandler => {
    return async function (req: FastifyRequest, reply: FastifyReply) {
        const { projectId } = req.params as { projectId: number };
        const isValid = await req.server.requireRole(req, roles, projectId);
        if (!isValid) {
            return reply.apiResponse(401, 'rôle insuffisant pour ce projet');
        }
    };
};
