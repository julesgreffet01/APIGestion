import {FastifyPluginAsync, FastifyInstance} from 'fastify'
import TaskController from "./task.controller";
import {useRequireRole} from '../../../hooks/droits'
import {useCheckTaskInTodo} from "./task.helpers";

const activityRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const taskController = new TaskController();

    fastify.get('/', taskController.getAllByTodoByPosition)
    fastify.get('/realised', taskController.getAllRealisedByTodo)
    fastify.post<{ Params: { todoId: number }, Body: { name: string, userIds?: number[], realDate?: string } }>('/', {preHandler: useRequireRole(["Admin"])}, taskController.create)
    fastify.put<{ Params: { taskId: number, toDoId: number }, Body: { name?: string, realDate?: string }}>('/:taskId',{preHandler: [useRequireRole(["Admin"]), useCheckTaskInTodo()]}, taskController.update)
    fastify.put<{ Params: { taskId: number, toDoId: number } }>('/:taskId/realised',{preHandler: [useRequireRole(["Admin"]), useCheckTaskInTodo()]}, taskController.realised)
    fastify.put<{ Params: { toDoId: number, taskId: number }, Body: { orderedTaskIds: number[] } }>('/:taskId/order',{preHandler: [useRequireRole(["Admin"]), useCheckTaskInTodo()]}, taskController.reorder)
    fastify.delete<{ Params: { taskId: number, toDoId: number } }>('/:taskId',{preHandler: [useRequireRole(["Admin"]), useCheckTaskInTodo()]}, taskController.delete)
}
export default activityRoutes;