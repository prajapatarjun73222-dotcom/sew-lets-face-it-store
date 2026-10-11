import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const EXTRA_MESSAGES = ['Custom creations welcome · Tell us what you are imagining'];

export default function AnnouncementBar() {
  const { settings } = useSettings();
  const messages = [settings.announcement, ...EXTRA_MESSAGES].filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 6000);
    return () => clearInterval(id);
  }, [messages.length]);

  if (!messages.length) return null;
  const go = (step) => setIndex((i) => (i + step + messages.length) % messages.length);

  return (
    <div className="bg-forest text-cream">
      <div className="container-page flex h-9 items-center justify-between gap-3 text-[11px] tracking-wide sm:text-xs">
        <button type="button" onClick={() => go(-1)} aria-label="Previous announcement" className="opacity-70 hover:opacity-100">
          <ChevronLeft className="size-3.5" />
        </button>
        <p key={index} className="animate-fade-in truncate text-center" aria-live="polite">
          {messages[index % messages.length]}
        </p>
        <button type="button" onClick={() => go(1)} aria-label="Next announcement" className="opacity-70 hover:opacity-100">
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
