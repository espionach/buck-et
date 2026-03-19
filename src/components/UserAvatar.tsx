import { User } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-lg",
  lg: "w-14 h-14 text-2xl",
  xl: "w-16 h-16 text-3xl",
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
        "rounded-full bg-primary/10 flex items-center justify-center shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {user.avatar}
    </span>
  );
};

export default UserAvatar;
