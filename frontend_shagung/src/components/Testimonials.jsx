import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode, Autoplay } from 'swiper/modules'
import { Star } from 'lucide-react'

import 'swiper/css'
import 'swiper/css/free-mode'

const testimonials = [
  {
    id: 1,
    name: 'Sanya Malhotra',
    location: 'Mumbai',
    rating: 5,
    text: 'The bridal lehenga I ordered was absolutely stunning! Everyone at the wedding asked where I got it from. The fit and finish were impeccable.',
    product: 'Bridal Series',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    location: 'Delhi',
    rating: 5,
    text: 'Material quality is superb. Perfectly stitched and delivered on time. The attention to detail is truly remarkable. Highly recommended.',
    product: 'Silk Saree',
  },
  {
    id: 3,
    name: 'Ananya Patel',
    location: 'Ahmedabad',
    rating: 5,
    text: 'Was skeptical about ordering online, but Shagun Gallery exceeded my expectations. Beautiful collection with incredibly premium fabrics.',
    product: 'Party Wear',
  },
  {
    id: 4,
    name: 'Riya Singh',
    location: 'Bangalore',
    rating: 5,
    text: 'The embroidery work on the suit is so intricate and neat. Worth every penny. The minimalist drape holds up beautifully throughout the day.',
    product: 'Anarkali Set',
  },
  {
    id: 5,
    name: 'Kavita Reddy',
    location: 'Hyderabad',
    rating: 5,
    text: 'Customer support was very helpful in guiding me to choose the right size. It fits perfectly and feels like it was custom made just for me.',
    product: 'Kurti Palazzo',
  },
  {
    id: 6,
    name: 'Neha Gupta',
    location: 'Jaipur',
    rating: 5,
    text: 'Authentic designs and vibrant yet elegant colors. Just like what is shown in the pictures. A luxurious experience from unboxing to wearing.',
    product: 'Jaipuri Suit',
  },
  {
    id: 7,
    name: 'Meera Iyer',
    location: 'Chennai',
    rating: 5,
    text: 'Ordered a saree for my mom. She absolutely loved the fabric and the subtle, elegant print. We are completely won over.',
    product: 'Kanjivaram Saree',
  },
  {
    id: 8,
    name: 'Ishita Verma',
    location: 'Pune',
    rating: 5,
    text: 'Fast delivery and premium packaging. The outfit looks very expensive and classy. Will definitely be returning for my next event.',
    product: 'Designer Gown',
  },
]

const row1 = testimonials.slice(0, 4)
const row2 = testimonials.slice(4, 8)

function TestimonialCard({ testimonial }) {
  return (
    <div className="bg-white p-4 md:p-7 w-[260px] sm:w-[360px] flex-shrink-0 group border border-rose-100 hover:border-rose-400 hover:shadow-md transition-all duration-500 ease-in-out cursor-default flex flex-col h-full">
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`}
          />
        ))}
      </div>

      <p className="text-neutral-600 text-xs md:text-sm font-light leading-relaxed mb-3 flex-grow">
        "{testimonial.text}"
      </p>

      <div className="mt-auto border-t border-neutral-100 pt-4 flex flex-col">
        <span className="text-xs uppercase tracking-widest font-medium text-neutral-900 mb-1">{testimonial.name}</span>
        <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase tracking-wider">
           <span>{testimonial.location}</span>
           <span>{testimonial.product}</span>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const swiper1Ref = useRef(null)
  const swiper2Ref = useRef(null)

  return (
    <section className="bg-rose-50/30 py-10 md:py-20 overflow-hidden border-y border-rose-100">
      <div className="container mx-auto px-4 mb-8 md:mb-14">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-heading font-light tracking-[0.1em] text-rose-950 uppercase mb-4">
            Client Experiences
          </h2>
          <p className="text-rose-700/70 text-sm font-light">
            Discover what our discerning clientele has to say about their experience.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Row 1 - Left to Right */}
        <Swiper
          modules={[FreeMode, Autoplay]}
          spaceBetween={24}
          slidesPerView="auto"
          freeMode={{ enabled: true, momentum: true, momentumRatio: 0.5 }}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            reverseDirection: false,
          }}
          speed={7000}
          loop={true}
          onSwiper={(swiper) => (swiper1Ref.current = swiper)}
          className="testimonial-marquee !px-4"
        >
          {[...row1, ...row1, ...row1].map((testimonial, index) => (
            <SwiperSlide key={`row1-${index}`} className="!w-auto !h-auto">
              <TestimonialCard testimonial={testimonial} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Row 2 - Right to Left */}
        <Swiper
          modules={[FreeMode, Autoplay]}
          spaceBetween={24}
          slidesPerView="auto"
          freeMode={{ enabled: true, momentum: true, momentumRatio: 0.5 }}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            reverseDirection: true,
          }}
          speed={8500}
          loop={true}
          onSwiper={(swiper) => (swiper2Ref.current = swiper)}
          className="testimonial-marquee !px-4"
        >
          {[...row2, ...row2, ...row2].map((testimonial, index) => (
            <SwiperSlide key={`row2-${index}`} className="!w-auto !h-auto">
              <TestimonialCard testimonial={testimonial} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Styles */}
      <style>{`
        .testimonial-marquee {
            padding: 4px 0;
        }
        .testimonial-marquee .swiper-wrapper {
            transition-timing-function: linear !important;
        }
      `}</style>
    </section>
  )
}

