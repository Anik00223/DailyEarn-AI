import { useMemo, useState } from 'react';
import gsap from 'gsap';
import {
  useCineScope,
  useReducedMotion,
  registerCineEase,
} from '../../hooks/useCinematicScroll';
import { AtmosphereLayer } from './AtmosphereLayer';
import { OversizedType } from './OversizedType';
import { IndiaIntelligenceMap } from './IndiaIntelligenceMap';
import {
  ControlsPanel,
  MoneyModelPanel,
  FeasibilityGauge,
  OpportunityPaths,
  RoadmapStage,
  formatINR,
  type Skill,
  type OpportunityRow,
} from './filmInstruments';
import {
  getDeterministicCalculation,
  calculateCityNet,
} from '../sections/DailyEarnCockpit';
import { useFilmViewport } from './useFilmViewport';

/**
 * CINEMATIC SCROLL FILM — "Hyper-Local Income Intelligence".
 * One pinned frame, five morphing stages, a single scrubbed GSAP timeline.
 * Every financial value comes from the deterministic engines — never invented.
 */

const PEER_CITIES = ['Kolkata', 'Patna', 'Kota', 'Guwahati', 'Silchar', 'Delhi', 'Bengaluru'];

export function CinematicFilm() {
  const [city, setCity] = useState('Pune');
  const [skill, setSkill] = useState<Skill>('Delivery');
  const [hours, setHours] = useState(4);
  const [target, setTarget] = useState(800);

  const reduced = useReducedMotion();
  const isCompact = useFilmViewport();
  const isStatic = reduced || isCompact;

  const calc = useMemo(
    () => getDeterministicCalculation(city, skill, hours, target),
    [city, skill, hours, target]
  );

  const ranked: OpportunityRow[] = useMemo(() => {
    return [
      { city, skill, net: calculateCityNet(city, skill, hours) },
      ...PEER_CITIES.filter((c) => c !== city).map((c) => ({
        city: c,
        skill,
        net: calculateCityNet(c, skill, hours),
      })),
    ].sort((a, b) => b.net - a.net);
  }, [city, skill, hours]);

  const rootRef = useCineScope(
    (scope, motionReduced) => {
      if (motionReduced || isCompact) return;
      registerCineEase();

      const q = gsap.utils.selector(scope);
      const anchorEl = q('[data-cine-count="net"]')[0] as HTMLElement | undefined;

      /* initial instrument states — only when JS drives the film */
      gsap.set(q('[data-cine-line]'), { yPercent: 110 });
      gsap.set(
        q('.cine-layer--map, .cine-layer--money, .cine-layer--paths, .cine-layer--action'),
        { autoAlpha: 0 }
      );

      const tl = gsap.timeline({
        defaults: { ease: 'cine' },
        scrollTrigger: {
          trigger: scope,
          start: 'top top',
          end: '+=420%',
          scrub: 1,
          pin: q('.cine-frame')[0] as HTMLElement,
          anticipatePin: 1,
        },
      });

      /* parallax depth — atmosphere drifts slowest across the whole film */
      tl.fromTo(q('.cine-atmos'), { yPercent: -4 }, { yPercent: 4, duration: 10, ease: 'none' }, 0);

      /* ── PHASE A · HERO (0–2.2) — typography becomes a physical object ── */
      tl.to(q('[data-cine-role="stage-intro"]'), { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.15);
      tl.to(q('[data-cine="controls"]'), { autoAlpha: 0, y: -46, duration: 0.8 }, 1.4);

      /* the anchor swells as it exits — it hands focus to the geography below */
      tl.to(q('[data-cine="anchor"]'), { scale: 1.06, duration: 0.9, ease: 'power1.in' }, 1.4);

      /* lines separate in depth while exiting: staggered rise + per-line x shear */
      tl.to(
        q('[data-cine-role="stage-intro"]'),
        {
          yPercent: (i: number) => -118 - i * 14,
          xPercent: (i: number) => (i % 2 === 0 ? 2.5 : -2.5),
          autoAlpha: 0,
          duration: 1.25,
          stagger: 0.1,
          ease: 'power1.in',
        },
        1.9
      );
      tl.to(q('[data-cine="anchor"]'), { yPercent: -165, autoAlpha: 0, scale: 1.02, duration: 1.0 }, 2.0);

      /* ── PHASE B · MAP EMERGENCE (1.7–3.7) — grows from behind the type ── */
      /* map starts scaling while typography is still visible above it */
      tl.fromTo(
        q('.cine-layer--map'),
        { autoAlpha: 0, scale: 0.86, yPercent: 7 },
        { autoAlpha: 1, scale: 1, yPercent: 0, duration: 2.0, ease: 'power1.out' },
        1.7
      );
      /* city nodes activate sequentially, rings echo after each core */
      tl.fromTo(
        q('.cine-map__node-core'),
        { scale: 0, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.14, ease: 'power2.out' },
        2.7
      );
      tl.fromTo(
        q('.cine-map__node-ring'),
        { scale: 0.4, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.7, stagger: 0.14, ease: 'power2.out' },
        2.85
      );
      /* intelligence paths begin drawing in sequence (opacity keeps the dash flow) */
      tl.fromTo(
        q('.cine-map__path'),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.8, stagger: 0.14, ease: 'power1.inout' },
        3.0
      );
      tl.fromTo(
        q('[data-cine-role="stage-market"]'),
        { yPercent: 115 },
        { yPercent: 0, duration: 1.1, stagger: 0.1 },
        2.6
      );

      /* ── PHASE C · MONEY MODEL (3.4–5.5) — data grows out of the map axis ── */
      tl.to(
        q('[data-cine-role="stage-market"]'),
        { yPercent: -125, autoAlpha: 0, scale: 0.97, duration: 0.9, stagger: 0.06 },
        3.4
      );
      /* map recedes but stays visible in the background at reduced depth */
      tl.to(q('.cine-layer--map'), { scale: 0.94, xPercent: -6, autoAlpha: 0.55, duration: 1.4 }, 3.6);
      /* money panel expands outward from a central signal axis (clip grows) */
      tl.fromTo(
        q('.cine-layer--money'),
        { autoAlpha: 0, y: 44, scale: 0.97, clipPath: 'inset(0% 47% 0% 47%)' },
        { autoAlpha: 1, y: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power2.out' },
        3.8
      );
      tl.fromTo(q('[data-cine-bar]'), { scaleX: 0 }, { scaleX: 1, duration: 1.0, stagger: 0.1 }, 4.2);

      if (anchorEl) {
        const counter = { v: 0 };
        tl.fromTo(
          counter,
          { v: 0 },
          {
            v: calc.net,
            duration: 1.2,
            ease: 'power1.out',
            onUpdate: () => {
              anchorEl.textContent = formatINR(counter.v);
            },
          },
          4.3
        );
      }

      /* ── PHASE D · OPPORTUNITY DISCOVERY (5.4–7.6) — branches from the money model ── */
      /* money model compresses and recedes — it does not vanish */
      tl.to(q('.cine-layer--money'), { autoAlpha: 0.32, scale: 0.94, y: -22, duration: 1.0 }, 5.4);
      tl.to(q('.cine-layer--map'), { scale: 1.0, xPercent: 3, autoAlpha: 0.4, duration: 1.2 }, 5.6);
      /* opportunity rows branch out from the compressed financial result */
      tl.fromTo(
        q('.cine-layer--paths'),
        { autoAlpha: 0, x: 88, clipPath: 'inset(0% 0% 0% 100%)' },
        { autoAlpha: 1, x: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power2.out' },
        5.6
      );
      tl.fromTo(
        q('[data-cine-path]'),
        { autoAlpha: 0, y: 30, x: 24 },
        { autoAlpha: 1, y: 0, x: 0, duration: 0.7, stagger: 0.09, ease: 'power2.out' },
        5.95
      );
      tl.fromTo(
        q('[data-cine="gauge"]'),
        { autoAlpha: 0, rotate: -6, scale: 0.92 },
        { autoAlpha: 1, rotate: 0, scale: 1, duration: 0.9, ease: 'power2.out' },
        6.15
      );

      /* ── PHASE E · NOW ACT (7.4–9.6) — the strongest transformation ── */
      /* opportunity list compresses toward the right as the call enters */
      tl.to(q('.cine-layer--paths'), { autoAlpha: 0, xPercent: 26, scale: 0.96, duration: 0.9, ease: 'power1.in' }, 7.4);
      tl.to(q('.cine-layer--map'), { autoAlpha: 0.28, scale: 1.04, duration: 1.0 }, 7.5);
      tl.fromTo(q('.cine-layer--action'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 7.7);
      /* oversized type enters from beyond the viewport — NOW first, ACT follows */
      tl.fromTo(
        q('[data-cine-role="stage-act"]'),
        { xPercent: 130, yPercent: 0 },
        { xPercent: 0, duration: 1.0, stagger: 0.35, ease: 'power2.out' },
        7.8
      );
      /* 7-day roadmap assembles behind the typography, columns reveal progressively */
      tl.fromTo(
        q('[data-cine-day]'),
        { autoAlpha: 0, y: 44 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.11, ease: 'power2.out' },
        8.3
      );
      tl.fromTo(
        q('[data-cine-day-bar]'),
        { scaleX: 0 },
        { scaleX: 1, duration: 0.55, stagger: 0.11, ease: 'power2.out' },
        8.45
      );
      tl.to({}, { duration: 1.1 }); /* closing hold */
    },
    [isCompact, city, skill, hours, target, calc.net]
  );

  /* deterministic, engine-derived gap composition (never invented) */
  const gapPct = Math.min(100, (calc.net / Math.max(1, target)) * 100);
  const gapColor = calc.feasible ? 'var(--sig-mint)' : 'var(--sig-amber)';

  return (
    <section
      ref={rootRef}
      className={`cine-film${isStatic ? ' cine-film--static' : ''}`}
      aria-label="DailyEarn hyper-local income intelligence"
    >
      <div className="cine-frame">
        {/* BACKGROUND — grain + slow atmospheric light */}
        <div className="cine-layer cine-layer--bg">
          <AtmosphereLayer />
        </div>

        {/* STAGE 1 — INPUT: "WHAT DO YOU WANT TO EARN?" */}
        <div className="cine-layer cine-layer--fg cine-stage cine-stage--input">
          <span className="cine-label cine-label--micro cine-t-cyan">
            DailyEarn · hyper-local income intelligence
          </span>
          <OversizedType
            as="h2"
            role="stage-intro"
            lines={['WHAT DO YOU', 'WANT TO EARN?']}
            scale="hero"
            accentLine={1}
          />
          <div className="cine-film__inputgrid">
            <div className="cine-panel" data-cine="controls">
              <ControlsPanel
                city={city}
                skill={skill}
                hours={hours}
                onCity={setCity}
                onSkill={setSkill}
                onHours={setHours}
              />
            </div>
            <div className="cine-anchor" data-cine="anchor">
              <span className="cine-label cine-label--micro">Daily income target</span>
              <span className="cine-anchor__value">₹{target.toLocaleString('en-IN')}</span>
              <span className="cine-label cine-label--micro cine-t-blue">
                the anchor every calculation is measured against
              </span>
            </div>
          </div>
        </div>

        {/* STAGE 2 — LOCAL INTELLIGENCE: the India map emerges */}
        <div className="cine-layer cine-layer--map">
          <IndiaIntelligenceMap
            activeCity={city}
            skill={skill}
            hours={hours}
            onSelectCity={setCity}
          />
          <div className="cine-map__caption">
            <OversizedType
              role="stage-market"
              lines={['THE MARKET AROUND YOU', 'MATTERS.']}
              scale="statement"
              tone="outline"
            />
          </div>
        </div>

        {/* STAGE 3 — MONEY MODEL: deterministic financial engine */}
        <div className="cine-layer cine-layer--money">
          <div className="cine-film__moneygrid">
            <div className="cine-panel">
              <MoneyModelPanel calc={calc} target={target} />
            </div>
            <div className="cine-panel cine-panel--accent cine-gap" data-cine="gap">
              <span className="cine-label cine-label--micro">Target gap</span>
              <div className="cine-gap__track">
                <div
                  className="cine-gap__earned"
                  style={{ width: `${gapPct}%`, background: `linear-gradient(90deg, transparent, ${gapColor})`, borderRight: `1px solid ${gapColor}` }}
                />
                <div className="cine-gap__target" style={{ right: 0 }} />
              </div>
              <span className="cine-label cine-label--micro" style={{ color: gapColor }}>
                {calc.feasible
                  ? `Target reachable — net ${formatINR(calc.net)} / day`
                  : `Short by ${formatINR(calc.gap)} / day at ${hours}h`}
              </span>
            </div>
          </div>
        </div>

        {/* STAGE 4 — OPPORTUNITY DISCOVERY */}
        <div className="cine-layer cine-layer--paths">
          <div className="cine-film__pathsgrid">
            <div className="cine-paths-col">
              <OversizedType
                role="stage-discover"
                lines={['OPPORTUNITY', 'DISCOVERY']}
                scale="display"
                accentLine={0}
                accentColor="var(--sig-violet)"
              />
              <OpportunityPaths rows={ranked} activeCity={city} onSelectCity={setCity} />
            </div>
            <div className="cine-panel cine-panel--accent cine-film__gaugehost">
              <FeasibilityGauge calc={calc} target={target} />
            </div>
          </div>
        </div>

        {/* STAGE 5 — ACTION: the 7-day roadmap */}
        <div className="cine-layer cine-layer--action">
          <div className="cine-film__actiongrid">
            <OversizedType
              role="stage-act"
              lines={['NOW', 'ACT.']}
              scale="hero"
              accentLine={1}
              accentColor="var(--sig-mint)"
            />
            <RoadmapStage calc={calc} city={city} />
          </div>
        </div>
      </div>
    </section>
  );
}
