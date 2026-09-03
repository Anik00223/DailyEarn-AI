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
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
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
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sliders size={20} color="var(--accent)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#fff', margin: 0 }}>
              Live Earnings Simulator
            </h3>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(0,229,255,0.1)',
                color: '#00E5FF',
                border: '1px solid rgba(0,229,255,0.3)',
              }}
            >
              MODELLED
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 18px', lineHeight: 1.5 }}>
          Simulating <b>{opp.opportunityName}</b> ({opp.platform}). Deterministic arithmetic engine with live vehicle mileage and fuel recalculations.
        </p>

        {/* Live Output Banner */}
        <div
          style={{
            background: 'rgba(0, 255, 136, 0.06)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            borderRadius: 8,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-label)' }}>
              Projected Net Daily
            </span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
              {formatINR(sim.netDaily)}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}> / day</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Gross: {formatINR(sim.grossDaily)} | Deductions: {formatINR(sim.platformFee + sim.calculatedTravel + materialCost)}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.82rem', color: '#fff' }}>
              Weekly ({daysPerWeek}d): <b>{formatINR(sim.netWeekly)}</b>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#fff' }}>
              Monthly (~{daysPerWeek * 4.33 | 0}d): <b>{formatINR(sim.netMonthly)}</b>
            </div>
            {sim.targetGap > 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#FFAA00' }}>
                Gap to ₹{targetDailyIncome} goal: −{formatINR(sim.targetGap)}
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#00FF88' }}>
                ✓ Target achieved ({sim.percentage}%)
              </span>
            )}
          </div>
        </div>

        {/* Parameter Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Daily Hours */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Available Daily Hours:</span>
              <b style={{ color: 'var(--accent)' }}>{hours} hrs / day</b>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Working Days / Week:</span>
              <b style={{ color: '#fff' }}>{daysPerWeek} days</b>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payout per {initialFin.unitName.slice(0, -1) || 'unit'}:</span>
              <b style={{ color: 'var(--accent)' }}>₹{pricePerUnit}</b>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Throughput ({initialFin.unitName}/hour):</span>
              <b style={{ color: 'var(--accent)' }}>{unitsPerHour}</b>
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
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFAA00' }}>
                  Dynamic Fuel Equation: ({distanceKm}km ÷ {mileageKmPerLiter}km/L) × ₹{fuelPricePerLiter}/L = ₹{sim.calculatedTravel}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: '0.75rem' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)' }}>Daily Distance: {distanceKm} km</label>
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
                  <label style={{ color: 'var(--text-muted)' }}>Fuel Price: ₹{fuelPricePerLiter}/L</label>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Daily Commute / Transit:</span>
                <b style={{ color: '#FFAA00' }}>₹{manualTravelCost} / day</b>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Platform Commission:</span>
              <b style={{ color: '#FF3366' }}>{platformFeePercent}%</b>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={platformFeePercent}
              onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#FF3366' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.82rem',
            }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
