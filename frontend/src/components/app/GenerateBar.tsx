import { useState, useMemo } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { GenerateIdeasInput } from '../../types/api.types';

const PRESET_SKILLS = ['Typing', 'Cooking', 'Teaching', 'Driving', 'Stitching', 'Coding', 'Photography', 'Tailoring', 'Selling', 'Tutoring'];
const LANGUAGES = [
  { value: 'en' as const, label: 'English' },
  { value: 'hi' as const, label: 'हिंदी' },
  { value: 'bn' as const, label: 'বাংলা' },
  { value: 'te' as const, label: 'తెలుగు' },
  { value: 'ta' as const, label: 'தமிழ்' },
  { value: 'mr' as const, label: 'मराठी' },
];

interface GenerateBarProps {
  onGenerate: (params: GenerateIdeasInput) => void;
  isGenerating: boolean;
  generationsLeft: number;
}

export function GenerateBar({ onGenerate, isGenerating, generationsLeft }: GenerateBarProps) {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(500);
  const [language, setLanguage] = useState<'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr'>('en');
  const [cooldown, setCooldown] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : prev.length < 5 ? [...prev, skill] : prev
    );
  };

  const handleGenerate = () => {
    if (!city || selectedSkills.length === 0 || isGenerating || cooldown || generationsLeft <= 0) return;
    onGenerate({ city, state: state || city, skills: selectedSkills, dailyGoal, language, count: 5 });
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(5, 5, 8, 0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--accent-border)', padding: '16px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Row 1: City + State + Goal + Language */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city (e.g., Silchar)" style={{ flex: '1 1 180px', minWidth: 150, fontSize: '0.9rem' }} />
          <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" style={{ flex: '1 1 140px', minWidth: 120, fontSize: '0.9rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 180px' }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Goal: {formatINR(dailyGoal)}</span>
            <input type="range" min={200} max={5000} step={100} value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
          </div>
          <select value={language} onChange={(e) => setLanguage(e.target.value as typeof language)} style={{ padding: '10px 12px', fontSize: '0.85rem', minWidth: 100 }}>
            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        {/* Row 2: Skills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {PRESET_SKILLS.map((skill) => {
            const active = selectedSkills.includes(skill);
            return (
              <button key={skill} onClick={() => toggleSkill(skill)} style={{ padding: '6px 14px', borderRadius: 50, fontSize: '0.8rem', fontFamily: 'var(--font-label)', border: `1px solid ${active ? 'var(--accent-border-h)' : 'var(--accent-border)'}`, background: active ? 'var(--accent-glow)' : 'transparent', color: active ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                {skill}
              </button>
            );
          })}
          {/* Generate button */}
          <button onClick={handleGenerate} disabled={isGenerating || cooldown || !city || selectedSkills.length === 0 || generationsLeft <= 0} style={{ marginLeft: 'auto', padding: '10px 24px', borderRadius: 50, fontSize: '0.85rem', fontFamily: 'var(--font-display)', fontWeight: 700, background: (isGenerating || cooldown || generationsLeft <= 0) ? 'var(--bg-elevated)' : 'var(--accent)', color: (isGenerating || cooldown || generationsLeft <= 0) ? 'var(--text-muted)' : '#000', cursor: (isGenerating || cooldown || generationsLeft <= 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, border: 'none', transition: 'all 0.3s' }}>
            {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Thinking...</> : <><Sparkles size={16} /> Generate Ideas</>}
          </button>
          {/* Counter */}
          <span style={{ fontSize: '0.75rem', color: generationsLeft <= 2 ? 'var(--danger)' : 'var(--text-muted)', fontFamily: 'var(--font-label)', whiteSpace: 'nowrap' }}>
            {generationsLeft > 0 ? `${generationsLeft} left today` : 'Limit reached'}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatINR(n: number) { return `₹${n.toLocaleString('en-IN')}`; }
