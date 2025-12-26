import { useEffect, useState, useContext } from 'react'
import { database } from './database'

import { appContext } from './appContext'

import './TimeDisplay.css'

function convertTime(seconds: number) {
  return {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor(seconds % 3600 / 60) ,
    seconds: Math.floor(seconds % 60),
  };
}


export function TimeDisplay({ lastHours, taskId, text }: {
  lastHours: number | null,
  taskId: number | null,
  text: string | null 
  }) {
  const [timeSeconds, setTimeSeconds] = useState(0)
  const [localTime, setLocalTime] = useState(0)
 
  const tskctx = useContext(appContext)!
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
          <span className="science-gothic-font" >{hours.toString().padStart(2, '0')}</span>
          <span className="h-label science-gothic-font">:</span>
          <span className="science-gothic-font">{minutes.toString().padStart(2, '0')}</span>
          <span className="h-label science-gothic-font">:</span>
          <span className="science-gothic-font">{seconds.toString().padStart(2, '0')}</span>
        </div>
        {text === null ? "" : <p className="playwrite-no-font">{text}</p>} 
      </div>      
    </>
  )
}

// Why is this kind of things not default... 
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}


export function TimerCell({ defaultTime=0, step=1, min=0, max=95 } : 
  {defaultTime?: number, step?: number, min?: number, max?: number}) {
  const [time, setTime] = useState(defaultTime)

  function onWheel(e: any) {
    if (!window.matchMedia("(pointer: fine)").matches) return
    setTime(clamp(time - Math.sign(e.deltaY) * step, min, max));
    
  }
  
  return (
    <>
      <input type="number" className="time-input science-gothic-font" min={min} max={max} inputMode='numeric' pattern="[0-9]*" step={step} value={time}
        onChange={(e) => {setTime(Number(e.target.value))}}
        onWheel={onWheel}
      />
    </>
  )


}

export function DurationSet({seperator, text}: 
  {seperator?: string, text?: string}) {
  return (
    <>
      <div className='duration-set'>
        <div>
          <TimerCell defaultTime={0} step={1}/>
          {seperator == null ? "" : <p>{seperator}</p>}
          <TimerCell defaultTime={0} step={5}/>
        </div>
        {text == null ? "" : <p className="playwrite-no-font">{text}</p>} 
      </div>
    </>
  ) 
}

export function PomodoroBox() {
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
