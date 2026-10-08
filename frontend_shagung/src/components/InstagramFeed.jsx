import { Instagram } from 'lucide-react'

const posts = [
  { id: 1, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80', likes: 1243 },
  { id: 2, image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80', likes: 2156 },
  { id: 3, image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80', likes: 1876 },
  { id: 4, image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80', likes: 3421 },
  { id: 5, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80', likes: 2987 },
  { id: 6, image: 'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=600&q=80', likes: 1654 },
]

export default function InstagramFeed() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-pink-100 px-4 py-2 rounded-full mb-4">
            <Instagram className="h-5 w-5 text-pink-600" />
            <span className="font-medium text-pink-600">@elegance_fashion</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Follow Us on Instagram</h2>
          <p className="text-gray-600 text-lg">Get inspired by our community and share your style with #EleganceStyle</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer">
              <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <div className="text-white flex items-center gap-2 p-4">
                  <Instagram className="h-5 w-5" />
                  <span className="font-semibold">{post.likes.toLocaleString()} likes</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a href="#" className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-semibold transition-colors">
            <Instagram className="h-5 w-5" />
            Follow us for more
          </a>
        </div>
      </div>
    </section>
  )
}
