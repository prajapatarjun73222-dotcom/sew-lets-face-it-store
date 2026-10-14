import { useSearchParams, Link } from 'react-router-dom';
import { Mail, Phone, Scissors } from 'lucide-react';
import EnquiryForm from '../components/forms/EnquiryForm';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../context/SettingsContext';
import { Instagram, Facebook } from '../components/ui/SocialIcons';

export default function Contact() {
  useDocumentTitle('Contact', 'Get in touch with Sew Lets Face It about a product, a personalised gift or a custom creation.');
  const [params] = useSearchParams();
  const product = params.get('product') || '';
  const { settings } = useSettings();

  return (
    <div>
      <section className="border-b border-beige bg-cream-dark">
        <div className="container-page py-12 sm:py-16">
          <p className="eyebrow mb-2">Get in touch</p>
          <h1 className="text-5xl text-charcoal">Contact Us</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
            Questions about a piece, interested in purchasing, or looking for a personalised gift? Send a message and Jackie
            will get back to you by email.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 sm:py-16 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-sm border border-beige bg-white p-6 sm:p-8">
          <EnquiryForm defaultType={product ? 'Product enquiry' : 'General enquiry'} defaultProduct={product} />
        </div>
        <aside className="space-y-8">
          <div>
            <h2 className="text-2xl text-charcoal">Other ways to say hello</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {settings.contactEmail && (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} className="inline-flex items-center gap-2.5 text-charcoal hover:text-terracotta">
                    <Mail className="size-4 text-terracotta" aria-hidden /> {settings.contactEmail}
                  </a>
                </li>
              )}
              {settings.contactPhone && (
                <li>
                  <a
                    href={`tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`}
                    className="inline-flex items-center gap-2.5 text-charcoal hover:text-terracotta"
                  >
                    <Phone className="size-4 text-terracotta" aria-hidden /> {settings.contactPhone}
                  </a>
                </li>
              )}
              <li>
                <a href={settings.social.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 text-charcoal hover:text-terracotta">
                  <Instagram className="size-4 text-terracotta" /> @sew_lets_face_it
                </a>
              </li>
              <li>
                <a href={settings.social.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 text-charcoal hover:text-terracotta">
                  <Facebook className="size-4 text-terracotta" /> Sew Lets Face It on Facebook
                </a>
              </li>
            </ul>
          </div>
          <div className="rounded-sm bg-beige/60 p-6">
            <Scissors className="size-6 text-terracotta" strokeWidth={1.4} aria-hidden />
            <h2 className="mt-3 text-2xl text-charcoal">Dreaming of something bespoke?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Share your ideas for fabrics, embroidery or a personalised gift.
            </p>
            <Link to="/custom-order" className="mt-4 inline-block text-sm font-medium text-terracotta hover:underline">
              Request a custom creation →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
