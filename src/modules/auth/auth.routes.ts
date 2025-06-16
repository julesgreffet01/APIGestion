import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import AuthController from './auth.controller'

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const authController = new AuthController()

    fastify.post('/login', authController.login)
    fastify.post('/register', authController.register)
}
export default authRoutes;