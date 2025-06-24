import {FastifyPluginAsync, FastifyInstance} from 'fastify'
import ActivityController from "./activity.controller";
import {useRequireRole} from '../../../hooks/droits'
import {useCheckActivityInGantt} from "./activity.helpers";

const activityRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
        const activityController = new ActivityController();
        fastify.get('/', activityController.getAllByGantt);
        fastify.post<{ Body: {name: string, description: string, startDate: string, endDate: string, userIds?: number[], dependencesIds?: number[] }, Params: { ganttId: number, projectId: number } }>('/',{preHandler: useRequireRole(["Admin"])}, activityController.create);
        fastify.put<{ Body: { name?: string,description?: string, startDate?: string, endDate?: string, userIds?: number[], dependencesIds?: number[], progress: number }, Params: { ganttId: number, activityId: number, projectId: number } }>('/:activityId',{preHandler: [useRequireRole(["Admin"]), useCheckActivityInGantt()]}, activityController.update);
        fastify.delete<{ Params: { activityId: number, ganttId: number } }>('/:activityId',{preHandler: [useRequireRole(["Admin"]), useCheckActivityInGantt()]}, activityController.delete);
}

export default activityRoutes;