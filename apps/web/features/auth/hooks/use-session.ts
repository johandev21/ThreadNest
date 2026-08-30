import { authClient } from "../api/auth-client";

export function useSession() {
  return authClient.useSession();
}
