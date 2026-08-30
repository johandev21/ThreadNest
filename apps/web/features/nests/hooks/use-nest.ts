import { useQuery } from "@tanstack/react-query";
import { getNest } from "../api/get-nest";
import { nestKeys } from "./nest-keys";

export function useNest(slug: string) {
  return useQuery({
    queryKey: nestKeys.detail(slug),
    queryFn: () => getNest(slug),
  });
}
