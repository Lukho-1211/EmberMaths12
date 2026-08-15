"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { filterMunicipalities, isValidMunicipality } from "@/lib/sa-geography";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40 disabled:cursor-not-allowed disabled:bg-ember-gray/40";

export function MunicipalityAutocomplete({
  province,
  value,
  onChange,
  required = false,
  id,
  disabled,
}: {
  province: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
  disabled?: boolean;
}) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [optionsKey, setOptionsKey] = useState("");
  const isDisabled = disabled || !province;

  const options = useMemo(
    () => (province ? filterMunicipalities(province, value) : []),
    [province, value],
  );

  const nextOptionsKey = options.join("\0");
  if (nextOptionsKey !== optionsKey) {
    setOptionsKey(nextOptionsKey);
    setHighlight(0);
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(name: string) {
    onChange(name);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (isDisabled || options.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h - 1 + options.length) % options.length);
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      pick(options[highlight]!);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const valid = !value || isValidMunicipality(province, value);

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        className={inputClass}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (!isDisabled) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={province ? "Start typing municipality…" : "Select a province first"}
        disabled={isDisabled}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={value.length > 0 && !valid}
      />
      {open && !isDisabled && options.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-ember-white py-1 shadow-lg"
        >
          {options.map((name, i) => (
            <li key={name} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm ${
                  i === highlight ? "bg-ember-gold/20 font-medium" : "hover:bg-ember-gray/50"
                }`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(name)}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {value && !valid ? (
        <p className="mt-1 text-xs text-danger">Choose a municipality from the list for this province.</p>
      ) : null}
    </div>
  );
}
