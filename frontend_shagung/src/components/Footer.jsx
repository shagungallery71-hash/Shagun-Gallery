import { Link } from 'react-router-dom'
import { Instagram, Facebook, Mail, Phone, MapPin, ArrowRight } from 'lucide-react'

const footerLinks = {
  shop: [
    { label: 'New Arrivals', href: '/products?filter=new' },
    { label: 'Best Sellers', href: '/products?filter=bestseller' },
    { label: 'Sale', href: '/sale' },
    { label: 'Ethnic Wear', href: '/products?category=ethnic' },
    { label: 'Western Wear', href: '/products?category=western' },
  ],
  support: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Shipping Info', href: '/shipping' },
    { label: 'Returns & Exchanges', href: '/returns' },
    { label: 'Size Guide', href: '/size-guide' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Story', href: '/story' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blogs', href: '/blogs' },
    { label: 'Sustainability', href: '/sustainability' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
}

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/shagungallery', label: 'Instagram' },
  { icon: Facebook, href: 'https://www.facebook.com/ShagunGallery', label: 'Facebook' },
]

export default function Footer() {
  return (
    <footer className="bg-black text-white relative overflow-hidden">
      <div className="container mx-auto px-6 py-12 md:py-24 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand Info & Contact */}
          <div className="lg:col-span-4 lg:pr-12">
            <Link to="/" className="inline-block mb-6 md:mb-8">
              <img 
                 src="https://res.cloudinary.com/dsgktwwae/image/upload/v1773397047/WhatsApp_Image_2026-03-13_at_11.39.26_wepbgx.jpg" 
                 alt="Shagun Gallery" 
                 className="h-10 md:h-14 object-contain opacity-90 hover:opacity-100 transition-opacity rounded-md border border-white/10"
              />
            </Link>
            <p className="text-neutral-400 text-xs md:text-sm font-light mb-8 leading-relaxed max-w-md">
              Crafting timeless elegance with contemporary designs. Your premier destination for luxury ethnic and fusion wear.
            </p>

            <div className="space-y-3 text-[10px] md:text-xs tracking-[0.15em] md:tracking-widest uppercase font-light text-neutral-400">
              <a href="mailto:shagungallery71@gmail.com" className="flex items-center gap-3 hover:text-white transition-colors">
                <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" strokeWidth={1} />
                shagungallery71@gmail.com
              </a>
              <a href="tel:+918587098161" className="flex items-center gap-3 hover:text-white transition-colors">
                <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" strokeWidth={1} />
                +91 85870 98161
              </a>
              <div className="flex items-start gap-3 pt-1">
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 mt-0.5 md:mt-1" strokeWidth={1} />
                <span className="leading-relaxed">K-316/5, First Floor, Lado Sarai,<br />Near Shiv Mandir, New Delhi - 110030</span>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8 md:mt-10">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 md:w-12 md:h-12 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white transition-colors"
                >
                  <social.icon className="h-4 w-4 md:h-5 md:w-5" strokeWidth={1} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 lg:gap-8 overflow-hidden">
            {/* Shop Links */}
            <div>
              <h3 className="text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase text-white mb-5 md:mb-8 border-b border-neutral-800 pb-3 md:pb-4 inline-block w-full">Shop</h3>
              <ul className="space-y-3 md:space-y-4">
                {footerLinks.shop.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[10px] md:text-xs uppercase tracking-widest font-light text-neutral-400 hover:text-white transition-colors flex items-center gap-2 group w-fit"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:block" strokeWidth={1} />
                      <span className="md:-translate-x-5 md:group-hover:translate-x-0 transition-transform duration-300">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase text-white mb-5 md:mb-8 border-b border-neutral-800 pb-3 md:pb-4 inline-block w-full">Support</h3>
              <ul className="space-y-3 md:space-y-4">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[10px] md:text-xs uppercase tracking-widest font-light text-neutral-400 hover:text-white transition-colors flex items-center gap-2 group w-fit"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:block" strokeWidth={1} />
                      <span className="md:-translate-x-5 md:group-hover:translate-x-0 transition-transform duration-300">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase text-white mb-5 md:mb-8 border-b border-neutral-800 pb-3 md:pb-4 inline-block w-full">Company</h3>
              <ul className="space-y-3 md:space-y-4">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[10px] md:text-xs uppercase tracking-widest font-light text-neutral-400 hover:text-white transition-colors flex items-center gap-2 group w-fit"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:block" strokeWidth={1} />
                      <span className="md:-translate-x-5 md:group-hover:translate-x-0 transition-transform duration-300">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800 py-8 lg:py-6 pb-safe lg:pb-6">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4 text-[9px] md:text-[10px] uppercase font-light tracking-[0.15em] text-neutral-500">
            <p className="text-center lg:text-left order-2 lg:order-1">
              © {new Date().getFullYear()} Shagun Gallery. All Rights Reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 order-1 lg:order-2">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="hover:text-white transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
