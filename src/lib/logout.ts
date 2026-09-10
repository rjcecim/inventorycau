import { signOut } from "next-auth/react";

export async function logout() {
  await signOut({ redirect: false });
  // Navegação absoluta evita redirect do Auth.js para 0.0.0.0 no Docker.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- origem do browser, não do container
  window.location.assign(`${window.location.origin}/login`);
}
