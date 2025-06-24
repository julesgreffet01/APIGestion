import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import GanttController from "./gantt.controller";
import {useCheckAccessProject, useRequireRole} from '../../hooks/droits'
import {useCheckGanttInProject} from "./gantt.helpers";
import activityRoutes from "./ganttActivity/activity.routes";

const ganttRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const ganttController = new GanttController();

    fastify.get('/', ganttController.getAllByProject)
    fastify.post<{Params: {projectId: number}, Body: {name: string}}>('/',{preHandler: useRequireRole(['Admin'])}, ganttController.create)
    fastify.put<{Body: {name: string}, Params: {ganttId: number, projectId: number}}>('/:ganttId', {preHandler: [useCheckGanttInProject(), useRequireRole(['Admin'])]}, ganttController.update)
    fastify.delete<{Params: {ganttId: number, projectId: number}}>('/:ganttId', {preHandler: [useCheckGanttInProject(), useRequireRole(['Admin'])]}, ganttController.delete)

    fastify.register(async function (projectScoped) {
        await projectScoped.register(activityRoutes, { prefix: '/:ganttId/activity' });
    });
}

export default ganttRoutes;
