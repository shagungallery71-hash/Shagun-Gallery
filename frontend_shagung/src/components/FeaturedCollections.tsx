import { Sparkles, TrendingUp, Zap } from "lucide-react";

interface Collection {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  icon: React.ReactNode;
  color: string;
}

const collections: Collection[] = [
  {
    id: 1,
    title: "Trending Now",
    subtitle: "Most Popular Styles",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 2,
    title: "New Arrivals",
    subtitle: "Fresh Off The Runway",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
    icon: <Sparkles className="h-6 w-6" />,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: 3,
    title: "Flash Sale",
    subtitle: "Limited Time Offers",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
    icon: <Zap className="h-6 w-6" />,
    color: "from-rose-500 to-orange-500",
  },
];

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl aspect-[16/9] cursor-pointer">
      <img
        src={collection.image}
        alt={collection.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/30" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
        <div className={`mb-4 p-3 rounded-full bg-gradient-to-r ${collection.color} shadow-lg`}>
          {collection.icon}
        </div>
        <h3 className="text-2xl md:text-3xl font-bold mb-2 text-center">
          {collection.title}
        </h3>
        <p className="text-sm text-white/90 mb-4">{collection.subtitle}</p>
        <div className="px-6 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-medium group-hover:bg-white/30 transition-colors">
          Explore Collection
        </div>
      </div>
    </div>
  );
}

export default function FeaturedCollections() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured Collections
          </h2>
          <p className="text-muted-foreground text-lg">
            Curated selections for every style and occasion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    </section>
  );
}