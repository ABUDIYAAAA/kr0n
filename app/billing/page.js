'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Receipt,
  Check,
  X,
  Info,
} from 'lucide-react';
import { useKr0nStore } from '@/lib/kr0n-state';

const AVAILABLE_PLANS = [
  {
    id: 'starter',
    name: 'Starter Tier',
    price: '$0',
    desc: 'For individual developers prototyping edge applications.',
    features: ['5 vCPU Compute', '10 GB Memory', '20 GB Persistent Storage', '1 TB Network Egress', '500 build min / mo', 'Community Support'],
  },
  {
    id: 'team',
    name: 'Team Tier',
    price: '$49/mo',
    desc: 'For small teams scaling microservices with dedicated SLA.',
    features: ['20 vCPU Compute', '40 GB Memory', '200 GB Persistent Storage', '5 TB Network Egress', '1,000 build min / mo', 'Priority Edge Routing'],
  },
  {
    id: 'scale',
    name: 'Scale Tier',
    price: '$120/mo',
    desc: 'Full production isolation with autoscaling and Anycast mesh.',
    current: true,
    features: ['50 vCPU Compute', '100 GB Memory', '1 TB Persistent Storage', '10 TB Network Egress', '2,000 build min / mo', '24/7 Dedicated Slack channel'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Tier',
    price: 'Custom',
    desc: 'Dedicated bare-metal edge clusters with HIPAA/SOC2 compliance.',
    features: ['Unlimited Compute', 'Dedicated Anycast IPs', 'Custom Persistent Backends', 'Custom SLA (99.99%)', 'Dedicated Security Engineer'],
  },
];

export default function BillingPage() {
  const { billing } = useKr0nStore();

  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('scale');
  const [planChangeSuccess, setPlanChangeSuccess] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(null);

  const handlePlanChange = (planId) => {
    setSelectedPlanId(planId);
    setPlanChangeSuccess(true);
    setTimeout(() => {
      setPlanChangeSuccess(false);
      setShowManageModal(false);
    }, 1500);
  };

  const handleDownloadInvoice = (inv) => {
    setDownloadNotice(`Downloading receipt for ${inv.id}...`);
    setTimeout(() => setDownloadNotice(null), 2500);
  };

  const totalEstimated = billing.costBreakdown.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Header ─── */}
      <div className='px-4 sm:px-6 lg:px-8 py-6 border-b border-kr0n-line bg-kr0n-black/40 shrink-0'>
        <div className='max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='space-y-1'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 border border-kr0n-line bg-kr0n-surface flex items-center justify-center text-white'>
                <CreditCard size={16} />
              </div>
              <h1 className='text-xl sm:text-2xl font-bold font-mono text-white tracking-wide uppercase'>
                Billing & Entitlements
              </h1>
            </div>
            <p className='text-xs font-mono text-kr0n-text-secondary'>
              Subscription plan tier, metered compute ledger, and invoice statements.
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <Link
              href='/usage'
              className='px-3 py-1.5 border border-kr0n-line hover:border-kr0n-line-strong text-xs font-mono text-kr0n-text-secondary hover:text-white transition-colors'
            >
              Usage Telemetry →
            </Link>
            <button
              type='button'
              onClick={() => setShowManageModal(true)}
              className='clipped-btn inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold transition-colors'
            >
              <span>Manage Plan</span>
            </button>
          </div>
        </div>
      </div>

      {downloadNotice && (
        <div className='sticky top-0 z-30 bg-kr0n-surface border-b border-kr0n-line-strong px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs font-mono text-white'>
          <CheckCircle2 size={14} className='text-emerald-400' />
          <span>{downloadNotice}</span>
        </div>
      )}

      <div className='flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8'>
        {/* ─── Current Plan & Cycle Overview ─── */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Active Plan Card */}
          <div className='border border-kr0n-line bg-kr0n-surface p-5 space-y-3 font-mono text-xs'>
            <div className='flex items-center justify-between'>
              <span className='text-[10px] text-kr0n-text-secondary uppercase tracking-widest font-bold'>
                Active Plan Tier
              </span>
              <span className='px-2 py-0.5 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase'>
                Subscribed
              </span>
            </div>
            <div>
              <div className='text-2xl font-bold text-white uppercase'>{billing.plan.name}</div>
              <div className='text-kr0n-text-secondary mt-0.5'>
                ${billing.plan.price} / month + metered resource consumption
              </div>
            </div>
            <div className='pt-2 border-t border-kr0n-line-soft text-[11px] text-kr0n-text-secondary flex justify-between'>
              <span>Renewal Date:</span>
              <span className='text-white font-bold'>{billing.plan.renewalDate}</span>
            </div>
          </div>

          {/* Month-to-Date Estimate Card */}
          <div className='border border-kr0n-line bg-kr0n-surface p-5 space-y-3 font-mono text-xs'>
            <div className='flex items-center justify-between'>
              <span className='text-[10px] text-kr0n-text-secondary uppercase tracking-widest font-bold'>
                Current Cycle Estimate
              </span>
              <span className='text-[10px] text-kr0n-text-secondary'>Oct 2026</span>
            </div>
            <div>
              <div className='text-2xl font-bold text-white tabular-nums'>
                ${totalEstimated.toFixed(2)}
              </div>
              <div className='text-kr0n-text-secondary mt-0.5'>
                Base platform ($120.00) + metered compute ($116.64)
              </div>
            </div>
            <div className='pt-2 border-t border-kr0n-line-soft text-[11px] text-emerald-400 flex items-center gap-1 font-bold'>
              <TrendingUp size={11} />
              <span>Within monthly budget alert limit ($300.00)</span>
            </div>
          </div>

          {/* Payment Method Notice Card */}
          <div className='border border-kr0n-line bg-kr0n-surface p-5 space-y-3 font-mono text-xs'>
            <span className='text-[10px] text-kr0n-text-secondary uppercase tracking-widest font-bold block'>
              Payment Method
            </span>
            <div className='flex items-center gap-3 py-1'>
              <div className='w-10 h-7 border border-kr0n-line bg-kr0n-black flex items-center justify-center font-bold text-white text-[10px]'>
                VISA
              </div>
              <div>
                <span className='text-white font-bold block'>•••• •••• •••• 4242</span>
                <span className='text-kr0n-muted text-[10px]'>Expires 08/28 · Demo Card</span>
              </div>
            </div>
            <div className='pt-2 border-t border-kr0n-line-soft text-[10px] text-kr0n-muted font-sans leading-tight'>
              Demonstration environment. No actual payment method or real currency charges are processed.
            </div>
          </div>
        </div>

        {/* ─── Entitlements Matrix ─── */}
        <div className='space-y-3 font-mono text-xs'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
              Plan Entitlements & Capacity Caps
            </h2>
            <Link
              href='/capacity'
              className='text-[11px] text-kr0n-text-secondary hover:text-white transition-colors'
            >
              Cluster Capacity →
            </Link>
          </div>

          <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
            <div className='p-3 bg-kr0n-black/60 grid grid-cols-3 text-[10px] text-kr0n-muted uppercase font-bold tracking-wider'>
              <span>Resource Dimension</span>
              <span>Included Entitlement</span>
              <span className='text-right'>Cycle Utilization</span>
            </div>
            {billing.plan.entitlements.map((ent, i) => (
              <div key={i} className='p-3.5 grid grid-cols-3 items-center hover:bg-white/[0.015] transition-colors'>
                <span className='font-bold text-white'>{ent.resource}</span>
                <span className='text-kr0n-text-secondary'>{ent.included}</span>
                <div className='text-right'>
                  <span className='text-emerald-400 font-bold'>{ent.used}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Metered Consumption Ledger ─── */}
        <div className='space-y-3 font-mono text-xs'>
          <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
            Month-to-Date Metered Breakdown
          </h2>

          <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
            <div className='p-3 bg-kr0n-black/60 grid grid-cols-12 text-[10px] text-kr0n-muted uppercase font-bold tracking-wider'>
              <span className='col-span-8'>Item & Consumption Details</span>
              <span className='col-span-4 text-right'>Amount (USD)</span>
            </div>
            {billing.costBreakdown.map((item, idx) => (
              <div key={idx} className='p-4 grid grid-cols-12 items-center hover:bg-white/[0.015] transition-colors'>
                <div className='col-span-8 space-y-0.5'>
                  <div className='text-white font-bold'>{item.item}</div>
                  <div className='text-[11px] text-kr0n-text-secondary font-sans'>{item.desc}</div>
                </div>
                <div className='col-span-4 text-right text-sm font-bold text-white tabular-nums'>
                  ${item.amount.toFixed(2)}
                </div>
              </div>
            ))}
            {/* Total Row */}
            <div className='p-4 bg-kr0n-black flex items-center justify-between font-bold text-sm'>
              <span className='uppercase tracking-wider text-white'>Total Estimated Charges</span>
              <span className='text-white tabular-nums text-base'>${totalEstimated.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ─── Invoice Statement History ─── */}
        <div className='space-y-3 font-mono text-xs'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
              Invoice & Statement History
            </h2>
            <span className='text-[10px] text-kr0n-muted'>{billing.invoices.length} Statements</span>
          </div>

          <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
            {billing.invoices.map((inv) => (
              <div key={inv.id} className='p-4 flex items-center justify-between gap-4 hover:bg-white/[0.015] transition-colors'>
                <div className='flex items-center gap-3'>
                  <Receipt size={14} className='text-kr0n-muted' />
                  <div>
                    <div className='flex items-center gap-2'>
                      <span className='text-white font-bold'>{inv.id}</span>
                      <span
                        className={`px-1.5 py-0.2 text-[9px] uppercase font-bold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                            : 'bg-white/10 text-zinc-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <div className='text-[10px] text-kr0n-text-secondary mt-0.5'>
                      {inv.period} · {inv.date}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-4'>
                  <span className='font-bold text-white tabular-nums text-sm'>
                    ${inv.amount.toFixed(2)}
                  </span>
                  <button
                    type='button'
                    onClick={() => handleDownloadInvoice(inv)}
                    className='p-1.5 border border-kr0n-line hover:border-white text-kr0n-text-secondary hover:text-white transition-colors'
                    title='Download Receipt'
                  >
                    <Download size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Manage Plan Dialog ─── */}
      {showManageModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-3xl w-full border border-kr0n-line bg-kr0n-canvas-raised p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-kr0n-line-soft pb-4'>
              <div>
                <h3 className='text-base font-bold text-white uppercase'>Manage Subscription Plan</h3>
                <p className='text-kr0n-text-secondary text-[11px] font-sans mt-0.5'>
                  Choose the plan tier matching your project workload and throughput requirements.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setShowManageModal(false)}
                className='p-1.5 text-kr0n-muted hover:text-white'
              >
                <X size={16} />
              </button>
            </div>

            {planChangeSuccess && (
              <div className='p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2'>
                <CheckCircle2 size={14} />
                <span>Plan tier updated successfully in simulated environment!</span>
              </div>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {AVAILABLE_PLANS.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`p-5 border space-y-4 flex flex-col justify-between ${
                      isSelected ? 'border-white bg-kr0n-surface' : 'border-kr0n-line bg-kr0n-surface/40'
                    }`}
                  >
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='font-bold text-white uppercase text-sm'>{p.name}</span>
                        <span className='font-bold text-white text-base'>{p.price}</span>
                      </div>
                      <p className='text-[11px] text-kr0n-text-secondary font-sans leading-snug'>{p.desc}</p>
                      <ul className='space-y-1.5 pt-2 text-[10px] text-kr0n-muted'>
                        {p.features.map((feat, idx) => (
                          <li key={idx} className='flex items-center gap-1.5 text-kr0n-text-secondary'>
                            <Check size={11} className='text-emerald-400 shrink-0' />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type='button'
                      onClick={() => handlePlanChange(p.id)}
                      className={`w-full py-2 uppercase font-bold text-xs tracking-wider transition-colors ${
                        isSelected
                          ? 'bg-white/10 text-white border border-white/20 cursor-default'
                          : 'bg-white hover:bg-neutral-200 text-black clipped-btn'
                      }`}
                    >
                      {isSelected ? 'Current Tier' : 'Select Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className='p-3 bg-kr0n-black border border-kr0n-line-soft text-[10px] text-kr0n-muted font-sans leading-relaxed'>
              <strong className='text-white font-mono'>DEMO NOTICE:</strong> Plan upgrades and downgrades are simulated client-side. No credit card charge or external gateway integration is performed.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
