import { useEffect, useState, useContext } from 'react'

import { database, Task, WorkEntry } from './database'
import { TimeDisplay } from './TimeDisplay'
import { TaskArea } from './Tasks'

import './App.css'

import { appContext } from './appContext'


function Navbar() {
  return (
    <>
      <nav>
        <p>Tasks</p>
        <p className='current'>Today</p>
        <p>Calendar</p>
        <p>Stats</p>
        <p>Settings</p>
      </nav>
    </>
  )
}


function BottomBar() {

  const tskctx = useContext(appContext)!  
  return (
    <>
      <div className="bottom-bar">
        <div className="selected-task-panel task">
          {tskctx.selectedTask ? tskctx.selectedTask.description : tskctx.workingEntry ? "Free work" : "Select task"}
        </div>
        <div className="control-panel">
          <TimeDisplay 
            lastHours={null}
            taskId={null} 
            text={"All tasks"} />
          <button onClick={async () => {
            if (tskctx.workingEntry != null) {
              // Stop working
              tskctx.workingEntry.finish()
              tskctx.setWorkingEntry(null)
            } else {
              // Start working
              const workEntry = await (await database).addWorkEntry(tskctx.selectedTask)
              tskctx.setWorkingEntry(workEntry)
            }
            
            }
          } className={tskctx.workingEntry != null ? "stop": "start"}>
            {tskctx.workingEntry != null ? "Stop": "Start"}</button>
          <TimeDisplay
            lastHours={null}
            taskId={tskctx.selectedTask?.id ?? null}
            text={"Current task"} />
        </div>
      </div>
    </>
  )
}

function App() {

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [workingEntry, setWorkingEntry] = useState<WorkEntry | null>(null)
  const [editedTask, setEditedTask] = useState<Task | null>(null)
  
  useEffect(() => {
    (async () => {
      const entry = await (await database).getWorkingEntry()
      setWorkingEntry(entry)
      console.log(entry)
    })()    
  }, []) 

  const customSetSelectedTask = (task: Task | null) => {
    if (task == selectedTask) return
    if (workingEntry != null) return
    setSelectedTask(task)
  }

  return (
    <appContext.Provider value={
      { 
        selectedTask: selectedTask, 
        setSelectedTask: customSetSelectedTask, 
        workingEntry: workingEntry,
        setWorkingEntry: setWorkingEntry,
        editedTask: editedTask,
        setEditedTask: setEditedTask,
      }}>
      <Navbar/>
      <TaskArea/>
    </appContext.Provider>
  )
}

export default App
