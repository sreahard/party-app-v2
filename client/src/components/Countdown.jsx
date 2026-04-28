import { useState, useEffect } from 'react'

export default function Countdown({ dateStr }) {
  const [units, setUnits] = useState(null)
  const [past, setPast] = useState(false)

  useEffect(() => {
    function tick() {
      const diff = new Date(dateStr + 'T00:00:00') - new Date()
      if (diff <= 0) {
        setPast(true)
        return
      }
      setUnits([
        { num: Math.floor(diff / 86400000), label: 'Days' },
        { num: Math.floor((diff % 86400000) / 3600000), label: 'Hours' },
        { num: Math.floor((diff % 3600000) / 60000), label: 'Minutes' },
        { num: Math.floor((diff % 60000) / 1000), label: 'Seconds' },
      ])
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [dateStr])

  if (past)
    return (
      <p className="text-center text-xl font-bold text-brand-coral">The celebration is here.</p>
    )
  if (!units) return null

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {units.map(({ num, label }) => (
        <div
          key={label}
          className="min-w-[60px] rounded-2xl border-2 border-brand-sea-mist bg-white px-4 py-3.5 text-center shadow-md shadow-brand-ocean/10">
          <div className="text-4xl font-bold leading-none text-brand-ocean">
            {String(num).padStart(2, '0')}
          </div>
          <div className="mt-1.5 text-sm font-semibold uppercase tracking-wide text-brand-ocean">{label}</div>
        </div>
      ))}
    </div>
  )
}
