import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook to navigate table rows using J/K keys.
 * Returns the currently focused row index (0-indexed).
 */
export function useTableNavigation(rowCount: number) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with inputs or textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < rowCount - 1 ? prev + 1 : prev));
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rowCount]);

  useEffect(() => {
    // Scroll the focused row into view if it's outside the container's visible area
    if (focusedIndex >= 0 && containerRef.current) {
      const rows = containerRef.current.querySelectorAll('tbody tr');
      if (rows[focusedIndex]) {
        rows[focusedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  return { focusedIndex, setFocusedIndex, containerRef };
}
