"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import classNames from "classnames";

import styles from "./style.module.css";
import { Task } from "./types";
import {
    Backend,
    initToken,
    client_id,
    BackendContext,
    useProjects,
    useData,
    useCreateTask,
    useDeleteTask,
    useCompleteTask,
    useUpdateTask
} from "./backend";

const queryClient = new QueryClient();

const AUTH_URL = `https://ticktick.com/oauth/authorize?client_id=${client_id}&redirect_uri=http://localhost:3000&response_type=code&scope=tasks:read tasks:write`;

export function TickTick() {
    const [token, setToken] = useState<string | null>(null);
    const params = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        async function run() {
            let stored = localStorage.getItem("token");
            if (stored) {
                setToken(stored);
                return;
            };
            if (window.location.protocol === "file:") return;

            const code = params.get("code");
            if (code) {
                stored = await initToken(code);
                localStorage.setItem("token", stored);
                setToken(stored);
                router.replace("/");
                return;
            }

            router.push(AUTH_URL);

        }
        run();
    }, [params, router]);

    if (!token) {
        return <div className={styles.outer}>
            <pre>Failed to fetch tasks</pre>
            <pre>Token error</pre>
        </div>;
    }

    return <QueryClientProvider client={queryClient}>
            <BackendContext value={new Backend(token)}>
            <div className={styles.outer}>
                <h1>Tasks</h1>
                <Inner/>
            </div>
        </BackendContext>
    </QueryClientProvider>
}

function Inner(){
    const projects = useProjects();
    return <div className={styles.inner}>
        {projects.toSorted((a,b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((proj, idx) => <section className={styles.list} key={proj.id ?? idx}>
            <h2>{proj.name}</h2>
            <Tasks projectId={proj.id!} />
        </section>)}
    </div>
}

type PreviewPos = {
    task: Task,
    x: number,
    y: number,
}

function getTaskContent(task: Task) {
    return (task.content ?? task.desc ?? "").trim();
}

function compareDates(a: Date, b: Date) {
    let diff = a.getFullYear() - b.getFullYear();
    if (diff) return Math.sign(diff);
    diff = a.getMonth() - b.getMonth();
    if (diff) return Math.sign(diff);
    return a.getDate() - b.getDate();
}

function isValidDate(date?: Date | null): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
}

function startOfLocalDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0,0,0,0);
    return result;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function nextMonday(from = new Date()): Date {
    const result = startOfLocalDay(from);

    const daysUntilMonday = (8 - result.getDay()) % 7 || 7;

    return addDays(result, daysUntilMonday);
}

function dueDateBucket(date?: Date | null): "clear" | "today" | "tomorrow" | "nextWeek" | "custom" {
    if (!isValidDate(date)) return "clear";

    const today = startOfLocalDay(new Date());
    const tomorrow = addDays(today, 1);
    const nextWeekStart = nextMonday(today);
    const nextWeekEnd = addDays(nextWeekStart, 7);

    if (compareDates(date, today) === 0) return "today";
    if (compareDates(date, tomorrow) === 0) return "tomorrow";
    if (compareDates(date, nextWeekStart) >= 0 && compareDates(date, nextWeekEnd) < 0) return "nextWeek";

    return "custom";
}

