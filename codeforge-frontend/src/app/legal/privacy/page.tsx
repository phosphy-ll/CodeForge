import { LegalLayout } from "@/components/legal/legal-layout"

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updatedAt="May 2026"
    >
      <h2>1. Eligibility</h2>

      <p>
        You must be at least 13 years old to use CodeForge.
      </p>

      <h2>2. Description of the Service</h2>

      <p>
        CodeForge is an AI-powered execution and learning platform
        designed to help developers improve real-world skills.
      </p>

      <h2>3. Accounts</h2>

      <ul>
        <li>No account sharing</li>
        <li>No abuse or automation</li>
        <li>No fraudulent activity</li>
      </ul>

      <h2>4. AI Features</h2>

      <p>
        AI outputs may contain inaccuracies and should not be treated
        as guaranteed professional advice.
      </p>

      <h2>5. Subscriptions</h2>

      <p>
        Paid subscriptions renew automatically unless canceled.
      </p>

      <h2>6. Contact</h2>

      <p>
        codeforgesupport@codeforgeapp.com
      </p>
    </LegalLayout>
  )
}