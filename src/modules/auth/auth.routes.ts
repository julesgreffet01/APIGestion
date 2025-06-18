import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import AuthController from './auth.controller'
import {useVerifyToken} from '../../hooks/droits'

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const authController = new AuthController(fastify)

    fastify.post<{ Body: { email: string; password: string } }>('/login', authController.login)
    fastify.post('/register', authController.register)
    fastify.post<{ Body: { email: string }}>('/recupérationMDP', authController.recuperationMDP)
    fastify.post<{ Body: { newPassword: string } }>('/reinitialiosationMDP',{preHandler: [useVerifyToken] }, authController.reinitialisationMDP)
    fastify.post('/extension/refresh', authController.refreshToken)
}
export default authRoutes;