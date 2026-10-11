import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { sizedImage } from '../../utils/format';

export default function BrandStory() {
  const { settings } = useSettings();
  return (
    <section className="bg-cream-dark py-16 sm:py-24" aria-labelledby="story-heading">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <div className="relative">
          <div className="absolute -top-4 -left-4 hidden h-full w-full rounded-sm border border-beige-dark lg:block" aria-hidden />
          <img
            src={sizedImage(settings.images.story, 1200)}
            alt="Hands guiding fabric through a sewing machine in the workshop"
            loading="lazy"
            className="relative aspect-[5/4] w-full rounded-sm object-cover"
          />
        </div>
        <div className="max-w-lg">
          <p className="font-script text-3xl text-terracotta">My Story</p>
          <h2 id="story-heading" className="mt-2 text-4xl leading-tight text-charcoal sm:text-5xl">
            A Little Piece of Handmade Happiness
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-charcoal/75">
            Every piece begins with an idea, a choice of fabric, and the care that goes into making something special. Sew
            Lets Face It celebrates handmade accessories created with personality, creativity, and attention to detail.
          </p>
          <Button to="/our-story" className="mt-8">
            Read Our Story <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
