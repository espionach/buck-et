import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav(-1)}
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

      <div className="mt-8 p-4 rounded-2xl bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Questions about this Privacy Notice? Contact us at{" "}
          <a href="mailto:bucketapp.support@gmail.com" className="text-primary font-semibold">
            bucketapp.support@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;