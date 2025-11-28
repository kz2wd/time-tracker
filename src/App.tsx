import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
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

function TaskCard({ task }) {
  return (
    <>
    <div className="card">
      <p>Task:</p>
      <p>{task.description}</p>
      <input type="text"/>

    </div>
    </>
  )
}

function TaskContainer() {

  // Fetch root level tasks

  const rootTasks: Task[] = [
    new Task(choice(mockDescriptions)),
    new Task(choice(mockDescriptions)),
    new Task(choice(mockDescriptions)),
  ]


  return (
    <>
    {rootTasks.map((it) => (
      <TaskCard task={it} />
    ))}
    </>
  )
}




function TaskAdder() {

}


function App() {
  return (
    <>
      <h1>Task Timer</h1>
      <div>
        Menu
        
      </div>
      <TaskContainer />
    </>
  )
}

export default App
