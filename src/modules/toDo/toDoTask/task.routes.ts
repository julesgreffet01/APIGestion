import {FastifyPluginAsync, FastifyInstance} from 'fastify'
import ActivityController from "./task.controller";
import {useRequireRole} from '../../../hooks/droits'

const activityRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

}
export default activityRoutes;