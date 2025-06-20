import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import GanttController from "./activity.controller";
import {useRequireRole} from '../../../hooks/droits'

const activityRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

}

export default activityRoutes;