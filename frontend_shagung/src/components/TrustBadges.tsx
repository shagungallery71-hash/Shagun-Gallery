import { Shield, Truck, RefreshCw, Award } from "lucide-react";

interface TrustBadge {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const badges: TrustBadge[] = [
  {
    icon: <Truck className="h-8 w-8 text-pink-600" />,
    title: "Free Shipping",
    description: "On orders over $50",
  },
  {
    icon: <RefreshCw className="h-8 w-8 text-pink-600" />,
    title: "Easy Returns",
    description: "30-day return policy",
  },
  {
    icon: <Shield className="h-8 w-8 text-pink-600" />,
    title: "Secure Payment",
    description: "100% secure checkout",
  },
  {
    icon: <Award className="h-8 w-8 text-pink-600" />,
    title: "Premium Quality",
    description: "Guaranteed satisfaction",
  },
];

export default function TrustBadges() {
  return (
    <section className="py-12 bg-pink-50/50 border-y border-pink-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center group"
            >
              <div className="mb-4 p-4 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow duration-300">
                {badge.icon}
              </div>
              <h3 className="font-semibold mb-1">{badge.title}</h3>
              <p className="text-sm text-muted-foreground">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}