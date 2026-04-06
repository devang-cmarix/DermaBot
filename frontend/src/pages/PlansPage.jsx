import React, { useState, useEffect } from 'react';
import { C } from '../constants/constants';

function PlansPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data));
  }, []);

  return (
    <div className="page-shell page-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 20 }}>
      {plans.map((plan) => (
        <div key={plan.name} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Inter', sans-serif", color: plan.color, fontWeight: 800, fontSize: 20 }}>{plan.name}</div>
            <div style={{ fontSize: 30, marginTop: 10 }}>{plan.price}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {plan.features.map((feature) => (
              <div key={feature} style={{ color: C.textMuted }}>
                ✓ {feature}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PlansPage;
