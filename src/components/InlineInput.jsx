import { useEffect, useRef, useState } from 'react';

/**
 * Textfeld, das wie normaler Text aussieht. Commit bei Enter/Blur,
 * Escape verwirft. Liefert onCommit `false`, wird der alte Wert wiederhergestellt.
 */
export default function InlineInput({ value, onCommit, className = '', selectOnFocus = true, ...rest }) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const skip = useRef(false);

  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  return (
    <input
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => {
        setFocused(true);
        if (selectOnFocus) e.target.select();
      }}
      onBlur={() => {
        setFocused(false);
        if (skip.current) {
          skip.current = false;
          setDraft(value);
          return;
        }
        if (draft !== value && onCommit(draft) === false) setDraft(value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          skip.current = true;
          e.currentTarget.blur();
        }
      }}
      className={`inline-field ${className}`}
    />
  );
}
