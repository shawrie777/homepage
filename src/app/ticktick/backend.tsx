import { createContext, useContext } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ApiProjectData, ApiTask, Project, ProjectData, Task } from "./types";

export const client_id = "252BiNRuW0lME3Tvbo";
const client_secret = "8f74nkYm0WdG9Z1gOESyKWLnpbWOGYJN";

export async function initToken(code: string) {
    const resp = await fetch("https://ticktick.com/oauth/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id,
                client_secret,
                code,
                grant_type: "authorization_code",
                scope: "tasks:write tasks:read",
                redirect_uri: "http://localhost:3000",
            }),
        });

    if (!resp.ok) throw new Error("Failed to init token");
    return (await resp.json() as {access_token: string}).access_token;
}

export class Backend {
    constructor(
        private token: string,
    ) {};

    private async request<TResponse>(
        method: string,
        path: string,
        body?: unknown
    ): Promise<TResponse> {
        const resp = await fetch(`https://api.ticktick.com/open/v1${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });

        const text = await resp.text();

        if (!resp.ok) {
            throw new Error(text);
        }

        if (resp.status === 204 || !text) {
            return undefined as TResponse;
        }

        return text ? JSON.parse(text) : null as TResponse;
    }

    get<T>(path: string) {
        return this.request<T>("GET", path);
    }

    post<TReq, TRes>(path: string, body?: TReq) {
        return this.request<TRes>("POST", path, body);
    }

    delete<T>(path: string) {
        return this.request<T>("DELETE", path);
    }
}

export const BackendContext = createContext<Backend | null>(null);

function useBackend() {
    const backend = useContext(BackendContext);
    if (!backend) throw new Error("No backend context created.");
    return backend;
}

export function useProjects() {
    const backend = useBackend();
    return useSuspenseQuery({
        queryKey: ["projects"],
        queryFn: ()=>backend.get<Project[]>("/project"),
        refetchInterval: 300000, // 5 minutes
        refetchOnWindowFocus: true,
    }).data;
}

export function useData(projectId : string) : ProjectData {
    const backend = useBackend();
    return useSuspenseQuery({
        queryKey: ["data", projectId],
        queryFn: ()=>backend.get<ApiProjectData>(`/project/${projectId}/data`),
        refetchInterval: 300000, // 5 minutes
        refetchOnWindowFocus: true,
        select: data=> ({...data, tasks: data.tasks?.map(fromApiTask)}),
    }).data;
}

export function useCreateTask() {
    const backend = useBackend();
    const client = useQueryClient();
    return useMutation({
        mutationKey: ["newTask"],
        mutationFn: async ({task} : {task: Task}) => {
            await backend.post<ApiTask, ApiTask>("/task", toApiTask(task));
            return {projectId: task.projectId};
        },
        onSuccess: ({projectId}) => client.invalidateQueries({queryKey: ["data", projectId]})
    })
}

export function useUpdateTask() {
    const backend = useBackend();
    const client = useQueryClient();
    return useMutation({
        mutationKey: ["updateTask"],
        mutationFn: async ({task} : {task: Task}) => {
            await backend.post<ApiTask, ApiTask>(`/task/${task.id!}`, toApiTask(task));
            return {projectId: task.projectId};
        },
        onSuccess:  ({projectId}) => client.invalidateQueries({queryKey: ["data", projectId]}),
        onError: (e) =>
            console.log(e)
    })
}

export function useDeleteTask() {
    const backend = useBackend();
    const client = useQueryClient();
    return useMutation({
        mutationKey: ["deleteTask"],
        mutationFn: async ({task} : {task: Task}) => {
            await backend.delete(`/project/${task.projectId}/task/${task.id!}`);
            return {projectId: task.projectId};
        },
    onSuccess: ({projectId}) => {
        client.invalidateQueries({queryKey: ["data", projectId]})
    },
    onError: (e) => 
        console.log(e)
    })
}

export function useCompleteTask() {
    const backend = useBackend();
    const client = useQueryClient();
    return useMutation({
        mutationKey: ["completeTask"],
        mutationFn: async ({task} : {task: Task}) => {
            await backend.post<undefined, undefined>(`/project/${task.projectId}/task/${task.id}/complete`);
            return {projectId: task.projectId}
        },
            onSuccess: ({projectId}) => {
        client.invalidateQueries({queryKey: ["data", projectId]})
    },
    onError: (e) => 
        console.log(e)
    })
}

function formatApiDate(date?: Date | null): string | null | undefined {
    if (date === null) return null;
    if (!date || isNaN(date.getTime())) return undefined;

    return date.toISOString().replace(/\.\d{3}Z$/, "+0000");
}

function parseApiDate(date?: string | null): Date | undefined {
    if (!date) return undefined;

    const parsed = new Date(date.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
    return isNaN(parsed.getTime()) ? undefined : parsed;
}

function toApiTask(task: Task) : ApiTask {
    return {
        ...task,
        startDate: task.dueDate === null ? null : formatApiDate(task.startDate),
        dueDate: formatApiDate(task.dueDate),
    }
};

function fromApiTask(task: ApiTask) : Task {
    return {
        ...task,
        startDate: parseApiDate(task.startDate),
        dueDate: parseApiDate(task.dueDate),
    }
}