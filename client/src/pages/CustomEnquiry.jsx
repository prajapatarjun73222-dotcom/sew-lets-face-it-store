import { useSearchParams } from 'react-router-dom';
import { Palette, PenLine, MessagesSquare } from 'lucide-react';
import EnquiryForm from '../components/forms/EnquiryForm';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../context/SettingsContext';
import { sizedImage } from '../utils/format';

const points = [
  { Icon: Palette, title: 'Your fabrics & colours', text: 'Tell us the prints, textures or colour palette you love.' },
  { Icon: PenLine, title: 'Embroidery & names', text: 'Add initials, a name or a motif for a truly personal piece.' },
  { Icon: MessagesSquare, title: 'A friendly chat', text: 'Jackie will reply by email to explore what is possible.' },
];

export default function CustomEnquiry() {
  useDocumentTitle('Custom Creations', 'Request a custom handmade bag or personalised gift from Sew Lets Face It.');
  const [params] = useSearchParams();
  const { settings } = useSettings();

  return (
    <div>
      <section className="bg-beige">
        <div className="container-page grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <p className="font-script text-3xl text-terracotta">Made just for you</p>
            <h1 className="mt-2 text-5xl leading-tight text-charcoal sm:text-6xl">Something Made Just for You</h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-charcoal/75">
              Have a particular fabric, embroidery idea, or custom design in mind? Tell us what you are imagining, and let's
              explore a handmade creation just for you.
            </p>
          </div>
          <img
            src={sizedImage(settings.images.custom, 1000)}
            alt="Floral fabric for a custom handmade piece"
            className="aspect-[16/10] w-full rounded-sm object-cover"
          />
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_1.6fr]">
        <ul className="space-y-6">
          {points.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-terracotta/30 text-terracotta">
                <Icon className="size-5" strokeWidth={1.4} aria-hidden />
              </span>
              <div>
                <h2 className="font-sans text-sm font-semibold text-charcoal">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
          <li className="rounded-sm bg-cream-dark p-4 text-xs leading-relaxed text-muted">
            Sending an enquiry doesn't commit you to anything, and no payment is taken on this website.
          </li>
        </ul>
        <div className="rounded-sm border border-beige bg-white p-6 sm:p-8">
          <h2 className="mb-6 text-3xl text-charcoal">Tell us your idea</h2>
          <EnquiryForm
            defaultType="Custom creation"
            defaultProduct={params.get('product') || ''}
            messagePlaceholder="Describe the piece you're imagining - type of bag, size, fabrics or colours, embroidery, who it's for and any date you have in mind."
          />
        </div>
      </div>
    </div>
  );
}
