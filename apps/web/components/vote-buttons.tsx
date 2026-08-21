"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import type { VoteTargetType, VoteValue } from "@/lib/api";
import { useVote } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  targetType: VoteTargetType;
  targetId: string;
  score: number;
  myVote: VoteValue;
  compact?: boolean;
}

export function VoteButtons({
  targetType,
  targetId,
  score,
  myVote,
  compact = false,
}: VoteButtonsProps) {
  const { data: session } = authClient.useSession();
  const authenticated = Boolean(session?.user);
  const vote = useVote();
  const disabled = !authenticated || vote.isPending;

  function cast(value: Exclude<VoteValue, 0>) {
    vote.mutate({
      targetType,
      targetId,
      myVote: myVote === value ? 0 : value,
    });
  }

  return (
    <div
      className={cn(
        "flex items-center",
        compact ? "flex-row gap-0.5" : "flex-col gap-0.5"
      )}
    >
      <VoteArrow
        direction="up"
        active={myVote === 1}
        disabled={disabled}
        compact={compact}
        showTooltip={!authenticated}
        onClick={() => cast(1)}
      />
      <span
        className={cn(
          "text-xs font-semibold tabular-nums text-muted-foreground",
          myVote === 1 && "text-vote-up",
          myVote === -1 && "text-vote-down"
        )}
      >
        {score}
      </span>
      <VoteArrow
        direction="down"
        active={myVote === -1}
        disabled={disabled}
        compact={compact}
        showTooltip={!authenticated}
        onClick={() => cast(-1)}
      />
    </div>
  );
}

interface VoteArrowProps {
  direction: "up" | "down";
  active: boolean;
  disabled: boolean;
  compact: boolean;
  showTooltip: boolean;
  onClick: () => void;
}

function VoteArrow({
  direction,
  active,
  disabled,
  compact,
  showTooltip,
  onClick,
}: VoteArrowProps) {
  const isUp = direction === "up";
  const label = `Vote ${isUp ? "up" : "down"}`;
  const button = (
    <Button
      variant="ghost"
      size={compact ? "icon-xs" : "icon-sm"}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-xl text-muted-foreground hover:text-foreground",
        active && isUp && "bg-vote-up/10 text-vote-up hover:bg-vote-up/20 hover:text-vote-up",
        active && !isUp && "bg-vote-down/10 text-vote-down hover:bg-vote-down/20 hover:text-vote-down"
      )}
    >
      {isUp ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </Button>
  );

  if (!showTooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>Sign in to vote</TooltipContent>
    </Tooltip>
  );
}
