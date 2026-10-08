import { Role } from "@/models/role-model";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { OctagonAlert, TrashIcon } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface Props {
  open: boolean;
  onClose: () => void;
  roleToDelete: Role;
  availableRoles: Role[];
  onConfirm: (newRoleId?: number) => void; 
  isLoading?: boolean;
}

export function DeleteRoleAlert({
  open,
  onClose,
  roleToDelete,
  availableRoles,
  onConfirm,
  isLoading,
}: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const reassignableRoles = availableRoles.filter(
    (role) => role.role_id !== roleToDelete.role_id
  );

  // Check if users exist in this role
  const hasUsers = (roleToDelete?.user_count || 0) > 0;

  const handleConfirm = () => {
    if (hasUsers && selectedRoleId) {
      onConfirm(Number(selectedRoleId));
    } else if (!hasUsers) {
      onConfirm(); // Send without newRoleId if no users
    }
  };

  const handleClose = () => {
    setSelectedRoleId("");
    onClose();
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle>
            <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <OctagonAlert className="h-7 w-7 text-destructive animate-pulse" />
            </div>
            Are you sure you want to delete this role?
          </AlertDialogTitle>
          
          {hasUsers &&(
            <>
              <AlertDialogDescription className="text-center">
                This role currently has <strong>{roleToDelete.user_count}</strong> users. 
                They must be reassigned to another role before deletion:
              </AlertDialogDescription>

              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger id="role-select" className="mt-4">
                  <SelectValue placeholder="Select a target role" />
                </SelectTrigger>
                <SelectContent>
                  {reassignableRoles.map((role) => (
                    <SelectItem key={role.role_id} value={String(role.role_id)}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
         
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2 sm:justify-center">
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive2" })}
            onClick={handleConfirm}
            // Disable button if loading, OR if users exist but no target role is selected
            disabled={isLoading || (hasUsers && !selectedRoleId)}
          >
            {isLoading ? (
              <>
                <Spinner variant="circle" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon />
                Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}