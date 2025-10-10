"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

interface ImageCompareProps {
  before?: string | null;
  after?: string | null;
  altBefore?: string;
  altAfter?: string;
}

export function ImageCompare({ before, after, altBefore, altAfter }: ImageCompareProps) {
  const [value, setValue] = useState(50);

  const beforeSrc = useMemo(() => before ?? "/placeholder.png", [before]);
  const afterSrc = useMemo(() => after ?? beforeSrc, [after, beforeSrc]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100">
      <div className="absolute inset-0">
        <Image
          src={afterSrc}
          alt={altAfter ?? "Gambar hasil"}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
      >
        <Image
          src={beforeSrc}
          alt={altBefore ?? "Gambar asli"}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="pointer-events-none absolute left-6 top-6 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
        Asli
      </div>
      <div className="pointer-events-none absolute right-6 top-6 rounded-full bg-neutral-900/90 px-3 py-1 text-xs font-medium text-white shadow-sm">
        Hasil
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-full w-full">
          <div
            className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/80 shadow-[0_0_20px_rgba(0,0,0,0.15)]"
            style={{ left: `${value}%` }}
          />
          <div
            className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-neutral-900 text-white shadow-lg"
            style={{ left: `${value}%` }}
          >
            <span className="text-lg">?</span>
          </div>
        </div>
      </div>
      <input
        type="range"
        aria-label="Bandingkan gambar"
        min={0}
        max={100}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        className="absolute inset-x-0 bottom-6 mx-auto h-1 w-40 cursor-ew-resize appearance-none rounded-full bg-white/60 accent-neutral-900"
      />
    </div>
  );
}
