
export class Task {
    id?: number
    description: String
    parentId: number | null
    subtaskIds: number[] = []
    isOver: boolean = false

    constructor(description: String, parentId: number | null = null) {
        this.description = description
        this.parentId = parentId
    }

    toObject() {
        return {
            // do not include id as IndexedDB will handle it
            description: this.description,
            parentId: this.parentId,
            subtaskIds: this.subtaskIds,
            isOver: this.isOver,
        }
    }

    static fromObject(o: any): Task {
        const t = new Task(o.description, o.parentId)
        t.id = o.id ?? undefined
        t.subtaskIds = o.subtaskIds ?? []
        t.isOver = o.isOver ?? false
        return t
    }

    async setDescription(newDescription: String) {
        this.description = newDescription;
        (await database).updateTask(this);
    }

    async setIsOver(newIsOver: boolean) {
        this.isOver = newIsOver;
        (await database).updateTask(this);
    }

    async getTotalTimeMinutes(): Promise<number> {
        return 10
    }
    async delete(): Promise<void> {
        if (this.id === null) return

        // Check if task has work entry, if so, ask if user is sure
        (await database).deleteTask(this.id!)
    }

}

export class WorkEntry {
    id?: number
    start: number // Time in MS since 1970
    end: number | null = null  // Time in MS since 1970
    relatedTaskId: number | null = null
    satisfaction: number | null = null // Out of 5

    constructor(relatedTaskId: number | null = null) {
        this.start = Date.now()
        this.relatedTaskId = relatedTaskId
    }

    toObject() {
        return {
            start: this.start,
            end: this.end,
            relatedTaskId: this.relatedTaskId,
            satisfaction: this.satisfaction,
        }
    }

    static fromObject(o: any): WorkEntry {
        const wo = new WorkEntry(o.relatedTaskId)
        wo.start = o.start  // Idk how to handle this one so i'd rather let that crash
        wo.end = o.end ?? null
        wo.satisfaction = o.satisfaction ?? null
        return wo
    }

    async finish() {
        this.end = Date.now();
        (await database).updateWorkEntry(this);
    }

    async setSatisfaction(satisfaction: number) {
        satisfaction = Math.min(Math.max(satisfaction, 0), 5);
        this.satisfaction = satisfaction;
        (await database).updateWorkEntry(this);
    }

}

let connection: IDBDatabase

function request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => {
            console.log(req.error?.message)
            reject(req.error)
        }
    })
}

async function* cursorIterator(store: IDBObjectStore) {
    let cursorRequest = store.openCursor()
    while (true) {
        const cursor: IDBCursorWithValue | null = await new Promise((resolve, reject) => {
            cursorRequest.onsuccess = () => resolve(cursorRequest.result)
            cursorRequest.onerror = () => reject(cursorRequest.error)
        })
        if (!cursor) break
        yield cursor
        cursor.continue()
    }
}


async function updateParent(store: IDBObjectStore, childId: number, parent: Task): Promise<void> {
    parent.subtaskIds.push(childId)
    const req = store.put(parent)
    await request(req)
}

async function initDatabase (): Promise<Database> {
    return new Promise((resolve, reject) => {
        let openRequest = indexedDB.open("TasksTrackerDB", 3)

        openRequest.onerror = (_event: Event) => {
            console.log("Usage of IndexedDB not allowed.")
            reject(openRequest.error)
        }

        openRequest.onsuccess = (event: Event) => {
            connection = (event.target as IDBOpenDBRequest).result;
            console.log(`Initializing database, version [${connection.version}]`)
            
            connection.onerror = (event: Event) => {
                const rq = (event.target as IDBOpenDBRequest)
                console.error(`Database error: ${rq.error?.message}`)
            }

            resolve(databaseCore)
        }

        openRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains("tasks")) {
                const objectStore = db.createObjectStore("tasks", 
                    { keyPath: "id", autoIncrement: true }
                )
                objectStore.createIndex("parentId", "parentId")
            }
            if (!db.objectStoreNames.contains("workEntries")) {
                const objectStore = db.createObjectStore("workEntries", 
                    { keyPath: "id", autoIncrement: true }
                )
                objectStore.createIndex("relatedTaskId", "relatedTaskId")
            }
        }
    })
}

export const database: Promise<Database> = initDatabase()

interface Database {
    addTask(description: String, parent: Task | null): Promise<Task>
    getRootTasks(): Promise<Array<Task>>
    updateTask(task: Task): Promise<void>
    deleteTask(taskId: number): Promise<void>
    addWorkEntry(task: Task | null): Promise<WorkEntry>
    updateWorkEntry(workEntry: WorkEntry): Promise<void>
    getWorkTimeSeconds(sinceXHours?: number | null, taskId?: number | null): Promise<number>
}

const databaseCore: Database = {
    async addTask(description: string, parent: Task | null): Promise<Task> {
        let task: Task = new Task(
            description = description,
            parent?.id
        )
        const transaction = connection.transaction("tasks", "readwrite")
        const store = transaction.objectStore("tasks")
        let rq: IDBRequest<IDBValidKey>
        try {
            rq = store.add(task.toObject())
            const key = await request<IDBValidKey>(rq)
            task.id = key as number
            if (parent != null) {
                await updateParent(store, key as number, parent)
            }
        } catch (e) {
            console.error(e, task);
        }
        
        return task
    },
    async getRootTasks(): Promise<Array<Task>> {
        const transaction = connection.transaction("tasks", "readonly")
        const store = transaction.objectStore("tasks")
        return request(store.getAll()).then(arr => arr.map(it => Task.fromObject(it)))
    },
    async updateTask(task: Task): Promise<void> {
        const transaction = connection.transaction("tasks", "readwrite")
        const store = transaction.objectStore("tasks")
        await request(store.put(task))
    },
    async deleteTask(taskId: number): Promise<void> {
        const transaction = connection.transaction("tasks", "readwrite")
        const store = transaction.objectStore("tasks")
        await request(store.delete(taskId))
    },

    async addWorkEntry(task: Task | null = null): Promise<WorkEntry> {
        const workEntry: WorkEntry = new WorkEntry(task?.id)
        const transaction = connection.transaction("workEntries", "readwrite")
        const store = transaction.objectStore("workEntries")
        const req = store.add(workEntry.toObject())
        const id = await request(req) as number
        workEntry.id = id
        return workEntry
    },

    async updateWorkEntry(workEntry: WorkEntry): Promise<void> {
        const transaction = connection.transaction("workEntries", "readwrite")
        const store = transaction.objectStore("workEntries")
        await request(store.put(workEntry))
    },
    async getWorkTimeSeconds(sinceXHours: number | null = null, taskId: number | null = null): Promise<number> {
        const transaction = connection.transaction("workEntries", "readonly")
        const store = transaction.objectStore("workEntries")
        const cutoff = sinceXHours !== null ? Date.now() - sinceXHours * 60 * 60 * 1000 : null
        let totalMs = 0

        for await (const cursor of cursorIterator(store)) {
            const entry: WorkEntry = WorkEntry.fromObject(cursor.value)
            if (taskId && entry.id != taskId) {
                continue
            }
            if (!cutoff || entry.start >= cutoff) {
                totalMs += entry.end ? (entry.end - entry.start) : (Date.now() - entry.start)
            }
        }
        return totalMs / 1000
    }

} 
