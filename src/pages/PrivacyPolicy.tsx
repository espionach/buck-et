import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLegalUpdates } from "@/hooks/useLegalUpdates";

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-base font-bold text-foreground mt-6 mb-2">{children}</h2>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">{children}</h3>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>
);

const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mb-3 space-y-1">
    {children}
  </ul>
);

const PrivacyPolicy = () => {
  const nav = useNavigate();
  const { acknowledgeLatest } = useLegalUpdates();

  useEffect(() => {
    window.scrollTo(0, 0);
    acknowledgeLatest("privacy");
  }, [acknowledgeLatest]);

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav("/settings")}
          className="p-2 -ml-2 text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Privacy Policy</h1>
      </div>

      <p className="text-xs text-muted-foreground mb-4">Last updated May 06, 2026</p>

      <P>
        This Privacy Notice for Buck-et ("we," "us," or "our"), describes how and why we might
        access, collect, store, use, and/or share ("process") your personal information when you
        use our services ("Services"), including when you:
      </P>
      <UL>
        <li>
          Download and use our mobile application (Buck-et), or any other application of ours that
          links to this Privacy Notice
        </li>
        <li>
          Use Buck-et. A mobile app that turns "we should do this sometime" into actual sidequests
          with your friends. You can create, vote on, join, and complete shared activities that are
          organized in one place. It makes planning sidequests easier, more fun, and a little
          harder to back out of.
        </li>
        <li>Engage with us in other related ways, including any marketing or events</li>
      </UL>
      <P>
        Questions or concerns? Reading this Privacy Notice will help you understand your privacy
        rights and choices. We are responsible for making decisions about how your personal
        information is processed. If you do not agree with our policies and practices, please do
        not use our Services. If you still have any questions or concerns, please contact us at{" "}
        <a href="mailto:bucketapp.support@gmail.com" className="text-primary font-semibold">
          bucketapp.support@gmail.com
        </a>
        .
      </P>

      <H2>Summary of Key Points</H2>
      <P>
        This summary provides key points from our Privacy Notice, but you can find out more
        details about any of these topics by clicking the link following each key point or by
        using our table of contents below to find the section you are looking for.
      </P>
      <P>
        <strong className="text-foreground">What personal information do we process?</strong> When
        you visit, use, or navigate our Services, we may process personal information depending on
        how you interact with us and the Services, the choices you make, and the products and
        features you use.
      </P>
      <P>
        <strong className="text-foreground">
          Do we process any sensitive personal information?
        </strong>{" "}
        Some of the information may be considered "special" or "sensitive" in certain
        jurisdictions, for example your racial or ethnic origins, sexual orientation, and
        religious beliefs. We do not process sensitive personal information.
      </P>
      <P>
        <strong className="text-foreground">
          Do we collect any information from third parties?
        </strong>{" "}
        We do not collect any information from third parties.
      </P>
      <P>
        <strong className="text-foreground">How do we process your information?</strong> We
        process your information to provide, improve, and administer our Services, communicate
        with you, for security and fraud prevention, and to comply with law. We may also process
        your information for other purposes with your consent. We process your information only
        when we have a valid legal reason to do so.
      </P>
      <P>
        <strong className="text-foreground">
          In what situations and with which parties do we share personal information?
        </strong>{" "}
        We may share information in specific situations and with specific third parties.
      </P>
      <P>
        <strong className="text-foreground">How do we keep your information safe?</strong> We have
        adequate organizational and technical processes and procedures in place to protect your
        personal information. However, no electronic transmission over the internet or information
        storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee
        that hackers, cybercriminals, or other unauthorized third parties will not be able to
        defeat our security and improperly collect, access, steal, or modify your information.
      </P>
      <P>
        <strong className="text-foreground">What are your rights?</strong> Depending on where you
        are located geographically, the applicable privacy law may mean you have certain rights
        regarding your personal information.
      </P>
      <P>
        <strong className="text-foreground">How do you exercise your rights?</strong> The easiest
        way to exercise your rights is by visiting{" "}
        <a
          href="https://forms.gle/S8384AgTtxqYrhZ88"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold"
        >
          https://forms.gle/S8384AgTtxqYrhZ88
        </a>
        , or by contacting us. We will consider and act upon any request in accordance with
        applicable data protection laws.
      </P>
      <P>
        Want to learn more about what we do with any information we collect? Review the Privacy
        Notice in full.
      </P>

      <H2>Table of Contents</H2>
      <UL>
        <li>1. What information do we collect?</li>
        <li>2. How do we process your information?</li>
        <li>3. What legal bases do we rely on to process your personal information?</li>
        <li>4. When and with whom do we share your personal information?</li>
        <li>5. Is your information transferred internationally?</li>
        <li>6. How long do we keep your information?</li>
        <li>7. How do we keep your information safe?</li>
        <li>8. Do we collect information from minors?</li>
        <li>9. What are your privacy rights?</li>
        <li>10. Controls for do-not-track features</li>
        <li>11. Do United States residents have specific privacy rights?</li>
        <li>12. Do we make updates to this notice?</li>
        <li>13. How can you contact us about this notice?</li>
        <li>14. How can you review, update, or delete the data we collect from you?</li>
      </UL>

      <H2>1. What Information Do We Collect?</H2>
      <H3>Personal information you disclose to us</H3>
      <P>
        <em>In Short:</em> We collect personal information that you provide to us.
      </P>
      <P>
        We collect personal information that you voluntarily provide to us when you register on
        the Services, express an interest in obtaining information about us or our products and
        Services, when you participate in activities on the Services, or otherwise when you
        contact us.
      </P>
      <P>
        <strong className="text-foreground">Personal Information Provided by You.</strong> The
        personal information that we collect depends on the context of your interactions with us
        and the Services, the choices you make, and the products and features you use. The
        personal information we collect may include the following:
      </P>
      <UL>
        <li>names</li>
        <li>email addresses</li>
        <li>usernames</li>
        <li>passwords</li>
        <li>contact or authentication data</li>
        <li>contact preferences</li>
      </UL>
      <P>
        <strong className="text-foreground">Sensitive Information.</strong> We do not process
        sensitive information.
      </P>
      <P>
        <strong className="text-foreground">Application Data.</strong> If you use our
        application(s), we also may collect the following information if you choose to provide us
        with access or permission:
      </P>
      <UL>
        <li>
          <strong className="text-foreground">Mobile Device Access.</strong> We may request access
          or permission to certain features from your mobile device, including your mobile
          device's camera, reminders, and other features. If you wish to change our access or
          permissions, you may do so in your device's settings.
        </li>
        <li>
          <strong className="text-foreground">Push Notifications.</strong> We may request to send
          you push notifications regarding your account or certain features of the application(s).
          If you wish to opt out from receiving these types of communications, you may turn them
          off in your device's settings.
        </li>
      </UL>
      <P>
        This information is primarily needed to maintain the security and operation of our
        application(s), for troubleshooting, and for our internal analytics and reporting
        purposes.
      </P>
      <P>
        All personal information that you provide to us must be true, complete, and accurate, and
        you must notify us of any changes to such personal information.
      </P>

      <H2>2. How Do We Process Your Information?</H2>
      <P>
        <em>In Short:</em> We process your information to provide, improve, and administer our
        Services, communicate with you, for security and fraud prevention, and to comply with law.
        We process the personal information for the following purposes listed below. We may also
        process your information for other purposes only with your prior explicit consent.
      </P>
      <P>
        We process your personal information for a variety of reasons, depending on how you
        interact with our Services, including:
      </P>
      <UL>
        <li>
          To facilitate account creation and authentication and otherwise manage user accounts. We
          may process your information so you can create and log in to your account, as well as
          keep your account in working order.
        </li>
        <li>
          To deliver and facilitate delivery of services to the user. We may process your
          information to provide you with the requested service.
        </li>
        <li>
          To respond to user inquiries/offer support to users. We may process your information to
          respond to your inquiries and solve any potential issues you might have with the
          requested service.
        </li>
        <li>
          To send administrative information to you. We may process your information to send you
          details about our products and services, changes to our terms and policies, and other
          similar information.
        </li>
        <li>
          To enable user-to-user communications. We may process your information if you choose to
          use any of our offerings that allow for communication with another user.
        </li>
        <li>
          To save or protect an individual's vital interest. We may process your information when
          necessary to save or protect an individual's vital interest, such as to prevent harm.
        </li>
      </UL>

      <H2>3. What Legal Bases Do We Rely on to Process Your Information?</H2>
      <P>
        <em>In Short:</em> We only process your personal information when we believe it is necessary
        and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with
        your consent, to comply with laws, to provide you with services to enter into or fulfill our
        contractual obligations, to protect your rights, or to fulfill our legitimate business
        interests.
      </P>
      <P>
        <em>
          <strong>If you are located in the EU or UK, this section applies to you.</strong>
        </em>
      </P>
      <P>
        The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid
        legal bases we rely on in order to process your personal information. As such, we may rely
        on the following legal bases to process your personal information:
      </P>
      <UL>
        <li>
          <strong className="text-foreground">Consent.</strong> We may process your information if
          you have given us permission (i.e., consent) to use your personal information for a
          specific purpose. You can withdraw your consent at any time. Learn more about
          withdrawing your consent.
        </li>
        <li>
          <strong className="text-foreground">Performance of a Contract.</strong> We may process
          your personal information when we believe it is necessary to fulfill our contractual
          obligations to you, including providing our Services or at your request prior to entering
          into a contract with you.
        </li>
        <li>
          <strong className="text-foreground">Legal Obligations.</strong> We may process your
          information where we believe it is necessary for compliance with our legal obligations,
          such as to cooperate with a law enforcement body or regulatory agency, exercise or defend
          our legal rights, or disclose your information as evidence in litigation in which we are
          involved.
        </li>
        <li>
          <strong className="text-foreground">Vital Interests.</strong> We may process your
          information where we believe it is necessary to protect your vital interests or the
          vital interests of a third party, such as situations involving potential threats to the
          safety of any person.
        </li>
      </UL>
      <P>
        <em>
          <strong>If you are located in Canada, this section applies to you.</strong>
        </em>
      </P>
      <P>
        We may process your information if you have given us specific permission (i.e., express
        consent) to use your personal information for a specific purpose, or in situations where
        your permission can be inferred (i.e., implied consent). You can withdraw your consent at
        any time.
      </P>
      <P>
        In some exceptional cases, we may be legally permitted under applicable law to process your
        information without your consent, including, for example:
      </P>
      <UL>
        <li>
          If collection is clearly in the interests of an individual and consent cannot be obtained
          in a timely way
        </li>
        <li>For investigations and fraud detection and prevention</li>
        <li>For business transactions provided certain conditions are met</li>
        <li>
          If it is contained in a witness statement and the collection is necessary to assess,
          process, or settle an insurance claim
        </li>
        <li>
          For identifying injured, ill, or deceased persons and communicating with next of kin
        </li>
        <li>
          If we have reasonable grounds to believe an individual has been, is, or may be victim of
          financial abuse
        </li>
        <li>
          If it is reasonable to expect collection and use with consent would compromise the
          availability or the accuracy of the information and the collection is reasonable for
          purposes related to investigating a breach of an agreement or a contravention of the laws
          of Canada or a province
        </li>
        <li>
          If disclosure is required to comply with a subpoena, warrant, court order, or rules of
          the court relating to the production of records
        </li>
        <li>
          If it was produced by an individual in the course of their employment, business, or
          profession and the collection is consistent with the purposes for which the information
          was produced
        </li>
        <li>
          If the collection is solely for journalistic, artistic, or literary purposes
        </li>
        <li>If the information is publicly available and is specified by the regulations</li>
        <li>
          We may disclose de-identified information for approved research or statistics projects,
          subject to ethics oversight and confidentiality commitments
        </li>
      </UL>

      <H2>4. When and With Whom Do We Share Your Personal Information?</H2>
      <P>
        <em>In Short:</em> We may share information in specific situations described in this
        section and/or with the following third parties.
      </P>
      <P>We may need to share your personal information in the following situations:</P>
      <UL>
        <li>
          <strong className="text-foreground">Business Transfers.</strong> We may share or
          transfer your information in connection with, or during negotiations of, any merger,
          sale of company assets, financing, or acquisition of all or a portion of our business to
          another company.
        </li>
        <li>
          <strong className="text-foreground">Other Users.</strong> When you share personal
          information (for example, by posting comments, contributions, or other content to the
          Services) or otherwise interact with public areas of the Services, such personal
          information may be viewed by all users and may be publicly made available outside the
          Services in perpetuity. Similarly, other users will be able to view descriptions of
          your activity, communicate with you within our Services, and view your profile.
        </li>
      </UL>

      <H2>5. Is Your Information Transferred Internationally?</H2>
      <P>
        <em>In Short:</em> We may transfer, store, and process your information in countries other
        than your own.
      </P>
      <P>
        Our servers are located in the United States. Regardless of your location, please be aware
        that your information may be transferred to, stored by, and processed by us in our
        facilities and in the facilities of the third parties with whom we may share your personal
        information (see "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?" above),
        including facilities in the United States and other countries.
      </P>
      <P>
        If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or
        Switzerland, then these countries may not necessarily have data protection laws or other
        similar laws as comprehensive as those in your country. However, we will take all necessary
        measures to protect your personal information in accordance with this Privacy Notice and
        applicable law.
      </P>
      <P>
        <strong className="text-foreground">European Commission's Standard Contractual Clauses:</strong>
      </P>
      <P>
        We have implemented measures to protect your personal information, including by using the
        European Commission's Standard Contractual Clauses for transfers of personal information
        between our group companies and between us and our third-party providers. These clauses
        require all recipients to protect all personal information that they process originating
        from the EEA or UK in accordance with European data protection laws and regulations. Our
        Standard Contractual Clauses can be provided upon request. We have implemented similar
        appropriate safeguards with our third-party service providers and partners and further
        details can be provided upon request.
      </P>

      <H2>6. How Long Do We Keep Your Information?</H2>
      <P>
        <em>In Short:</em> We keep your information for as long as necessary to fulfill the
        purposes outlined in this Privacy Notice unless otherwise required by law.
      </P>
      <P>
        We will only keep your personal information for as long as it is necessary for the purposes
        set out in this Privacy Notice, unless a longer retention period is required or permitted by
        law (such as tax, accounting, or other legal requirements). No purpose in this notice will
        require us keeping your personal information for longer than the period of time in which
        users have an account with us.
      </P>
      <P>
        When we have no ongoing legitimate business need to process your personal information, we
        will either delete or anonymize such information, or, if this is not possible (for example,
        because your personal information has been stored in backup archives), then we will securely
        store your personal information and isolate it from any further processing until deletion is
        possible.
      </P>

      <H2>7. How Do We Keep Your Information Safe?</H2>
      <P>
        <em>In Short:</em> We aim to protect your personal information through a system of
        organizational and technical security measures.
      </P>
      <P>
        We have implemented appropriate and reasonable technical and organizational security
        measures designed to protect the security of any personal information we process. However,
        despite our safeguards and efforts to secure your information, no electronic transmission
        over the Internet or information storage technology can be guaranteed to be 100% secure, so
        we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third
        parties will not be able to defeat our security and improperly collect, access, steal, or
        modify your information. Although we will do our best to protect your personal information,
        transmission of personal information to and from our Services is at your own risk. You
        should only access the Services within a secure environment.
      </P>

      <H2>8. Do We Collect Information From Minors?</H2>
      <P>
        <em>In Short:</em> We do not knowingly collect data from or market to children under 18
        years of age or the equivalent age as specified by law in your jurisdiction.
      </P>
      <P>
        We do not knowingly collect, solicit data from, or market to children under 18 years of age
        or the equivalent age as specified by law in your jurisdiction, nor do we knowingly sell
        such personal information. By using the Services, you represent that you are at least 18 or
        the equivalent age as specified by law in your jurisdiction or that you are the parent or
        guardian of such a minor and consent to such minor dependent's use of the Services. If we
        learn that personal information from users less than 18 years of age or the equivalent age
        as specified by law in your jurisdiction has been collected, we will deactivate the account
        and take reasonable measures to promptly delete such data from our records. If you become
        aware of any data we may have collected from children under age 18 or the equivalent age as
        specified by law in your jurisdiction, please contact us at{" "}
        <a href="mailto:bucketapp.support@gmail.com" className="text-primary font-semibold">
          bucketapp.support@gmail.com
        </a>
        .
      </P>

      <H2>9. What Are Your Privacy Rights?</H2>
      <P>
        <em>In Short:</em> Depending on your state of residence in the US or in some regions, such
        as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have
        rights that allow you greater access to and control over your personal information. You may
        review, change, or terminate your account at any time, depending on your country, province,
        or state of residence.
      </P>
      <P>
        In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under
        applicable data protection laws. These may include the right (i) to request access and
        obtain a copy of your personal information, (ii) to request rectification or erasure; (iii)
        to restrict the processing of your personal information; (iv) if applicable, to data
        portability; and (v) not to be subject to automated decision-making. If a decision that
        produces legal or similarly significant effects is made solely by automated means, we will
        inform you, explain the main factors, and offer a simple way to request human review. In
        certain circumstances, you may also have the right to object to the processing of your
        personal information. You can make such a request by contacting us by using the contact
        details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.
      </P>
      <P>
        We will consider and act upon any request in accordance with applicable data protection
        laws.
      </P>
      <P>
        If you are located in the EEA or UK and you believe we are unlawfully processing your
        personal information, you also have the right to complain to your Member State data
        protection authority or UK data protection authority.
      </P>
      <P>
        If you are located in Switzerland, you may contact the Federal Data Protection and
        Information Commissioner.
      </P>
      <P>
        <strong className="text-foreground">Withdrawing your consent:</strong> If we are relying
        on your consent to process your personal information, which may be express and/or implied
        consent depending on the applicable law, you have the right to withdraw your consent at
        any time. You can withdraw your consent at any time by contacting us by using the contact
        details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.
      </P>
      <P>
        However, please note that this will not affect the lawfulness of the processing before its
        withdrawal nor, when applicable law allows, will it affect the processing of your personal
        information conducted in reliance on lawful processing grounds other than consent.
      </P>
      <H3>Account Information</H3>
      <P>
        If you would at any time like to review or change the information in your account or
        terminate your account, you can:
      </P>
      <UL>
        <li>Log in to your account settings and update your user account.</li>
      </UL>
      <P>
        Upon your request to terminate your account, we will deactivate or delete your account and
        information from our active databases. However, we may retain some information in our
        files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our
        legal terms and/or comply with applicable legal requirements.
      </P>
      <P>
        If you have questions or comments about your privacy rights, you may email us at{" "}
        <a href="mailto:bucketapp.support@gmail.com" className="text-primary font-semibold">
          bucketapp.support@gmail.com
        </a>
        .
      </P>

      <H2>10. Controls for Do-Not-Track Features</H2>
      <P>
        Most web browsers and some mobile operating systems and mobile applications include a
        Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference
        not to have data about your online browsing activities monitored and collected. At this
        stage, no uniform technology standard for recognizing and implementing DNT signals has
        been finalized. As such, we do not currently respond to DNT browser signals or any other
        mechanism that automatically communicates your choice not to be tracked online. If a
        standard for online tracking is adopted that we must follow in the future, we will inform
        you about that practice in a revised version of this Privacy Notice.
      </P>
      <P>
        California law requires us to let you know how we respond to web browser DNT signals.
        Because there currently is not an industry or legal standard for recognizing or honoring
        DNT signals, we do not respond to them at this time.
      </P>

      <H2>11. Do United States Residents Have Specific Privacy Rights?</H2>
      <P>
        <em>In Short:</em> If you are a resident of California, Colorado, Connecticut, Delaware,
        Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire,
        New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you may have the
        right to request access to and receive details about the personal information we maintain
        about you and how we have processed it, correct inaccuracies, get a copy of, or delete
        your personal information. You may also have the right to withdraw your consent to our
        processing of your personal information. These rights may be limited in some circumstances
        by applicable law. More information is provided below.
      </P>
      <H3>Categories of Personal Information We Collect</H3>
      <P>
        The table below shows the categories of personal information we have collected in the past
        twelve (12) months. The table includes illustrative examples of each category and does not
        reflect the personal information we collect from you. For a comprehensive inventory of all
        personal information we process, please refer to the section "WHAT INFORMATION DO WE
        COLLECT?"
      </P>
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-xs text-left border border-border rounded-lg">
          <thead className="bg-muted/50 text-foreground">
            <tr>
              <th className="p-2 border-b border-border font-semibold">Category</th>
              <th className="p-2 border-b border-border font-semibold">Examples</th>
              <th className="p-2 border-b border-border font-semibold">Collected</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {[
              ["A. Identifiers", "Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal identifier, online identifier, Internet Protocol address, email address, and account name"],
              ["B. Personal information as defined in the California Customer Records statute", "Name, contact information, education, employment, employment history, and financial information"],
              ["C. Protected classification characteristics under state or federal law", "Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data"],
              ["D. Commercial information", "Transaction information, purchase history, financial details, and payment information"],
              ["E. Biometric information", "Fingerprints and voiceprints"],
              ["F. Internet or other similar network activity", "Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements"],
              ["G. Geolocation data", "Device location"],
              ["H. Audio, electronic, sensory, or similar information", "Images and audio, video or call recordings created in connection with our business activities"],
              ["I. Professional or employment-related information", "Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us"],
              ["J. Education Information", "Student records and directory information"],
              ["K. Inferences drawn from collected personal information", "Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual's preferences and characteristics"],
              ["L. Sensitive personal Information", ""],
            ].map(([cat, ex]) => (
              <tr key={cat} className="border-t border-border align-top">
                <td className="p-2 font-medium text-foreground">{cat}</td>
                <td className="p-2">{ex}</td>
                <td className="p-2">NO</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        We may also collect other personal information outside of these categories through
        instances where you interact with us in person, online, or by phone or mail in the context
        of:
      </P>
      <UL>
        <li>Receiving help through our customer support channels;</li>
        <li>Participation in customer surveys or contests; and</li>
        <li>Facilitation in the delivery of our Services and to respond to your inquiries.</li>
      </UL>
      <H3>Sources of Personal Information</H3>
      <P>
        Learn more about the sources of personal information we collect in "WHAT INFORMATION DO WE
        COLLECT?"
      </P>
      <H3>How We Use and Share Personal Information</H3>
      <P>
        Learn more about how we use your personal information in the section, "HOW DO WE PROCESS
        YOUR INFORMATION?"
      </P>
      <P>
        <strong className="text-foreground">Will your information be shared with anyone else?</strong>
      </P>
      <P>
        We may disclose your personal information with our service providers pursuant to a written
        contract between us and each service provider. Learn more about how we disclose personal
        information to in the section, "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"
      </P>
      <P>
        We may use your personal information for our own business purposes, such as for
        undertaking internal research for technological development and demonstration. This is not
        considered to be "selling" of your personal information.
      </P>
      <P>
        We have not disclosed, sold, or shared any personal information to third parties for a
        business or commercial purpose in the preceding twelve (12) months. We will not sell or
        share personal information in the future belonging to website visitors, users, and other
        consumers.
      </P>
      <H3>Your Rights</H3>
      <P>
        You have rights under certain US state data protection laws. However, these rights are not
        absolute, and in certain cases, we may decline your request as permitted by law. These
        rights include:
      </P>
      <UL>
        <li>Right to know whether or not we are processing your personal data</li>
        <li>Right to access your personal data</li>
        <li>Right to correct inaccuracies in your personal data</li>
        <li>Right to request the deletion of your personal data</li>
        <li>Right to obtain a copy of the personal data you previously shared with us</li>
        <li>Right to non-discrimination for exercising your rights</li>
        <li>
          Right to opt out of the processing of your personal data if it is used for targeted
          advertising (or sharing as defined under California's privacy law), the sale of personal
          data, or profiling in furtherance of decisions that produce legal or similarly
          significant effects ("profiling")
        </li>
      </UL>
      <P>Depending upon the state where you live, you may also have the following rights:</P>
      <UL>
        <li>
          Right to access the categories of personal data being processed (as permitted by
          applicable law, including the privacy law in Minnesota)
        </li>
        <li>
          Right to obtain a list of the categories of third parties to which we have disclosed
          personal data (as permitted by applicable law, including the privacy law in California,
          Delaware, and Maryland)
        </li>
        <li>
          Right to obtain a list of specific third parties to which we have disclosed personal
          data (as permitted by applicable law, including the privacy law in Minnesota and Oregon)
        </li>
        <li>
          Right to obtain a list of third parties to which we have sold personal data (as permitted
          by applicable law, including the privacy law in Connecticut)
        </li>
        <li>
          Right to review, understand, question, and depending on where you live, correct how
          personal data has been profiled (as permitted by applicable law, including the privacy law
          in Connecticut and Minnesota)
        </li>
        <li>
          Right to limit use and disclosure of sensitive personal data (as permitted by applicable
          law, including the privacy law in California)
        </li>
        <li>
          Right to opt out of the collection of sensitive data and personal data collected through
          the operation of a voice or facial recognition feature (as permitted by applicable law,
          including the privacy law in Florida)
        </li>
      </UL>

      <H3>How to Exercise Your Rights</H3>
      <P>
        To exercise these rights, you can contact us by visiting{" "}
        <a
          href="https://forms.gle/S8384AgTtxqYrhZ88"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold"
        >
          https://forms.gle/S8384AgTtxqYrhZ88
        </a>
        , by emailing us at{" "}
        <a href="mailto:bucketapp.support@gmail.com" className="text-primary font-semibold">
          bucketapp.support@gmail.com
        </a>
        , or by referring to the contact details at the bottom of this document.
      </P>
      <P>
        Under certain US state data protection laws, you can designate an authorized agent to make a
        request on your behalf. We may deny a request from an authorized agent that does not submit
        proof that they have been validly authorized to act on your behalf in accordance with
        applicable laws.
      </P>

      <H3>Request Verification</H3>
      <P>
        Upon receiving your request, we will need to verify your identity to determine you are the
        same person about whom we have the information in our system. We will only use personal
        information provided in your request to verify your identity or authority to make the
        request. However, if we cannot verify your identity from the information already maintained
        by us, we may request that you provide additional information for the purposes of verifying
        your identity and for security or fraud-prevention purposes.
      </P>
      <P>
        If you submit the request through an authorized agent, we may need to collect additional
        information to verify your identity before processing your request and the agent will need to
        provide a written and signed permission from you to submit such request on your behalf.
      </P>

      <H3>Appeals</H3>
      <P>
        Under certain US state data protection laws, if we decline to take action regarding your
        request, you may appeal our decision by emailing us at{" "}
        <a href="mailto:bucketapp.support@gmail.com" className="text-primary font-semibold">
          bucketapp.support@gmail.com
        </a>
        . We will inform you in writing of any action taken or not taken in response to the appeal,
        including a written explanation of the reasons for the decisions. If your appeal is denied,
        you may submit a complaint to your state attorney general.
      </P>

      <H3>California "Shine The Light" Law</H3>
      <P>
        California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits
        our users who are California residents to request and obtain from us, once a year and free
        of charge, information about categories of personal information (if any) we disclosed to
        third parties for direct marketing purposes and the names and addresses of all third parties
        with which we shared personal information in the immediately preceding calendar year. If you
        are a California resident and would like to make such a request, please submit your request
        in writing to us by using the contact details provided in the section "HOW CAN YOU CONTACT
        US ABOUT THIS NOTICE?"
      </P>

      <H2>12. Do We Make Updates to This Notice?</H2>
      <P>
        <em>In Short:</em> Yes, we will update this notice as necessary to stay compliant with
        relevant laws.
      </P>
      <P>
        We may update this Privacy Notice from time to time. The updated version will be indicated
        by an updated "Revised" date at the top of this Privacy Notice. If we make material changes
        to this Privacy Notice, we may notify you either by prominently posting a notice of such
        changes or by directly sending you a notification. We encourage you to review this Privacy
        Notice frequently to be informed of how we are protecting your information.
      </P>

      <H2>13. How Can You Contact Us About This Notice?</H2>
      <P>
        If you have questions or comments about this notice, you may email us at{" "}
        <a href="mailto:bucketapp.support@gmail.com" className="text-primary font-semibold">
          bucketapp.support@gmail.com
        </a>{" "}
        or contact us by post at:
      </P>
      <P>
        <strong className="text-foreground">Buck-et</strong>
        <br />
        __________
      </P>

      <H2>
        14. How Can You Review, Update, or Delete the Data We Collect From You?
      </H2>
      <P>
        Based on the applicable laws of your country or state of residence in the US, you may have
        the right to request access to the personal information we collect from you, details about
        how we have processed it, correct inaccuracies, or delete your personal information. You may
        also have the right to withdraw your consent to our processing of your personal information.
        These rights may be limited in some circumstances by applicable law. To request to review,
        update, or delete your personal information, please visit:{" "}
        <a
          href="https://forms.gle/S8384AgTtxqYrhZ88"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold"
        >
          https://forms.gle/S8384AgTtxqYrhZ88
        </a>
        .
      </P>

      <div className="mt-8 p-4 rounded-2xl bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This Privacy Policy was created using Termly&apos;s Privacy Policy Generator.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;