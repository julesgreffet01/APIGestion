import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import GanttController from "./gantt.controller";
import {useRequireRole} from '../../hooks/droits'
import {useCheckGanttInProject} from "./gantt.helpers";

const ganttRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const ganttController = new GanttController();

    fastify.get('/', ganttController.getAllByProject)
    fastify.post<{Params: {projectId: number}, Body: {name: string}}>('/',{preHandler: useRequireRole(['Admin'])}, ganttController.create)
    fastify.put<{Body: {name: string}, Params: {ganttId: number, projectId: number}}>('/:ganttId', {preHandler: [useCheckGanttInProject(), useRequireRole(['Admin'])]}, ganttController.update)
    fastify.delete<{Params: {ganttId: number, projectId: number}}>('/:ganttId', {preHandler: [useCheckGanttInProject(), useRequireRole(['Admin'])]}, ganttController.delete)
}

export default ganttRoutes;
