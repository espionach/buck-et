import { User } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { User as UserIcon } from "lucide-react";

interface UserAvatarProps {
  user: User;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-16 h-16",
};

const iconSizeClasses = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
  xl: "w-8 h-8",
};

const UserAvatar = ({ user, size = "md", className }: UserAvatarProps) => {
  const pic = user.profilePicture;

  return pic ? (
    <img
      src={pic}
      alt={user.name}
      className={cn("rounded-full object-cover shrink-0", sizeClasses[size], className)}
    />
  ) : (
    <span
      className={cn(
        "rounded-full bg-muted flex items-center justify-center shrink-0",
        sizeClasses[size],
        className
      )}
      aria-label={user.name}
    >
      <UserIcon className={cn("text-muted-foreground", iconSizeClasses[size])} strokeWidth={1.75} />
    </span>
  );
};

export default UserAvatar;
