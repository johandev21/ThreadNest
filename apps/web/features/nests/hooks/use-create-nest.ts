import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNest } from "../api/create-nest";
import type { CreateNestInput } from "../types/nest.types";
import { nestKeys } from "./nest-keys";

export function useCreateNest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNestInput) => createNest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nestKeys.all });
    },
  });
}
