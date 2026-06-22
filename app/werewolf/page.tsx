import React, { Suspense } from "react";
import { WerewolfProvider } from "@/features/werewolf/contexts/werewolf-context";
import WerewolfGameUI from "@/features/werewolf/components/werewolf-game-ui";

export default function WerewolfPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">Đang tải...</div>}>
      <WerewolfProvider>
        <WerewolfGameUI />
      </WerewolfProvider>
    </Suspense>
  );
}
