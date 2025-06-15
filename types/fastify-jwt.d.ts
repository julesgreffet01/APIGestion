// types/fastify-jwt.d.ts
import '@fastify/jwt';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { userId: number };
        user: { userId: number };
    }
}
