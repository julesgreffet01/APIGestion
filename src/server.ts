import Fastify, { FastifyInstance } from 'fastify';
import * as dotenv from 'dotenv';
import apiResponsePlugin from './plugins/response'
import droitsPlugins from './plugins/droits'

dotenv.config();

const fastify: FastifyInstance = Fastify({
    requestTimeout: 5000,
    caseSensitive: true,
});

fastify.register(apiResponsePlugin);
fastify.register(droitsPlugins);

const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
        console.log('Server is running on http://localhost:3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start()
