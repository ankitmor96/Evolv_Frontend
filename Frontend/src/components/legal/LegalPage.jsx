import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

const goTo = (hash) => {
  window.location.hash = hash;
  window.dispatchEvent(new Event('navigated'));
};

const CONTENT = {
  terms: {
    title: 'Terms of Use',
    updated: 'Last updated: October 2026',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By creating an account or using EVOLV, you agree to these Terms of Use. If you do not agree, please do not use the platform.',
      },
      {
        heading: '2. Your Account',
        body: 'You are responsible for keeping your login details secure and for all activity under your account. You must provide accurate information when you sign up.',
      },
      {
        heading: '3. Community Guidelines',
        body: 'Be respectful. Do not post content that is harmful, hateful, misleading, or that infringes on the rights of others. We may remove content or suspend accounts that break these rules.',
      },
      {
        heading: '4. Your Content',
        body: 'You keep ownership of what you post. By posting on EVOLV, you give us permission to display and distribute your content within the platform so that other users can see it.',
      },
      {
        heading: '5. Termination',
        body: 'You can stop using EVOLV at any time. We may suspend or end access if these terms are violated.',
      },
      {
        heading: '6. Contact',
        body: 'Questions about these terms? Email support@evolv.app.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: October 2026',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect the details you give us (name, email, profile information, skills and interests) and the content you post on EVOLV.',
      },
      {
        heading: '2. How We Use Your Information',
        body: 'We use your information to run your account, personalise your feed, suggest people and skills, and keep the platform safe.',
      },
      {
        heading: '3. Sharing',
        body: 'Your public profile and posts are visible to other users. We do not sell your personal information to third parties.',
      },
      {
        heading: '4. Data Security',
        body: 'We use reasonable safeguards to protect your data, but no online service can guarantee complete security.',
      },
      {
        heading: '5. Your Choices',
        body: 'You can edit your profile and skills at any time, and you can request deletion of your account by contacting us.',
      },
      {
        heading: '6. Contact',
        body: 'Questions about privacy? Email support@evolv.app.',
      },
    ],
  },
};

export default function LegalPage({ type = 'terms' }) {
  const page = CONTENT[type] ?? CONTENT.terms;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  return (
    <div className="lg-page">
      <style>{CSS}</style>

      <header className="lg-header">
        <button
          className="lg-back"
          onClick={() => goTo('/profile')}
          aria-label="Back to profile"
        >
          <ArrowLeft size={20} />
        </button>
        <h1>{page.title}</h1>
      </header>

      <main className="lg-body">
        <p className="lg-updated">{page.updated}</p>
        <p className="lg-demo">
          This is demo content and will be replaced with our official policy.
        </p>

        {page.sections.map((s) => (
          <section key={s.heading} className="lg-section">
            <h2>{s.heading}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </main>
    </div>
  );
}

const CSS = `
.lg-page{min-height:100dvh;background:#f4f3fa;font-family:'Inter',sans-serif;color:#09030f;padding-bottom:48px}
.lg-header{display:flex;align-items:center;gap:12px;padding:16px;background:#fff;border-bottom:1px solid rgba(9,3,15,.08);position:sticky;top:0;z-index:5}
.lg-header h1{font-size:18px;font-weight:700;margin:0}
.lg-back{width:38px;height:38px;border-radius:12px;border:1px solid rgba(9,3,15,.12);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.lg-back:hover{border-color:#aa45f5;color:#aa45f5}
.lg-body{max-width:760px;margin:20px auto 0;padding:24px;background:#fff;border:1px solid rgba(9,3,15,.08);border-radius:16px}
.lg-updated{font-size:13px;color:#8b7aa3;margin:0 0 8px}
.lg-demo{font-size:13px;background:#f7efff;color:#7a2bd1;padding:8px 12px;border-radius:10px;margin:0 0 20px}
.lg-section{margin-bottom:20px}
.lg-section h2{font-size:16px;font-weight:700;margin:0 0 6px}
.lg-section p{font-size:14px;line-height:1.65;margin:0;color:#3b3347}
@media(max-width:480px){.lg-body{margin:12px;padding:18px}}
`;