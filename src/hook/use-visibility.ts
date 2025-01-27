import { useEffect } from "react";

type UseVisibilityEffectOptions = {
  onVisible: () => void; 
};

export function useVisibility({ onVisible }: UseVisibilityEffectOptions) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        onVisible();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onVisible]);
}
