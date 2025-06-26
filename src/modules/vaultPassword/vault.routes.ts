import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import VaultController from "./vault.controller";
import {useVerifyToken} from '../../hooks/droits'

const vaultRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const vaultController = new VaultController();
    fastify.addHook('preHandler', useVerifyToken());

    fastify.get('/', vaultController.getAllByUser)
    fastify.post('/', vaultController.create)
    fastify.put('/:passwordId', vaultController.update)
    fastify.delete('/passwordId', vaultController.delete)
}

export default vaultRoutes;