function dueDateLabel(date?: Date | null) {
    const bucket = dueDateBucket(date);
    if (bucket === "clear") return null;
    if (bucket === "today") return "Today";
    if (bucket === "tomorrow") return "Tomorrow";
    if (bucket === "nextWeek") return "Next Week";

    if (!isValidDate(date)) return null;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}/${month}`;
}

function dateFromInputValue(value: FormDataEntryValue | null): Date | null {
    if (typeof value !== "string" || !value) return null;

    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
}

function Tasks({projectId} : {projectId: string}) {
    const [editing, setEditing] = useState<Task | null>(null);
    const [preview, setPreview] = useState<PreviewPos | null>(null);
    const [quickMenu, setQuickMenu] = useState<PreviewPos | null>(null);
    const previewClose = useRef<number | null>(null);

    const data = useData(projectId);
    const tasks = data.tasks ?? [];

    const completeTask = useCompleteTask();
    const deleteTask = useDeleteTask();
    const updateTask = useUpdateTask();

    const cancelPreviewClose = () => {
        if (previewClose.current !== null) {
            window.clearTimeout(previewClose.current);
            previewClose.current = null;
        }
    };

    const schedulePreviewClose = () => {
        cancelPreviewClose();
        previewClose.current = window.setTimeout(() => setPreview(null), 140);
    };

    const openPreview = (task: Task, target: HTMLElement) => {
        if (quickMenu) {
            setPreview(null);
            return;
        }

        cancelPreviewClose();
        const rect = target.getBoundingClientRect();
        const previewWidth = 288;
        const x = rect.left > previewWidth + 16
            ? rect.left - previewWidth - 8
            : Math.min(rect.right + 8, window.innerWidth - previewWidth - 8);

        const y = Math.min(Math.max(rect.top, 8), window.innerHeight - 160);
                setPreview({task, x, y});
    };

    const openQuickMenu = (task: Task, x: number, y: number) => {
        cancelPreviewClose();
        setPreview(null);
        setQuickMenu({
            task,
            x: Math.min(Math.max(x, 8), window.innerWidth - 232),
            y: Math.min(Math.max(y, 8), window.innerHeight - 180),
        });
    };

    const updateQuickTask = (changes: Partial<Task>) => {
        if (!quickMenu) return;
        updateTask.mutate({task: {...quickMenu.task, ...changes}});
        setQuickMenu(null);
    };

    const updateQuickDueDate = (dueDate: Date | null) => {
        updateQuickTask({startDate: dueDate, dueDate});
    };

    useEffect(() => {
        return () => cancelPreviewClose();
    }, []);

    useEffect(() => {
        if (!quickMenu) return;

        const close = () => setQuickMenu(null);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };

        window.addEventListener("click", close);
        window.addEventListener("contextmenu", close);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("click", close);
            window.removeEventListener("contextmenu", close);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [quickMenu]);

    return <>
        <div className={styles.tasks}>
            {tasks.length === 0
                ? <p className={styles.empty}>No tasks</p>
                : tasks.toSorted((a,b) => (b.priority ?? 0) - (a.priority ?? 0))
                    .map((task, idx) => <div
                        className={styles.task}
                        key={task.id ?? idx}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openQuickMenu(task, e.clientX, e.clientY);
                        }}
                        onMouseEnter={(e) => openPreview(task, e.currentTarget)}
                        onMouseLeave={schedulePreviewClose}
                    >
                        <button
                            className={classNames(styles.complete,
                                task.priority === 0 && styles.none,
                                task.priority === 1 && styles.low,
                                task.priority === 3 && styles.medium,
                                task.priority === 5 && styles.high
                            )}
                            type="button"
                            aria-label={`Complete ${task.title}`}
                            onClick={(e)=> {
                                e.stopPropagation();
                                setPreview(null);
                                setQuickMenu(null);
                                completeTask.mutate({task});
                            }}
                        >
                            <span aria-hidden="true">&#10003;</span>
                        </button>
                        <button
                            className={styles.taskTitle}
                            type="button"
                            onClick={() => {
                                setPreview(null);
                                setQuickMenu(null);
                                setEditing(task);
                            }}
                        >
                            <span className={classNames(styles.taskText, isValidDate(task.dueDate) && compareDates(new Date(), task.dueDate) > 0 && styles.overdue)}>{task.title}</span>
                            <TaskDueBadge dueDate={task.dueDate} />
                        </button>
                        <button
                            className={styles.deleteTask}
                            type="button"
                            aria-label={`Delete ${task.title}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreview(null);
                                setQuickMenu(null);
                                deleteTask.mutate({ task });
                            }}
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>)}
        </div>
        <QuickAdd projectId={projectId} />
        {preview && <div
            className={styles.preview}
            style={{left: preview.x, top: preview.y}}
            onMouseEnter={cancelPreviewClose}
            onMouseLeave={schedulePreviewClose}
        >
            <TaskPreview task={preview.task} />
        </div>}
        {quickMenu && <QuickEditMenu
            menu={quickMenu}
            onPriority={(priority) => updateQuickTask({priority})}
            onDueDate={updateQuickDueDate}
        />}
        {editing && <TaskModal task={editing} close={() => setEditing(null)}/>}    
    </>
}

function TaskDueBadge({dueDate}: {dueDate?: Date | null}) {
    const label = dueDateLabel(dueDate);
    if (!label) return null;

    return <span className={styles.dueBadge}>{label}</span>;
}

