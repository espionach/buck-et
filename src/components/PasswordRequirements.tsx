import { Check, X } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/passwordPolicy";

interface PasswordRequirementsProps {
  value: string;
  /** When true, unmet rules are shown in destructive color (e.g. after submit). */
  showErrors?: boolean;
}

const PasswordRequirements = ({ value, showErrors = false }: PasswordRequirementsProps) => {
  return (
    <ul className="space-y-1 text-xs" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        const colorClass = ok
          ? "text-foreground"
          : showErrors
            ? "text-destructive font-medium"
            : "text-muted-foreground";
        const iconClass = ok
          ? "text-primary"
          : showErrors
            ? "text-destructive"
            : "text-muted-foreground";
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 ${colorClass}`}
            aria-invalid={showErrors && !ok ? true : undefined}
          >
            {ok ? (
              <Check className={`w-3.5 h-3.5 ${iconClass}`} />
            ) : (
              <X className={`w-3.5 h-3.5 ${iconClass}`} />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
};

export default PasswordRequirements;