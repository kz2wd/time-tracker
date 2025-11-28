
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

    async setDescription(newDescription: String) {
        this.description = newDescription
        database.updateTask(this)
    }

    async setIsOver(newIsOver: boolean) {
        this.isOver = newIsOver
        database.updateTask(this)
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

    async finish() {
        this.end = Date.now()
        await database.updateWorkEntry(this)
    }

    async setSatisfaction(satisfaction: number) {
        satisfaction = Math.min(Math.max(satisfaction, 0), 5)
        this.satisfaction = satisfaction
        database.updateWorkEntry(this)
    }

}

let connection: IDBDatabase

function request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

async function updateParent(store: IDBObjectStore, childId: number, parent: Task): Promise<void> {
    parent.subtaskIds.push(childId)
    const req = store.put(parent)
    await request(req)
}

export const database = {
    async initDatabase (): Promise<void> {
        await new Promise((resolve, reject) => {
            let openRequest = indexedDB.open("TasksTrackerDB", 1)

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

                resolve(null)
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
    },

    async addTask(description: string, parent: Task | null): Promise<Task> {
        const task: Task = new Task(
            description = description,
            parent?.id
        )
        const transaction = connection.transaction("tasks", "readwrite")
        const store = transaction.objectStore("tasks")
        const rq = store.add(task)

        const key = await request<IDBValidKey>(rq)
        task.id = key as number

        if (parent != null) {
            await updateParent(store, key as number, parent)
        }
        return task
    },

    async updateTask(task: Task) {
        const transaction = connection.transaction("tasks", "readwrite")
        const store = transaction.objectStore("tasks")
        await request(store.put(task))
    },

    async addWorkEntry(task: Task | null = null): Promise<WorkEntry> {
        const workEntry: WorkEntry = new WorkEntry(task?.id)
        const transaction = connection.transaction("workEntries", "readwrite")
        const store = transaction.objectStore("workEntries")
        const req = store.add(workEntry)
        const id = await request(req) as number
        workEntry.id = id
        return workEntry
    },

    async updateWorkEntry(workEntry: WorkEntry) {
        const transaction = connection.transaction("workEntries", "readwrite")
        const store = transaction.objectStore("workEntries")
        await request(store.put(workEntry))
    }

} 
