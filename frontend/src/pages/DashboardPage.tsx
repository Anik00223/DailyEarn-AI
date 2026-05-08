import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useIdeasStore } from '../store/ideasStore';
import { GenerateBar } from '../components/app/GenerateBar';
import { IdeaCard } from '../components/app/IdeaCard';
import { Sparkles } from 'lucide-react';
import api from '../api/client';
import type { GenerateIdeasInput, ApiResponse, Idea } from '../types/api.types';

export function DashboardPage() {
  const { ideas, isGenerating, generationsToday, maxGenerations, setIdeas, addIdeas, setGenerating, incrementGenerations, dismissIdea: dismissFromStore, saveIdea: saveFromStore } = useIdeasStore();
  const cardsRef = useRef<HTMLDivElement>(null);

  // Load existing ideas on mount
  useEffect(() => {
    const loadIdeas = async () => {
      try {
        const { data } = await api.get<ApiResponse<{ ideas: Idea[]; total: number }>>('/ideas?page=1&limit=20');
        if (data.success) setIdeas(data.data.ideas);
      } catch { /* empty state is fine */ }
    };
    loadIdeas();
  }, [setIdeas]);

  const handleGenerate = async (params: GenerateIdeasInput) => {
    setGenerating(true);
    try {
      const { data } = await api.post<ApiResponse<Idea[]>>('/ideas/generate', params);
      if (data.success) {
        addIdeas(data.data);
        incrementGenerations();
        // Animate new cards
        if (cardsRef.current) {
          const newCards = cardsRef.current.querySelectorAll('[data-card]');
          gsap.fromTo(newCards, { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.1, ease: 'power3.out' });
        }
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (id: string) => {
    saveFromStore(id);
    try { await api.put(`/ideas/${id}/save`); } catch { saveFromStore(id); } // rollback on error
  };

  const handleDismiss = async (id: string) => {
    dismissFromStore(id);
    try { await api.put(`/ideas/${id}/dismiss`); } catch { /* already removed from UI */ }
  };

  return (
    <main style={{ paddingTop: 64, minHeight: '100vh' }}>
      <GenerateBar onGenerate={handleGenerate} isGenerating={isGenerating} generationsLeft={maxGenerations - generationsToday} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }} ref={cardsRef}>
        {ideas.length === 0 && !isGenerating && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <Sparkles size={48} color="var(--accent)" style={{ marginBottom: 16, opacity: 0.5 }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text-secondary)', marginBottom: 8 }}>No ideas yet</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enter your city and skills above to get started</p>
          </div>
        )}
        {isGenerating && ideas.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: 380, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {ideas.map((idea, index) => (
            <div key={idea.id} data-card>
              <IdeaCard idea={idea} onSave={handleSave} onDismiss={handleDismiss} index={index} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
