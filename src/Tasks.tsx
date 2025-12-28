import { useEffect, useState, useContext } from 'react'

import { database, Task } from './database'
import { TimeDisplay, DurationSet, PomodoroBox } from './TimeDisplay'
import { appContext } from './appContext'
import Tiptap from './Tiptap'

import './Tasks.css'



export function TaskCard({ task }: { task: Task }) {
  const tskctx = useContext(appContext)!
  const classes = `task-card task ${tskctx.selectedTask == task ? 'selected-task' : ''} ${tskctx.editedTask == task ? 'edited-task' : ''}`


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
        {task.title}
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


  return (
    <>
      <div className='task-container'>
        {rootTasks.map((it, index) => (
          <TaskCard
            key={it.id || index} 
            task={it}
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


import StarterKit from '@tiptap/starter-kit'
import { useEditor, EditorContent } from '@tiptap/react'

export function TaskInfoPanel() {

  const appctx = useContext(appContext)!
  const task = appctx.selectedTask

  const editor = useEditor({
    extensions: [StarterKit], // define your extension array
    content: task?.description, // initial content
  })

  return (
    <>
      <div className='task-info-panel'>
        <TaskTitle />
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
        <div className='description' >
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  )
}

function TaskTitle() {

  const appctx = useContext(appContext)!
  const task = appctx.selectedTask
  if (task === null) return

  const [draft, setDraft] = useState(task.title.toString())

  function confirmEdit() {
    if (draft === "") {
      task!.delete()
      appctx.setSelectedTask(null)
    } else {
      task!.setTitle(draft)
    }
  }

  function cancelEdit() {
    setDraft(task!.title.toString())
  }

  return (
    <>
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
    </>
  )
}

export function TaskArea(){
  return (
    <>
      <div className='task-area'>
        <div className='task-plateau column-container'>
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