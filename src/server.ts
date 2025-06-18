import Fastify, { FastifyInstance } from 'fastify';
import * as dotenv from 'dotenv';
import apiResponsePlugin from './plugins/response'
import droitsPlugins from './plugins/droits'
import jwt from '@fastify/jwt'
import path from 'path'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import authRoutes from './modules/auth/auth.routes'
import fs from 'fs'
import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors'


dotenv.config();

const fastify: FastifyInstance = Fastify({
    requestTimeout: 5000,
    caseSensitive: true,
    logger: true
});

fastify.register(jwt, {
    secret: process.env.JWT as string,
});

fastify.register(fastifyCookie, {
    secret: process.env.COOKIE as string,
});

fastify.register(cors, {
    origin: true,
    credentials: true,
});

fastify.register(fastifyMultipart)

const uploadsPath = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath)
}

fastify.register(fastifyStatic, {
    root: uploadsPath,
    prefix: '/uploads/',
})

fastify.register(apiResponsePlugin);
fastify.register(droitsPlugins);

fastify.register(authRoutes);

const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start()
