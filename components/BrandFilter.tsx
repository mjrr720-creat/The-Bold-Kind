'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// Fixed brand list — derived from restaurant_brand() in Postgres.
// Update both places together if brands are added/renamed.
const BRANDS = ['ASAH', 'GOAT', 'LATE', 'SOM', 'UNIQUE', 'UNKNOWN'];

interface Props {
  value: string; // 'All' or pipe-separated brand codes, e.g. 'GOAT|LATE'
  onChange: (value: string) => void;
}

export default function BrandFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const committed = useMemo(() => {
    if (!value || value === 'All') return BRANDS;
    return value
      .split('|')
      .map((b) => b.trim())
      .filter((b) => BRANDS.includes(b));
  }, [value]);

  const isAllSelected =
    draft.length === BRANDS.length &&
    BRANDS.every((b) => draft.includes(b));

  const open_ = () => {
    setDraft([...committed]);
    setOpen(true);
  };

  const toggle = (brand: string) => {
    setDraft((prev) => {
      const exists = prev.includes(brand);

      if (prev.length === BRANDS.length && BRANDS.length > 1 && exists) {
        return [brand];
      }

      if (exists) {
        return prev.filter((b) => b !== brand);
      }

      return [...prev, brand];
    });
  };

  const toggleAll = () => {
    setDraft(isAllSelected ? [] : [...BRANDS]);
  };

  const apply = () => {
    if (draft.length === 0) {
      setOpen(false);
      return;
    }

    if (draft.length === BRANDS.length) {
      onChange('All');
    } else {
      onChange(draft.join('|'));
    }

    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayText =
    committed.length === BRANDS.length
      ? 'All brands'
      : committed.length === 0
        ? 'All brands'
        : committed.length === 1
          ? committed[0]
          : `${committed.length} brands selected`;

  return (
    <div ref={ref} className="relative min-w-[200px] flex-1 sm:flex-none">
      <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-wide text-ink/40">
        Brand
      </label>

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : open_())}
        className="control flex w-full items-center justify-between gap-3 bg-white text-left sm:min-w-[200px]"
      >
        <span className="truncate text-[13px] text-[#172033]">
          {displayText}
        </span>

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 text-[#555] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[300] w-full min-w-[240px] overflow-hidden rounded-[16px] border border-[#E7E2DE] bg-white shadow-[0_18px_50px_rgba(25,20,15,0.16)]">
          <button
            type="button"
            onClick={toggleAll}
            className="flex w-full items-center gap-3 border-b border-[#ECE8E5] bg-[#FFF9F5] px-4 py-3.5 text-left transition hover:bg-[#FFF3EC]"
          >
            <span
              className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border transition ${
                isAllSelected
                  ? 'border-[#F36A21] bg-[#F36A21]'
                  : 'border-[#BDB8B4] bg-white'
              }`}
            >
              {isAllSelected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12L10 17L19 7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="text-[14px] font-semibold text-[#171717]">
              Select all
            </span>
          </button>

          <div className="max-h-[280px] overflow-y-auto">
            {BRANDS.map((brand) => {
              const selected = draft.includes(brand);
              return (
                <button
                  type="button"
                  key={brand}
                  onClick={() => toggle(brand)}
                  className="flex w-full items-center gap-3 border-b border-[#F0EEEC] px-4 py-3 text-left transition hover:bg-[#FFF9F5]"
                >
                  <span
                    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border transition ${
                      selected
                        ? 'border-[#F36A21] bg-[#F36A21] shadow-[0_2px_6px_rgba(243,106,33,0.22)]'
                        : 'border-[#C8C4C1] bg-white'
                    }`}
                  >
                    {selected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12L10 17L19 7"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`text-[13px] ${
                      selected ? 'font-semibold text-[#171717]' : 'font-medium text-[#303030]'
                    }`}
                  >
                    {brand}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-[#ECE8E5] bg-[#FCFBFA] px-4 py-3">
            <span className="text-[11px] font-medium text-[#8A8581]">
              {draft.length} {draft.length === 1 ? 'brand' : 'brands'} selected
            </span>
            <button
              type="button"
              onClick={apply}
              disabled={draft.length === 0}
              className="rounded-[8px] bg-[#F36A21] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_3px_8px_rgba(243,106,33,0.20)] transition hover:bg-[#E65D16] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
