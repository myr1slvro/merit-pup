import { useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounceMs?: number;
  autoFocus?: boolean;
  className?: string;
  name?: string;
  ariaLabel?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  autoFocus = false,
  className = "",
  name,
  ariaLabel,
}: SearchInputProps) {
  const [inner, setInner] = useState(value);

  useEffect(() => {
    setInner(value);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (inner !== value) onChange(inner.trim());
    }, debounceMs);
    return () => clearTimeout(t);
  }, [inner, value, onChange, debounceMs]);

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
        <BiSearch />
      </span>
      <input
        type="text"
        name={name}
        aria-label={ariaLabel || placeholder}
        className="pl-7 pr-2 py-1 border rounded w-full text-sm focus:outline-none focus:ring focus:ring-meritRed/30"
        placeholder={placeholder}
        value={inner}
        autoFocus={autoFocus}
        onChange={(e) => setInner(e.target.value)}
      />
      {inner && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
          onClick={() => setInner("")}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
