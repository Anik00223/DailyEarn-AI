import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, MapPin, Clock, Wallet, Bike, ShieldCheck, HelpCircle } from 'lucide-react';
import type { UserConstraints } from '../../types/decision.types';
import api from '../../api/client';
import { useDecisionStore } from '../../store/decisionStore';

const PRESET_SKILLS = [
  'Teaching',
  'Driving',
  'Cooking',
  'Tailoring',
  'Selling',
  'Typing',
  'Services',
  'Photography',
  'Design',
  'Coding',
];

const LANGUAGES = [
  { value: 'en' as const, label: 'English' },
  { value: 'hi' as const, label: 'हिंदी' },
  { value: 'bn' as const, label: 'বাংলা' },
  { value: 'te' as const, label: 'తెలుగు' },
  { value: 'ta' as const, label: 'தமிழ்' },
  { value: 'mr' as const, label: 'मराठी' },
];

const CAPITAL_OPTIONS = [
  { label: '₹0 (Zero Capital)', value: 0 },
  { label: '₹500', value: 500 },
  { label: '₹2,000', value: 2000 },
  { label: '₹5,000+', value: 5000 },
];

interface GenerateBarProps {
  onEvaluate: (constraints: UserConstraints) => void;
  isEvaluating: boolean;
  initialConstraints?: Partial<UserConstraints>;
}

