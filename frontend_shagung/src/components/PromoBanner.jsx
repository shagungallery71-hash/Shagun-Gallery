import { Clock, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PromoBanner() {
  const [time, setTime] = useState({ days: 2, hours: 15, minutes: 30, seconds: 45 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => ({...prev, seconds: prev.seconds > 0 ? prev.seconds - 1 : 59}))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full mb-6">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Limited Time Offer</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Spring Sale
            <span className="block mt-2">Up to 50% Off</span>
          </h2>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Don't miss out on our biggest sale of the season. Refresh your wardrobe with stunning pieces at unbeatable prices.
          </p>

          <div className="flex justify-center gap-4 mb-8">
            {[{ val: time.days, label: 'Days' }, { val: time.hours, label: 'Hours' }, { val: time.minutes, label: 'Minutes' }, { val: time.seconds, label: 'Seconds' }].map((item, i) => (
              <div key={i} className="bg-white/20 backdrop-blur rounded-lg p-4 min-w-[80px]">
                <div className="text-3xl md:text-4xl font-bold">{String(item.val).padStart(2, '0')}</div>
                <div className="text-sm text-white/80 mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          <button className="bg-white text-pink-600 hover:bg-white/90 px-8 py-3 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 mx-auto">
            Shop Sale Now
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="text-sm text-white/70 mt-6">*Discount applies to selected items. Terms and conditions apply.</p>
        </div>
      </div>
    </section>
  )
}
