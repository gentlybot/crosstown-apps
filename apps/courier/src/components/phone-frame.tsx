import type { ReactNode } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * On a desktop browser, show the app inside a phone-sized frame so it reads
 * as the mobile app it is. On a real phone or a native build, render nothing
 * extra: the viewport is the phone.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  if (Capacitor.isNativePlatform()) return <>{children}</>;
  return (
    <div className="phone-stage">
      <div className="phone-frame">
        <div className="phone-notch" aria-hidden="true" />
        <div className="phone-screen">{children}</div>
      </div>
    </div>
  );
}
