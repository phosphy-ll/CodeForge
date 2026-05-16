import { LegalLayout } from "@/components/legal/legal-layout"

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updatedAt="May 2026"
    >
      <section>
        <h2>1. Information We Collect</h2>

        <p>
          CodeForge may collect:
        </p>

        <ul>
          <li>Email address</li>
          <li>Username and profile information</li>
          <li>Learning progress and roadmap data</li>
          <li>Task submissions, code, and AI interactions</li>
          <li>Analytics and usage information</li>
        </ul>
      </section>

      <section>
        <h2>2. How We Use Information</h2>

        <p>
          We use collected information to:
        </p>

        <ul>
          <li>Provide platform functionality</li>
          <li>Generate AI feedback and roadmaps</li>
          <li>Improve user experience</li>
          <li>Prevent abuse and fraud</li>
          <li>Process subscriptions and purchases</li>
        </ul>
      </section>

      <section>
        <h2>3. AI Processing</h2>

        <p>
          Some submissions and interactions may be processed
          by third-party AI providers in order to generate
          platform features and AI-based feedback.
        </p>
      </section>

      <section>
        <h2>4. Payments</h2>

        <p>
          Payments are processed by third-party providers.
          CodeForge does not store full payment card information.
        </p>
      </section>

      <section>
        <h2>5. Cookies and Local Storage</h2>

        <p>
          CodeForge may use cookies, local storage,
          and authentication tokens to maintain sessions,
          preferences, and platform functionality.
        </p>
      </section>

      <section>
        <h2>6. Data Protection</h2>

        <p>
          We take reasonable measures to protect user information,
          but no online platform can guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>7. Account Deletion</h2>

        <p>
          You may request account deletion by contacting support.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>

        <p>
          codeforgesupport@codeforgeapp.com
        </p>
      </section>
    </LegalLayout>
  )
}