import { useEffect, useState, type RefCallback } from "react";

export type UseElementSizeResult = {
  ref: RefCallback<Element>;
  width: number;
  height: number;
};

/**
 * Track an element's content-box size via `ResizeObserver`.
 *
 * Moved here from `@var-ui/react` 0.1.x, which dropped it in 0.2.
 */
export function useElementSize(): UseElementSizeResult {
  const [node, setNode] = useState<Element | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref: setNode, width: size.width, height: size.height };
}
