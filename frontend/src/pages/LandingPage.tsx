import { CinematicFilm } from '../components/cinematic/CinematicFilm';
import { CTASection } from '../components/sections/CTASection';

export function LandingPage() {
  return (
    <main style={{ background: '#04060a', minHeight: '100vh', overflowX: 'hidden' }}>
      <CinematicFilm />
      <CTASection />
    </main>
  );
}
