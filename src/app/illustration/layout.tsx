import type { ReactNode } from "react";

// Sets the browser tab title for the /illustration page.
export const metadata = {
  title: "Climate & AI Basics with Tumaini",
  description:
    "Learn how computers help us prepare for floods, droughts and changing seasons.",
};

export default function TumainiLayout({ children }: { children: ReactNode }) {
  return children;
}
