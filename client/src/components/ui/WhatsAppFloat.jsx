import { WhatsApp } from './SocialIcons';
import { whatsappGeneralUrl } from '../../utils/whatsapp';

export default function WhatsAppFloat() {
  return (
    <a
      href={whatsappGeneralUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebe57] focus-visible:outline-offset-4 sm:right-6 sm:bottom-6"
    >
      <WhatsApp className="size-7" />
      <span className="sr-only">Enquire on WhatsApp</span>
    </a>
  );
}
