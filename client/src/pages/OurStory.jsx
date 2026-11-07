import { ArrowRight, Lightbulb, Scissors, Sparkles, Gift } from 'lucide-react';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../context/SettingsContext';
import { sizedImage } from '../utils/format';

const img = (id, w) => sizedImage(`https://images.unsplash.com/photo-${id}`, w);

const steps = [
  {
    Icon: Lightbulb,
    title: 'An idea',
    text: 'Each design starts with a sketch, a colour combination or a request from someone looking for something special.',
  },
  {
    Icon: Scissors,
    title: 'Choosing the fabric',
    text: 'Corduroys, cottons and prints are chosen for how they look, how they feel and how they will wear over time.',
  },
  {
    Icon: Sparkles,
    title: 'Stitching & embroidery',
    text: 'Pieces are cut, sewn and finished at the sewing machine, with machine embroidery adding names, florals and motifs.',
  },
  {
    Icon: Gift,
    title: 'Ready to be loved',
    text: 'Every finished piece is checked over before it goes on to become part of someone\u2019s everyday life.',
  },
];

export default function OurStory() {
  useDocumentTitle(
    'About Jackie',
    'Meet Jackie, the creator behind Sew Lets Face It — handmade bags, accessories, gifts and sewing classes.'
  );
  const { settings } = useSettings();

  return (
    <div>
      <section className="relative overflow-hidden bg-beige">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="max-w-xl">
            <p className="font-script text-3xl text-terracotta">About Jackie</p>
            <h1 className="mt-2 text-5xl leading-[1.05] text-charcoal sm:text-6xl">Sew Lets Face It</h1>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-charcoal/75">
              <p>
                Hi, I&apos;m Jackie, the creator behind Sew Lets Face It. I&apos;m passionate about sewing and creating
                beautiful, practical handmade items, including bags, purses, accessories and unique gifts. Every piece is
                made with care and attention to detail, using fabrics and designs chosen to make each item special.
              </p>
              <p>
                Alongside my handmade collections, I offer sewing classes for beginners and those looking to develop their
                skills. I love helping others discover the enjoyment of sewing and the satisfaction of creating something
                themselves.
              </p>
              <p>
                Whether you&apos;re looking for a unique handmade gift or want to learn a new skill, I&apos;m delighted to
                welcome you to Sew Lets Face It!
              </p>
            </div>
          </div>
          <img
            src={sizedImage(settings.images.story, 1200)}
            alt="Fabric being stitched on a sewing machine"
            className="aspect-[4/3] w-full rounded-sm object-cover"
          />
        </div>
      </section>

      <section className="container-page grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="grid grid-cols-2 gap-4">
          <img
            src={img('1527385352018-3c26dd6c3916', 700)}
            alt="Floral embroidery in wooden hoops"
            loading="lazy"
            className="aspect-[3/4] w-full rounded-sm object-cover"
          />
          <img
            src={img('1520006403909-838d6b92c22e', 700)}
            alt="Colourful patterned fabrics hanging on a rail"
            loading="lazy"
            className="mt-10 aspect-[3/4] w-full rounded-sm object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-4xl text-charcoal">Why handmade?</h2>
          <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-charcoal/75">
            <p>
              Handmade pieces carry something that mass-produced accessories can&apos;t: the choices of the person who made
              them. The fabric, the lining, the length of a strap, the placement of a motif - each one is considered.
            </p>
            <p>
              Because items are made in small numbers, no two batches are quite the same. Many pieces can be personalised
              with a name or initials, and if you have something particular in mind, you are always welcome to ask about a
              custom creation.
            </p>
          </div>
          <p className="mt-6 font-script text-3xl text-charcoal">- Jackie</p>
        </div>
      </section>

      <section className="bg-cream-dark py-16 sm:py-24" aria-labelledby="process-heading">
        <div className="container-page">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="eyebrow mb-2">The making process</p>
            <h2 id="process-heading" className="text-4xl text-charcoal sm:text-5xl">
              From idea to finished piece
            </h2>
          </div>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ Icon, title, text }, i) => (
              <li key={title} className="rounded-sm border border-beige bg-cream p-6">
                <div className="flex items-center justify-between">
                  <Icon className="size-7 text-terracotta" strokeWidth={1.3} aria-hidden />
                  <span className="font-serif text-3xl text-beige-dark">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-sans text-sm font-semibold tracking-wide text-charcoal">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['1771585655058-1772ec95b84b', 'Embroidered botanical tote bag'],
            ['1758398332771-0a79c5df74a3', 'Neatly finished zipped toiletry bag'],
            ['1777148783728-510bbeeba075', 'Close-up of floral machine embroidery'],
          ].map(([id, alt]) => (
            <img key={id} src={img(id, 700)} alt={alt} loading="lazy" className="aspect-square w-full rounded-sm object-cover" />
          ))}
        </div>
        <div className="mx-auto mt-14 max-w-2xl text-center">
          <h2 className="text-4xl text-charcoal sm:text-5xl">Find your piece</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Browse the current collection, or tell us about something you&apos;d love made just for you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/shop" size="lg">
              Browse the Collection <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button to="/custom-order" variant="outline" size="lg">
              Request a Custom Creation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
