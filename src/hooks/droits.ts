import {FastifyRequest, FastifyReply} from 'fastify'

export const useVerifyToken = async (req: FastifyRequest, reply:FastifyReply ) => {
    const isValid = await req.server.verifyToken(req);
    if (!isValid) {
        return reply.code(401).send({ error: 'Token invalide' });
    }
}

export const useVerifyParamExist = async (req: FastifyRequest, reply:FastifyReply, requiredParam: string[] ) => {
    const isValid = await req.server.verifyParamExist(req, requiredParam)
    if (!isValid) {
        return reply.apiResponse(400, 'parametres manquants');
    }
}

export const useCheckAccessProject = async (req: FastifyRequest<{Params: { projectId: number }}>, reply:FastifyReply) => {
    const {projectId} = req.params;
    const isValid = await req.server.checkAccessProject(req, projectId);
    if (!isValid) {
        return reply.apiResponse(401, 'pas acces a ce projet');
    }
}

export const useRequireRole = async (req: FastifyRequest<{Params: { projectId: number }}>, reply:FastifyReply, roles: string[]) => {
    const {projectId} = req.params;
    const isValid = await req.server.requireRole(req, roles, projectId);
    if (!isValid) {
        return reply.apiResponse(401, 'pas acces a ce projet');
    }
}