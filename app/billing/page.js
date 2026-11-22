import ComingSoonPage from '@/components/common/ComingSoonPage';

export default function BillingPage() {
  return (
    <ComingSoonPage
      section='Workspace'
      title='Billing & Entitlements'
      description='Subscription plans, metered invoices, and payment method management are coming soon.'
      secondaryHref='/settings'
      secondaryLabel='Organization Settings'
    />
  );
}
