/**
 * TallerLink Billing — registro de talleres + planes + Stripe Checkout
 * Free / Pro / Body Shop
 */
(function () {
  'use strict';

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
      // Set in Netlify env or replace after creating Stripe Payment Links / Prices
      priceEnv: 'PRICE_PRO',
      paymentLinkEnv: 'PAYMENT_LINK_PRO',
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
      priceEnv: 'PRICE_BODYSHOP',
      paymentLinkEnv: 'PAYMENT_LINK_BODYSHOP',
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
      status: 'active', // active | past_due | canceled | trialing
      customerId: '',
      subscriptionId: '',
      currentPeriodEnd: null,
      trialEndsAt: null,
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
    return b;
  }

  function getPlan(b) {
    return PLANS[b.plan] || PLANS.free;
  }

  function isPaid(b) {
    return (b.plan === 'pro' || b.plan === 'bodyshop') && (b.status === 'active' || b.status === 'trialing');
  }

  const billing = {
    PLANS,
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
    register({ email, ownerName, phone, shopName }) {
      const b = this.get();
      b.registered = true;
      b.email = (email || '').trim().toLowerCase();
      b.ownerName = (ownerName || '').trim();
      b.phone = (phone || '').trim();
      b.createdAt = b.createdAt || Date.now();
      saveBilling(b);
      // mirror into shop if empty
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
      // count active OTs
      let active = 0;
      try {
        const raw = JSON.parse(localStorage.getItem('tallerlink_v2') || '{}');
        active = (raw.ots || []).filter((o) => o.status !== 'entregado').length;
      } catch (_) {}
      if (active >= plan.otLimit) {
        return {
          ok: false,
          reason: `En el plan Free podés tener hasta ${plan.otLimit} vehículos activos. Pasá a Pro para ilimitados.`,
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
          reason: `Llegaste a ${plan.quoteLimit} cotizaciones este mes en Free. Actualizá a Pro.`,
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
      b.plan = PLANS[planId] ? planId : 'pro';
      b.status = meta.status || 'active';
      b.customerId = meta.customerId || b.customerId;
      b.subscriptionId = meta.subscriptionId || b.subscriptionId;
      b.currentPeriodEnd = meta.currentPeriodEnd || b.currentPeriodEnd;
      saveBilling(b);
      return b;
    },
    startTrial(days = 14) {
      const b = this.get();
      b.plan = 'pro';
      b.status = 'trialing';
      b.trialEndsAt = Date.now() + days * 86400000;
      saveBilling(b);
      return b;
    },
    async startCheckout(planId) {
      const b = this.get();
      if (!b.registered || !b.email) {
        return { error: 'register_required' };
      }
      const plan = PLANS[planId] || PLANS.pro;
      const origin = location.origin;
      const successUrl = origin + '/?billing=success&plan=' + encodeURIComponent(plan.id);
      const cancelUrl = origin + '/?billing=cancel';

      // 1) Try Netlify function (Stripe Checkout Session)
      try {
        const res = await fetch('/.netlify/functions/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: plan.id,
            email: b.email,
            shopName: b.ownerName || '',
            successUrl,
            cancelUrl,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            location.href = data.url;
            return { ok: true, method: 'checkout_session' };
          }
          if (data.paymentLink) {
            location.href = data.paymentLink;
            return { ok: true, method: 'payment_link' };
          }
        }
      } catch (_) {
        /* function not deployed or offline */
      }

      // 2) Payment Link from meta tag (optional hardcode for no-backend)
      const linkMeta = document.querySelector(`meta[name="tl-payment-link-${plan.id}"]`);
      if (linkMeta && linkMeta.content) {
        const url = linkMeta.content + (linkMeta.content.includes('?') ? '&' : '?') +
          'prefilled_email=' + encodeURIComponent(b.email) +
          '&client_reference_id=' + encodeURIComponent(b.email);
        location.href = url;
        return { ok: true, method: 'meta_payment_link' };
      }

      // 3) Demo mode — activate without Stripe (for testing UX)
      if (localStorage.getItem('tallerlink_demo_billing') === '1' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        this.activatePlan(plan.id, { status: 'active' });
        return { ok: true, method: 'demo_local' };
      }

      return {
        error: 'stripe_not_configured',
        message: 'Stripe aún no está configurado. Agregá las variables en Netlify o activá modo demo.',
      };
    },
  };

  window.TLBilling = billing;

  /* ─── UI injection ─── */
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
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
      .bill-card input{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:.7rem .85rem;margin-bottom:.75rem;color:#eef2f7;outline:none}
      .bill-card input:focus{border-color:rgba(255,122,26,.5);box-shadow:0 0 0 3px rgba(255,122,26,.14)}
      .plan-badge{display:inline-flex;align-items:center;gap:.35rem;font-size:.68rem;font-weight:700;padding:.25rem .55rem;border-radius:999px;background:rgba(255,122,26,.14);color:#ff7a1a;border:1px solid rgba(255,122,26,.3)}
      .plan-badge.free{background:rgba(255,255,255,.06);color:#8b98ab;border-color:rgba(255,255,255,.1)}
      .plan-badge.pro,.plan-badge.bodyshop{background:rgba(61,220,151,.14);color:#3ddc97;border-color:rgba(61,220,151,.3)}
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
            <p class="lead">Creá tu cuenta gratis. Después podés subir a Pro cuando el flujo ya te esté sirviendo.</p>
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
              Plan Free incluido. Sin tarjeta para empezar.
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
        // update live shop name in UI if possible
        const sn = document.getElementById('sideShopName');
        if (sn && shopName) sn.textContent = shopName;
        const shopNameInput = document.getElementById('shopName');
        if (shopNameInput && shopName) shopNameInput.value = shopName;
        hideGate();
        paintBillingUI();
        if (window.toast) window.toast('Taller registrado · plan Free');
        else alert('Listo. Ya podés usar TallerLink en Free.');
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
    const btn = el(`<button type="button" class="nav-btn" data-view="billing"><span class="ic">★</span> Plan y pago</button>`);
    const settings = nav.querySelector('[data-view="settings"]');
    if (settings) nav.insertBefore(btn, settings);
    else nav.appendChild(btn);
    btn.addEventListener('click', () => {
      if (typeof window.__tlSetView === 'function') window.__tlSetView('billing');
      else showBillingView();
    });
  }

  function ensureView() {
    const content = document.querySelector('.content');
    if (!content || document.getElementById('view-billing')) return;
    const sec = el(`
      <section id="view-billing" class="hidden">
        <div id="billingBanner" class="bill-banner"></div>
        <div class="panel" style="margin-bottom:1rem">
          <div class="panel-h"><h2>Tu suscripción</h2><span class="plan-badge" id="planBadgeTop">Free</span></div>
          <div class="panel-b" id="billingSummary"></div>
        </div>
        <div class="panel">
          <div class="panel-h"><h2>Planes</h2></div>
          <div class="panel-b">
            <div class="pricing-grid" id="pricingGrid"></div>
            <p style="margin-top:1rem;font-size:.8rem;color:#5f6d82;line-height:1.45">
              El pago lo procesa <strong>Stripe</strong> (tarjeta). TallerLink no guarda los datos de tu tarjeta.
              Podés cancelar cuando quieras desde el portal de cliente (Pro).
            </p>
          </div>
        </div>
      </section>`);
    content.appendChild(sec);
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
    return `
      <div class="row2">
        <div>
          <div style="font-size:.8rem;color:#8b98ab">Vehículos activos ${otLim ? active + ' / ' + otLim : active + ' · ilimitados'}</div>
          ${otLim ? `<div class="usage-bar"><i style="width:${otPct}%"></i></div>` : ''}
        </div>
        <div>
          <div style="font-size:.8rem;color:#8b98ab">Cotizaciones este mes ${qLim ? (b.quoteCountMonth || 0) + ' / ' + qLim : (b.quoteCountMonth || 0) + ' · ilimitadas'}</div>
          ${qLim ? `<div class="usage-bar"><i style="width:${qPct}%"></i></div>` : ''}
        </div>
      </div>
      <p style="margin-top:.85rem;font-size:.88rem;color:#8b98ab">
        Cuenta: <strong style="color:#eef2f7">${esc(b.email || '—')}</strong>
        ${b.ownerName ? ' · ' + esc(b.ownerName) : ''}
        ${b.status === 'trialing' && b.trialEndsAt ? '<br>Prueba Pro hasta ' + new Date(b.trialEndsAt).toLocaleDateString('es') : ''}
        ${b.currentPeriodEnd ? '<br>Próximo cobro / fin de periodo: ' + new Date(b.currentPeriodEnd).toLocaleDateString('es') : ''}
      </p>
    `;
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function paintBillingUI() {
    const b = billing.get();
    ensureNav();
    ensureView();

    // sidebar badge
    const foot = document.querySelector('.side-foot');
    if (foot && !document.getElementById('planBadgeSide')) {
      const badge = el(`<span class="plan-badge free" id="planBadgeSide" style="margin-top:.45rem">Free</span>`);
      foot.appendChild(badge);
    }
    const sideBadge = document.getElementById('planBadgeSide');
    const topBadge = document.getElementById('planBadgeTop');
    const plan = getPlan(b);
    [sideBadge, topBadge].forEach((node) => {
      if (!node) return;
      node.textContent = plan.name + (b.status === 'trialing' ? ' (prueba)' : '');
      node.className = 'plan-badge ' + plan.id;
    });

    const summary = document.getElementById('billingSummary');
    if (summary) {
      summary.innerHTML = usageBlock(b) + `
        <div style="display:flex;flex-wrap:wrap;gap:.45rem;margin-top:1rem">
          ${!isPaid(b) ? `<button type="button" class="btn btn-primary" data-checkout="pro">Mejorar a Pro — $29/mes</button>
          <button type="button" class="btn btn-ghost" data-trial="1">Probar Pro 14 días</button>` : `
          <button type="button" class="btn btn-ghost" id="btnPortal">Gestionar suscripción</button>
          <button type="button" class="btn btn-soft" data-checkout="bodyshop">Subir a Body Shop</button>`}
        </div>`;
      summary.querySelectorAll('[data-checkout]').forEach((btn) => {
        btn.onclick = () => startCheckoutFlow(btn.dataset.checkout);
      });
      summary.querySelector('[data-trial]')?.addEventListener('click', () => {
        billing.startTrial(14);
        paintBillingUI();
        if (window.toast) window.toast('Prueba Pro 14 días activada');
      });
      summary.querySelector('#btnPortal')?.addEventListener('click', openPortal);
    }

    const grid = document.getElementById('pricingGrid');
    if (grid) {
      grid.innerHTML = ['free', 'pro', 'bodyshop'].map((id) => {
        const p = PLANS[id];
        const current = b.plan === id;
        return `
          <div class="price-card ${id === 'pro' ? 'featured' : ''}">
            ${id === 'pro' ? '<span class="tag">Recomendado</span>' : ''}
            <h3>${esc(p.name)}</h3>
            <div class="amt">${esc(p.priceLabel)} <small>${esc(p.period)}</small></div>
            <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
            ${current
              ? `<button type="button" class="btn btn-ghost btn-block" disabled>Plan actual</button>`
              : id === 'free'
                ? `<button type="button" class="btn btn-ghost btn-block" data-downgrade="1">Quedarme en Free</button>`
                : `<button type="button" class="btn btn-primary btn-block" data-checkout="${id}">Suscribirme</button>`
            }
          </div>`;
      }).join('');
      grid.querySelectorAll('[data-checkout]').forEach((btn) => {
        btn.onclick = () => startCheckoutFlow(btn.dataset.checkout);
      });
      grid.querySelector('[data-downgrade]')?.addEventListener('click', () => {
        if (!confirm('¿Volver al plan Free? Se aplican los límites de uso.')) return;
        billing.activatePlan('free', { status: 'active' });
        paintBillingUI();
      });
    }

    // limit banner on dashboard
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
      banner.innerHTML = `<span>Plan <strong>${esc(getPlan(b).name)}</strong> activo · vehículos y cotizaciones ilimitados.</span>
        <button type="button" class="btn btn-ghost btn-sm" data-go-bill="1">Ver plan</button>`;
    } else if (!ot.ok || !q.ok) {
      banner.className = 'bill-banner show';
      banner.innerHTML = `<span>${esc((!ot.ok && ot.reason) || q.reason)}</span>
        <button type="button" class="btn btn-primary btn-sm" data-checkout="pro">Pasar a Pro</button>`;
    } else {
      const plan = getPlan(b);
      banner.className = 'bill-banner show';
      banner.innerHTML = `<span>Plan Free · ${ot.remaining != null ? ot.remaining + ' cupos de vehículos' : ''} ${q.remaining != null ? '· ' + q.remaining + ' cotizaciones este mes' : ''}</span>
        <button type="button" class="btn btn-soft btn-sm" data-checkout="pro">Mejorar plan</button>`;
    }
    banner.querySelectorAll('[data-checkout]').forEach((btn) => {
      btn.onclick = () => startCheckoutFlow(btn.dataset.checkout);
    });
    banner.querySelector('[data-go-bill]')?.addEventListener('click', () => {
      if (window.__tlSetView) window.__tlSetView('billing');
    });
  }

  async function startCheckoutFlow(planId) {
    const b = billing.get();
    if (!b.registered) {
      showGate();
      return;
    }
    if (window.toast) window.toast('Conectando con Stripe…');
    const res = await billing.startCheckout(planId);
    if (res.error === 'register_required') {
      showGate();
      return;
    }
    if (res.method === 'demo_local') {
      paintBillingUI();
      if (window.toast) window.toast('Plan ' + planId + ' activado (modo demo local)');
      alert('Modo demo: plan ' + planId + ' activado sin cobro real.\n\nEn producción esto abre Stripe Checkout.');
      return;
    }
    if (res.error === 'stripe_not_configured') {
      alert(
        'Stripe no está configurado todavía.\n\n' +
          '1) Creá productos en Stripe\n' +
          '2) En Netlify agregá STRIPE_SECRET_KEY y PRICE_PRO\n' +
          '3) O poné meta tl-payment-link-pro con tu Payment Link\n\n' +
          'Para probar la UX ahora:\nlocalStorage.setItem("tallerlink_demo_billing","1") y reintentá.'
      );
      return;
    }
    if (res.error) {
      alert(res.message || 'No se pudo iniciar el pago');
    }
  }

  async function openPortal() {
    const b = billing.get();
    try {
      const res = await fetch('/.netlify/functions/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: b.customerId, email: b.email }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          location.href = data.url;
          return;
        }
      }
    } catch (_) {}
    alert('El portal de cliente se activa cuando Stripe y el customerId estén configurados.');
  }

  function handleReturnFromStripe() {
    const params = new URLSearchParams(location.search);
    const billingParam = params.get('billing');
    if (!billingParam) return;
    if (billingParam === 'success') {
      const plan = params.get('plan') || 'pro';
      // Prefer server verification
      const sessionId = params.get('session_id');
      if (sessionId) {
        fetch('/.netlify/functions/verify-session?session_id=' + encodeURIComponent(sessionId))
          .then((r) => r.json())
          .then((data) => {
            if (data.ok) {
              billing.activatePlan(data.plan || plan, {
                status: 'active',
                customerId: data.customerId,
                subscriptionId: data.subscriptionId,
                currentPeriodEnd: data.currentPeriodEnd,
              });
            } else {
              billing.activatePlan(plan, { status: 'active' });
            }
            paintBillingUI();
            cleanupUrl();
            if (window.toast) window.toast('¡Suscripción activa!');
            if (window.__tlSetView) window.__tlSetView('billing');
          })
          .catch(() => {
            billing.activatePlan(plan, { status: 'active' });
            paintBillingUI();
            cleanupUrl();
          });
      } else {
        billing.activatePlan(plan, { status: 'active' });
        paintBillingUI();
        cleanupUrl();
        if (window.toast) window.toast('¡Pago recibido · plan activado!');
        if (window.__tlSetView) window.__tlSetView('billing');
      }
    }
    if (billingParam === 'cancel') {
      cleanupUrl();
      if (window.toast) window.toast('Pago cancelado · seguís en Free');
    }
  }

  function cleanupUrl() {
    try {
      const u = new URL(location.href);
      u.searchParams.delete('billing');
      u.searchParams.delete('plan');
      u.searchParams.delete('session_id');
      history.replaceState({}, '', u.pathname + u.search + u.hash);
    } catch (_) {}
  }

  /* Hooks for main app */
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

  function patchSetView() {
    // Wrap navigation if app exposes nothing — observe nav clicks
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setTimeout(paintLimitBanner, 50);
      });
    });
  }

  function boot() {
    // Don't show gate on public client view
    if (new URLSearchParams(location.search).get('c')) return;
    injectStyles();
    handleReturnFromStripe();
    const b = billing.get();
    ensureNav();
    ensureView();
    paintBillingUI();
    patchSetView();

    // Patch existing setView by intercepting nav
    const origNav = document.querySelectorAll('.nav-btn');
    origNav.forEach((btn) => {
      const v = btn.dataset.view;
      if (v === 'billing') return;
      btn.addEventListener('click', () => {
        document.getElementById('view-billing')?.classList.add('hidden');
      });
    });

    // Custom setView helper
    window.__tlSetView = function (name) {
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
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
      // trigger original renders lightly
      if (name !== 'billing') {
        const nb = document.querySelector(`.nav-btn[data-view="${name}"]`);
        // already on
      }
    };

    document.querySelector('[data-view="billing"]')?.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      window.__tlSetView('billing');
    });

    if (!b.registered) {
      // slight delay so app paints first
      setTimeout(showGate, 400);
    }

    // Monkey-patch buttons after app binds
    setTimeout(hookAppButtons, 0);
    setTimeout(hookAppButtons, 500);
  }

  function hookAppButtons() {
    const newOt = document.getElementById('btnNewOT');
    const newOt2 = document.getElementById('btnNewOT2');
    const quick = document.getElementById('quickOT');
    [newOt, newOt2, quick].forEach((btn) => {
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

  // Expose paint for after quote send — app can call
  window.TLBillingPaint = paintBillingUI;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
