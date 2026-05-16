import { LegalLayout } from "@/components/legal/legal-layout"

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updatedAt="May 2026"
    >
      <section>
        <h2>1. Eligibility</h2>

        <p>
          You must be at least 13 years old to use CodeForge.
          By using the platform, you confirm that you meet this requirement.
        </p>
      </section>

      <section>
        <h2>2. Description of the Service</h2>

        <p>
          CodeForge is an AI-powered execution and learning platform
          designed to help developers improve practical and real-world
          programming skills through tasks, roadmaps, AI feedback,
          accountability systems, and execution tracking.
        </p>

        <p>
          Certain features may require a paid subscription.
        </p>
      </section>

      <section>
        <h2>3. Accounts</h2>

        <ul>
          <li>You are responsible for your account security.</li>
          <li>Account sharing is prohibited.</li>
          <li>Automated abuse or scraping is prohibited.</li>
          <li>Fraudulent activity may result in termination.</li>
        </ul>
      </section>

      <section>
        <h2>4. AI Features Disclaimer</h2>

        <p>
          CodeForge uses AI-generated systems and feedback.
          AI outputs may contain inaccuracies and should not be treated
          as professional, legal, financial, educational, or career advice.
        </p>

        <p>
          We do not guarantee employment, interview success,
          income, or specific learning outcomes.
        </p>
      </section>

      <section>
        <h2>5. Payments and Subscriptions</h2>

        <p>
          Paid subscriptions renew automatically unless canceled before
          the next billing cycle.
        </p>

        <p>
          Payments are processed through third-party payment providers.
          CodeForge does not store full payment card information.
        </p>

        <p>
          Certain offers, including beta access packs, may be one-time purchases.
        </p>
      </section>

      <section>
        <h2>6. User Content</h2>

        <p>
          You retain ownership of code, text, and submissions uploaded
          to CodeForge.
        </p>

        <p>
          By using the platform, you grant CodeForge permission to process
          this content for AI analysis, platform functionality,
          moderation, and improvement of the service.
        </p>
      </section>

      <section>
        <h2>7. Termination</h2>

        <p>
          CodeForge may suspend or terminate accounts involved in abuse,
          fraud, excessive automated usage, attacks on the platform,
          or violations of these Terms.
        </p>
      </section>

      <section>
        <h2>8. Limitation of Liability</h2>

        <p>
          CodeForge is provided on an “as is” and “as available” basis.
          We are not liable for indirect damages, loss of data,
          loss of profits, interrupted learning progress,
          or platform downtime.
        </p>
      </section>

      <section>
        <h2>9. Jurisdiction</h2>

        <p>
          These Terms are governed by the laws of Kazakhstan.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>

        <p>
          codeforgesupport@codeforgeapp.com
        </p>
      </section>
    </LegalLayout>
  )
}