function QuickEditMenu({
    menu,
    onPriority,
    onDueDate,
}: {
    menu: PreviewPos,
    onPriority: (priority: number) => void,
    onDueDate: (dueDate: Date | null) => void,
}) {
    const currentDueDate = menu.task.dueDate;
    const currentDueDateBucket = dueDateBucket(currentDueDate);
    const priorityOptions = [
        {value: 0, className: "priorityNone"},
        {value: 1, className: "priorityLow"},
        {value: 3, className: "priorityMedium"},
        {value: 5, className: "priorityHigh"},
    ];
    const today = startOfLocalDay(new Date());
    const tomorrow = addDays(today, 1);
    const nextWeekStart = nextMonday(today);
    const dueOptions = [
        {label: "Today", value: today, condition: currentDueDateBucket === "today"},
        {label: "Tomorrow", value: tomorrow, condition: currentDueDateBucket === "tomorrow"},
        {
            label: "Next Week",
            value: nextWeekStart,
            condition: currentDueDateBucket === "nextWeek"},
        {label: "Clear", value: null, condition: currentDueDateBucket === "clear"},
    ];

    return <div
        className={styles.quickMenu}
        style={{left: menu.x, top: menu.y}}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
    >
        <div className={styles.quickMenuGroup}>
            <p>Priority</p>
            <div className={styles.priorityChoices}>
                {priorityOptions.map(option => <button
                    key={option.value}
                    type="button"
                    className={classNames(styles.priorityChoice, styles[option.className], ((menu.task.priority ?? 0) === option.value) && styles.activeChoice)}
                    onClick={() => onPriority(option.value)}
                />)}
            </div>
        </div>
        <div className={styles.quickMenuGroup}>
            <p>Due</p>
            <div className={styles.dueChoices}>
                {dueOptions.map(option => <button
                    key={option.label}
                    type="button"
                    className={classNames(styles.dueChoice, option.condition && styles.activeChoice)}
                    onClick={() => onDueDate(option.value)}
                >
                    {option.label}
                </button>)}
            </div>
        </div>
    </div>
}

function TaskPreview({task}: {task: Task}) {
    const content = getTaskContent(task);

    return <>
        <p className={styles.previewTitle}>{task.title}</p>
        {content && <>
            <div className={styles.previewDivider} />
            <div className={styles.previewContent}>
                <LinkifiedText text={content} />
            </div>
        </>}
    </>
}

function LinkifiedText({text}: {text: string}) {
    const parts = text.split(/(https?:\/\/\S*?)(?=[.,!?)]*(\s|$))/g);

    return <>
        {parts.map((part, idx) => {
            if (!part) return null;
            if (/^https?:\/\//.test(part)) {
                return <a key={idx} href={part} target="_blank" rel="noreferrer">{part}</a>
            }
            return <span key={idx}>{part}</span>
        })}
    </>
}

function QuickAdd({projectId}: {projectId: string}) {
    const [title, setTitle] = useState("");
    const createTask = useCreateTask();

    const handleSubmit = (e: React.KeyboardEvent) => {
        if (e.key === "Enter")  {
            e.preventDefault();
            const trimmed = title.trim();
            if (!trimmed) return;

            createTask.mutate({
                task: {
                    projectId,
                    title: trimmed,
                    priority: 0,
                }
            }, {
                onSuccess: () => setTitle(""),
            });
    }};

    return <input
            className={styles.newTask}
            aria-label="New task title"
            placeholder="New task"
            value={title}
            disabled={createTask.isPending}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleSubmit}
            id={projectId}
        />
}

function TaskModal({task, close} : {task: Task, close: ()=>void}) {
    const updateTask = useUpdateTask();

    const handleForm = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const title = (data.get("title")! as string).trim();
        if (!title) return;

        const dueDate = dateFromInputValue(data.get("dueDate"));
        const updatedTask : Task = {
            ...task,
            title,
            content: data.get("content")! as string,
            startDate: dueDate,
            dueDate,
        }
        updateTask.mutate({task: updatedTask});
        close();
    }

    function formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    return <div className={styles.modal}>
            <form onSubmit={handleForm} onClick={(e) => e.stopPropagation()}>
                <label htmlFor="title">Title</label><input name="title" defaultValue={task.title} id="title" autoFocus/>
                <label htmlFor="content">Content</label><textarea name="content" id="content" defaultValue={task.content ?? task.desc ?? ""}/>
                <label htmlFor="dueDate">Due Date</label>
                <input type="date" name="dueDate" id="dueDate" defaultValue={task.dueDate ? formatDateForInput(task.dueDate): ""}/>
                <div className={styles.actions}>
                    <button type="button" onClick={close}>Cancel</button>
                    <button type="submit">Save task</button>
                </div>
            </form>
        </div>
}