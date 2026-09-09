import { useState, useMemo } from 'react';
import { X, Sliders } from 'lucide-react';
import type { EvaluatedOpportunity } from '../../types/decision.types';
import { formatINR } from '../../utils/formatCurrency';

interface IncomeSimulatorModalProps {
  item: EvaluatedOpportunity;
  onClose: () => void;
  targetDailyIncome?: number;
}

export function IncomeSimulatorModal({ item, onClose, targetDailyIncome = 600 }: IncomeSimulatorModalProps) {
  const opp = item.opportunity;
  const initialFin = item.financials;

  const [hours, setHours] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(6);
  const [pricePerUnit, setPricePerUnit] = useState(initialFin.payoutPerUnit || opp.estimatedPayoutMin);
  const [unitsPerHour, setUnitsPerHour] = useState(opp.unitsPerHourTypical || 1.5);
  
  // Dynamic fuel controls for vehicle-dependent gigs
  const [useDynamicFuel, setUseDynamicFuel] = useState(opp.requiresVehicle);
  const [distanceKm, setDistanceKm] = useState(20);
  const [mileageKmPerLiter, setMileageKmPerLiter] = useState(45);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(102);
  const [manualTravelCost, setManualTravelCost] = useState(initialFin.travelCost || 0);

  const [platformFeePercent, setPlatformFeePercent] = useState(opp.platformFeePercent || 0);
  const [materialCost, setMaterialCost] = useState(initialFin.materialCost || 0);

  // Real-time client-side deterministic arithmetic
  const sim = useMemo(() => {
    const expectedUnitsPerDay = Math.max(1, Math.round(hours * unitsPerHour * 10) / 10);
    const grossDaily = Math.round(expectedUnitsPerDay * pricePerUnit);
    const platformFee = Math.round(grossDaily * (platformFeePercent / 100));

    // Dynamic fuel calculation: (distance / mileage) * fuelPrice
    const calculatedTravel = useDynamicFuel
      ? Math.round((distanceKm / Math.max(1, mileageKmPerLiter)) * fuelPricePerLiter)
      : manualTravelCost;

    const netDaily = Math.max(0, grossDaily - platformFee - calculatedTravel - materialCost);
    const netWeekly = netDaily * daysPerWeek;
    const netMonthly = Math.round(netDaily * daysPerWeek * 4.33);
    const grossWeekly = grossDaily * daysPerWeek;
    const grossMonthly = Math.round(grossDaily * daysPerWeek * 4.33);

    const targetGap = Math.max(0, targetDailyIncome - netDaily);
    const percentage = targetDailyIncome > 0 ? Math.min(100, Math.round((netDaily / targetDailyIncome) * 100)) : 100;

    return {
      expectedUnitsPerDay,
      grossDaily,
      grossWeekly,
      grossMonthly,
      platformFee,
      calculatedTravel,
      netDaily,
      netWeekly,
      netMonthly,
      targetGap,
      percentage,
      rangeLow: Math.round(netDaily * 0.85),
      rangeHigh: Math.round(netDaily * 1.20),
    };
  }, [
    hours,
    daysPerWeek,
    pricePerUnit,
    unitsPerHour,
    useDynamicFuel,
    distanceKm,
    mileageKmPerLiter,
    fuelPricePerLiter,
    manualTravelCost,
    platformFeePercent,
    materialCost,
    targetDailyIncome,
  ]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        background: 'rgba(2, 6, 9, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="obsidian-card"
        style={{
          borderRadius: 24,
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 32,
          border: '1px solid rgba(0, 242, 254, 0.22)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 242, 254, 0.08)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 6,
              }}
            >
              // CALIBRATION ENGINE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sliders size={20} color="var(--accent)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Income Simulator
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-label)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(0, 242, 254, 0.1)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                }}
              >
                DETERMINISTIC
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '0 0 20px', lineHeight: 1.5 }}>
          Simulating <strong style={{ color: '#fff' }}>{opp.opportunityName}</strong> ({opp.platform}). Deterministic arithmetic engine with live vehicle mileage and fuel recalculations.
        </p>

        {/* Live Output Banner */}
        <div
          style={{
            background: 'rgba(6, 24, 34, 0.8)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-label)', letterSpacing: '0.12em' }}>
              Projected Net Daily
            </span>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.2rem',
                fontWeight: 800,
                color: 'var(--accent)',
                textShadow: '0 0 25px rgba(0, 242, 254, 0.35)',
                margin: '2px 0',
              }}
            >
              {formatINR(sim.netDaily)}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}> / day</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Gross: {formatINR(sim.grossDaily)} | Deductions: {formatINR(sim.platformFee + sim.calculatedTravel + materialCost)}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: 3 }}>
              Weekly ({daysPerWeek}d): <strong style={{ color: 'var(--accent)' }}>{formatINR(sim.netWeekly)}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: 4 }}>
              Monthly (~{daysPerWeek * 4.33 | 0}d): <strong style={{ color: 'var(--accent)' }}>{formatINR(sim.netMonthly)}</strong>
            </div>
            {sim.targetGap > 0 ? (
              <span style={{ fontSize: '0.76rem', color: '#FFAA00', fontFamily: 'var(--font-label)' }}>
                Gap to ₹{targetDailyIncome} goal: −{formatINR(sim.targetGap)}
              </span>
            ) : (
              <span style={{ fontSize: '0.76rem', color: 'var(--accent)', fontFamily: 'var(--font-label)' }}>
                ✓ Target achieved ({sim.percentage}%)
              </span>
            )}
          </div>
        </div>

        {/* Parameter Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Daily Hours */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Available Daily Hours:</span>
              <b style={{ color: 'var(--accent)', fontFamily: 'var(--font-label)' }}>{hours} hrs / day</b>
            </div>
            <input
              type="range"
              min={1}
              max={12}
              step={0.5}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Days Per Week */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Working Days / Week:</span>
              <b style={{ color: '#fff', fontFamily: 'var(--font-label)' }}>{daysPerWeek} days</b>
            </div>
            <input
              type="range"
              min={1}
              max={7}
              step={1}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Unit Payout */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payout per {initialFin.unitName.slice(0, -1) || 'unit'}:</span>
              <b style={{ color: 'var(--accent)', fontFamily: 'var(--font-label)' }}>₹{pricePerUnit}</b>
            </div>
            <input
              type="range"
              min={Math.round(opp.estimatedPayoutMin * 0.7)}
              max={Math.round(opp.estimatedPayoutMax * 1.5)}
              step={5}
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Units completed per hour */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Throughput ({initialFin.unitName}/hour):</span>
              <b style={{ color: 'var(--accent)', fontFamily: 'var(--font-label)' }}>{unitsPerHour}</b>
            </div>
            <input
              type="range"
              min={0.3}
              max={4}
              step={0.1}
              value={unitsPerHour}
              onChange={(e) => setUnitsPerHour(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Dynamic Fuel Calculation (Phase 4) */}
          {opp.requiresVehicle ? (
            <div style={{ background: 'rgba(6, 18, 26, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFAA00' }}>
                  Dynamic Fuel Equation: ({distanceKm}km ÷ {mileageKmPerLiter}km/L) × ₹{fuelPricePerLiter}/L = ₹{sim.calculatedTravel}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: '0.75rem' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)' }}>Distance: {distanceKm} km</label>
                  <input
                    type="range"
                    min={5}
                    max={80}
                    step={2}
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#FFAA00' }}
                  />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)' }}>Mileage: {mileageKmPerLiter} km/L</label>
                  <input
                    type="range"
                    min={25}
                    max={65}
                    step={1}
                    value={mileageKmPerLiter}
                    onChange={(e) => setMileageKmPerLiter(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#FFAA00' }}
                  />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)' }}>Fuel: ₹{fuelPricePerLiter}/L</label>
                  <input
                    type="range"
                    min={90}
                    max={120}
                    step={1}
                    value={fuelPricePerLiter}
                    onChange={(e) => setFuelPricePerLiter(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#FFAA00' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Daily Commute / Transit:</span>
                <b style={{ color: '#FFAA00', fontFamily: 'var(--font-label)' }}>₹{manualTravelCost} / day</b>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                value={manualTravelCost}
                onChange={(e) => setManualTravelCost(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#FFAA00' }}
              />
            </div>
          )}

          {/* Platform fee percent */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Platform Commission:</span>
              <b style={{ color: 'var(--danger)', fontFamily: 'var(--font-label)' }}>{platformFeePercent}%</b>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={platformFeePercent}
              onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--danger)' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            className="btn-cyan-pill"
            style={{
              padding: '12px 28px',
              fontSize: '0.82rem',
              borderRadius: 50,
            }}
          >
            APPLY & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
