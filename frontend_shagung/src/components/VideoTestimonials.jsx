import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

const VIDEOS = [
  {
    src: 'https://res.cloudinary.com/dsgktwwae/video/upload/v1763020558/Shagun_Gallery_lehengas_collection_video_1_omrdlo.mp4',
    
  },
  {
    src: 'https://res.cloudinary.com/dsgktwwae/video/upload/v1763020558/Shagun_Gallery_lehengas_collection_video_2_j7jkkr.mp4',
   
  },
  {
    src: 'https://res.cloudinary.com/dsgktwwae/video/upload/v1763020557/Shagun_Gallery_lehengas_collection_video_3_fronen.mp4',
    
  },
  {
    src: 'https://res.cloudinary.com/dsgktwwae/video/upload/v1763020557/Shagun_Gallery_lehengas_collection_video_4_nmkitr.mp4',
    
  },
]

function VideoCard({ src, title, className = '' }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const node = videoRef.current
    if (!node) return

    node.muted = true
    node.playsInline = true

    const onIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          node.play().catch(() => {})
        } else {
          node.pause()
        }
      })
    }

    const observer = new IntersectionObserver(onIntersect, { threshold: [0, 0.5, 1] })
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

  const toggleMute = () => {
    const node = videoRef.current
    if (!node) return
    node.muted = !node.muted
    setMuted(node.muted)
  }

  return (
    <div className={`group relative rounded-xl overflow-hidden bg-black shadow-sm hover:shadow-lg transition-shadow ${className}`}>
      <div className="aspect-[4/5] w-full">
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-cover"
          loop
          autoPlay
          muted
          playsInline
          preload="metadata"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      {title ? (
        <div className="absolute left-3 bottom-3 text-white text-sm font-medium drop-shadow-sm">
          {title}
        </div>
      ) : null}

     
    </div>
  )
}

export default function VideoTestimonials() {
  return (
    <section className="bg-gradient-to-b from-white to-pink-50">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Video Testimonials</h2>
          <p className="text-gray-600 text-lg">Hear it from our customers—real moments wearing Shagun Gallery styles</p>
        </div>

        {/* Mobile slider */}
        <div className="md:hidden -mx-4 px-4 mt-4">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
            {VIDEOS.map((v, idx) => (
              <VideoCard key={idx} src={v.src} title={v.title} className="min-w-[80%] snap-start" />
            ))}
          </div>
        </div>

        {/* Grid on md+ */}
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
          {VIDEOS.map((v, idx) => (
            <VideoCard key={idx} src={v.src} title={v.title} />
          ))}
        </div>
      </div>
    </section>
  )
}
