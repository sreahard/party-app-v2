import { useState, useEffect } from 'react'

export default function Countdown({ dateStr }) {
  const [units, setUnits] = useState(null)
  const [past, setPast] = useState(false)

  useEffect(() => {
    function tick() {
      const diff = new Date(dateStr + 'T00:00:00') - new Date()
      if (diff <= 0) { setPast(true); return }
      setUnits([
        { num: Math.floor(diff / 86400000),              label: 'Days'    },
        { num: Math.floor((diff % 86400000) / 3600000),  label: 'Hours'   },
        { num: Math.floor((diff % 3600000)  / 60000),    label: 'Minutes' },
        { num: Math.floor((diff % 60000)    / 1000),     label: 'Seconds' },
      ])
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [dateStr])

  if (past) return <p className="text-center text-brand-pink font-bold text-xl">🎉 The party is today!</p>
  if (!units) return null

  return (
    <div className="flex gap-4 flex-wrap justify-center">
      {units.map(({ num, label }) => (
        <div key={label} className="text-center bg-white/10 border border-white/20 rounded-2xl px-5 py-3 min-w-[64px]">
          <div className="text-3xl font-extrabold leading-none bg-gradient-to-b from-pink-300 to-purple-400
                          bg-clip-text text-transparent">
            {String(num).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}
