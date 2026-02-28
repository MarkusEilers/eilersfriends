"use client";

import HeroSection from "@/components/sections/hero-section";
import LogoMarquee from "@/components/sections/logo-marquee";
import ProblemSection from "@/components/sections/problem-section";
import FrameworkSection from "@/components/sections/framework-section";
import SalesMadeSection from "@/components/sections/salesmade-section";
import BeliefsSection from "@/components/sections/beliefs-section";
import OffersSection from "@/components/sections/offers-section";
import TestimonialsSection from "@/components/sections/testimonials-section";
import GrowthCalculator from "@/components/sections/growth-calculator";
import NewsletterSection from "@/components/sections/newsletter-section";

export default function Home() {
  return (
    <>
      <div id="hero">
        <HeroSection />
      </div>
      <LogoMarquee />
      <ProblemSection />
      <div id="team">
        <FrameworkSection />
      </div>
      <SalesMadeSection />
      <div id="results" />
      <div id="resources">
        <BeliefsSection />
      </div>
      <div id="programs">
        <OffersSection />
      </div>
      <TestimonialsSection />
      <GrowthCalculator />
      <NewsletterSection />
    </>
  );
}
