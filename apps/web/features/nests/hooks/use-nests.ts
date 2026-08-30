import { useQuery } from "@tanstack/react-query";
import { listNests } from "../api/list-nests";
import { nestKeys } from "./nest-keys";

export function useNests() {
  return useQuery({
    queryKey: nestKeys.all,
    queryFn: () => listNests(),
  });
}
