import { useEffect } from "react";

type UseVisibilityEffectOptions = {
  onVisible: () => void; // Function to call when the app becomes visible
};

export function useVisibility({ onVisible }: UseVisibilityEffectOptions) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        onVisible(); // Trigger the callback when the app regains focus
      }
    };

    // Add the visibility change event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Clean up the listener
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onVisible]); // Re-run effect if `onVisible` changes
}
