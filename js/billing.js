/**
 * TallerLink Billing — registro + planes + pago con PayPal.me
 * Free / Pro / Body Shop
 * PayPal: https://www.paypal.com/paypalme/RandallCastroR9
 */
(function () {
  'use strict';

  const PAYPAL = {
    me: 'RandallCastroR9',
    base: 'https://www.paypal.com/paypalme/RandallCastroR9',
    // Si tenés WhatsApp de soporte para confirmar pagos:
    supportWa: '', // ej. '50688887777' — opcional
  };

  const PLANS = {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      priceLabel: '$0',
      period: 'para siempre',
      otLimit: 8,
      quoteLimit: 15,
      features: [
        'Hasta 8 vehículos activos',
        '15 cotizaciones / mes',
        'Cola del taller (Kanban)',
        'Links de aprobación WhatsApp',
        '1 usuario en este dispositivo',
      ],
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 29,
      priceLabel: '$29',
      period: '/ mes',
      otLimit: Infinity,
      quoteLimit: Infinity,
      features: [
        'Vehículos y cotizaciones ilimitados',
        'Presupuestos de proyecto (chapa/pintura)',
        'Logo del taller en links',
        'Historial sin límite',
        'Soporte prioritario',
      ],
    },
    bodyshop: {
      id: 'bodyshop',
      name: 'Body Shop',
      price: 49,
      priceLabel: '$49',
      period: '/ mes',
      otLimit: Infinity,
      quoteLimit: Infinity,
      features: [
        'Todo lo de Pro',
        'Enfoque enderezado / pintura',
        'Etapas de proyecto ilimitadas',
        'Ideal 2+ bahías de pintura',
      ],
    },
  };

  const STORE_KEY = 'tallerlink_billing_v1';

  function loadBilling() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || defaultBilling();
    } catch {
      return defaultBilling();
    }
  }

  function defaultBilling() {
    return {
      registered: false,
      email: '',
      ownerName: '',
      phone: '',
      plan: 'free',
      status: 'active', // active | pending_payment | trialing | past_due | canceled
      paymentMethod: 'paypal',
      customerId: '',
      subscriptionId: '',
      currentPeriodEnd: null,
      trialEndsAt: null,
      lastPayment: null,
      paymentHistory: [],
      otCreatedMonth: ym(),
      otCountMonth: 0,
      quoteCountMonth: 0,
      createdAt: Date.now(),
    };
  }

  function ym() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function saveBilling(b) {
    localStorage.setItem(STORE_KEY, JSON.stringify(b));
    window.dispatchEvent(new CustomEvent('tl-billing-updated', { detail: b }));
  }

  function rollMonth(b) {
    const m = ym();
    if (b.otCreatedMonth !== m) {
      b.otCreatedMonth = m;
      b.otCountMonth = 0;
      b.quoteCountMonth = 0;
      saveBilling(b);
    }
    // trial expiry
    if (b.status === 'trialing' && b.trialEndsAt && Date.now() > b.trialEndsAt) {
      b.plan = 'free';
      b.status = 'active';
      b.trialEndsAt = null;
      saveBilling(b);
    }
    // paid period end (soft)
    if (
      (b.plan === 'pro' || b.plan === 'bodyshop') &&
      b.status === 'active' &&
      b.currentPeriodEnd &&
      Date.now() > b.currentPeriodEnd
    ) {
      b.status = 'past_due';
      saveBilling(b);
    }
    return b;
  }

  function getPlan(b) {
    return PLANS[b.plan] || PLANS.free;
  }

  function isPaid(b) {
    return (
      (b.plan === 'pro' || b.plan === 'bodyshop') &&
      (b.status === 'active' || b.status === 'trialing')
    );
  }

  function paypalUrl(amount) {
    const n = Number(amount) || 0;
    // paypal.me/USER/AMOUNT  (USD por defecto en muchos países)
    return PAYPAL.base + '/' + n + 'USD';
  }

  const billing = {
    PLANS,
    PAYPAL,
    get() {
      return rollMonth(loadBilling());
    },
    save(b) {
      saveBilling(b);
    },
    plan() {
      return getPlan(this.get());
    },
    isPaid() {
      return isPaid(this.get());
    },
    paypalLink(planId) {
      const p = PLANS[planId] || PLANS.pro;
      return paypalUrl(p.price);
    },
    register({ email, ownerName, phone, shopName }) {
      const b = this.get();
      b.registered = true;
      b.email = (email || '').trim().toLowerCase();
      b.ownerName = (ownerName || '').trim();
      b.phone = (phone || '').trim();
      b.createdAt = b.createdAt || Date.now();
      saveBilling(b);
      try {
        const raw = JSON.parse(localStorage.getItem('tallerlink_v2') || '{}');
        raw.shop = raw.shop || {};
        if (shopName) raw.shop.name = shopName;
        if (phone && !raw.shop.phone) raw.shop.phone = phone;
        localStorage.setItem('tallerlink_v2', JSON.stringify(raw));
      } catch (_) {}
      return b;
    },
    canCreateOT() {
      const b = this.get();
      const plan = getPlan(b);
      if (plan.otLimit === Infinity) return { ok: true };
      let active = 0;
      try {
        const raw = JSON.parse(localStorage.getItem('tallerlink_v2') || '{}');
        active = (raw.ots || []).filter((o) => o.status !== 'entregado').length;
      } catch (_) {}
      if (active >= plan.otLimit) {
        return {
          ok: false,
          reason: `En Free podés tener hasta ${plan.otLimit} vehículos activos. Pasá a Pro (PayPal).`,
        };
      }
      return { ok: true, remaining: plan.otLimit - active };
    },
    canSendQuote() {
      const b = this.get();
      const plan = getPlan(b);
      if (plan.quoteLimit === Infinity) return { ok: true };
      if (b.quoteCountMonth >= plan.quoteLimit) {
        return {
          ok: false,
          reason: `Llegaste a ${plan.quoteLimit} cotizaciones este mes en Free. Actualizá a Pro con PayPal.`,
        };
      }
      return { ok: true, remaining: plan.quoteLimit - b.quoteCountMonth };
    },
    recordQuoteSent() {
      const b = this.get();
      b.quoteCountMonth = (b.quoteCountMonth || 0) + 1;
      saveBilling(b);
    },
    activatePlan(planId, meta = {}) {
      const b = this.get();
      const plan = PLANS[planId] ? planId : 'pro';
      b.plan = plan;
      b.status = meta.status || 'active';
      b.paymentMethod = meta.paymentMethod || b.paymentMethod || 'paypal';
      b.customerId = meta.customerId || b.customerId;
      b.subscriptionId = meta.subscriptionId || b.subscriptionId;
      if (meta.currentPeriodEnd) {
        b.currentPeriodEnd = meta.currentPeriodEnd;
      } else if (b.status === 'active' && plan !== 'free') {
        // 30 días desde ahora
        b.currentPeriodEnd = Date.now() + 30 * 86400000;
      }
      if (meta.lastPayment) b.lastPayment = meta.lastPayment;
      if (meta.pushHistory) {
        b.paymentHistory = b.paymentHistory || [];
        b.paymentHistory.unshift(meta.pushHistory);
        b.paymentHistory = b.paymentHistory.slice(0, 24);
      }
      saveBilling(b);
      return b;
    },
    startTrial(days = 14) {
      const b = this.get();
      b.plan = 'pro';
      b.status = 'trialing';
      b.trialEndsAt = Date.now() + days * 86400000;
      b.currentPeriodEnd = b.trialEndsAt;
      saveBilling(b);
      return b;
    },
    markPaidPaypal(planId, note) {
      const plan = PLANS[planId] || PLANS.pro;
      const b = this.get();
      const entry = {
        at: Date.now(),
        plan: plan.id,
        amount: plan.price,
        method: 'paypal',
        note: (note || '').slice(0, 200),
        email: b.email,
        ownerName: b.ownerName,
      };
      const result = this.activatePlan(plan.id, {
        status: 'active',
        paymentMethod: 'paypal',
        lastPayment: entry,
        pushHistory: entry,
        currentPeriodEnd: Date.now() + 30 * 86400000,
      });
      // Avisa al servidor (si hay admin) — no bloquea si falla
      pushPlanToServer(result).catch(() => {});
      return result;
    },
    setFree(reason) {
      const b = this.get();
      b.plan = 'free';
      b.status = 'active';
      b.trialEndsAt = null;
      b.currentPeriodEnd = null;
      b.lastPayment = b.lastPayment || null;
      b.revokeNote = (reason || '').slice(0, 200);
      b.revokedAt = Date.now();
      saveBilling(b);
      return b;
    },
  };

  async function pushPlanToServer(b) {
    // opcional: si el usuario tiene admin key en session no aplica;
    // guardamos solo si existe endpoint (redeploy)
    try {
      await fetch('/.netlify/functions/admin-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': localStorage.getItem('tl_admin_key') || '' },
        body: JSON.stringify({
          email: b.email,
          plan: b.plan,
          status: b.status,
          note: 'self_activate_paypal',
          days: 30,
          currentPeriodEnd: b.currentPeriodEnd,
        }),
      });
    } catch (_) {}
  }

  /**
   * Baja el plan definido en el panel admin.
   * Si vos lo bajaste a Free/blocked por no pagar → el taller pierde Pro al abrir la app.
   */
  async function syncPlanFromServer() {
    const b = billing.get();
    if (!b.email) return null;
    try {
      const res = await fetch(
        '/.netlify/functions/plan-status?email=' + encodeURIComponent(b.email)
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.record) return null;
      const rec = data.record;

      // Prioridad del servidor: free/blocked siempre gana (anti-fraude)
      if (rec.status === 'blocked' || rec.plan === 'free') {
        const wasPaid = b.plan === 'pro' || b.plan === 'bodyshop';
        billing.setFree(rec.note || 'Plan actualizado por administración');
        if (rec.status === 'blocked') {
          const bb = billing.get();
          bb.status = 'blocked';
          saveBilling(bb);
        }
        if (wasPaid && window.toast) {
          window.toast('Tu plan pasó a Free. Si ya pagaste, escribinos.');
        }
        return rec;
      }

      // Upgrade/confirmación desde admin (pago verificado por vos)
      if (
        (rec.plan === 'pro' || rec.plan === 'bodyshop') &&
        (rec.status === 'active' || rec.status === 'trialing')
      ) {
        const remoteEnd = rec.currentPeriodEnd || 0;
        const localEnd = b.currentPeriodEnd || 0;
        if (remoteEnd >= localEnd || !isPaid(b) || b.plan !== rec.plan) {
          billing.activatePlan(rec.plan, {
            status: rec.status,
            currentPeriodEnd: rec.currentPeriodEnd || Date.now() + 30 * 86400000,
            paymentMethod: 'paypal',
          });
        }
      }
      return rec;
    } catch (_) {
      return null;
    }
  }

  // export for boot
  window.__tlSyncPlan = syncPlanFromServer;

  window.TLBilling = billing;

  /* ─── UI ─── */
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function injectStyles() {
    if (document.getElementById('tl-billing-css')) return;
    const s = document.createElement('style');
    s.id = 'tl-billing-css';
    s.textContent = `
      .bill-gate{position:fixed;inset:0;z-index:100;background:rgba(8,10,14,.92);backdrop-filter:blur(10px);display:none;place-items:center;padding:1rem;overflow:auto}
      .bill-gate.show{display:grid}
      .bill-card{width:min(100%,440px);background:#1a2230;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:1.35rem;box-shadow:0 24px 60px rgba(0,0,0,.5)}
      .bill-card h2{font-family:'Space Grotesk',system-ui,sans-serif;font-size:1.35rem;letter-spacing:-.02em;margin:.35rem 0 .5rem}
      .bill-card .lead{color:#8b98ab;font-size:.92rem;line-height:1.5;margin-bottom:1rem}
      .bill-card label{display:block;font-size:.7rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#5f6d82;margin:0 0 .3rem}
      .bill-card input,.bill-card textarea{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:.7rem .85rem;margin-bottom:.75rem;color:#eef2f7;outline:none;font:inherit}
      .bill-card input:focus,.bill-card textarea:focus{border-color:rgba(255,122,26,.5);box-shadow:0 0 0 3px rgba(255,122,26,.14)}
      .plan-badge{display:inline-flex;align-items:center;gap:.35rem;font-size:.68rem;font-weight:700;padding:.25rem .55rem;border-radius:999px;background:rgba(255,255,255,.06);color:#8b98ab;border:1px solid rgba(255,255,255,.1)}
      .plan-badge.pro,.plan-badge.bodyshop{background:rgba(61,220,151,.14);color:#3ddc97;border-color:rgba(61,220,151,.3)}
      .plan-badge.pending{background:rgba(245,197,66,.14);color:#f5c542;border-color:rgba(245,197,66,.3)}
      .pricing-grid{display:grid;gap:1rem}
      @media(min-width:800px){.pricing-grid{grid-template-columns:repeat(3,1fr)}}
      .price-card{background:#1a2230;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.2rem;display:flex;flex-direction:column;gap:.5rem;position:relative}
      .price-card.featured{border-color:rgba(255,122,26,.45);box-shadow:0 0 0 1px rgba(255,122,26,.2)}
      .price-card .tag{position:absolute;top:.75rem;right:.75rem;font-size:.65rem;font-weight:700;background:#ff7a1a;color:#111;padding:.2rem .5rem;border-radius:999px}
      .price-card h3{font-family:'Space Grotesk',system-ui,sans-serif;font-size:1.15rem}
      .price-card .amt{font-family:'Space Grotesk',system-ui,sans-serif;font-size:2rem;font-weight:700;color:#ff7a1a}
      .price-card .amt small{font-size:.9rem;color:#5f6d82;font-weight:500}
      .price-card ul{list-style:none;margin:.5rem 0 1rem;padding:0;flex:1}
      .price-card li{font-size:.85rem;color:#8b98ab;padding:.3rem 0 .3rem 1.15rem;position:relative}
      .price-card li::before{content:'✓';position:absolute;left:0;color:#3ddc97;font-weight:700}
      .usage-bar{height:6px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden;margin-top:.35rem}
      .usage-bar i{display:block;height:100%;background:#ff7a1a;border-radius:999px}
      .bill-banner{display:none;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap;padding:.75rem 1rem;margin-bottom:1rem;border-radius:12px;background:rgba(255,122,26,.1);border:1px solid rgba(255,122,26,.28);font-size:.88rem}
      .bill-banner.show{display:flex}
      .bill-banner.ok{background:rgba(61,220,151,.1);border-color:rgba(61,220,151,.28)}
      .pp-bg{display:none;position:fixed;inset:0;z-index:110;background:rgba(0,0,0,.72);backdrop-filter:blur(6px);padding:1rem;overflow:auto;place-items:center}
      .pp-bg.show{display:grid}
      .pp-sheet{width:min(100%,420px);background:#1a2230;border:1px solid rgba(255,255,255,.12);border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5)}
      .pp-sheet .hd{padding:1.1rem 1.2rem;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.2)}
      .pp-sheet .hd h3{font-family:'Space Grotesk',system-ui,sans-serif;font-size:1.15rem;margin:0 0 .25rem}
      .pp-sheet .hd p{margin:0;font-size:.84rem;color:#8b98ab;line-height:1.45}
      .pp-sheet .bd{padding:1.1rem 1.2rem;display:grid;gap:.75rem}
      .pp-steps{margin:0;padding-left:1.15rem;color:#8b98ab;font-size:.88rem;line-height:1.55}
      .pp-steps li{margin:.25rem 0}
      .pp-amt{font-family:'Space Grotesk',system-ui,sans-serif;font-size:1.75rem;font-weight:700;color:#ff7a1a}
      .pp-note{font-size:.78rem;color:#5f6d82;line-height:1.4;padding:.65rem .75rem;background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.22);border-radius:10px}
      .btn-paypal{background:#0070ba;color:#fff}
      .btn-paypal:hover{box-shadow:0 8px 24px rgba(0,112,186,.35)}
    `;
    document.head.appendChild(s);
  }

  function showGate() {
    let gate = document.getElementById('billGate');
    if (!gate) {
      gate = el(`
        <div class="bill-gate" id="billGate">
          <div class="bill-card">
            <div style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ff7a1a">TallerLink</div>
            <h2>Registrá tu taller</h2>
            <p class="lead">Creá tu cuenta gratis. Cuando quieras Pro, pagás por <strong>PayPal</strong> en 1 minuto.</p>
            <label>Tu nombre</label>
            <input id="regOwner" placeholder="Juan Martínez" autocomplete="name" />
            <label>Email del taller</label>
            <input id="regEmail" type="email" placeholder="taller@email.com" autocomplete="email" />
            <label>WhatsApp</label>
            <input id="regPhone" placeholder="50688887777" inputmode="tel" autocomplete="tel" />
            <label>Nombre del taller</label>
            <input id="regShop" placeholder="Taller Martínez" />
            <button type="button" class="btn btn-primary btn-block" id="regSubmit" style="margin-top:.35rem">Empezar gratis</button>
            <p style="font-size:.75rem;color:#5f6d82;margin-top:.85rem;line-height:1.4;text-align:center">
              Free sin tarjeta. Pro se paga con PayPal.
            </p>
          </div>
        </div>`);
      document.body.appendChild(gate);
      gate.querySelector('#regSubmit').onclick = () => {
        const ownerName = gate.querySelector('#regOwner').value.trim();
        const email = gate.querySelector('#regEmail').value.trim();
        const phone = gate.querySelector('#regPhone').value.trim();
        const shopName = gate.querySelector('#regShop').value.trim();
        if (!ownerName || !email || !email.includes('@')) {
          alert('Completá nombre y un email válido');
          return;
        }
        billing.register({ email, ownerName, phone, shopName: shopName || 'Mi Taller' });
        const sn = document.getElementById('sideShopName');
        if (sn && shopName) sn.textContent = shopName;
        const shopNameInput = document.getElementById('shopName');
        if (shopNameInput && shopName) shopNameInput.value = shopName;
        hideGate();
        paintBillingUI();
        if (window.toast) window.toast('Taller registrado · sincronizando…');
        // Mismo email en PC y celular = mismos carros (nube)
        setTimeout(function () {
          if (typeof window.tlCloudPull === 'function') {
            window.tlCloudPull({ silent: false }).then(function (r) {
              if (r && r.changed) {
                if (window.toast) window.toast('Datos del taller cargados en este dispositivo');
              } else if (typeof window.tlCloudPush === 'function') {
                window.tlCloudPush(true);
              }
            });
          }
        }, 300);
      };
    }
    gate.classList.add('show');
  }

  function hideGate() {
    document.getElementById('billGate')?.classList.remove('show');
  }

  function ensureNav() {
    const nav = document.querySelector('.side-nav');
    if (!nav || document.querySelector('[data-view="billing"]')) return;
    const btn = el(
      `<button type="button" class="nav-btn" data-view="billing"><span class="ic">★</span> Plan y pago</button>`
    );
    const settings = nav.querySelector('[data-view="settings"]');
    if (settings) nav.insertBefore(btn, settings);
    else nav.appendChild(btn);
    btn.addEventListener('click', () => {
      if (typeof window.__tlSetView === 'function') window.__tlSetView('billing');
    });
  }

  function ensureView() {
    const content = document.querySelector('.content');
    if (!content || document.getElementById('view-billing')) return;
    const sec = el(`
      <section id="view-billing" class="hidden">
        <div class="panel" style="margin-bottom:1rem">
          <div class="panel-h"><h2>Tu suscripción</h2><span class="plan-badge" id="planBadgeTop">Free</span></div>
          <div class="panel-b" id="billingSummary"></div>
        </div>
        <div class="panel">
          <div class="panel-h"><h2>Planes</h2></div>
          <div class="panel-b">
            <div class="pricing-grid" id="pricingGrid"></div>
            <p style="margin-top:1rem;font-size:.8rem;color:#5f6d82;line-height:1.45">
              El pago se hace con <strong>PayPal</strong>
              (<a href="${PAYPAL.base}" target="_blank" rel="noopener" style="color:#5eb1ff">paypal.me/${PAYPAL.me}</a>.
              Después tocá <strong>Ya pagué</strong> para activar el plan. Renová cada mes desde aquí.
              Si el pago no aparece en PayPal, administración puede volver el taller a Free
              (<a href="/admin.html" style="color:#5eb1ff">panel admin</a>).
            </p>
          </div>
        </div>
      </section>`);
    content.appendChild(sec);
  }

  function ensurePaypalModal() {
    if (document.getElementById('ppBg')) return;
    const m = el(`
      <div class="pp-bg" id="ppBg" aria-hidden="true">
        <div class="pp-sheet" role="dialog" aria-modal="true">
          <div class="hd">
            <h3 id="ppTitle">Pagar con PayPal</h3>
            <p id="ppSub">Plan Pro</p>
          </div>
          <div class="bd">
            <div class="pp-amt" id="ppAmt">$29</div>
            <ol class="pp-steps">
              <li>Tocá <strong>Abrir PayPal</strong> y completá el pago de la suscripción mensual.</li>
              <li>En el concepto / nota poné tu <strong>email del taller</strong> (así lo identificamos).</li>
              <li>Volvé acá y tocá <strong>Ya pagué — activar plan</strong>.</li>
            </ol>
            <div class="pp-note">
              PayPal: <strong>paypal.me/${PAYPAL.me}</strong><br/>
              Monto exacto del plan. Si PayPal pide moneda, usá <strong>USD</strong>.
            </div>
            <label style="font-size:.7rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#5f6d82">Nota opcional (ID de transacción)</label>
            <input id="ppTxn" placeholder="Ej. código de PayPal o 'pagado 21/7'" maxlength="120" />
            <a class="btn btn-paypal btn-lg btn-block" id="ppOpen" href="#" target="_blank" rel="noopener">Abrir PayPal y pagar</a>
            <button type="button" class="btn btn-primary btn-block" id="ppPaid">Ya pagué — activar plan</button>
            <button type="button" class="btn btn-ghost btn-block" id="ppCopy">Copiar link de PayPal</button>
            <button type="button" class="btn btn-ghost btn-sm btn-block" id="ppClose">Cancelar</button>
          </div>
        </div>
      </div>`);
    document.body.appendChild(m);

    m.querySelector('#ppClose').onclick = closePaypalModal;
    m.addEventListener('click', (e) => {
      if (e.target === m) closePaypalModal();
    });
    m.querySelector('#ppCopy').onclick = async () => {
      const url = m.querySelector('#ppOpen').href;
      try {
        await navigator.clipboard.writeText(url);
        if (window.toast) window.toast('Link PayPal copiado');
        else alert('Copiado: ' + url);
      } catch {
        prompt('Copiá este link:', url);
      }
    };
    m.querySelector('#ppPaid').onclick = () => {
      const planId = m.dataset.plan || 'pro';
      const note = m.querySelector('#ppTxn').value.trim();
      billing.markPaidPaypal(planId, note);
      closePaypalModal();
      paintBillingUI();
      if (window.toast) window.toast('Plan ' + (PLANS[planId]?.name || planId) + ' activado · PayPal');
      alert(
        'Plan activado.\n\n' +
          'Si todavía no se refleja el pago en PayPal, lo revisamos manualmente.\n' +
          'Email de tu cuenta: ' +
          (billing.get().email || '—') +
          '\n\nRenovación: dentro de 30 días volvé a Plan y pago.'
      );
      if (window.__tlSetView) window.__tlSetView('billing');
    };
  }

  function openPaypalModal(planId) {
    ensurePaypalModal();
    const plan = PLANS[planId] || PLANS.pro;
    const m = document.getElementById('ppBg');
    m.dataset.plan = plan.id;
    m.querySelector('#ppTitle').textContent = 'Pagar ' + plan.name + ' con PayPal';
    m.querySelector('#ppSub').textContent =
      'Suscripción mensual · ' + plan.priceLabel + plan.period + ' · paypal.me/' + PAYPAL.me;
    m.querySelector('#ppAmt').textContent = plan.priceLabel + ' USD';
    m.querySelector('#ppOpen').href = paypalUrl(plan.price);
    m.querySelector('#ppTxn').value = '';
    m.classList.add('show');
    m.setAttribute('aria-hidden', 'false');
  }

  function closePaypalModal() {
    const m = document.getElementById('ppBg');
    if (!m) return;
    m.classList.remove('show');
    m.setAttribute('aria-hidden', 'true');
  }

  function usageBlock(b) {
    const plan = getPlan(b);
    let active = 0;
    try {
      const raw = JSON.parse(localStorage.getItem('tallerlink_v2') || '{}');
      active = (raw.ots || []).filter((o) => o.status !== 'entregado').length;
    } catch (_) {}
    const otLim = plan.otLimit === Infinity ? null : plan.otLimit;
    const qLim = plan.quoteLimit === Infinity ? null : plan.quoteLimit;
    const otPct = otLim ? Math.min(100, Math.round((active / otLim) * 100)) : 0;
    const qPct = qLim ? Math.min(100, Math.round(((b.quoteCountMonth || 0) / qLim) * 100)) : 0;
    const period =
      b.currentPeriodEnd && (b.plan === 'pro' || b.plan === 'bodyshop')
        ? '<br>Válido hasta: <strong style="color:#eef2f7">' +
          new Date(b.currentPeriodEnd).toLocaleDateString('es') +
          '</strong>'
        : '';
    const last =
      b.lastPayment && b.lastPayment.at
        ? '<br>Último pago PayPal: ' +
          new Date(b.lastPayment.at).toLocaleDateString('es') +
          ' · $' +
          (b.lastPayment.amount || '') +
          (b.lastPayment.note ? ' · ' + esc(b.lastPayment.note) : '')
        : '';
    return `
      <div class="row2">
        <div>
          <div style="font-size:.8rem;color:#8b98ab">Vehículos activos ${
            otLim ? active + ' / ' + otLim : active + ' · ilimitados'
          }</div>
          ${otLim ? `<div class="usage-bar"><i style="width:${otPct}%"></i></div>` : ''}
        </div>
        <div>
          <div style="font-size:.8rem;color:#8b98ab">Cotizaciones este mes ${
            qLim
              ? (b.quoteCountMonth || 0) + ' / ' + qLim
              : (b.quoteCountMonth || 0) + ' · ilimitadas'
          }</div>
          ${qLim ? `<div class="usage-bar"><i style="width:${qPct}%"></i></div>` : ''}
        </div>
      </div>
      <p style="margin-top:.85rem;font-size:.88rem;color:#8b98ab">
        Cuenta: <strong style="color:#eef2f7">${esc(b.email || '—')}</strong>
        ${b.ownerName ? ' · ' + esc(b.ownerName) : ''}
        ${b.status === 'trialing' && b.trialEndsAt ? '<br>Prueba Pro hasta ' + new Date(b.trialEndsAt).toLocaleDateString('es') : ''}
        ${b.status === 'past_due' ? '<br><span style="color:#f5c542">Periodo vencido — renovà con PayPal</span>' : ''}
        ${period}${last}
      </p>
    `;
  }

  function paintBillingUI() {
    const b = billing.get();
    ensureNav();
    ensureView();
    ensurePaypalModal();

    const foot = document.querySelector('.side-foot');
    if (foot && !document.getElementById('planBadgeSide')) {
      const badge = el(
        `<span class="plan-badge free" id="planBadgeSide" style="margin-top:.45rem">Free</span>`
      );
      foot.appendChild(badge);
    }
    const sideBadge = document.getElementById('planBadgeSide');
    const topBadge = document.getElementById('planBadgeTop');
    const plan = getPlan(b);
    [sideBadge, topBadge].forEach((node) => {
      if (!node) return;
      let label = plan.name;
      if (b.status === 'trialing') label += ' (prueba)';
      if (b.status === 'past_due') label += ' (vencer)';
      node.textContent = label;
      node.className =
        'plan-badge ' +
        (b.status === 'past_due' ? 'pending' : plan.id === 'free' ? 'free' : plan.id);
    });

    const summary = document.getElementById('billingSummary');
    if (summary) {
      const paid = isPaid(b);
      const needsRenew = b.status === 'past_due' || (paid && b.currentPeriodEnd && b.currentPeriodEnd - Date.now() < 5 * 86400000);
      summary.innerHTML =
        usageBlock(b) +
        `
        <div style="display:flex;flex-wrap:wrap;gap:.45rem;margin-top:1rem">
          ${
            !paid
              ? `<button type="button" class="btn btn-primary" data-checkout="pro">Mejorar a Pro — $29/mes (PayPal)</button>
          <button type="button" class="btn btn-ghost" data-trial="1">Probar Pro 14 días</button>`
              : `<button type="button" class="btn btn-paypal" data-checkout="${b.plan === 'bodyshop' ? 'bodyshop' : 'pro'}">${needsRenew ? 'Renovar con PayPal' : 'Pagar próximo mes'}</button>
          <button type="button" class="btn btn-soft" data-checkout="bodyshop">Body Shop $49</button>
          <a class="btn btn-ghost" href="${PAYPAL.base}" target="_blank" rel="noopener">Abrir mi PayPal.me</a>`
          }
        </div>`;
      summary.querySelectorAll('[data-checkout]').forEach((btn) => {
        btn.onclick = () => startCheckoutFlow(btn.dataset.checkout);
      });
      summary.querySelector('[data-trial]')?.addEventListener('click', () => {
        billing.startTrial(14);
        paintBillingUI();
        if (window.toast) window.toast('Prueba Pro 14 días activada');
      });
    }

    const grid = document.getElementById('pricingGrid');
    if (grid) {
      grid.innerHTML = ['free', 'pro', 'bodyshop']
        .map((id) => {
          const p = PLANS[id];
          const current = b.plan === id && (b.status === 'active' || b.status === 'trialing');
          return `
          <div class="price-card ${id === 'pro' ? 'featured' : ''}">
            ${id === 'pro' ? '<span class="tag">Recomendado</span>' : ''}
            <h3>${esc(p.name)}</h3>
            <div class="amt">${esc(p.priceLabel)} <small>${esc(p.period)}</small></div>
            <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
            ${
              current
                ? `<button type="button" class="btn btn-ghost btn-block" disabled>Plan actual</button>`
                : id === 'free'
                  ? `<button type="button" class="btn btn-ghost btn-block" data-downgrade="1">Quedarme en Free</button>`
                  : `<button type="button" class="btn btn-primary btn-block" data-checkout="${id}">Pagar con PayPal</button>`
            }
          </div>`;
        })
        .join('');
      grid.querySelectorAll('[data-checkout]').forEach((btn) => {
        btn.onclick = () => startCheckoutFlow(btn.dataset.checkout);
      });
      grid.querySelector('[data-downgrade]')?.addEventListener('click', () => {
        if (!confirm('¿Volver al plan Free? Se aplican los límites de uso.')) return;
        billing.activatePlan('free', { status: 'active' });
        paintBillingUI();
      });
    }

    paintLimitBanner();
  }

  function paintLimitBanner() {
    let banner = document.getElementById('limitBanner');
    const dash = document.getElementById('view-dashboard');
    if (!dash) return;
    if (!banner) {
      banner = el(`<div class="bill-banner" id="limitBanner"></div>`);
      dash.insertBefore(banner, dash.firstChild);
    }
    const b = billing.get();
    const ot = billing.canCreateOT();
    const q = billing.canSendQuote();
    if (isPaid(b)) {
      banner.className = 'bill-banner ok show';
      banner.innerHTML = `<span>Plan <strong>${esc(getPlan(b).name)}</strong> activo · pago por PayPal.</span>
        <button type="button" class="btn btn-ghost btn-sm" data-go-bill="1">Ver plan</button>`;
    } else if (!ot.ok || !q.ok) {
      banner.className = 'bill-banner show';
      banner.innerHTML = `<span>${esc((!ot.ok && ot.reason) || q.reason)}</span>
        <button type="button" class="btn btn-primary btn-sm" data-checkout="pro">Pagar Pro</button>`;
    } else {
      banner.className = 'bill-banner show';
      banner.innerHTML = `<span>Plan Free · ${
        ot.remaining != null ? ot.remaining + ' cupos vehículos' : ''
      } ${q.remaining != null ? '· ' + q.remaining + ' cotiz. este mes' : ''}</span>
        <button type="button" class="btn btn-soft btn-sm" data-checkout="pro">Mejorar con PayPal</button>`;
    }
    banner.querySelectorAll('[data-checkout]').forEach((btn) => {
      btn.onclick = () => startCheckoutFlow(btn.dataset.checkout);
    });
    banner.querySelector('[data-go-bill]')?.addEventListener('click', () => {
      if (window.__tlSetView) window.__tlSetView('billing');
    });
  }

  function startCheckoutFlow(planId) {
    const b = billing.get();
    if (!b.registered) {
      showGate();
      return;
    }
    if (planId === 'free') return;
    openPaypalModal(planId || 'pro');
  }

  /** True when this page is the client quote/status view (not the shop app). */
  function isClientPublicView() {
    try {
      const params = new URLSearchParams(location.search);
      // Long legacy payload
      if (params.get('c')) return true;
      // Short link: /c/abc123 rewritten to ?s=abc123 (or raw path)
      if (params.get('s')) return true;
      if (/\/c\/[a-z0-9]+/i.test(location.pathname || '')) return true;
    } catch (_) {}
    return false;
  }

  function boot() {
    // Nunca mostrar registro de taller en el link del cliente (WA)
    if (isClientPublicView()) return;
    injectStyles();
    // legacy stripe return URLs still activate plan if someone used old flow
    const params = new URLSearchParams(location.search);
    if (params.get('billing') === 'success') {
      billing.activatePlan(params.get('plan') || 'pro', { status: 'active', paymentMethod: 'paypal' });
      try {
        const u = new URL(location.href);
        u.searchParams.delete('billing');
        u.searchParams.delete('plan');
        u.searchParams.delete('session_id');
        history.replaceState({}, '', u.pathname + u.search + u.hash);
      } catch (_) {}
    }

    ensureNav();
    ensureView();
    paintBillingUI();

    // Sincronizar plan desde admin (si no pagó y lo bajaste a Free)
    syncPlanFromServer().then((rec) => {
      if (rec) paintBillingUI();
    });
    setInterval(() => {
      if (document.hidden) return;
      syncPlanFromServer().then((rec) => {
        if (rec) paintBillingUI();
      });
    }, 20000);

    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => setTimeout(paintLimitBanner, 50));
    });

    const prev = window.__tlSetView;
    window.__tlSetView = function (name) {
      if (typeof prev === 'function' && name !== 'billing') {
        // let main app handle non-billing if it was the original setView
      }
      document.querySelectorAll('.nav-btn').forEach((b) =>
        b.classList.toggle('on', b.dataset.view === name)
      );
      ['dashboard', 'vehicles', 'board', 'quotes', 'settings', 'billing'].forEach((v) => {
        document.getElementById('view-' + v)?.classList.toggle('hidden', v !== name);
      });
      const title = document.getElementById('pageTitle');
      if (title) {
        title.textContent =
          {
            dashboard: 'Inicio',
            vehicles: 'Vehículos en el taller',
            board: 'Cola del taller',
            quotes: 'Cotizaciones',
            settings: 'Mi taller',
            billing: 'Plan y pago',
          }[name] || 'TallerLink';
      }
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('scrim')?.classList.remove('show');
      if (name === 'billing') paintBillingUI();
      if (name === 'dashboard') paintLimitBanner();
      if (typeof prev === 'function' && name !== 'billing') {
        try {
          prev(name);
        } catch (_) {}
      }
    };

    document.querySelector('[data-view="billing"]')?.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.__tlSetView('billing');
      },
      true
    );

    if (!billing.get().registered) setTimeout(showGate, 400);
    setTimeout(hookAppButtons, 0);
    setTimeout(hookAppButtons, 500);
  }

  function hookAppButtons() {
    ['btnNewOT', 'btnNewOT2', 'quickOT'].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn || btn.dataset.billHooked) return;
      btn.dataset.billHooked = '1';
      btn.addEventListener(
        'click',
        (e) => {
          if (!window.TLBillingGuard.beforeNewOT()) {
            e.stopImmediatePropagation();
            e.preventDefault();
          }
        },
        true
      );
    });
  }

  window.TLBillingGuard = {
    beforeNewOT() {
      const b = billing.get();
      if (!b.registered) {
        showGate();
        return false;
      }
      const check = billing.canCreateOT();
      if (!check.ok) {
        alert(check.reason);
        if (window.__tlSetView) window.__tlSetView('billing');
        return false;
      }
      return true;
    },
    beforeSendQuote() {
      const b = billing.get();
      if (!b.registered) {
        showGate();
        return false;
      }
      const check = billing.canSendQuote();
      if (!check.ok) {
        alert(check.reason);
        if (window.__tlSetView) window.__tlSetView('billing');
        return false;
      }
      return true;
    },
    afterSendQuote() {
      billing.recordQuoteSent();
      paintBillingUI();
    },
  };

  window.TLBillingPaint = paintBillingUI;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
