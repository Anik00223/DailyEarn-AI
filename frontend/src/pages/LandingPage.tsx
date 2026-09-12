import React, { useState, useMemo } from 'react';
import { HeroSection } from '../components/sections/HeroSection';
import { ScrollStorytellingSection } from '../components/sections/ScrollStorytellingSection';
import { IdeaPreviewSection } from '../components/sections/IdeaPreviewSection';
import { CitySection } from '../components/sections/CitySection';
import { StatsSection } from '../components/sections/StatsSection';
import { CTASection } from '../components/sections/CTASection';
import { getDeterministicCalculation } from '../components/sections/DailyEarnCockpit';

export function LandingPage() {
  // Shared interactive state across the landing page experience
  const [selectedCity, setSelectedCity] = useState('Silchar');
  const [selectedSkill, setSelectedSkill] = useState<'Teaching' | 'Delivery' | 'Digital'>('Teaching');
  const [selectedHours, setSelectedHours] = useState<number>(4);
  const [targetIncome, setTargetIncome] = useState<number>(800);

  // Deterministic calculation model shared by Hero and Scroll Story Theater
  const calculation = useMemo(() => {
    return getDeterministicCalculation(selectedCity, selectedSkill, selectedHours, targetIncome);
  }, [selectedCity, selectedSkill, selectedHours, targetIncome]);

  return (
    <main style={{ background: '#05070A', minHeight: '100vh', overflowX: 'hidden' }}>
      <HeroSection
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        selectedSkill={selectedSkill}
        onSelectSkill={setSelectedSkill}
        selectedHours={selectedHours}
        onSelectHours={setSelectedHours}
        targetIncome={targetIncome}
        onSelectTarget={setTargetIncome}
        calculation={calculation}
      />
      <ScrollStorytellingSection
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        selectedSkill={selectedSkill}
        onSelectSkill={setSelectedSkill}
        selectedHours={selectedHours}
        onSelectHours={setSelectedHours}
        targetIncome={targetIncome}
        onSelectTarget={setTargetIncome}
        calculation={calculation}
      />
      <IdeaPreviewSection />
      <CitySection />
      <StatsSection />
      <CTASection />
    </main>
  );
}
