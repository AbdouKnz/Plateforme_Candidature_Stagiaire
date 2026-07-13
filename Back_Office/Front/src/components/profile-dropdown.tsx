"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconUser } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import React from "react";
import { ChangePasswordModal } from "./ui/change-password-modal";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { Link } from "@tanstack/react-router";

export function ProfileDropdown() {
  const { t } = useTranslation();
  const { mutate: logout, isPending } = useLogout();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);

  const user = useAuthStore((state) => state.user);
  const fullName = `${user?.first_name} ${user?.last_name}`;

  const handleLogout = () => {
    if (!user) return;

    logout({
      first_name: user?.first_name,
      last_name: user?.last_name,
    });
  };
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt="@shadcn" />
              <AvatarFallback>
                <IconUser />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm leading-none font-medium">{fullName}</p>
              <p className="text-muted-foreground text-xs leading-none">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              asChild
              className="cursor-pointer"
              
            >
              <Link to="/settings">
                {t("settings")}
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsChangePasswordOpen(true)}>
              {t("change_password")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isPending}
            onClick={handleLogout}
            className="cursor-pointer"
          >
            {t("log_out")}
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordModal
      user={user}
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
}
