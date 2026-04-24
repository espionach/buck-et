import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Shield, MessageCircle, Flag, Ban, Sparkles } from "lucide-react";

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card rounded-2xl border border-border p-4 mb-3">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </div>
);

const CommunityGuidelines = () => {
  const nav = useNavigate();

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav(-1)}
          className="p-2 -ml-2 text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Community Guidelines</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        SideQuest is built for friends to plan adventures together. To keep it a safe, welcoming
        place, please follow these guidelines whenever you post, comment, or interact.
      </p>

      <Section icon={Heart} title="Be kind & respectful">
        <p>
          Treat everyone the way you'd want to be treated. No harassment, hate speech, slurs, or
          targeted attacks based on identity, beliefs, or background.
        </p>
      </Section>

      <Section icon={MessageCircle} title="Keep it appropriate">
        <p>
          No profanity in quest titles, descriptions, comments, or profile bios. We filter obvious
          violations automatically — repeated attempts may lead to action on your account.
        </p>
        <p>No sexual content, graphic violence, or content involving minors.</p>
      </Section>

      <Section icon={Shield} title="Respect privacy & safety">
        <p>
          Don't share other people's private info (addresses, phone numbers, etc.) without their
          consent. Don't impersonate others.
        </p>
        <p>Only invite people you actually know to your groups and quests.</p>
      </Section>

      <Section icon={Sparkles} title="Keep it real">
        <p>
          No spam, scams, or misleading content. Don't use SideQuest to advertise or solicit
          unrelated services.
        </p>
      </Section>

      <Section icon={Flag} title="Report what doesn't belong">
        <p>
          See something off? Use the ••• menu on a quest, comment, or profile to report it. Reports
          are reviewed by our team and we follow up where needed.
        </p>
      </Section>

      <Section icon={Ban} title="Block when you need space">
        <p>
          You can block any user from their profile. Blocked users can't see your content or
          interact with you, and vice versa. Unblocking restores everything as it was.
        </p>
      </Section>

      <div className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Violations of these guidelines may result in content removal, temporary restrictions, or
          permanent account suspension. Questions or concerns? Reach us at{" "}
          <a href="mailto:support@buck-et.app" className="text-primary font-semibold">
            support@buck-et.app
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default CommunityGuidelines;
