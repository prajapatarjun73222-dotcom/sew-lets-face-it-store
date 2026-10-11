import { useSettings } from '../../context/SettingsContext';
import { HeartStitch } from '../ui/Logo';
import { sizedImage } from '../../utils/format';

export default function BrandBanner() {
  const { settings } = useSettings();
  return (
    <section className="relative overflow-hidden bg-beige" aria-label="Brand statement">
      {settings.images.banner && (
        <img
          src={sizedImage(settings.images.banner, 1800)}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/10 via-beige/60 via-45% to-beige" />
      <div className="container-page relative flex min-h-[260px] items-center justify-end py-14 sm:min-h-[300px]">
        <p className="max-w-md text-right font-serif text-3xl leading-snug text-charcoal sm:text-4xl">
          Bringing Fabric, Creativity
          <br className="hidden sm:block" /> &amp; Everyday Style{' '}
          <span className="inline-flex items-center gap-2">
            Together <HeartStitch className="size-6 text-terracotta" />
          </span>
        </p>
      </div>
    </section>
  );
}
