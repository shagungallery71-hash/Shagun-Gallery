// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Check, X } from "lucide-react";

// interface Feature {
//   name: string;
//   basic: boolean;
//   premium: boolean;
//   luxury: boolean;
// }

// const features: Feature[] = [
//   { name: "Free Shipping", basic: false, premium: true, luxury: true },
//   { name: "Easy Returns (30 days)", basic: true, premium: true, luxury: true },
//   { name: "Priority Support", basic: false, premium: true, luxury: true },
//   { name: "Exclusive Discounts", basic: false, premium: true, luxury: true },
//   { name: "Early Access to Sales", basic: false, premium: false, luxury: true },
//   { name: "Personal Stylist", basic: false, premium: false, luxury: true },
//   { name: "Gift Wrapping", basic: false, premium: true, luxury: true },
//   { name: "Loyalty Rewards", basic: false, premium: true, luxury: true },
// ];

// export default function ComparisonTable() {
//   return (
//     <section className="py-16 md:py-24 bg-gradient-to-b from-white to-pink-50">
//       <div className="container mx-auto px-4">
//         <div className="text-center max-w-2xl mx-auto mb-12">
//           <h2 className="text-3xl md:text-4xl font-bold mb-4">
//             Choose Your Experience
//           </h2>
//           <p className="text-muted-foreground text-lg">
//             Select the membership tier that best fits your style
//           </p>
//         </div>

//         <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
//           {/* Basic */}
//           <Card className="border-pink-100">
//             <CardHeader className="text-center pb-8">
//               <CardTitle className="text-2xl mb-2">Basic</CardTitle>
//               <div className="text-4xl font-bold mb-2">Free</div>
//               <p className="text-muted-foreground">Perfect for casual shoppers</p>
//             </CardHeader>
//             <CardContent>
//               <ul className="space-y-3 mb-6">
//                 {features.map((feature, index) => (
//                   <li key={index} className="flex items-center gap-2">
//                     {feature.basic ? (
//                       <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
//                     ) : (
//                       <X className="h-5 w-5 text-gray-300 flex-shrink-0" />
//                     )}
//                     <span className={feature.basic ? "" : "text-muted-foreground"}>
//                       {feature.name}
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//               <Button variant="outline" className="w-full">
//                 Current Plan
//               </Button>
//             </CardContent>
//           </Card>

//           {/* Premium */}
//           <Card className="border-pink-500 border-2 relative">
//             <div className="absolute -top-4 left-1/2 -translate-x-1/2">
//               <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1 rounded-full text-sm font-medium">
//                 Most Popular
//               </span>
//             </div>
//             <CardHeader className="text-center pb-8">
//               <CardTitle className="text-2xl mb-2">Premium</CardTitle>
//               <div className="text-4xl font-bold mb-2">
//                 $9.99<span className="text-lg text-muted-foreground">/mo</span>
//               </div>
//               <p className="text-muted-foreground">For fashion enthusiasts</p>
//             </CardHeader>
//             <CardContent>
//               <ul className="space-y-3 mb-6">
//                 {features.map((feature, index) => (
//                   <li key={index} className="flex items-center gap-2">
//                     {feature.premium ? (
//                       <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
//                     ) : (
//                       <X className="h-5 w-5 text-gray-300 flex-shrink-0" />
//                     )}
//                     <span className={feature.premium ? "" : "text-muted-foreground"}>
//                       {feature.name}
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//               <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500">
//                 Upgrade Now
//               </Button>
//             </CardContent>
//           </Card>

//           {/* Luxury */}
//           <Card className="border-pink-100">
//             <CardHeader className="text-center pb-8">
//               <CardTitle className="text-2xl mb-2">Luxury</CardTitle>
//               <div className="text-4xl font-bold mb-2">
//                 $29.99<span className="text-lg text-muted-foreground">/mo</span>
//               </div>
//               <p className="text-muted-foreground">Ultimate VIP experience</p>
//             </CardHeader>
//             <CardContent>
//               <ul className="space-y-3 mb-6">
//                 {features.map((feature, index) => (
//                   <li key={index} className="flex items-center gap-2">
//                     {feature.luxury ? (
//                       <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
//                     ) : (
//                       <X className="h-5 w-5 text-gray-300 flex-shrink-0" />
//                     )}
//                     <span className={feature.luxury ? "" : "text-muted-foreground"}>
//                       {feature.name}
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//               <Button variant="outline" className="w-full">
//                 Upgrade Now
//               </Button>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </section>
//   );
// }