"use client";
import { useTranslations, useLocale } from 'next-intl';

const logos = [
  { src: '/logos/amazon.png', alt: 'Amazon', name: 'Amazon' },
  { src: '/logos/wsj.png', alt: 'The Wall Street Journal', name: 'WSJ' },
  { src: '/logos/izf.png', alt: 'Initiative Zukunftsfähige Führung', name: 'IZF' },
  { src: '/logos/microsoft.png', alt: 'Microsoft', name: 'Microsoft' },
  { src: '/logos/barnes-noble.png', alt: 'Barnes & Noble', name: 'Barnes & Noble' },
  { src: '/images/logos/usa-today.png', alt: 'USA Today', name: 'USA Today' },
];

export default function LogoMarquee() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="py-12 bg-background border-y border-border/30 overflow-hidden">
      <div className="container mb-8">
        <p className="text-center text-sm text-muted-foreground font-medium">
          {t('hero.social_proof')}
        </p>
      </div>
      
      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient Fade Left */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        
        {/* Gradient Fade Right */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling Logos - CSS Animation for smoother performance */}
        <div className="flex animate-marquee">
          {/* First set */}
          <div className="flex items-center gap-16 shrink-0 px-8">
            {logos.map((logo, index) => (
              <div
                key={`first-${logo.name}-${index}`}
                className="flex-shrink-0 group cursor-pointer"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-12 md:h-14 w-auto object-contain transition-all duration-300 
                    grayscale opacity-60 
                    group-hover:grayscale-0 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
          {/* Second set (duplicate for seamless loop) */}
          <div className="flex items-center gap-16 shrink-0 px-8">
            {logos.map((logo, index) => (
              <div
                key={`second-${logo.name}-${index}`}
                className="flex-shrink-0 group cursor-pointer"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-12 md:h-14 w-auto object-contain transition-all duration-300 
                    grayscale opacity-60 
                    group-hover:grayscale-0 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
          {/* Third set for extra smoothness */}
          <div className="flex items-center gap-16 shrink-0 px-8">
            {logos.map((logo, index) => (
              <div
                key={`third-${logo.name}-${index}`}
                className="flex-shrink-0 group cursor-pointer"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-12 md:h-14 w-auto object-contain transition-all duration-300 
                    grayscale opacity-60 
                    group-hover:grayscale-0 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          will-change: transform;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
