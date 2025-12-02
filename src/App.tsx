import { useEffect, useState, createContext, useContext } from 'react'
import './App.css'
import { database, Task } from './database'


// Work Entry
// Start
// End
// (transient) duration
// Task
// Note (int / 5)


const mockDescriptions = [
  "Buy groceries",
  "Finish report",
  "Clean desk",
  "Plan trip",
  "Fix bug #42",
  "Read documentation",
  "Water plants",
  "Call client",
  "Organize files",
  "Review pull request"
]

function choice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateFakeTasks(n: number): Task[] {
  return Array(n).map(() => new Task(choice(mockDescriptions)))
}


function TaskCard({ task }: { task: Task }) {
  const tskctx = useContext(SelectedTaskContext)!
  const classes = `task-card ${tskctx.selectedTask == task ? 'selected-task' : ''}`
  
  return (
    <>
      <div className={classes}
        onClick={() => {
            tskctx.setSelectedTask(task)
          }}
        onDoubleClick={() => {
          console.log("double")
        }}
      >
        {task.description}
      </div>
    </>
  )
}

const rootTasks: Task[] = [
    new Task(choice(mockDescriptions)),
    new Task(choice(mockDescriptions)),
    new Task(choice(mockDescriptions)),
  ]

function TaskContainer() {

  // Fetch root level tasks

  

  return (
    <>
      <div className='task-container'>
        {rootTasks.map((it, index) => (
          <TaskCard 
            key={it.id || index} 
            task={it}
            />
        ))}
      </div>
    </>
  )
}

function minutesToHoursMinutes(minutes: number) {
  return {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  };
}


function TimeDisplay({ totalMinutes, text }: {
  totalMinutes: number, text: String
}) {
  const { hours, minutes } = minutesToHoursMinutes(totalMinutes);
  return (
    <>
      <div className='time-display'>
        <div>
          <span className="hours-display" >{hours}</span>
          <span className="h-label">H</span>
          <span className="minutes-display">{minutes}</span>
        </div>
        <p>{text}</p>
      </div>      
    </>
  )
}

function BottomBar() {

  const tskctx = useContext(SelectedTaskContext)!  

  return (
    <>
      <div className="bottom-bar">
        {tskctx.selectedTask ? tskctx.selectedTask.description : "Select task"}
        <div className="control-panel">
          <TimeDisplay totalMinutes={140} text={"Total"} />
          <button onClick={() => {
              tskctx.setIsWorking(!tskctx.isWorking)
            }
          } className={tskctx.isWorking ? "stop": "start"}>
            {tskctx.isWorking ? "Stop": "Start"}</button>
          <TimeDisplay totalMinutes={10} text={"Today"} />
        </div>
      </div>
    </>
  )
}


const SelectedTaskContext = createContext<{
  selectedTask: Task | null
  setSelectedTask: (t: Task | null) => void
  isWorking: boolean
  setIsWorking: (b: boolean) => void
} | null>(null); 

function App() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  
  const customSetSelectedTask = (task: Task | null) => {
    if (task == selectedTask) return
    if (isWorking) return
    setSelectedTask(task)
  }

  return (
    <SelectedTaskContext.Provider value={
      { 
        selectedTask: selectedTask, 
        setSelectedTask: customSetSelectedTask, 
        isWorking: isWorking,
        setIsWorking: setIsWorking }}>
      <TaskContainer />
      <BottomBar />
    </SelectedTaskContext.Provider>
  )
}

export default App
