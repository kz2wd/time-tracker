import { createContext } from 'react'

import { Task, WorkEntry } from './database'

export const appContext = createContext<{
  selectedTask: Task | null
  setSelectedTask: (t: Task | null) => void
  workingEntry: WorkEntry | null
  setWorkingEntry: (w: WorkEntry | null) => void
  editedTask: Task | null
  setEditedTask: (t: Task | null) => void
}| null>(null); 
