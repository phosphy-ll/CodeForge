import { LegalLayout } from "@/components/legal/legal-layout"

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      updatedAt="May 2026"
    >
      <h2>1. Refund Window</h2>

      <p>
        Refund requests may be submitted within 7 days of purchase.
      </p>

      <h2>2. Non-Refundable Usage</h2>

      <p>
        Refunds may be denied after substantial premium AI usage.
      </p>

      <h2>3. Subscription Renewals</h2>

      <p>
        Subscriptions renew automatically unless canceled before the
        next billing cycle.
      </p>

      <h2>4. Contact</h2>

      <p>
        codeforgesupport@codeforgeapp.com
      </p>
    </LegalLayout>
  )
}