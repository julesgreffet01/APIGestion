import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import GanttController from "./gantt.controller";
import {useVerifyToken, useRequireRole, useCheckAccessProject} from '../../hooks/droits'
import {useCheckGanttInProject} from "./gantt.helpers";

const ganttRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const ganttController = new GanttController();
    fastify.addHook('preHandler', useVerifyToken());
    fastify.addHook('preHandler', useCheckAccessProject())


}

export default ganttRoutes;
