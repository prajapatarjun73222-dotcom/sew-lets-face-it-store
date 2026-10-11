import { ArrowRight } from 'lucide-react';
import { Instagram } from '../ui/SocialIcons';
import { useSettings } from '../../context/SettingsContext';
import { sizedImage } from '../../utils/format';

export default function InstagramGallery() {
  const { settings } = useSettings();
  const images = settings.images.instagram || [];
  const profile = settings.social.instagram;
  if (!images.length) return null;

  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="instagram-heading">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="instagram-heading" className="text-3xl text-charcoal sm:text-4xl">
            Follow on Instagram
          </h2>
          <p className="mt-2 text-sm text-muted">
            See the latest creations and behind-the-scenes moments at{' '}
            <a href={profile} target="_blank" rel="noreferrer" className="text-terracotta hover:underline">
              @sew_lets_face_it
            </a>
          </p>
        </div>
        <a
          href={profile}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-terracotta hover:text-terracotta-dark"
        >
          Follow Us <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </a>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
        {images.map((src, i) => (
          <li key={src + i}>
            <a
              href={profile}
              target="_blank"
              rel="noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-sm bg-beige/50"
              aria-label="Visit Sew Lets Face It on Instagram"
            >
              <img
                src={sizedImage(src, 400)}
                alt="Handmade bags and sewing inspiration"
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-charcoal/0 text-white opacity-0 transition group-hover:bg-charcoal/30 group-hover:opacity-100">
                <Instagram className="size-6" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
