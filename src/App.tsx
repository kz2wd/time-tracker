import { useEffect, useState, createContext, useContext } from 'react'
import './App.css'
import { database, Task, WorkEntry } from './database'


// Work Entry
// Start
// End
// (transient) duration
// Task
// Note (int / 5)

// Why is this kind of things not default... 
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function TaskCard({ task, hideOldTask }: { task: Task, hideOldTask: (t: Task) => void }) {
  const tskctx = useContext(SelectedTaskContext)!
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

function AddCard({ showNewTask }: { showNewTask: (t: Task) => void }) {
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

function TaskContainer() {

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

function convertTime(seconds: number) {
  return {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor(seconds % 3600 / 60) ,
    seconds: Math.floor(seconds % 60),
  };
}


function TimeDisplay({ lastHours, taskId, text }: {
  lastHours: number | null,
  taskId: number | null,
  text: string | null 
  }) {
  const [timeSeconds, setTimeSeconds] = useState(0)
  const [localTime, setLocalTime] = useState(0)
 
  const tskctx = useContext(SelectedTaskContext)!
  useEffect(() => {
    if (!tskctx.workingEntry) return
    
    const intervalId = setInterval(() => {
      if (!tskctx.workingEntry) return
      const now = Date.now()
      setLocalTime((now - tskctx.workingEntry.start) / 1000)  // Elapsed time
    }, 1000)
    

    return () => clearInterval(intervalId)
    
  }, [tskctx.workingEntry])

  useEffect(() => {
    let cancelled = false
    setLocalTime(0)
    ;(async () => {
      const seconds = await (await database).getWorkTimeSeconds(lastHours, taskId)
      if (!cancelled) setTimeSeconds(seconds)
    })() 

  return () => { cancelled = true }
  }, [lastHours, taskId, tskctx.workingEntry])

  const {hours, minutes, seconds} = convertTime(timeSeconds + localTime)

  return (
    <>
      <div className='time-display'>
        <div>
          
          <span className="hours-display science-gothic-font" >{hours.toString().padStart(2, '0')}</span>
          <span className="h-label science-gothic-font">:</span>
          <span className="minutes-display science-gothic-font">{minutes.toString().padStart(2, '0')}</span>
          <span className="h-label science-gothic-font">:</span>
          <span className="minutes-display science-gothic-font">{seconds.toString().padStart(2, '0')}</span>
        </div>
        {text === null ? "" : <p className="playwrite-no-font">{text}</p>} 
      </div>      
    </>
  )
}

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

function TaskInfoPanel() {
  return (
    <>
      <div className='task-info-panel'>
        <div className='title'>Task Title</div>
        <div className='timers inline-elements'>
          <div className='paired'>
            <TimeDisplay lastHours={null} taskId={null} text={"Total"} />
            <TimeDisplay lastHours={null} taskId={null} text={"Expected"} />
          </div>
          <div className='paired'>
            <TimeDisplay lastHours={24} taskId={null} text={"Today"} />
            <TimeDisplay lastHours={null} taskId={null} text={"Daily quota"} />
          </div>
       </div>
        <div className='button-settings inline-elements'>
          <button>Subtasks</button>
          <button>Color</button>
        </div>
        <div className='description'></div>
      </div>
    </>
  )
}

function TaskArea(){
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

function TimerCell({ defaultTime=0, step=1, min=0, max=95 } : 
  {defaultTime?: number, step?: number, min?: number, max?: number}) {
  const [time, setTime] = useState(defaultTime)

  function onWheel(e: any) {
    if (!window.matchMedia("(pointer: fine)").matches) return
    e.preventDefault();
    setTime(clamp(time - Math.sign(e.deltaY) * step, min, max));
    
  }
  
  return (
    <>
      <input type="number" className="time-input science-gothic-font" min={max} max={max} inputMode='numeric' pattern="[0-9]*" step={step} value={time}
        onChange={(e) => setTime(Number(e.target.value))}
        onWheel={onWheel}
      />
    </>
  )


}

function PomodoroBox() {
  return (
    <>
      <div className='pomodoro-box'>
        <button>Pomodoro ON</button>
        <TimerCell defaultTime={25} step={5}/>
        <TimerCell defaultTime={5} step={5}/>
      </div>
    </>
  )
}



function BottomBar() {

  const tskctx = useContext(SelectedTaskContext)!  
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

const SelectedTaskContext = createContext<{
  selectedTask: Task | null
  setSelectedTask: (t: Task | null) => void
  workingEntry: WorkEntry | null
  setWorkingEntry: (w: WorkEntry | null) => void
  editedTask: Task | null
  setEditedTask: (t: Task | null) => void
}| null>(null); 

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
    <SelectedTaskContext.Provider value={
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
    </SelectedTaskContext.Provider>
  )
}

export default App
