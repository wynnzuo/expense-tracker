import { HomeClient } from "@/components/home-client";
import { SiteShell } from "@/components/site-shell";

export function HomePage() {
  return (
    <SiteShell currentPath="/" variant="chat">
      <HomeClient />
    </SiteShell>
  );
}
