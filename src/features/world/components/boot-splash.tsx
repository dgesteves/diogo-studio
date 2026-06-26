import type { ReactElement } from "react";
import { BOOT_SESSION_KEY, BOOT_SPLASH_ID } from "@/stores/boot-store";
import { BootBackdrop } from "./boot-backdrop";

const HIDE_IF_BOOTED = `try{if(sessionStorage.getItem('${BOOT_SESSION_KEY}')==='1'){var e=document.getElementById('${BOOT_SPLASH_ID}');if(e)e.style.display='none'}}catch(_){}`;

export function BootSplash(): ReactElement {
  return (
    <div
      id={BOOT_SPLASH_ID}
      aria-hidden="true"
      className="fixed inset-0 z-45 overflow-hidden"
      suppressHydrationWarning
    >
      <BootBackdrop />
      <noscript>
        <style>{`#${BOOT_SPLASH_ID}{display:none}`}</style>
      </noscript>
      <script dangerouslySetInnerHTML={{ __html: HIDE_IF_BOOTED }} />
    </div>
  );
}
