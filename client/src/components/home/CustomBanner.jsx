import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EnquiryForm from '../forms/EnquiryForm';
import { HeartStitch } from '../ui/Logo';
import { useSettings } from '../../context/SettingsContext';
import { sizedImage } from '../../utils/format';

export default function CustomBanner() {
  const [open, setOpen] = useState(false);
  const { settings } = useSettings();

  return (
    <section className="container-page py-16 sm:py-24" aria-labelledby="custom-heading">
      <div className="grid overflow-hidden rounded-sm bg-beige lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16">
          <h2 id="custom-heading" className="text-4xl leading-tight text-charcoal sm:text-[2.75rem]">
            Something Made Just for{' '}
            <span className="whitespace-nowrap">
              You
              <HeartStitch className="ml-3 inline size-8 -translate-y-1 text-terracotta" />
            </span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-charcoal/75">
            Have a particular fabric, embroidery idea, or custom design in mind? Tell us what you are imagining, and let's
            explore a handmade creation just for you.
          </p>
          <div className="mt-8">
            <Button onClick={() => setOpen(true)} aria-haspopup="dialog">
              Request a Custom Creation <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
        <div className="relative min-h-[260px]">
          <img
            src={sizedImage(settings.images.custom, 1000)}
            alt="Colourful floral fabric ready to be made into a custom piece"
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Request a Custom Creation">
        <p className="mb-6 text-sm leading-relaxed text-muted">
          Share as much or as little as you like - fabrics, colours, a name for embroidery, or who it's for. Jackie will
          reply by email to talk through ideas. There's no obligation, and nothing is charged for an enquiry.
        </p>
        <EnquiryForm
          defaultType="Custom creation"
          messagePlaceholder="Tell us about the piece you're imagining - the type of bag, fabrics or colours, any embroidery or personalisation…"
        />
      </Modal>
    </section>
  );
}
