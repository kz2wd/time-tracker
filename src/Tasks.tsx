import { useEffect, useState, useContext } from 'react'
import { database, Task } from './database'
import { TimeDisplay, DurationSet, PomodoroBox } from './TimeDisplay'

import './App.css'

import { appContext } from './appContext'


export function TaskCard({ task, hideOldTask }: { task: Task, hideOldTask: (t: Task) => void }) {
  const tskctx = useContext(appContext)!
  const classes = `task-card task ${tskctx.selectedTask == task ? 'selected-task' : ''} ${tskctx.editedTask == task ? 'edited-task' : ''}`
  const [draft, setDraft] = useState(task.description.toString())

  function confirmEdit() {
    if (draft === "") {
      hideOldTask(task)
      task.delete()
      tskctx.setSelectedTask(null)
    } else {
      task.setDescription(draft)
    }
    tskctx.setEditedTask(null)
  }

  function cancelEdit() {
    setDraft(task.description.toString())
    tskctx.setEditedTask(null)
  }


  return (
    <>
      <div className={classes}
        onClick={() => {
            tskctx.setSelectedTask(task)
          }}
        onDoubleClick={() => {
           tskctx.setEditedTask(task)
        }}
      >
        
        <input
          value={draft as string}
          onBlur={() => {
            confirmEdit()
          }}
          onChange={(ev) => setDraft(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") confirmEdit()
            if (ev.key === "Escape") cancelEdit()
          }}
          className="task-input"
        /> 
        
      </div>
    </>
  )
}


export function TaskContainer() {

  // Fetch root level tasks
  const [rootTasks, setRootTasks] = useState<Array<Task>>([])
  
  useEffect(() => {

    async function load() {
      const tasks = await (await database).getRootTasks() 
      setRootTasks(tasks)  
    }

    load()
    
  }, [])

  function showNewTask(task: Task) {
      setRootTasks([...rootTasks, task]);
  }

  function hideOldTask(task: Task) {
    setRootTasks(rootTasks.filter((t: Task) => t.id !== task.id));
  }

  return (
    <>
      <div className='task-container'>
        {rootTasks.map((it, index) => (
          <TaskCard
            key={it.id || index} 
            task={it}
            hideOldTask={hideOldTask}
          />
        ))}
        <AddCard
          showNewTask={showNewTask}
         />
      </div>
    </>
  )
}


export function AddCard({ showNewTask }: { showNewTask: (t: Task) => void }) {
  const [draft, setDraft] = useState("")
  async function addTask() {
    // replace null with selected task
    const task = await (await database).addTask(draft, null)
    showNewTask(task)
  }

  return (
    <>
      <div className="task-card task">
        <input placeholder='New task' className="task-input"
          value={draft}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              addTask()
              setDraft("")
            }
          }}
        onChange={(ev) => {
          setDraft(ev.target.value)
        }}
        
        />
      </div>
    </>
  )
} 



export function TaskInfoPanel() {
  return (
    <>
      <div className='task-info-panel'>
        <div className='title'>Task Title</div>
        <div className='timers inline-elements'>
          <div className='paired inline-elements'>
            <TimeDisplay lastHours={null} taskId={null} text={"Total"} />
            <DurationSet text={"Expected"} />
          </div>
          <div className='paired inline-elements'>
            <TimeDisplay lastHours={24} taskId={null} text={"Today"} />
            <DurationSet text={"Daily quota"} />
          </div>
       </div>
        <div className='button-settings inline-elements'>
          <button>Subtasks</button>
          <button>Color</button>
        </div>
        <input className='description'>
        </input>
      </div>
    </>
  )
}

export function TaskArea(){
  return (
    <>
      <div className='task-area'>
        <div className='task-plateau'>
          <LocationBar />
          <TaskContainer />
          <PresenceBar />
        </div>
        <TaskInfoPanel />

      </div>
    </>
  )
}



function LocationBar() {
  return (
    <>
      <div className='location-bar'>Home - Today</div>
    </>
  )
}

function PresenceBar() {
  return (
    <>
      <div className='presence-bar'>
        <PomodoroBox />
        <button>Start</button>
        <TimeDisplay lastHours={24} taskId={null} text={null} />
      </div>
    </>
  )
}