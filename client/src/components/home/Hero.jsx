import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { sizedImage } from '../../utils/format';

export default function Hero() {
  const { settings } = useSettings();
  const slides = settings.images.hero?.length ? settings.images.hero : [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(id);
  }, [slides.length, paused]);

  const go = (step) => setIndex((i) => (i + step + slides.length) % slides.length);

  return (
    <section
      className="relative overflow-hidden bg-beige"
      aria-roledescription="carousel"
      aria-label="Featured handmade pieces"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative lg:min-h-[600px] xl:min-h-[640px]">
        {/* Images */}
        <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[66%]">
          {slides.map((src, i) => (
            <img
              key={src + i}
              src={sizedImage(src, 1600)}
              alt={i === 0 ? 'Handmade embroidered tote bag in warm natural light' : 'Handmade bag by Sew Lets Face It'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden={i !== index}
            />
          ))}
          <div className="absolute inset-y-0 -left-1 hidden w-3/5 bg-gradient-to-r from-beige from-5% via-beige/55 via-35% to-transparent lg:block" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-beige to-transparent lg:hidden" />

          {slides.length > 1 && (
            <>
              <div className="absolute right-4 bottom-4 flex gap-2 lg:top-1/2 lg:right-6 lg:bottom-auto lg:-translate-y-1/2 lg:flex-col">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous slide"
                  className="flex size-10 items-center justify-center rounded-full bg-white/85 text-charcoal shadow-sm backdrop-blur transition hover:bg-white"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next slide"
                  className="flex size-10 items-center justify-center rounded-full bg-white/85 text-charcoal shadow-sm backdrop-blur transition hover:bg-white"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show slide ${i + 1}`}
                    aria-current={i === index}
                    className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/60 hover:bg-white'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Copy */}
        <div className="container-page relative z-10 -mt-10 pb-14 lg:mt-0 lg:flex lg:min-h-[600px] lg:items-center lg:pb-0 xl:min-h-[640px]">
          <div className="max-w-xl animate-fade-in lg:max-w-[34rem] lg:py-20">
            <p className="eyebrow mb-5">Handmade in the UK</p>
            <h1 className="text-[2.75rem] leading-[1.02] text-charcoal sm:text-6xl lg:text-[4.4rem]">
              Made by Hand.
              <br />
              Made to Be Yours.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal/75">
              Thoughtfully handmade bags and accessories, stitched with care and designed for everyday life.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button to="/shop" size="lg">
                Shop the Collection <ArrowRight className="size-4" aria-hidden />
              </Button>
              <Button to="/our-story" variant="outline" size="lg" className="bg-cream/40">
                Discover Our Story
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
