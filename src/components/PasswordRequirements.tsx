import { Check, X } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/passwordPolicy";

interface PasswordRequirementsProps {
  value: string;
}

const PasswordRequirements = ({ value }: PasswordRequirementsProps) => {
  return (
    <ul className="space-y-1 text-xs" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 ${ok ? "text-foreground" : "text-muted-foreground"}`}
          >
            {ok ? (
              <Check className="w-3.5 h-3.5 text-primary" />
            ) : (
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
};

export default PasswordRequirements;