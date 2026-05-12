import { LegalPage, s } from "../../components/LegalPage";

export const metadata = {
  title: "Privacy Policy – LiftSlate",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="April 29, 2026">
      <p style={s.p}>
        LiftSlate ("we", "our", or "the app") is operated by Ezequiel Garcia.
        This Privacy Policy explains how we collect, use, store, and protect
        your personal information when you use the LiftSlate mobile application.
      </p>
      <p style={s.p}>
        By using LiftSlate, you agree to the collection and use of information
        as described in this policy.
      </p>

      <h2 style={s.h2}>1. Information We Collect</h2>
      <p style={s.p}>
        We collect the following information to provide and improve the app:
      </p>

      <h3 style={s.h3}>a) Account Information</h3>
      <ul style={s.ul}>
        <li style={s.li}>Email address</li>
        <li style={s.li}>Display name</li>
        <li style={s.li}>
          Authentication credentials (securely managed by our authentication
          provider)
        </li>
      </ul>

      <h3 style={s.h3}>b) Fitness and Exercise Data</h3>
      <ul style={s.ul}>
        <li style={s.li}>
          Exercise data and lift records (max weights, sets, reps, percentages)
        </li>
        <li style={s.li}>Workout logs and history</li>
        <li style={s.li}>Notes added to exercises or workouts</li>
      </ul>
      <p style={s.p}>
        This data is used exclusively for app functionality (tracking your lifts
        and calculating training weights). It is not used for health analysis,
        diagnostics, or shared with health platforms.
      </p>

      <h3 style={s.h3}>c) Gym and Membership Data</h3>
      <ul style={s.ul}>
        <li style={s.li}>
          Gym information (name, description, logo image) if you create or join
          a gym
        </li>
        <li style={s.li}>
          Gym membership and role information (athlete, coach, admin)
        </li>
      </ul>

      <h3 style={s.h3}>d) Preferences</h3>
      <ul style={s.ul}>
        <li style={s.li}>Unit preference (kg or lbs)</li>
        <li style={s.li}>Rounding increment settings</li>
      </ul>

      <h3 style={s.h3}>e) Automatically Collected Information</h3>
      <ul style={s.ul}>
        <li style={s.li}>Device type and operating system version</li>
        <li style={s.li}>App crash reports and error logs (via Sentry)</li>
        <li style={s.li}>General app performance metrics</li>
      </ul>

      <h2 style={s.h2}>2. Information We Do NOT Collect</h2>
      <ul style={s.ul}>
        <li style={s.li}>We do not collect your location data.</li>
        <li style={s.li}>We do not collect biometric data.</li>
        <li style={s.li}>
          We do not collect financial or payment information.
        </li>
        <li style={s.li}>
          We do not use advertising identifiers or tracking pixels.
        </li>
        <li style={s.li}>
          We do not access your device contacts, camera, or microphone (camera
          access is only requested if you choose to upload a gym logo via the
          photo library).
        </li>
        <li style={s.li}>
          We do not integrate with Apple HealthKit, Google Health Connect, or
          any health platform.
        </li>
      </ul>

      <h2 style={s.h2}>3. How We Use Your Information</h2>
      <p style={s.p}>We use your information solely to:</p>
      <ul style={s.ul}>
        <li style={s.li}>
          Provide the core app functionality (tracking lifts, calculating
          training weights, managing workouts)
        </li>
        <li style={s.li}>
          Authenticate your account and maintain your session
        </li>
        <li style={s.li}>
          Enable gym features (creating, joining, and managing gyms)
        </li>
        <li style={s.li}>
          Send essential account-related communications (e.g., password resets,
          security alerts)
        </li>
        <li style={s.li}>Monitor and fix app errors and crashes</li>
        <li style={s.li}>Improve app performance and reliability</li>
      </ul>
      <p style={s.p}>
        We do <strong style={s.strong}>not</strong> use your information for
        advertising, marketing, profiling, or training AI/ML models. We do{" "}
        <strong style={s.strong}>not</strong> sell, rent, or trade your personal
        information to third parties.
      </p>

      <h2 style={s.h2}>4. Third-Party Services</h2>
      <p style={s.p}>
        We use the following third-party services to operate the app:
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          <strong style={s.strong}>Supabase</strong> (database and
          authentication) — stores your account and app data on secure cloud
          servers hosted on Amazon Web Services (AWS) in the West EU (Ireland)
          region (eu-west-1).{" "}
          <a href="https://supabase.com/privacy" style={s.a}>
            Supabase Privacy Policy
          </a>
          .
        </li>
        <li style={s.li}>
          <strong style={s.strong}>Sentry</strong> (error tracking) — captures
          crash reports and technical diagnostic data only. We do not
          intentionally send user-entered content to Sentry.{" "}
          <a href="https://sentry.io/privacy/" style={s.a}>
            Sentry Privacy Policy
          </a>
          .
        </li>
        <li style={s.li}>
          <strong style={s.strong}>Google OAuth</strong> (optional sign-in) — if
          you choose to sign in with Google, we only receive your email and
          name.{" "}
          <a href="https://policies.google.com/privacy" style={s.a}>
            Google Privacy Policy
          </a>
          .
        </li>
        <li style={s.li}>
          <strong style={s.strong}>Apple Sign-In</strong> (optional sign-in) —
          you may choose to hide your email.{" "}
          <a href="https://www.apple.com/legal/privacy/" style={s.a}>
            Apple Privacy Policy
          </a>
          .
        </li>
      </ul>

      <h2 style={s.h2}>5. Data Storage and Security</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          All data is transmitted over encrypted connections (TLS/HTTPS).
        </li>
        <li style={s.li}>
          Your data is stored on Supabase-managed servers hosted on AWS in the
          West EU (Ireland) region (eu-west-1).
        </li>
        <li style={s.li}>
          Authentication tokens are stored securely on your device using
          platform-native secure storage (Keychain on iOS, Keystore on Android).
        </li>
        <li style={s.li}>
          Database access is controlled through row-level security policies,
          ensuring users can only access their own data.
        </li>
      </ul>

      <h2 style={s.h2}>6. Data Retention</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          Your data is retained for as long as your account is active.
        </li>
        <li style={s.li}>
          When you delete your account, all your data is permanently deleted
          immediately. This action is irreversible.
        </li>
        <li style={s.li}>
          Anonymized crash data retained by Sentry may persist per their own
          retention policies but cannot be linked back to your identity.
        </li>
      </ul>

      <h2 style={s.h2}>7. Data Sharing</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          <strong style={s.strong}>Within your gym:</strong> your display name
          and role are visible to other gym members. Coaches and admins may view
          workouts assigned to you.
        </li>
        <li style={s.li}>
          <strong style={s.strong}>Error reports:</strong> anonymized crash data
          is sent to Sentry for debugging.
        </li>
        <li style={s.li}>
          <strong style={s.strong}>Legal requirements:</strong> we may disclose
          your information if required by law or court order.
        </li>
      </ul>

      <h2 style={s.h2}>8. Your Rights</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          <strong style={s.strong}>Access</strong> — all your data is visible
          within the app.
        </li>
        <li style={s.li}>
          <strong style={s.strong}>Correct</strong> — you can update your
          profile, exercises, and maxes at any time.
        </li>
        <li style={s.li}>
          <strong style={s.strong}>Delete</strong> — permanently delete your
          account from the Profile screen or by contacting us.
        </li>
        <li style={s.li}>
          <strong style={s.strong}>Data portability</strong> — contact us to
          request a copy of your data.
        </li>
      </ul>
      <p style={s.p}>
        To exercise any of these rights, contact us at{" "}
        <a href="mailto:liftslate.support@gmail.com" style={s.a}>
          liftslate.support@gmail.com
        </a>
        .
      </p>

      <h2 style={s.h2}>9. Account Deletion</h2>
      <p style={s.p}>
        You can delete your account at any time from the Profile screen. All
        your data is permanently and immediately removed. If you cannot access
        the app, email{" "}
        <a href="mailto:liftslate.support@gmail.com" style={s.a}>
          liftslate.support@gmail.com
        </a>{" "}
        and we will process your request within 7 business days.
      </p>

      <h2 style={s.h2}>10. Children's Privacy</h2>
      <p style={s.p}>
        LiftSlate is not directed at children under 13 (or 16 in the EEA). We do
        not knowingly collect personal information from children under these
        ages.
      </p>

      <h2 style={s.h2}>11. EEA and UK Residents (GDPR)</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          Legal basis: contract performance for core features; legitimate
          interests for diagnostic data.
        </li>
        <li style={s.li}>
          Your data is stored within the EEA on AWS servers in Ireland
          (eu-west-1).
        </li>
        <li style={s.li}>
          You have the right to restrict processing, object, and lodge a
          complaint with your local data protection authority.
        </li>
      </ul>

      <h2 style={s.h2}>12. California Residents (CCPA/CPRA)</h2>
      <p style={s.p}>
        We do not sell your personal information. You have the right to know
        what data we collect, request deletion, and opt-out of sale (not
        applicable). Contact{" "}
        <a href="mailto:liftslate.support@gmail.com" style={s.a}>
          liftslate.support@gmail.com
        </a>{" "}
        to exercise these rights.
      </p>

      <h2 style={s.h2}>13. Changes to This Policy</h2>
      <p style={s.p}>
        We may update this policy from time to time. Changes will be posted here
        with an updated effective date. Continued use of the app after changes
        constitutes acceptance.
      </p>

      <h2 style={s.h2}>14. Contact</h2>
      <p style={s.p}>
        <strong style={s.strong}>Ezequiel Garcia</strong>
        <br />
        Location: Israel
        <br />
        Email:{" "}
        <a href="mailto:liftslate.support@gmail.com" style={s.a}>
          liftslate.support@gmail.com
        </a>
      </p>
    </LegalPage>
  );
}
