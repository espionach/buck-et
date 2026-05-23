import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  cta?: { label: string; onClick: () => void };
  size?: "sm" | "md";
  className?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  cta,
  size = "md",
  className = "",
}: EmptyStateProps) => {
  const isSm = size === "sm";
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        isSm ? "py-6" : "py-12"
      } ${className}`}
    >
      <Icon
        className={`${isSm ? "w-6 h-6 mb-2" : "w-8 h-8 mb-3"} text-muted-foreground`}
        strokeWidth={1.5}
      />
      <p
        className={`font-bold text-foreground ${
          isSm ? "text-sm" : "text-sm"
        } mb-1`}
      >
        {title}
      </p>
      {description && (
        <p
          className={`text-muted-foreground ${
            isSm ? "text-xs" : "text-sm"
          } max-w-xs`}
        >
          {description}
        </p>
      )}
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-4 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
