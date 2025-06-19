import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import UserController from "./user.controller";
import {useVerifyToken} from '../../hooks/droits'

const userRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const userController = new UserController();
    fastify.addHook('preHandler', useVerifyToken());

    fastify.post<{Body: {email?: string, password?: string, name?: string, firstName?: string}}>('/update', userController.updateUser )
    fastify.get('/', userController.find)
    fastify.get('/progressed', userController.progressed)
    fastify.get<{Params: {search: string}}>('/search/:search', userController.searchBarre)
}

export default userRoutes;