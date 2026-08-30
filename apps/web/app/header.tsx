"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOutIcon, PlusIcon } from "lucide-react";

import { Logo } from "@/shared/components/logo";
import { ModeToggle } from "@/shared/components/mode-toggle";
import { SearchBar } from "@/features/nests";
import { authClient, useSession } from "@/features/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  async function handleSignOut() {
    await authClient.signOut();
    queryClient.clear();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 font-heading text-base font-semibold tracking-tight"
        >
          <Logo className="size-5 text-foreground" />
          ThreadNest
        </Link>
        <div className="hidden flex-1 justify-center md:flex">
          <SearchBar />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            render={<Link href="/submit" />}
            nativeButton={false}
            variant="default"
            size="sm"
            aria-current={pathname === "/submit" ? "page" : undefined}
          >
            <PlusIcon data-icon="inline-start" />
            Submit
          </Button>
          <ModeToggle />
          {isPending ? (
            <Skeleton className="size-8 rounded-full" />
          ) : user ? (
            <UserMenu user={user} onSignOut={handleSignOut} />
          ) : (
            <AuthButtons />
          )}
        </div>
      </div>
    </header>
  );
}

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  onSignOut: () => void;
}

function UserMenu({ user, onSignOut }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label="Account menu"
          />
        }
      >
        <Avatar className="size-7">
          {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut}>
            <LogOutIcon data-icon="inline-start" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthButtons() {
  return (
    <>
      <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">
        Sign in
      </Button>
      <Button render={<Link href="/register" />} nativeButton={false} variant="outline" size="sm">
        Register
      </Button>
    </>
  );
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}
