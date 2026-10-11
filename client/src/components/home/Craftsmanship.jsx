import { HandHeart, Scissors, Flower2 } from 'lucide-react';

const features = [
  {
    Icon: HandHeart,
    title: 'Handmade with Care',
    text: 'Each piece is cut, stitched and finished by hand, with attention to every detail.',
  },
  {
    Icon: Scissors,
    title: 'Thoughtful Fabric Choices',
    text: 'Corduroys, cottons and prints chosen for their texture, colour and character.',
  },
  {
    Icon: Flower2,
    title: 'Unique Designs',
    text: 'Original designs and embroidery, so your piece feels like it was made for you.',
  },
];

export default function Craftsmanship() {
  return (
    <section className="border-y border-beige bg-cream" aria-label="Our craftsmanship">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-3 sm:gap-6 sm:py-16">
        {features.map(({ Icon, title, text }) => (
          <div key={title} className="flex flex-col items-center px-4 text-center">
            <span className="flex size-16 items-center justify-center rounded-full border border-terracotta/30 text-terracotta">
              <Icon className="size-7" strokeWidth={1.2} aria-hidden />
            </span>
            <h3 className="mt-5 font-sans text-sm font-semibold tracking-wide text-charcoal">{title}</h3>
            <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
