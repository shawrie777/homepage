export type ChecklistItem = {
    id: string,
    title: string,
    status: number,
    isAllDay?: boolean,
    sortOrder?: number,
    timeZone?: string,
}

export type Kind = "TEXT" | "NOTE" | "CHECKLIST";

export type TaskBase = {
    id?: string,
    projectId: string,
    title: string,
    isAllDay?: boolean,
    content?: string,
    desc?: string,
    items?: ChecklistItem[],
    priority?: number,
    reminders?: string[],
    tags?: string[],
    repeatFlag?: string,
    sortOrder?: number,
    status?: string,
    timeZone?: string,
    kind?: Kind,
}

export type ApiTask = TaskBase & {dueDate?: string};

export type Task = TaskBase & {dueDate?: Date};

export type ViewMode = "list" | "kanban" | "timeline";
export type Permission = "read" | "write" | "comment";

export type Project = {
    id?: string,
    name: string,
    color?: string,
    sortOrder?: number,
    closed?: boolean,
    groupId?: string,
    viewMode?: ViewMode,
    permission?: Permission,
    kind?: Omit<Kind, "CHECKLIST">,
}

export type Column = {
    id?: string,
    projectId: string,
    name: string,
    sortOrder?: number,
}

export type ApiProjectData = {
    project: Project,
    tasks?: ApiTask[],
    columns?: Column[],
}

export type ProjectData = {
    project: Project,
    tasks?: Task[],
    columns?: Column[],
}