import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import AuthController from './auth.controller.js'
import {useVerifyToken} from '../../hooks/droits.js'

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const authController = new AuthController()

    fastify.post<{ Body: { email: string; password: string } }>('/login', authController.login)
    fastify.post('/register', authController.register)
    fastify.post<{ Body: { email: string }}>('/recuperationMDP', authController.recuperationMDP)
    fastify.post<{ Body: { newPassword: string } }>('/reinitialisationMDP',{preHandler: [useVerifyToken()] }, authController.reinitialisationMDP)
}
export default authRoutes;