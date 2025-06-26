import Fastify, { FastifyInstance } from 'fastify';
import * as dotenv from 'dotenv';
import apiResponsePlugin from './plugins/response'
import droitsPlugins from './plugins/droits'
import jwt from '@fastify/jwt'
import path from 'path'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fs from 'fs'
import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors'

//----- routes ---
import userRoutes from './modules/user/user.routes'
import authRoutes from './modules/auth/auth.routes'
import calendarRoutes from './modules/calendar/calendar.routes'
import projectRoutes from './modules/project/project.routes'
import roleRoutes from './modules/role/role.routes'
import statutRoutes from "./modules/statut/statut.routes";
import vaultRoutes from "./modules/vaultPassword/vault.routes";


dotenv.config();

// server
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

// plugins
fastify.register(apiResponsePlugin);
fastify.register(droitsPlugins);

// routes
fastify.register(authRoutes);
fastify.register(userRoutes, {prefix: '/user'});
fastify.register(calendarRoutes, {prefix: '/calendar'});
fastify.register(projectRoutes, {prefix: '/project'});
fastify.register(roleRoutes, {prefix: '/role'});
fastify.register(statutRoutes, {prefix: '/statut'});
fastify.register(vaultRoutes, {prefix: '/password'});

//start du server
const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start()
