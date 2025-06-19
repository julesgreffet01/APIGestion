import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SearchResult {
    id: number;
    name: string;
    type: 'project' | 'calendar' | 'gantt' | 'todo' | 'trello' | 'trello_card' | 'todo_task' | 'gantt_activity';
    description?: string;
    projectName?: string; // Pour les éléments liés à un projet
}

export async function searchUserItems(userId: number, searchTerm: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const LIMIT = 5;

    // 1. Projets
    const projects = await prisma.project.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { creatorId: userId },
                        { userProjects: { some: { userId } } },
                    ],
                },
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { delete: false },
            ],
        },
        select: { id: true, name: true, description: true },
        take: LIMIT,
    });
    projects.forEach((p) => {
        if (results.length < LIMIT) {
            results.push({
                id: p.id,
                name: p.name,
                type: 'project',
                description: p.description ?? undefined,
            });
        }
    });
    if (results.length >= LIMIT) return results;

    // 2. Événements de calendrier
    const calendars = await prisma.calendarEvent.findMany({
        where: {
            userId,
            name: { contains: searchTerm, mode: 'insensitive' },
        },
        select: { id: true, name: true, description: true },
        take: LIMIT - results.length,
    });
    calendars.forEach((e) => {
        if (results.length < LIMIT) {
            results.push({
                id: e.id,
                name: e.name,
                type: 'calendar',
                description: e.description,
            });
        }
    });
    if (results.length >= LIMIT) return results;

    // 3a. Gantt (diagrammes)
    const gantts = await prisma.gantt.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { project: { creatorId: userId } },
                        { project: { userProjects: { some: { userId } } } },
                    ],
                },
                { name: { contains: searchTerm, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            name: true,
            project: { select: { name: true } },
        },
        take: LIMIT - results.length,
    });
    gantts.forEach((g) => {
        if (results.length < LIMIT) {
            results.push({
                id: g.id,
                name: g.name,
                type: 'gantt',
                projectName: g.project.name,
            });
        }
    });
    if (results.length >= LIMIT) return results;

    // 3b. Activités Gantt
    const ganttActivities = await prisma.ganttActivity.findMany({
        where: {
            AND: [
                { users: { some: { userId } } },
                { name: { contains: searchTerm, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            name: true,
            description: true,
            gantt: { select: { project: { select: { name: true } } } },
        },
        take: LIMIT - results.length,
    });
    ganttActivities.forEach((a) => {
        if (results.length < LIMIT) {
            results.push({
                id: a.id,
                name: a.name,
                type: 'gantt_activity',
                description: a.description,
                projectName: a.gantt.project.name,
            });
        }
    });
    if (results.length >= LIMIT) return results;

    // 4a. ToDos
    const todos = await prisma.toDo.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { project: { creatorId: userId } },
                        { project: { userProjects: { some: { userId } } } },
                    ],
                },
                { name: { contains: searchTerm, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            name: true,
            project: { select: { name: true } },
        },
        take: LIMIT - results.length,
    });
    todos.forEach((t) => {
        if (results.length < LIMIT) {
            results.push({
                id: t.id,
                name: t.name,
                type: 'todo',
                projectName: t.project.name,
            });
        }
    });
    if (results.length >= LIMIT) return results;

    // 4b. Tâches ToDo
    const todoTasks = await prisma.toDoTask.findMany({
        where: {
            AND: [
                { users: { some: { userId } } },
                { name: { contains: searchTerm, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            name: true,
            todo: { select: { project: { select: { name: true } } } },
        },
        take: LIMIT - results.length,
    });
    todoTasks.forEach((t) => {
        if (results.length < LIMIT) {
            results.push({
                id: t.id,
                name: t.name,
                type: 'todo_task',
                projectName: t.todo.project.name,
            });
        }
    });
    if (results.length >= LIMIT) return results;

    // 5a. Trello (boards)
    const trellos = await prisma.trello.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { project: { creatorId: userId } },
                        { project: { userProjects: { some: { userId } } } },
                    ],
                },
                { name: { contains: searchTerm, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            name: true,
            project: { select: { name: true } },
        },
        take: LIMIT - results.length,
    });
    trellos.forEach((b) => {
        if (results.length < LIMIT) {
            results.push({
                id: b.id,
                name: b.name,
                type: 'trello',
                projectName: b.project.name,
            });
        }
    });
    if (results.length >= LIMIT) return results;

    // 5b. Cartes Trello
    const trelloCards = await prisma.trelloCard.findMany({
        where: {
            AND: [
                { users: { some: { userId } } },
                { name: { contains: searchTerm, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            name: true,
            description: true,
            list: {
                select: {
                    trello: {
                        select: {
                            project: { select: { name: true } },
                        },
                    },
                },
            },
        },
        take: LIMIT - results.length,
    });
    trelloCards.forEach((c) => {
        if (results.length < LIMIT) {
            results.push({
                id: c.id,
                name: c.name,
                type: 'trello_card',
                description: c.description,
                projectName: c.list.trello.project.name,
            });
        }
    });

    return results;
}