import { useRef, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Navigation } from 'swiper/modules'
import { Play, ChevronLeft, ChevronRight, Eye, Heart, Share2 } from 'lucide-react'

import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/navigation'

const videos = [
    {
        id: 1,
        url: "https://res.cloudinary.com/dsgktwwae/video/upload/v1763020558/Shagun_Gallery_lehengas_collection_video_1_omrdlo.mp4",
        title: "Royal Bridal Lehengas",
        subtitle: "Wedding Collection 2025",
        views: "24.5K",
        likes: "2.1K"
    },
    {
        id: 2,
        url: "https://res.cloudinary.com/dsgktwwae/video/upload/v1763020558/Shagun_Gallery_lehengas_collection_video_2_j7jkkr.mp4",
        title: "Modern Silk Sarees",
        subtitle: "Festive Elegance",
        views: "18.2K",
        likes: "1.5K"
    },
    {
        id: 3,
        url: "https://res.cloudinary.com/dsgktwwae/video/upload/v1763020557/Shagun_Gallery_lehengas_collection_video_3_fronen.mp4",
        title: "Party Wear Gowns",
        subtitle: "Evening Glamour",
        views: "15.8K",
        likes: "1.2K"
    },
    {
        id: 4,
        url: "https://res.cloudinary.com/dsgktwwae/video/upload/v1763020557/Shagun_Gallery_lehengas_collection_video_4_nmkitr.mp4",
        title: "Designer Anarkalis",
        subtitle: "Royal Heritage",
        views: "21.3K",
        likes: "1.8K"
    },
    {
        id: 5,
        url: "https://res.cloudinary.com/dsgktwwae/video/upload/v1763020558/Shagun_Gallery_lehengas_collection_video_1_omrdlo.mp4",
        title: "Traditional Fusion",
        subtitle: "Contemporary Cuts",
        views: "12.4K",
        likes: "950"
    },
    {
        id: 6,
        url: "https://res.cloudinary.com/dsgktwwae/video/upload/v1763020558/Shagun_Gallery_lehengas_collection_video_2_j7jkkr.mp4",
        title: "Velvet Luxe Series",
        subtitle: "Winter Weddings",
        views: "19.7K",
        likes: "1.6K"
    },
    {
        id: 7,
        url: "https://res.cloudinary.com/dsgktwwae/video/upload/v1763020557/Shagun_Gallery_lehengas_collection_video_3_fronen.mp4",
        title: "Chikankari Magic",
        subtitle: "Lucknowi Edition",
        views: "14.2K",
        likes: "1.1K"
    },
    {
        id: 8,
        url: "https://res.cloudinary.com/dsgktwwae/video/upload/v1763020557/Shagun_Gallery_lehengas_collection_video_4_nmkitr.mp4",
        title: "Banarasi Heritage",
        subtitle: "Classic Weaves",
        views: "22.8K",
        likes: "2.3K"
    }
]

function VideoCard({ video, isActive }) {
    const videoRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)

    useEffect(() => {
        if (!isActive && videoRef.current) {
            videoRef.current.pause()
            setIsPlaying(false)
        }
    }, [isActive])

    const togglePlay = (e) => {
        e.stopPropagation()
        if (!videoRef.current) return

        if (isPlaying) {
            videoRef.current.pause()
        } else {
            videoRef.current.muted = false
            setIsMuted(false)
            const playPromise = videoRef.current.play()
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name !== 'AbortError') console.error('Video play error:', error)
                })
            }
        }
        setIsPlaying(!isPlaying)
    }

    const handleShare = async (e) => {
        e.stopPropagation()
        if (navigator.share) {
            try {
                await navigator.share({
                    title: video.title,
                    text: `Check out this collection: ${video.title}`,
                    url: window.location.href,
                })
            } catch (error) {
                console.log('Error sharing:', error)
            }
        }
    }

    return (
        <div className={`relative transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isActive ? 'scale-100 opacity-100 z-20' : 'scale-[0.85] opacity-40 z-10'}`}>
            <div className="relative w-[200px] sm:w-[280px] h-[360px] sm:h-[500px] bg-neutral-900 overflow-hidden border border-neutral-200">
                <video
                    ref={videoRef}
                    src={video.url}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    playsInline
                />

                <div className={`absolute inset-0 transition-opacity duration-500 bg-black/40 ${isActive && isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                    {/* Top Tag */}
                    <div className="absolute top-6 left-6">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-white border-b border-white/40 pb-1">
                            {video.subtitle}
                        </span>
                    </div>

                    {/* Center Play Button */}
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
                            <div className="w-14 h-14 rounded-full border border-white/50 backdrop-blur-sm flex items-center justify-center text-white transition-transform hover:scale-110">
                                <Play fill="currentColor" className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    )}

                    {/* Bottom Info */}
                    <div className="absolute bottom-0 left-0 w-full p-6 text-white bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <h3 className="text-xl font-light tracking-wide mb-6">{video.title}</h3>

                        <div className="flex items-center justify-between text-xs font-light tracking-wider">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{video.views}</span>
                                <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" />{video.likes}</span>
                            </div>
                            <button onClick={handleShare} className="hover:text-neutral-300 transition-colors uppercase text-[9px] tracking-widest border border-white/30 px-3 py-1.5 backdrop-blur-sm">
                                Share
                            </button>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay} />
            </div>
        </div>
    )
}

export default function FeaturedVideo() {
    const swiperRef = useRef(null)

    return (
        <section className="relative py-10 md:py-24 bg-white overflow-hidden border-b border-neutral-100">
            <div className="container relative mx-auto px-4">
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-8 md:mb-14">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-4 block">Editorial</span>
                    <h2 className="text-3xl md:text-5xl font-heading font-light tracking-wide text-neutral-900 uppercase">
                        The Cinematic Lookbook
                    </h2>
                </div>

                <div className="relative max-w-7xl mx-auto">
                    <button
                        onClick={() => swiperRef.current?.slidePrev()}
                        className="absolute left-0 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-black transition-colors hidden md:flex"
                        aria-label="Previous video"
                    >
                        <ChevronLeft strokeWidth={1} className="w-8 h-8" />
                    </button>

                    <button
                        onClick={() => swiperRef.current?.slideNext()}
                        className="absolute right-0 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-black transition-colors hidden md:flex"
                        aria-label="Next video"
                    >
                        <ChevronRight strokeWidth={1} className="w-8 h-8" />
                    </button>

                    <Swiper
                        onSwiper={(swiper) => (swiperRef.current = swiper)}
                        effect={'coverflow'}
                        grabCursor={true}
                        centeredSlides={true}
                        slidesPerView={'auto'}
                        loop={true}
                        coverflowEffect={{
                            rotate: 0,
                            stretch: 100,
                            depth: 150,
                            modifier: 1.5,
                            slideShadows: false,
                        }}
                        modules={[EffectCoverflow, Navigation]}
                        className="featured-video-swiper !overflow-visible py-8"
                    >
                        {videos.map((video, index) => (
                            <SwiperSlide key={`${video.id}-${index}`} className="!w-auto">
                                {({ isActive }) => (
                                    <VideoCard video={video} isActive={isActive} />
                                )}
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    )
}