export function GenerateBar({ onEvaluate, isEvaluating, initialConstraints }: GenerateBarProps) {
  const [city, setCity] = useState(initialConstraints?.city || '');
  const [state, setState] = useState(initialConstraints?.state || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialConstraints?.skills || ['Teaching']);
  const [dailyGoal, setDailyGoal] = useState(initialConstraints?.targetDailyIncome || 600);
  const [availableHours, setAvailableHours] = useState(initialConstraints?.availableHoursPerDay || 4);
  const [capital, setCapital] = useState(initialConstraints?.availableCapital || 0);
  const [hasVehicle, setHasVehicle] = useState(initialConstraints?.hasVehicle || false);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>(
    initialConstraints?.experienceLevel || 'beginner'
  );
  const [language, setLanguage] = useState<'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr'>(
    initialConstraints?.language || 'en'
  );

  // Sync if initialConstraints changes (e.g. via competition demo click)
  useEffect(() => {
    if (initialConstraints) {
      if (initialConstraints.city) setCity(initialConstraints.city);
      if (initialConstraints.state) setState(initialConstraints.state);
      if (initialConstraints.skills) setSelectedSkills(initialConstraints.skills);
      if (initialConstraints.targetDailyIncome) setDailyGoal(initialConstraints.targetDailyIncome);
      if (initialConstraints.availableHoursPerDay !== undefined) setAvailableHours(initialConstraints.availableHoursPerDay);
      if (initialConstraints.availableCapital !== undefined) setCapital(initialConstraints.availableCapital);
      if (initialConstraints.hasVehicle !== undefined) setHasVehicle(initialConstraints.hasVehicle);
      if (initialConstraints.experienceLevel) setExperience(initialConstraints.experienceLevel);
    }
  }, [initialConstraints]);

  // Geocoding suggestions state
  const [suggestions, setSuggestions] = useState<{ city: string; state: string; display: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { setTrustCenterOpen } = useDecisionStore();

  // Debounced geocoding search
  useEffect(() => {
    if (city.length < 2) {
      setSuggestions([]);
      return;
    }

    const isExactMatch = suggestions.some((s) => s.city.toLowerCase() === city.toLowerCase());
    if (isExactMatch) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get(`/locations/search?q=${encodeURIComponent(city)}`);
        if (data.success) {
          setSuggestions(data.data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Failed to search locations:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [city]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : prev.length < 5 ? [...prev, skill] : prev
    );
  };

  const handleEvaluate = () => {
    if (!city || selectedSkills.length === 0 || isEvaluating) return;
    onEvaluate({
      city,
      state: state || city,
      skills: selectedSkills,
      targetDailyIncome: dailyGoal,
      availableHoursPerDay: availableHours,
      availableCapital: capital,
      hasVehicle,
      experienceLevel: experience,
      language,
    });
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(5, 5, 8, 0.94)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--accent-border)',
        padding: '16px 24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* ROW 1: City + Target Goal + Available Hours + Language */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* City Autocomplete Input */}
          <div ref={containerRef} style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="City (e.g. Silchar, Indore)"
                style={{ width: '100%', fontSize: '0.9rem', paddingRight: isSearching ? 40 : 16 }}
              />
              {isSearching && (
                <Loader2
                  size={16}
                  className="animate-spin"
                  style={{ position: 'absolute', right: 12, color: 'var(--text-secondary)' }}
                />
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <ul
                className="glass"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  maxHeight: 220,
                  overflowY: 'auto',
                  zIndex: 100,
                  padding: '6px 0',
                  boxShadow: 'var(--glow-card)',
                  listStyle: 'none',
                }}
              >
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setCity(s.city);
                      setState(s.state);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background 0.2s',
                    }}
                  >
                    <MapPin size={14} style={{ color: 'var(--accent)' }} />
                    <span>{s.display}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
            style={{ flex: '1 1 120px', minWidth: 100, fontSize: '0.9rem' }}
          />

          {/* Goal Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 190px' }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              Goal: <b style={{ color: '#fff' }}>₹{dailyGoal}</b>
            </span>
            <input
              type="range"
              min={200}
              max={5000}
              step={100}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Available Hours Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 180px' }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              Time: <b style={{ color: 'var(--accent)' }}>{availableHours}h/day</b>
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={availableHours}
              onChange={(e) => setAvailableHours(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            style={{ padding: '10px 12px', fontSize: '0.85rem', minWidth: 95 }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* ROW 2: Constraints (Capital, Vehicle, Experience) */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem' }}>
          {/* Capital Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Wallet size={13} /> Capital:
            </span>
            {CAPITAL_OPTIONS.map((cap) => (
              <button
                key={cap.value}
                onClick={() => setCapital(cap.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  border: `1px solid ${capital === cap.value ? 'var(--accent)' : 'var(--accent-border)'}`,
                  background: capital === cap.value ? 'rgba(0,255,136,0.1)' : 'transparent',
                  color: capital === cap.value ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {cap.label}
              </button>
            ))}
          </div>

          {/* Vehicle Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Bike size={13} /> Transport:
            </span>
            <button
              onClick={() => setHasVehicle(false)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: '0.75rem',
                border: `1px solid ${!hasVehicle ? 'var(--accent)' : 'var(--accent-border)'}`,
                background: !hasVehicle ? 'rgba(0,255,136,0.1)' : 'transparent',
                color: !hasVehicle ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Walking / Bus
            </button>
            <button
              onClick={() => setHasVehicle(true)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: '0.75rem',
                border: `1px solid ${hasVehicle ? 'var(--accent)' : 'var(--accent-border)'}`,
                background: hasVehicle ? 'rgba(0,255,136,0.1)' : 'transparent',
                color: hasVehicle ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Two-Wheeler
            </button>
          </div>

          {/* Experience level */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Experience:</span>
            {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setExperience(lvl)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  textTransform: 'capitalize',
                  border: `1px solid ${experience === lvl ? 'var(--accent)' : 'var(--accent-border)'}`,
                  background: experience === lvl ? 'rgba(0,255,136,0.1)' : 'transparent',
                  color: experience === lvl ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Trust Center Trigger */}
          <button
            onClick={() => setTrustCenterOpen(true)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ShieldCheck size={14} /> Trust & Methodology
          </button>
        </div>

        {/* ROW 3: Skills + Primary Decision CTA */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {PRESET_SKILLS.map((skill) => {
            const active = selectedSkills.includes(skill);
            return (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 50,
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-label)',
                  border: `1px solid ${active ? 'var(--accent-border-h)' : 'var(--accent-border)'}`,
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {skill}
              </button>
            );
          })}

          {/* Primary Evaluate & Decide button */}
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !city || selectedSkills.length === 0}
            style={{
              marginLeft: 'auto',
              padding: '10px 24px',
              borderRadius: 50,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              background: isEvaluating || !city || selectedSkills.length === 0 ? 'var(--bg-elevated)' : 'var(--accent)',
              color: isEvaluating || !city || selectedSkills.length === 0 ? 'var(--text-muted)' : '#000',
              cursor: isEvaluating || !city || selectedSkills.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              transition: 'all 0.3s',
            }}
          >
            {isEvaluating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Evaluating Constraints...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Evaluate Decision
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
