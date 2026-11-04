import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { navigate as goTo } from '../../utils/navigate.js';

// ── Small helpers to keep the content readable ──────────────
const p = (text) => ({ type: 'p', text });
const ul = (items) => ({ type: 'ul', items });
const sub = (text) => ({ type: 'sub', text });

// ─────────────────────────────────────────────────────────────
// CONTENT
// ─────────────────────────────────────────────────────────────
const CONTENT = {
  // ═════════════════════════ TERMS OF USE ═════════════════════════
  terms: {
    title: 'Terms of Use',
    updated: 'Effective Date: [Insert launch date]  ·  Last Updated: [Insert date]',
    sections: [
      {
        heading: '1. Introduction',
        blocks: [
          p(`Welcome to EVOLV.`),
          p(`EVOLV ("EVOLV", "we", "us", or "our") is a skill-based social networking platform designed to help people explore their interests, share knowledge, develop skills, discover ideas, and learn from one another.`),
          p(`These Terms of Use ("Terms") govern your access to and use of the EVOLV website, mobile applications, features, and related services (collectively, the "Platform").`),
          p(`The Platform is operated by [Full Legal Name of Operating Entity], having its registered office at [Registered Address, India].`),
          p(`By creating an account, accessing, or using the Platform, you agree to these Terms and our Privacy Policy. If you do not agree, you must not use the Platform.`),
        ],
      },
      {
        heading: '2. Eligibility and Accounts',
        blocks: [
          p(`2.1 You must be at least 18 years old to create an account or use EVOLV under this version of the Terms.`),
          p(`2.2 You agree to provide accurate, current, and complete information during registration and to keep your account information reasonably up to date.`),
          p(`2.3 You are responsible for maintaining the confidentiality of your login credentials and for activities conducted through your account, subject to applicable law.`),
          p(`2.4 You must promptly notify us if you suspect unauthorized access to your account.`),
          p(`2.5 You may not create an account using another person's identity, impersonate another person or organization, or misrepresent your qualifications, experience, or skills.`),
          p(`2.6 We may request reasonable information to verify an account, investigate abuse, or protect the security of the Platform, where permitted by law.`),
        ],
      },
      {
        heading: '3. Purpose of EVOLV',
        blocks: [
          p(`EVOLV is intended to support meaningful discovery, learning, creativity, and personal development.`),
          p(`The Platform may provide features such as:`),
          ul([
            `Profiles describing your interests, skills, experiences, and learning goals.`,
            `Sharing text, photographs, short videos, and other supported content.`,
            `Discovering people, topics, skills, and learning opportunities.`,
            `Identifying people you have learned from and people who have learned from you.`,
            `Optional reactions, comments, and other forms of engagement.`,
            `AI-assisted content moderation, topic classification, skill identification, and personalized recommendations.`,
            `Additional community, communication, or learning features introduced over time.`,
          ]),
          p(`Available features may vary by version, location, and account eligibility.`),
          p(`EVOLV is not an educational institution, accreditation authority, or professional licensing body. Unless expressly stated otherwise, skills displayed on profiles are not independently certified or guaranteed by EVOLV.`),
        ],
      },
      {
        heading: '4. User Content and Ownership',
        blocks: [
          p(`4.1 "User Content" means content you submit, upload, publish, transmit, or otherwise make available through EVOLV, including text, images, videos, comments, profile information, and other materials.`),
          p(`4.2 You retain ownership of your User Content, subject to the rights you grant under these Terms and the rights of any third parties.`),
          p(`4.3 By submitting User Content, you grant EVOLV a non-exclusive, worldwide, royalty-free license to host, store, reproduce, process, adapt for technical compatibility, display, distribute, and make that content available as reasonably necessary to operate, secure, moderate, improve, and provide the Platform's features.`),
          p(`4.4 This license is limited to the purposes described in these Terms and our Privacy Policy. It does not transfer ownership of your content to EVOLV.`),
          p(`4.5 The license continues for as long as reasonably necessary to provide the relevant service, comply with legal obligations, resolve disputes, and maintain legitimate security or operational records. Content may remain in backups or in other users' interactions for a limited period after deletion, where technically necessary or legally permitted.`),
          p(`4.6 You represent that you own your User Content or have the permissions, licenses, and other rights necessary to upload and share it.`),
          p(`4.7 You must not upload content that infringes copyright, trademarks, privacy rights, publicity rights, or other legal rights.`),
          p(`4.8 You are responsible for the content you publish and the consequences of making it available to other users.`),
        ],
      },
      {
        heading: '5. Public and Shared Content',
        blocks: [
          p(`5.1 Certain profiles, posts, comments, and other content may be visible to other users or publicly accessible, depending on the Platform's features and your settings.`),
          p(`5.2 You should not assume that public content is private or that other users will keep shared information confidential.`),
          p(`5.3 Other users may copy, capture, download, quote, or redistribute content where the Platform or applicable technology permits it. EVOLV cannot guarantee that content shared with others can be completely recalled.`),
          p(`5.4 Before publishing, consider whether your content includes personal information, confidential material, or information about another person.`),
          p(`5.5 Your privacy settings may control some visibility, but they may not override content that has already been shared, lawfully retained, or independently copied by others.`),
        ],
      },
      {
        heading: '6. Acceptable Use',
        blocks: [
          p(`You agree to use EVOLV lawfully and respectfully.`),
          p(`You must not:`),
          ul([
            `a. Harass, threaten, stalk, intimidate, or repeatedly target another user.`,
            `b. Publish unlawful, defamatory, fraudulent, deceptive, or otherwise prohibited content.`,
            `c. Share sexual exploitation material involving minors, non-consensual intimate imagery, or content that unlawfully violates another person's privacy.`,
            `d. Promote violence, hatred, or discrimination, or encourage criminal activity.`,
            `e. Impersonate another person, fabricate credentials, or misrepresent your skills with the intent to deceive.`,
            `f. Infringe intellectual property rights or misuse another person's personal information.`,
            `g. Spam users, manipulate engagement, operate deceptive accounts, or artificially distort recommendations or skill recognition.`,
            `h. Use bots, scraping tools, or automated methods to access or collect data from EVOLV without our authorization, except where applicable law permits such activity.`,
            `i. Attempt to bypass access controls, interfere with Platform security, introduce malicious code, or disrupt the service.`,
            `j. Reverse engineer or misuse our systems except to the extent such restrictions are prohibited by applicable law.`,
            `k. Use the Platform to conduct scams, phishing, fraud, or unauthorized commercial solicitation.`,
            `l. Upload content or submit information designed to manipulate, evade, or disable our safety and moderation systems.`,
            `m. Use another user's content, personal information, or account without appropriate authorization.`,
            `n. Violate applicable laws, regulations, or these Terms.`,
          ]),
        ],
      },
      {
        heading: '7. Content Moderation and Platform Safety',
        blocks: [
          p(`7.1 EVOLV may use automated systems, AI models, user reports, and human review to detect potentially harmful content and enforce Platform policies.`),
          p(`7.2 Moderation may involve classifying content, assessing potential policy violations, limiting distribution, adding warnings, requesting edits, removing content, restricting features, or suspending accounts.`),
          p(`7.3 Automated moderation systems may make mistakes. Where appropriate and available, users may report a decision and request review through the Platform or our published support channels.`),
          p(`7.4 We may remove or restrict content that violates these Terms, our Community Guidelines, or applicable law. We may also take action where reasonably necessary to protect users, investigate abuse, comply with lawful orders, or preserve the security of EVOLV.`),
          p(`7.5 Where required by law, we will provide notices, reasons, complaint mechanisms, or review opportunities within the applicable scope and timelines.`),
          p(`7.6 We do not guarantee that every harmful, misleading, or prohibited item will be identified before it becomes visible.`),
        ],
      },
      {
        heading: '8. AI Features and Recommendations',
        blocks: [
          p(`8.1 EVOLV may use AI-assisted systems to analyze permitted profile information, declared interests, skills, learning goals, and content to provide discovery, classification, moderation, or recommendation features.`),
          p(`8.2 AI-generated skill suggestions and classifications are estimates. They may be incomplete, inaccurate, or outdated and should not be treated as professional assessments, verified qualifications, or definitive statements about a person.`),
          p(`8.3 Recommendations are intended to help users discover relevant people, subjects, and content. They do not guarantee the accuracy, quality, safety, or suitability of recommended material.`),
          p(`8.4 You must not treat AI-generated information as a substitute for independent judgment or professional advice.`),
          p(`8.5 AI processing of personal data is subject to our Privacy Policy and applicable law.`),
        ],
      },
      {
        heading: '9. Intellectual Property of EVOLV',
        blocks: [
          p(`The Platform, including its software, interface, design, branding, logos, visual elements, documentation, and original features, is owned by or licensed to EVOLV and is protected by applicable intellectual property laws.`),
          p(`Except as expressly permitted by law or by written authorization, you may not copy, reproduce, distribute, modify, sell, or commercially exploit EVOLV's protected materials.`),
          p(`No ownership rights in EVOLV's intellectual property are transferred to you through use of the Platform.`),
        ],
      },
      {
        heading: '10. Third-Party Services and Links',
        blocks: [
          p(`EVOLV may integrate with or link to third-party services, websites, hosting providers, analytics tools, or other technologies.`),
          p(`Third-party services may operate under their own terms and privacy policies. We are not responsible for third-party services that we do not control, except to the extent responsibility cannot be excluded under applicable law.`),
          p(`Your use of those services is subject to their applicable terms.`),
        ],
      },
      {
        heading: '11. Availability and Changes to the Platform',
        blocks: [
          p(`11.1 We may add, modify, suspend, or discontinue features to improve functionality, safety, security, or performance.`),
          p(`11.2 We aim to maintain reliable access but do not guarantee uninterrupted, error-free, or continuously available service.`),
          p(`11.3 The Platform may be unavailable because of maintenance, technical failures, security incidents, network issues, or circumstances outside our reasonable control.`),
          p(`11.4 We may update these Terms to reflect changes in our services, operations, or legal obligations. Material changes will be communicated through appropriate means where required by law.`),
          p(`11.5 The revised Terms will identify the updated effective date. Where consent is legally required for a change, we will obtain it before relying on that change.`),
        ],
      },
      {
        heading: '12. Account Suspension and Termination',
        blocks: [
          p(`12.1 You may stop using EVOLV and request account deletion through the available account settings or by contacting us.`),
          p(`12.2 We may restrict, suspend, or terminate an account when reasonably necessary because of a serious or repeated violation of these Terms, unlawful activity, security risks, fraud, or a legal obligation.`),
          p(`12.3 Where appropriate and legally permitted, we may provide notice of the action and an opportunity to appeal.`),
          p(`12.4 On account termination, your access to the Platform will cease. Your content and personal data will be handled according to our Privacy Policy, applicable retention requirements, and any necessary legal or security exceptions.`),
          p(`12.5 Termination does not remove obligations or liabilities that arose before termination or provisions that by their nature should survive it.`),
        ],
      },
      {
        heading: '13. Disclaimers',
        blocks: [
          p(`To the extent permitted by applicable law, EVOLV is provided on an "as available" basis.`),
          p(`We do not guarantee that:`),
          ul([
            `User-generated content is accurate, complete, or reliable.`,
            `Users possess the skills, qualifications, or experience they claim.`,
            `Interactions with other users will result in learning, employment, business opportunities, or personal growth.`,
            `AI classifications or recommendations will be accurate or unbiased.`,
            `The Platform will always be secure, uninterrupted, or free from errors.`,
          ]),
          p(`Users are responsible for evaluating information and exercising appropriate judgment when interacting with others.`),
          p(`Nothing in these Terms excludes any consumer, privacy, or other rights that cannot lawfully be excluded.`),
        ],
      },
      {
        heading: '14. Limitation of Liability',
        blocks: [
          p(`To the maximum extent permitted by applicable law, EVOLV will not be liable for indirect, incidental, special, or consequential losses arising from use of the Platform, including loss of profits, opportunities, or data, where such exclusions are legally permissible.`),
          p(`Nothing in these Terms excludes or limits liability for fraud, willful misconduct, or any liability that cannot be excluded or limited under applicable law.`),
          p(`Any other limitation of liability must be interpreted consistently with mandatory legal protections applicable to you.`),
        ],
      },
      {
        heading: '15. Indemnity',
        blocks: [
          p(`To the extent permitted by applicable law, you may be responsible for losses, claims, and reasonable costs directly arising from your unlawful conduct, infringement of third-party rights, or material breach of these Terms.`),
          p(`This provision does not impose liability for matters for which you are not legally responsible and does not override any non-waivable statutory rights.`),
        ],
      },
      {
        heading: '16. Governing Law and Disputes',
        blocks: [
          p(`These Terms are governed by the laws of India, subject to applicable mandatory laws and consumer protections.`),
          p(`Disputes will be addressed through good-faith discussions where practical. Nothing in this section prevents a user from approaching a competent court, regulator, or statutory grievance mechanism where permitted by law.`),
          p(`Any exclusive jurisdiction provision, if adopted, will be subject to applicable law.`),
        ],
      },
      {
        heading: '17. Grievances and Contact',
        blocks: [
          p(`For account issues, content complaints, legal notices, or questions about these Terms, contact:`),
          ul([
            `Operating Entity: [Full Legal Name]`,
            `Address: [Registered Office Address]`,
            `General Support: [Support Email]`,
            `Grievance Officer: [Name, once appointed]`,
            `Grievance Email: [Dedicated Grievance Email]`,
          ]),
          p(`Where required by applicable law, complaints will be acknowledged, processed, and resolved within the applicable statutory timelines.`),
        ],
      },
      {
        heading: '18. General Provisions',
        blocks: [
          p(`If any provision of these Terms is found unenforceable, the remaining provisions will continue to apply to the extent legally permissible.`),
          p(`Our failure to enforce a provision does not constitute a waiver of our rights.`),
          p(`You may not transfer your rights or obligations under these Terms without our consent, except where permitted by law. We may transfer our rights and obligations as part of a lawful business restructuring or transfer, subject to applicable law.`),
          p(`These Terms, together with the Privacy Policy and any applicable supplementary policies, govern your use of EVOLV.`),
        ],
      },
    ],
  },

  // ═════════════════════════ PRIVACY POLICY ═════════════════════════
  privacy: {
    title: 'Privacy Policy',
    updated: 'Effective Date: [Insert launch date]  ·  Last Updated: [Insert date]',
    sections: [
      {
        heading: '1. Introduction',
        blocks: [
          p(`EVOLV ("EVOLV", "we", "us", or "our") respects your privacy and is committed to handling personal data responsibly.`),
          p(`This Privacy Policy explains how we collect, use, disclose, store, and protect information when you access or use the EVOLV website, mobile applications, and related services (collectively, the "Platform").`),
          p(`EVOLV is a skill-based social networking platform designed to encourage learning, curiosity, meaningful discovery, and personal development.`),
          p(`The Platform is operated by [Full Legal Name of Operating Entity], having its registered office at [Registered Address, India].`),
          p(`By using EVOLV, you acknowledge that you have been provided access to this Privacy Policy. Where consent is required for particular processing, we will request that consent separately in accordance with applicable law.`),
        ],
      },
      {
        heading: '2. Scope of This Policy',
        blocks: [
          p(`This Privacy Policy applies to personal data processed in connection with EVOLV, including information collected through account registration, profile creation, content sharing, discovery features, user interactions, moderation, and customer support.`),
          p(`It also describes information processed by our service providers when they provide services on our behalf.`),
          p(`Third-party websites and services accessed through links or integrations may have separate privacy policies.`),
        ],
      },
      {
        heading: '3. Information We Collect',
        blocks: [
          p(`The information we collect depends on the features you use and the choices you make.`),

          sub(`3.1 Account and Registration Information`),
          p(`We may collect:`),
          ul([
            `Name or display name.`,
            `Username and profile identifier.`,
            `Email address and/or mobile number.`,
            `Authentication credentials or securely stored authentication-related information.`,
            `Date of birth or age information where necessary to establish eligibility.`,
            `Account preferences, settings, and registration status.`,
          ]),
          p(`We do not need to collect every listed category in every case. We will collect information appropriate to the features you use.`),

          sub(`3.2 Profile and Learning Information`),
          p(`You may provide:`),
          ul([
            `Profile photographs, biographies, and descriptions.`,
            `Skills, interests, hobbies, and areas of expertise.`,
            `Learning goals and subjects you wish to improve.`,
            `Educational or professional information you choose to publish.`,
            `Your connections to other users, including people you learn from and people who learn from you.`,
            `Other information you choose to include in your profile.`,
          ]),
          p(`Please avoid publishing sensitive or confidential information unless you understand the visibility and consequences of sharing it.`),

          sub(`3.3 User-Generated Content`),
          p(`When you publish or interact with content, we may process:`),
          ul([
            `Text posts, photographs, short videos, captions, and other supported media.`,
            `Comments, reactions, reports, and related interactions.`,
            `Content metadata, such as upload timestamps and technical file information.`,
            `Information associated with content moderation and enforcement decisions.`,
          ]),
          p(`The visibility of this information depends on the Platform's features and your applicable settings.`),

          sub(`3.4 Technical and Usage Information`),
          p(`When you use EVOLV, we may collect technical information such as:`),
          ul([
            `IP address and approximate network-derived location.`,
            `Device type, operating system, browser, and application version.`,
            `Log records, access timestamps, and diagnostic information.`,
            `Feature usage, interactions, and navigation events.`,
            `Crash reports, performance information, and security-related events.`,
            `Cookie identifiers or similar technologies, where used.`,
          ]),
          p(`We will use such information only for disclosed purposes, subject to applicable law and any consent requirements.`),

          sub(`3.5 Support and Communication Information`),
          p(`If you contact us, submit feedback, report content, appeal a moderation decision, or request assistance, we may process the information you provide and the records necessary to respond.`),

          sub(`3.6 Information from Other Sources`),
          p(`Where permitted by law, we may receive information from authentication providers, security services, or other integrated services you choose to use.`),
          p(`We will explain any additional collection that materially changes how personal data is processed.`),
        ],
      },
      {
        heading: '4. How We Use Information',
        blocks: [
          p(`We may process personal data for the following purposes:`),

          sub(`4.1 Account Management`),
          p(`To register accounts, authenticate users, maintain profiles, manage settings, and provide access to Platform features.`),

          sub(`4.2 Content Publishing and Social Features`),
          p(`To store and display content, enable user interactions, maintain learning connections, and provide the sharing functionality you request.`),

          sub(`4.3 Skill and Interest Identification`),
          p(`Where these features are enabled, we may analyze information you provide and content you publish to suggest relevant skills, topics, interests, and learning opportunities.`),
          p(`These suggestions are estimates and may be inaccurate. You should be able to correct or update profile information where the relevant functionality supports it.`),

          sub(`4.4 Discovery and Recommendations`),
          p(`We may use your declared interests, learning goals, selected preferences, and permitted usage signals to recommend relevant people, topics, skills, or content.`),
          p(`We aim to support meaningful discovery rather than maximize time spent scrolling. Recommendations may change as features and user preferences evolve.`),

          sub(`4.5 AI-Assisted Content Safety`),
          p(`We may process uploaded content using automated systems or AI models to detect potentially harmful material, identify policy violations, classify content, and support moderation.`),
          p(`Depending on the content and applicable rules, this may involve automated analysis, limited human review, restrictions, or removal.`),
          p(`AI systems can produce inaccurate results. We may use additional review or appeal processes where appropriate and available.`),

          sub(`4.6 Security and Fraud Prevention`),
          p(`To detect suspicious activity, prevent unauthorized access, investigate abuse, protect users, maintain service integrity, and respond to security incidents.`),

          sub(`4.7 Communication and Support`),
          p(`To send account-related notices, respond to requests, process complaints, explain material policy changes, and provide other communications necessary to operate the Platform.`),
          p(`Optional promotional communications, if introduced, will be handled in accordance with applicable law and available user choices.`),

          sub(`4.8 Product Development and Reliability`),
          p(`To diagnose errors, monitor performance, improve accessibility, evaluate features, and develop the Platform.`),
          p(`Where practical and appropriate, we may use aggregated or de-identified information for analytics and product improvement.`),

          sub(`4.9 Legal and Regulatory Compliance`),
          p(`To comply with applicable laws, lawful requests, legal processes, and obligations relating to safety, record retention, dispute resolution, and regulatory reporting.`),
          p(`We will assess requests for disclosure and respond as required by applicable law.`),
        ],
      },
      {
        heading: '5. AI Processing and Automated Systems',
        blocks: [
          p(`EVOLV may use AI-assisted technologies for content moderation, skill identification, topic classification, and recommendations.`),
          p(`Depending on the feature, these systems may analyze profile information, user-submitted content, selected preferences, and permitted interaction signals.`),
          p(`We use this processing to operate relevant features, improve discovery, and support Platform safety.`),
          p(`AI-generated classifications are not definitive judgments about a user's character, abilities, qualifications, or potential.`),
          p(`We will not represent an AI-generated skill suggestion as a verified credential unless a separate verification process has actually established that status.`),
          p(`Where applicable law requires additional notice, consent, safeguards, or a review mechanism for automated processing, we will implement those requirements.`),
          p(`Model training: We will not assume that permission to publish content automatically gives us permission to use identifiable personal data to train general-purpose AI models. Any such use will be assessed separately and conducted only where we have an appropriate lawful basis and satisfy applicable transparency, consent, and other legal requirements.`),
        ],
      },
      {
        heading: '6. How We Share Information',
        blocks: [
          p(`We do not disclose personal data indiscriminately. We may share information in the following circumstances:`),

          sub(`6.1 With Other Users`),
          p(`Information you publish publicly or share through social features may be visible to other users or, depending on settings, the public.`),
          p(`Your profile details, posts, learning connections, and interactions may therefore be visible according to the relevant feature's design.`),

          sub(`6.2 With Service Providers`),
          p(`We may share necessary information with providers supporting:`),
          ul([
            `Cloud hosting and infrastructure.`,
            `Databases, storage, and backups.`,
            `Authentication and account security.`,
            `AI processing and content moderation.`,
            `Error monitoring, diagnostics, and service reliability.`,
            `Customer support and communications.`,
          ]),
          p(`These providers will be engaged under appropriate contractual and security arrangements and may process information only as permitted by their role, instructions, and applicable law.`),

          sub(`6.3 For Legal and Safety Reasons`),
          p(`We may disclose information where required or authorized by applicable law, a valid legal process, or a competent authority, or where necessary to investigate security incidents, address unlawful activity, protect users, or establish or defend legal claims.`),

          sub(`6.4 Business Transfers`),
          p(`If EVOLV undergoes a merger, acquisition, restructuring, or transfer of assets, relevant information may be transferred as part of that transaction, subject to applicable law and appropriate safeguards.`),

          sub(`6.5 With Your Direction or Consent`),
          p(`We may share information for other purposes when you request the sharing or provide the consent required by law.`),
          p(`We do not sell personal data for money. We will not share personal data for unrelated third-party marketing purposes without an appropriate legal basis and any consent required by law.`),
        ],
      },
      {
        heading: '7. Public Content and Privacy Settings',
        blocks: [
          p(`EVOLV includes social and discovery features that may make certain information available to other users.`),
          p(`Before publishing content, consider whether you are comfortable with it being viewed, copied, or redistributed by others.`),
          p(`Changing your profile settings or deleting a post may not remove copies previously saved by other users, content quoted elsewhere, or information retained in legally required records.`),
          p(`We will provide privacy and visibility controls where supported by the Platform and will explain material limitations associated with those controls.`),
        ],
      },
      {
        heading: '8. Cookies and Similar Technologies',
        blocks: [
          p(`If EVOLV uses cookies, local storage, software development kits, pixels, or similar technologies, these may support:`),
          ul([
            `Authentication and session management.`,
            `Security and fraud prevention.`,
            `Remembering user preferences.`,
            `Diagnosing technical problems.`,
            `Measuring performance and improving functionality.`,
          ]),
          p(`Non-essential analytics, advertising, or tracking technologies, if introduced, will be managed in accordance with applicable consent requirements.`),
          p(`You may be able to control certain cookies through your browser or device settings. Blocking essential technologies may affect Platform functionality.`),
          p(`The specific technologies in use will be described in a cookie notice or additional disclosure where appropriate.`),
        ],
      },
      {
        heading: '9. Data Retention',
        blocks: [
          p(`We retain personal data only for as long as reasonably necessary for the purposes described in this Policy, subject to applicable legal obligations.`),
          p(`Retention periods may depend on the type of information and the reason it was collected.`),
          ul([
            `Account data: generally retained while your account remains active and for a limited period afterward where needed for deletion processing, legal obligations, or security.`,
            `User content: retained while published or otherwise needed to provide the requested service, subject to deletion requests and applicable exceptions.`,
            `Moderation and security records: retained for an appropriate period to investigate abuse, handle appeals, enforce policies, and comply with legal requirements.`,
            `Technical logs: retained for periods appropriate to troubleshooting, security, and operational needs.`,
            `Support and complaint records: retained as reasonably necessary to resolve issues, document decisions, and meet applicable obligations.`,
          ]),
          p(`We will establish and apply specific retention schedules appropriate to our operations and applicable law.`),
          p(`When information is no longer needed, we will delete it or irreversibly de-identify it, unless retention is required or permitted for a legitimate legal purpose.`),
        ],
      },
      {
        heading: '10. Account Deletion and Data Erasure',
        blocks: [
          p(`You may request account deletion through the Platform's available controls or by contacting us.`),
          p(`Following a valid request, we will process deletion in accordance with applicable law and our retention practices.`),
          p(`Some information may remain for a limited period in backups, security logs, dispute records, or other systems where necessary and legally permitted. Information may also need to be retained to comply with legal obligations, respond to lawful requests, establish legal claims, or prevent abuse.`),
          p(`Where complete immediate deletion is not possible, we will restrict further use as appropriate and delete the information when the applicable retention period or reason ends.`),
          p(`Deleting your account may remove access to your profile and content, subject to the exceptions described above.`),
        ],
      },
      {
        heading: '11. Data Security',
        blocks: [
          p(`We implement reasonable technical and organizational measures designed to protect personal data against unauthorized access, disclosure, alteration, loss, and misuse.`),
          p(`Depending on the system and the information involved, safeguards may include access controls, authentication protections, encryption, monitoring, backups, and security testing.`),
          p(`No online service can guarantee absolute security. You should protect your login credentials and notify us promptly if you suspect unauthorized account access.`),
          p(`If a personal data breach occurs, we will take appropriate steps to investigate, contain, and respond to the incident and provide notices to affected individuals or authorities where required by applicable law.`),
        ],
      },
      {
        heading: '12. International Data Transfers',
        blocks: [
          p(`EVOLV or its service providers may process or store information in locations outside the state or country where you reside.`),
          p(`Where international processing occurs, we will comply with applicable restrictions, transfer requirements, and safeguards, including any requirements imposed under Indian law or other applicable privacy laws.`),
          p(`The countries and providers involved may change as our infrastructure evolves. We will update relevant disclosures when required.`),
        ],
      },
      {
        heading: '13. Your Privacy Rights and Choices',
        blocks: [
          p(`Depending on the laws applicable to you, you may have rights to:`),
          ul([
            `Request access to information about the personal data we process.`,
            `Request correction or updating of inaccurate or incomplete information.`,
            `Request deletion of personal data, subject to applicable exceptions.`,
            `Withdraw consent where processing relies on consent.`,
            `Raise a grievance regarding our handling of personal data.`,
            `Nominate another person to exercise specified rights where provided by applicable law.`,
            `Exercise additional rights available under the privacy laws applicable to you.`,
          ]),
          p(`You may update certain profile information and preferences through the Platform where those controls are available.`),
          p(`To submit a privacy request, contact [Privacy Contact Email]. We may need to verify your identity before responding to protect your information.`),
          p(`We will respond within the timeframes required by applicable law. Withdrawal of consent does not invalidate processing lawfully conducted before withdrawal, and it may affect features that depend on the withdrawn consent.`),
        ],
      },
      {
        heading: `14. Children's Privacy`,
        blocks: [
          p(`Under this version of our Terms, EVOLV is intended for users aged 18 and above.`),
          p(`We do not knowingly permit individuals under 18 to create accounts under this eligibility policy. If we learn that an account has been created in violation of applicable age requirements, we will take appropriate steps, including restricting or deleting the account where required.`),
          p(`If you believe a minor has provided personal data to EVOLV, contact us at [Privacy Contact Email].`),
          p(`We will address such reports in accordance with applicable law. If EVOLV later permits younger users, we will implement the additional notices, safeguards, and consent mechanisms required for that audience before enabling the relevant service.`),
        ],
      },
      {
        heading: '15. Third-Party Services',
        blocks: [
          p(`EVOLV may rely on third-party infrastructure or integrate with external websites and services.`),
          p(`When you interact directly with those third parties, their privacy practices may apply independently of this Policy.`),
          p(`We encourage you to review the applicable policies of third-party services before providing them with information.`),
        ],
      },
      {
        heading: '16. Changes to This Privacy Policy',
        blocks: [
          p(`We may update this Policy as EVOLV introduces features, changes its data practices, or responds to legal requirements.`),
          p(`The updated Policy will identify its revision date. Where a change materially affects your privacy or requires renewed consent, we will provide appropriate notice and obtain consent where required by law.`),
          p(`We will not rely solely on continued use of the Platform as consent where applicable law requires a separate affirmative action.`),
        ],
      },
      {
        heading: '17. Contact and Grievance Redressal',
        blocks: [
          p(`For questions, requests, or complaints relating to personal data and privacy, contact:`),
          ul([
            `Operating Entity: [Full Legal Name]`,
            `Registered Address: [Registered Office Address, India]`,
            `Privacy Contact: [Privacy Email]`,
            `Grievance Officer: [Name, once appointed]`,
            `Grievance Email: [Dedicated Grievance Email]`,
          ]),
          p(`Please include sufficient details about your request to allow us to identify the issue. Avoid sending passwords or unnecessary sensitive information.`),
          p(`We will acknowledge and address complaints within the timeframes applicable under the relevant laws. Where required, we will provide information about the applicable escalation or appeal mechanism.`),
        ],
      },
      {
        heading: '18. Applicable Law',
        blocks: [
          p(`This Policy will be interpreted in accordance with the laws applicable to EVOLV and its processing of personal data, including applicable Indian data protection and information technology laws.`),
          p(`Where another jurisdiction's mandatory privacy law applies to a particular user or activity, the applicable legal requirements will also be respected.`),
        ],
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
function renderBlock(block, i) {
  if (block.type === 'sub') return <h3 key={i}>{block.text}</h3>;
  if (block.type === 'ul') {
    return (
      <ul key={i}>
        {block.items.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p key={i}>{block.text}</p>;
}

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

        {page.sections.map((s) => (
          <section key={s.heading} className="lg-section">
            <h2>{s.heading}</h2>
            {s.blocks.map(renderBlock)}
          </section>
        ))}

        <p className="lg-end">
          End of {page.title}
        </p>
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
.lg-body{max-width:760px;margin:20px auto 0;padding:28px;background:#fff;border:1px solid rgba(9,3,15,.08);border-radius:16px}
.lg-updated{font-size:13px;color:#8b7aa3;margin:0 0 24px}
.lg-section{margin-bottom:28px}
.lg-section h2{font-size:17px;font-weight:700;margin:0 0 10px;color:#1a0a2e}
.lg-section h3{font-size:15px;font-weight:600;margin:16px 0 6px;color:#2d1b4e}
.lg-section p{font-size:14px;line-height:1.7;margin:0 0 10px;color:#3b3347}
.lg-section ul{margin:0 0 10px;padding-left:20px}
.lg-section li{font-size:14px;line-height:1.7;color:#3b3347;margin-bottom:4px}
.lg-end{margin:32px 0 0;padding-top:16px;border-top:1px solid rgba(9,3,15,.08);font-size:13px;color:#8b7aa3;text-align:center}
@media(max-width:480px){.lg-body{margin:12px;padding:18px}}
`;