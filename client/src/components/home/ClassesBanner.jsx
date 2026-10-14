import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { WEEKDAY_NAMES, formatPrice, formatSlotRange, sizedImage } from '../../utils/format';

export default function ClassesBanner() {
  const { settings } = useSettings();
  const { classes } = settings;
  if (!classes.enabled) return null;

  const price = classes.offerActive ? classes.offerPrice : classes.regularPrice;

  return (
    <section className="container-page pb-16 sm:pb-24" aria-labelledby="classes-heading">
      <div className="grid overflow-hidden rounded-sm bg-forest text-cream lg:grid-cols-[1fr_1.1fr]">
        {classes.image && (
          <div className="relative min-h-[240px]">
            <img
              src={sizedImage(classes.image, 1000)}
              alt="A sewing machine ready for class"
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-cream/70 uppercase">Basic Sewing Class</p>
          <h2 id="classes-heading" className="mt-3 text-4xl leading-tight sm:text-[2.75rem]">
            Learn sewing skills for life
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-cream/80">
            Get to know your sewing machine - threading, bobbins, tension and your first stitches - in a friendly small
            group.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-cream/85">
            {classes.schedule.length > 0 && (
              <li className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />
                {classes.schedule
                  .map((slot) => `${WEEKDAY_NAMES[slot.weekday]}s ${formatSlotRange(slot.time, classes.durationMinutes)}`)
                  .join(' · ')}
              </li>
            )}
            {classes.venue && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {classes.venue}
              </li>
            )}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button to="/sewing-classes" variant="light">
              Choose a date <ArrowRight className="size-4" aria-hidden />
            </Button>
            <span className="text-sm text-cream/80">
              {formatPrice(price)} per person
              {classes.offerActive && classes.regularPrice > price && (
                <span className="ml-2 text-cream/60 line-through">{formatPrice(classes.regularPrice)}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
