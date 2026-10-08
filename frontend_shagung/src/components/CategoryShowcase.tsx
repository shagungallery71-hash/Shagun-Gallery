import { ArrowRight } from "lucide-react";

interface Category {
  id: number;
  name: string;
  image: string;
  itemCount: number;
}

const categories: Category[] = [
  {
    id: 1,
    name: "Dresses",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    itemCount: 245,
  },
  {
    id: 2,
    name: "Accessories",
    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80",
    itemCount: 189,
  },
  {
    id: 3,
    name: "Shoes",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
    itemCount: 156,
  },
  {
    id: 4,
    name: "Beauty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
    itemCount: 312,
  },
];

function CategoryCard({ category }: { category: Category }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer">
      {/* Background Image */}
      <img
        src={category.image}
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
        <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
          <h3 className="text-2xl md:text-3xl font-bold mb-2">
            {category.name}
          </h3>
          <p className="text-sm text-white/80 mb-4">
            {category.itemCount} items
          </p>
          <div className="flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Shop Now
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 border-4 border-white/0 group-hover:border-white/20 transition-colors duration-300 rounded-2xl" />
    </div>
  );
}

export default function CategoryShowcase() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-pink-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg">
            Explore our curated collections designed for every occasion
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}