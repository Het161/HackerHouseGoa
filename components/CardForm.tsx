"use client";

import { useId } from "react";

import { formatBuilderNumber } from "@/lib/titles";
import type { CardFields } from "@/lib/types";

export interface CardFormProps {
  fields: CardFields;
  onChange: (next: CardFields) => void;
  onReroll: () => void;
}

/**
 * X handles are `[A-Za-z0-9_]{1,15}`. People paste "@name", "twitter.com/name"
 * or a name with a trailing space, and any of those would render as a broken
 * handle on the badge — so normalise on every keystroke rather than validating
 * at submit time (there is no submit).
 */
export function sanitizeHandle(raw: string): string {
  // lastIndexOf returns -1 when there is no slash, so slice(0) keeps the whole
  // string; when someone pastes "x.com/ada" this keeps just "ada".
  const lastSegment = raw.slice(raw.lastIndexOf("/") + 1);
  return lastSegment
    .replace(/^@+/, "")
    .replace(/[^A-Za-z0-9_]/g, "")
    .slice(0, 15);
}

const LABEL = "block font-data text-[11px] uppercase tracking-[0.18em] text-goa-ink/65";
const INPUT =
  "mt-1 w-full rounded-sm border-2 border-goa-ink/25 bg-white px-3 py-2 text-base text-goa-ink placeholder:text-goa-ink/35 focus:border-goa-red";

export default function CardForm({ fields, onChange, onReroll }: CardFormProps) {
  const uid = useId();
  const nameId = `${uid}-name`;
  const roleId = `${uid}-role`;
  const handleId = `${uid}-handle`;

  return (
    <section className="mt-4 rounded-md border-[3px] border-goa-cream bg-goa-cream p-4 text-goa-ink shadow-[5px_5px_0_0_var(--color-goa-green-deep)]">
      <p className="font-data text-[10px] uppercase tracking-[0.24em] text-goa-red">Builder details</p>

      <div className="mt-3">
        <label htmlFor={nameId} className={LABEL}>
          Name <span className="text-goa-red">*</span>
        </label>
        <input
          id={nameId}
          type="text"
          value={fields.name}
          maxLength={28}
          autoCapitalize="words"
          autoComplete="name"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Ada Lovelace"
          className={`${INPUT} font-display text-lg`}
          onChange={(event) => onChange({ ...fields, name: event.target.value })}
        />
      </div>

      <div className="mt-3">
        <label htmlFor={roleId} className={LABEL}>
          Stack / Role
        </label>
        <input
          id={roleId}
          type="text"
          value={fields.role}
          maxLength={32}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Next.js + Solidity"
          className={`${INPUT} font-data`}
          onChange={(event) => onChange({ ...fields, role: event.target.value })}
        />
      </div>

      <div className="mt-3">
        <label htmlFor={handleId} className={LABEL}>
          X handle
        </label>
        <div className="mt-1 flex items-center rounded-sm border-2 border-goa-ink/25 bg-white focus-within:border-goa-red">
          <span aria-hidden="true" className="pl-3 font-data text-base text-goa-ink/40">
            @
          </span>
          <input
            id={handleId}
            type="text"
            inputMode="text"
            value={fields.handle}
            maxLength={15}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="yourhandle"
            className="w-full min-w-0 rounded-sm bg-transparent px-2 py-2 font-data text-base text-goa-ink placeholder:text-goa-ink/35"
            onChange={(event) => onChange({ ...fields, handle: sanitizeHandle(event.target.value) })}
          />
        </div>
      </div>

      <div className="mt-4 flex items-stretch gap-2">
        <div className="stamp min-w-0 flex-1 rounded-sm border-[3px] border-dashed border-goa-red bg-goa-cream px-3 py-2">
          <p className="font-data text-[9px] uppercase tracking-[0.22em] text-goa-red">Builder title</p>
          <p className="font-display text-lg leading-tight break-words text-goa-ink">{fields.title}</p>
        </div>
        <button
          type="button"
          onClick={onReroll}
          aria-label="Reroll builder title"
          title="Reroll builder title"
          className="h-11 w-11 shrink-0 self-center rounded-sm border-[3px] border-goa-ink bg-goa-yellow text-xl leading-none shadow-[3px_3px_0_0_var(--color-goa-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <span aria-hidden="true">🎲</span>
        </button>
      </div>

      <p className="mt-4 border-t-2 border-dashed border-goa-ink/20 pt-3 font-data text-xs uppercase tracking-[0.2em] text-goa-ink/70">
        {formatBuilderNumber(fields.builderNo)}
      </p>
    </section>
  );
}
