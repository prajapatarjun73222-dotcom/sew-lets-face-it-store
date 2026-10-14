import { useMemo, useState } from 'react';
import { CalendarDays, Check } from 'lucide-react';
import { classMonthKey, formatClassDay, formatClassMonth, formatClassTimeRange } from '../../utils/format';

function availability(session) {
  if (session.status === 'cancelled') return { text: 'Cancelled', tone: 'off' };
  if (session.placesLeft <= 0) return { text: 'Fully booked', tone: 'off' };
  if (session.placesLeft === 1) return { text: '1 place left', tone: 'low' };
  return { text: `${session.placesLeft} places left`, tone: 'ok' };
}

export default function ClassDatePicker({ sessions, selectedId, onSelect }) {
  const months = useMemo(() => {
    const groups = new Map();
    for (const session of sessions) {
      const key = classMonthKey(session.startsAt);
      if (!groups.has(key)) groups.set(key, { key, label: formatClassMonth(session.startsAt), sessions: [] });
      groups.get(key).sessions.push(session);
    }
    return [...groups.values()];
  }, [sessions]);

  const selectedMonth = months.find((m) => m.sessions.some((s) => s._id === selectedId))?.key;
  const [activeKey, setActiveKey] = useState(null);
  const active = months.find((m) => m.key === (activeKey || selectedMonth)) || months[0];

  if (!months.length) {
    return (
      <div className="rounded-sm border border-dashed border-beige bg-white p-8 text-center">
        <CalendarDays className="mx-auto size-8 text-terracotta" strokeWidth={1.4} aria-hidden />
        <p className="mt-3 text-sm text-muted">New class dates will be added soon. Please get in touch to register your interest.</p>
      </div>
    );
  }

  return (
    <div>
      <div role="tablist" aria-label="Class months" className="flex flex-wrap gap-2">
        {months.map((month) => {
          const isActive = month.key === active.key;
          return (
            <button
              key={month.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveKey(month.key)}
              className={`rounded-sm border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-forest bg-forest text-cream'
                  : 'border-beige bg-white text-charcoal hover:border-terracotta hover:text-terracotta'
              }`}
            >
              {month.label}
            </button>
          );
        })}
      </div>

      <ul role="tabpanel" aria-label={active.label} className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {active.sessions.map((session) => {
          const status = availability(session);
          const disabled = status.tone === 'off';
          const selected = session._id === selectedId;
          return (
            <li key={session._id}>
              <button
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => onSelect(session)}
                className={`relative flex h-full w-full flex-col items-start rounded-sm border p-3 text-left transition-colors sm:p-4 ${
                  selected
                    ? 'border-terracotta bg-terracotta/5 ring-1 ring-terracotta'
                    : disabled
                      ? 'cursor-not-allowed border-beige bg-cream-dark/60 opacity-70'
                      : 'border-beige bg-white hover:border-terracotta'
                }`}
              >
                {selected && (
                  <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-terracotta text-white">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                )}
                <span className="pr-5 text-base font-medium text-charcoal sm:text-lg">{formatClassDay(session.startsAt)}</span>
                <span className="text-xs text-muted sm:text-sm">{formatClassTimeRange(session.startsAt, session.durationMinutes)}</span>
                <span
                  className={`mt-2 text-xs font-medium ${
                    status.tone === 'off' ? 'text-muted line-through decoration-1' : status.tone === 'low' ? 'text-terracotta' : 'text-forest'
                  }`}
                >
                  {status.text}
                </span>
                {session.note && <span className="mt-1 text-xs text-muted">{session.note}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
