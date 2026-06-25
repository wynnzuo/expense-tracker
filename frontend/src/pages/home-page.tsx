import { useState } from "react";

import { HomeClient } from "@/components/home-client";
import { SiteShell } from "@/components/site-shell";

export function HomePage() {
  const [chatKey, setChatKey] = useState(0);

  return (
    <SiteShell currentPath="/" variant="chat" onClear={() => setChatKey((k) => k + 1)}>
      <HomeClient key={chatKey} />
    </SiteShell>
  );
}
