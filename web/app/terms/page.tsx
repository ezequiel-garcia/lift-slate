import { LegalPage, s } from "../../components/LegalPage";

export const metadata = {
  title: "Terms of Service – LiftSlate",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="April 29, 2026">
      <p style={s.p}>
        Welcome to LiftSlate. These Terms of Service ("Terms") govern your use
        of the LiftSlate mobile application ("the app"), operated by Ezequiel
        Garcia ("we", "our", or "us").
      </p>
      <p style={s.p}>
        By creating an account or using the app, you agree to these Terms and
        our{" "}
        <a href="/privacy" style={s.a}>
          Privacy Policy
        </a>
        . If you do not agree, do not use the app.
      </p>

      <h2 style={s.h2}>1. Description of Service</h2>
      <p style={s.p}>
        LiftSlate is a strength training application that allows users to:
      </p>
      <ul style={s.ul}>
        <li style={s.li}>Track exercise maxes and personal records</li>
        <li style={s.li}>Calculate percentage-based training weights</li>
        <li style={s.li}>Create and join gyms for team workout management</li>
        <li style={s.li}>View and follow workouts created by coaches</li>
      </ul>

      <h2 style={s.h2}>2. Eligibility and Account Registration</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          You must be at least 13 years old (or 16 in the EEA) to use the app.
        </li>
        <li style={s.li}>
          If you are under 18, you represent that you have your parent&apos;s or
          legal guardian&apos;s permission.
        </li>
        <li style={s.li}>
          You must provide accurate and complete information when creating an
          account.
        </li>
        <li style={s.li}>
          You are responsible for maintaining the confidentiality of your
          account credentials and all activity under your account.
        </li>
        <li style={s.li}>
          One person may maintain one account. Duplicate accounts may be
          removed.
        </li>
      </ul>

      <h2 style={s.h2}>3. Acceptable Use</h2>
      <p style={s.p}>You agree not to:</p>
      <ul style={s.ul}>
        <li style={s.li}>Use the app for any unlawful purpose.</li>
        <li style={s.li}>
          Attempt to access other users&apos; data or accounts without
          authorization.
        </li>
        <li style={s.li}>
          Interfere with or disrupt the app&apos;s infrastructure or services.
        </li>
        <li style={s.li}>
          Upload malicious content, spam, or offensive material.
        </li>
        <li style={s.li}>
          Reverse engineer, decompile, or attempt to extract the source code.
        </li>
        <li style={s.li}>
          Use automated tools, bots, or scrapers to access the app.
        </li>
        <li style={s.li}>
          Impersonate any person or entity, or falsely represent your
          affiliation.
        </li>
      </ul>

      <h2 style={s.h2}>4. Health Disclaimer and Assumption of Risk</h2>
      <p style={s.p}>
        <strong style={s.strong}>
          LiftSlate is NOT a medical, health, or fitness advisory service and
          does NOT function as a personal trainer, physician, or licensed
          healthcare provider.
        </strong>
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          The app provides tools for tracking and calculating training weights.
          It does not provide medical advice, diagnoses, or treatment
          recommendations.
        </li>
        <li style={s.li}>
          Calculated training weights are mathematical suggestions based on your
          recorded maxes — not tailored to your health condition or physical
          limitations.
        </li>
        <li style={s.li}>
          Consult a qualified physician before beginning or modifying any
          exercise program, particularly if you have pre-existing medical
          conditions.
        </li>
        <li style={s.li}>
          <strong style={s.strong}>
            You voluntarily assume all risks associated with physical exercise,
            including muscle strains, joint injuries, cardiovascular events, and
            other physical injuries.
          </strong>
        </li>
        <li style={s.li}>
          We are not responsible for any injuries or damages resulting from
          exercises performed using data or workouts from the app.
        </li>
      </ul>

      <h2 style={s.h2}>5. Coach and Gym Content Disclaimer</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          Workouts created by coaches represent their independent programming
          and judgment.
        </li>
        <li style={s.li}>
          We do not verify, endorse, or guarantee the safety or suitability of
          coach-created workouts.
        </li>
        <li style={s.li}>
          Any coach-athlete relationship formed through the app is solely
          between those users. We are not a party to that relationship.
        </li>
      </ul>

      <h2 style={s.h2}>6. Gym Features</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          Gym owners are responsible for managing their gym and its members.
        </li>
        <li style={s.li}>
          Gym owners may not delete their account while they own an active gym.
          Ownership must be transferred or the gym deleted first.
        </li>
        <li style={s.li}>
          We reserve the right to remove gyms that violate these Terms.
        </li>
      </ul>

      <h2 style={s.h2}>7. User Content</h2>
      <p style={s.p}>
        You retain ownership of all content you create in the app. By using the
        app, you grant us a non-exclusive, royalty-free, worldwide license to
        store, process, and transmit your content solely to provide the service.
        This license terminates when you delete your content or account.
      </p>

      <h2 style={s.h2}>8. Intellectual Property</h2>
      <p style={s.p}>
        The LiftSlate app, including its design, code, and branding, is the
        property of Ezequiel Garcia and protected by applicable intellectual
        property laws. We grant you a limited, non-exclusive, revocable license
        to use the app for personal, non-commercial purposes.
      </p>

      <h2 style={s.h2}>9. Account Termination</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          You may delete your account at any time from the Profile screen.
          Deletion is permanent and irreversible.
        </li>
        <li style={s.li}>
          We reserve the right to suspend or terminate accounts that violate
          these Terms without prior notice.
        </li>
      </ul>

      <h2 style={s.h2}>10. Disclaimer of Warranties</h2>
      <p style={s.p}>
        The app is provided <strong style={s.strong}>"as is"</strong> and{" "}
        <strong style={s.strong}>"as available"</strong> without warranties of
        any kind. We do not warrant that the app will be uninterrupted,
        error-free, or free of harmful components.
      </p>

      <h2 style={s.h2}>11. Limitation of Liability</h2>
      <p style={s.p}>
        To the maximum extent permitted by law, we are not liable for any
        indirect, incidental, or consequential damages. Our total aggregate
        liability shall not exceed the amount you paid to use the app in the
        preceding 12 months, or $50 USD, whichever is greater.
      </p>

      <h2 style={s.h2}>12. Indemnification</h2>
      <p style={s.p}>
        You agree to indemnify and hold harmless Ezequiel Garcia from any
        claims, damages, or expenses arising from your use of the app, violation
        of these Terms, or content you upload.
      </p>

      <h2 style={s.h2}>13. Dispute Resolution</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          First, contact us at{" "}
          <a href="mailto:liftslate.support@gmail.com" style={s.a}>
            liftslate.support@gmail.com
          </a>{" "}
          to resolve informally. We will respond within 30 days.
        </li>
        <li style={s.li}>
          Unresolved disputes shall be submitted to the exclusive jurisdiction
          of the courts of Israel.
        </li>
        <li style={s.li}>
          You waive any right to participate in a class action lawsuit against
          us.
        </li>
      </ul>

      <h2 style={s.h2}>14. Governing Law</h2>
      <p style={s.p}>
        These Terms are governed by the laws of the State of Israel, without
        regard to conflict of law principles. This does not deprive you of
        mandatory consumer protection rights in your country of residence.
      </p>

      <h2 style={s.h2}>15. App Store Terms</h2>
      <p style={s.p}>
        These Terms are between you and Ezequiel Garcia, not Apple Inc. or
        Google LLC. The App Store Provider has no obligation to provide
        maintenance or support for the app and is not responsible for any claims
        relating to it.
      </p>

      <h2 style={s.h2}>16. Changes to These Terms</h2>
      <p style={s.p}>
        We may update these Terms from time to time. Updated Terms will be
        posted here with a new effective date. Continued use of the app after
        changes constitutes acceptance.
      </p>

      <h2 style={s.h2}>17. Contact</h2>
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
