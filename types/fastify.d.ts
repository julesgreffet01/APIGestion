import 'fastify'

declare module 'fastify' {
    interface FastifyReply {
        apiResponse(
            statusCode: number,
            data?: any,
        ): FastifyReply
    }
    interface FastifyInstance {
        verifyToken: (request: FastifyRequest) => Promise<boolean>;
        checkAccessProject: (request: FastifyRequest, projectId: number) => Promise<boolean>;
        verifyParamExist: (request: FastifyRequest, requiredParams: string[]) => Promise<boolean>;
        requireRole: (request: FastifyRequest, roles: string[], projectId: number) => Promise<boolean>;
    }

    interface FastifyRequest {
        user?: {
            userId: number;
        };
    }
}
