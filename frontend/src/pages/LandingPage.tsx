import { HeroSection } from '../components/sections/HeroSection';
import { HowItWorksSection } from '../components/sections/HowItWorksSection';
import { IdeaPreviewSection } from '../components/sections/IdeaPreviewSection';
import { CitySection } from '../components/sections/CitySection';
import { StatsSection } from '../components/sections/StatsSection';
import { CTASection } from '../components/sections/CTASection';

export function LandingPage() {
  return (
    <main>
      <HeroSection />
      <HowItWorksSection />
      <IdeaPreviewSection />
      <CitySection />
      <StatsSection />
      <CTASection />
    </main>
  );
}
