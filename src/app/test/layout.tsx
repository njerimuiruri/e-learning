import type { ReactNode } from "react";

// Sets the browser tab title for the /test page.
export const metadata = {
  title: "Tumaini's Climate AI Adventures",
  description:
    "Learn how computers help us prepare for floods, droughts and changing seasons.",
};

export default function TumainiLayout({ children }: { children: ReactNode }) {
  return children;
}
