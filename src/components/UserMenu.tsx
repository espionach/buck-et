import { useState } from "react";
import { MoreVertical, ShieldOff, Flag, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/data/appState";
import { User } from "@/data/mockData";
import ReportUserModal from "@/components/ReportUserModal";
import BlockConfirmDialog from "@/components/BlockConfirmDialog";
import { toast } from "sonner";

interface UserMenuProps {
  user: User;
  onBlocked?: () => void;
}

const UserMenu = ({ user, onBlocked }: UserMenuProps) => {
  const { currentUser, blockedUserIds, blockUser, unblockUser } = useAppStore();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  if (!currentUser.id || user.id === currentUser.id) return null;

  const isBlocked = blockedUserIds.includes(user.id);

  const handleUnblock = async () => {
    await unblockUser(user.id);
    toast.success("User unblocked");
  };

  const handleConfirmBlock = async () => {
    await blockUser(user.id);
    setBlockOpen(false);
    toast.success(`${user.name} blocked`);
    onBlocked?.();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="More options"
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isBlocked ? (
            <DropdownMenuItem onClick={handleUnblock}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              Unblock User
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                onClick={() => setBlockOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Block User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setReportOpen(true)}>
                <Flag className="w-4 h-4 mr-2" />
                Report User
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportUserModal
        user={user}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
      <BlockConfirmDialog
        user={user}
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onConfirm={handleConfirmBlock}
      />
    </>
  );
};

export default UserMenu;
