import 'fastify'

declare module 'fastify' {
    interface FastifyReply {
        apiResponse(
            statusCode: number,
            data?: any,
        ): FastifyReply
    }
}
