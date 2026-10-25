import { useEffect, useState } from "react";

/**
 * Debounce a value.
 *
 * Moved here from `@var-ui/react` 0.1.x, which dropped it in 0.2.
 *
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
