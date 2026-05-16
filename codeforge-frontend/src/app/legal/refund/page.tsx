import { LegalLayout } from "@/components/legal/legal-layout"

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      updatedAt="May 2026"
    >
      <section>
        <h2>1. Refund Window</h2>

        <p>
          Refund requests may be submitted within 7 days of purchase.
        </p>
      </section>

      <section>
        <h2>2. Subscription Renewals</h2>

        <p>
          Subscriptions renew automatically unless canceled before
          the next billing cycle.
        </p>

        <p>
          Renewal charges are generally non-refundable after renewal
          has been processed.
        </p>
      </section>

      <section>
        <h2>3. Beta Access Purchases</h2>

        <p>
          Beta access purchases may be refunded within 7 days unless
          substantial platform usage, premium AI usage,
          or abuse has occurred.
        </p>
      </section>

      <section>
        <h2>4. Abuse and Fraud</h2>

        <p>
          Refunds may be denied in cases involving abuse,
          fraudulent activity, chargeback abuse,
          or violations of the Terms of Service.
        </p>
      </section>

      <section>
        <h2>5. Contact</h2>

        <p>
          codeforgesupport@codeforgeapp.com
        </p>
      </section>
    </LegalLayout>
  )
}