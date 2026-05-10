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