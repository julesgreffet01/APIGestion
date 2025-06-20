import {FastifyRequest, FastifyReply} from 'fastify';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();
export default class ProjectController {
    async getAllRecents(req: FastifyRequest, res: FastifyReply) {
        const userId = req.user?.userId;
        if(!userId) return res.apiResponse(400);
        try {
            const projects = await prisma.project.findMany({
                where: {
                    delete: false,
                    userProjects: {
                        some: {
                            userId: userId,
                        },
                    },
                },
                orderBy: {
                    id: 'desc',
                },
                take: 4,
            });
            return res.apiResponse(200, projects);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async create(req: FastifyRequest<{Body: {name: string, description: string}}>, res: FastifyReply) {
        const {name, description} = req.body;
        const userId = Number(req.user?.userId);
        if(!userId) return res.apiResponse(400);
        try {
            const project = await prisma.project.create({
                data: {
                    name,
                    description,
                    creatorId: userId,
                }
            })
            await prisma.userProject.create({
                data: {
                    userId,
                    projectId: project.id,
                    roleId: 1
                }
            });
            return res.apiResponse(201)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async update(req: FastifyRequest<{Body: {name?: string, description?: string}, Params: {projectId: number}}>, res: FastifyReply) {
        const {name, description} = req.body;
        const projectId = Number(req.params.projectId);
        const dataToUpdate: Record<string, any> = {};
        if(name !== undefined) dataToUpdate.name = name;
        if(description !== undefined) dataToUpdate.description = description;
        if (Object.keys(dataToUpdate).length === 0) {
            return res.apiResponse(400,'Aucune donnée à mettre à jour' );
        }
        try {
            await prisma.project.update({
                where: {
                    id: projectId,
                },
                data: dataToUpdate
            })
            return res.apiResponse(200)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }
    async delete(req: FastifyRequest<{Params: {projectId: number}}>, res:FastifyReply){
        const projectId = Number(req.params.projectId);
        const userId = Number(req.user?.userId);
        try {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
            });
            if (!project || project.creatorId !== userId) {
                return res.apiResponse(403, 'Accès interdit');
            }
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    delete: true,
                }
            });
            return res.apiResponse(200, 'Projet supprimé');
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async addPeople(req: FastifyRequest<{Body: {peopleId: number, roleId: number}, Params: {projectId: number}}>, res: FastifyReply) {
        const projectId = Number(req.params.projectId);
        const {peopleId, roleId} = req.body;
        if(![peopleId, roleId, projectId].every(Boolean)) return res.apiResponse(401);
        try {
            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                }
            });
            const role = await prisma.project.findUnique({
                where: {
                    id: roleId,
                }
            })
            const user = await prisma.user.findUnique({
                where: {
                    id: peopleId
                }
            })
            if(![user, project, role].every(Boolean)) return res.apiResponse(500);
            await prisma.userProject.create({
                data: {
                    userId: peopleId,
                    roleId,
                    projectId,
                }
            });
            return res.apiResponse(200)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async updatePeople(req: FastifyRequest<{Body: {peopleId: number, roleId: number}, Params: {projectId: number}}>, res: FastifyReply) {
        const projectId = Number(req.params.projectId);
        const {peopleId, roleId} = req.body;
        if(![peopleId, roleId, projectId].every(Boolean)) return res.apiResponse(401);
        try {
            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                }
            });
            const role = await prisma.project.findUnique({
                where: {
                    id: roleId,
                }
            })
            const user = await prisma.user.findUnique({
                where: {
                    id: peopleId
                }
            })
            if (!user || !project || !role) return res.apiResponse(500);
            if(user.id === project.creatorId) return res.apiResponse(500)
            await prisma.userProject.update({
                where: {
                    userId_projectId: {
                        userId: peopleId,
                        projectId: projectId
                    }
                },
                data: {
                    roleId
                }
            })
            return res.apiResponse(200)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async getAll(req: FastifyRequest, res: FastifyReply) {
        const userId = Number(req.user?.userId);
        if(!userId) return res.apiResponse(401);
        try {
            const projects = await prisma.project.findMany({
                where: {
                    delete: false,
                    userProjects: {
                        some: {
                            userId: userId,
                        },
                    },
                },
                orderBy: {
                    id: 'desc',
                },
            });
            return res.apiResponse(200, projects);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async getAllDel(req: FastifyRequest, res: FastifyReply) {
        const userId = Number(req.user?.userId);
        if(!userId) return res.apiResponse(401);
        try {
            const projects = await prisma.project.findMany({
                where: {
                    delete: true,
                    creatorId: userId,
                },
                orderBy: {
                    id: 'desc',
                },
            });
            return res.apiResponse(200, projects);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async leave(req: FastifyRequest<{Params: {projectId: number}}>, res: FastifyReply) {
        const userId = Number(req.user?.userId);
        if(!userId) return res.apiResponse(401);
        const projectId = Number(req.params.projectId);
        try {
            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                }
            })
            if(!project) return res.apiResponse(401);
            if(project.creatorId === userId) return res.apiResponse(403);
            await prisma.userProject.delete({
                where: {
                    userId_projectId: {
                        userId,
                        projectId,
                    },
                }
            })
            return res.apiResponse(200)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async restore(req: FastifyRequest<{Params: {projectId: number}}>, res: FastifyReply) {
        const projectId = Number(req.params.projectId);
        const userId = Number(req.user?.userId);
        try {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
            });
            if (!project || project.creatorId !== userId) {
                return res.apiResponse(400);
            }
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    delete: false,
                }
            });
            return res.apiResponse(200, 'Projet restorer');
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }
}