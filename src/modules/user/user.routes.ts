import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import UserController from "./user.controller.js";
import {useVerifyToken} from '../../hooks/droits.js'

const userRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const userController = new UserController();
    fastify.addHook('preHandler', useVerifyToken());

    fastify.put<{Body: {email?: string, name?: string, firstName?: string}}>('/', userController.updateUser )
    fastify.put('/password', userController.changePassword)
    fastify.get('/', userController.find)
    fastify.get('/progressed', userController.progressed)
    fastify.get<{Params: {search: string}}>('/search/:search', userController.searchBarre)
    fastify.get<{ Params: { projectId: number } }>('/notInProject/:projectId', userController.getAllNoInProject)
    fastify.get<{ Params: { projectId: number } }>('/inProject/:projectId', userController.getAllInProject)
}

export default userRoutes;