import { Link } from 'react-router-dom';
import Alert from '../components/ui/Alert';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../context/SettingsContext';

function PolicyPage({ title, children }) {
  useDocumentTitle(title);
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <h1 className="text-5xl text-charcoal">{title}</h1>
      <Alert type="warning" title="Draft - pending owner approval" className="mt-6">
        This page is placeholder wording prepared for the website demo. It has not been reviewed or approved by the business
        owner and is not legal advice. It must be reviewed before the site goes live.
      </Alert>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-charcoal/80 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:text-charcoal [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}

export function PrivacyPolicy() {
  const { settings } = useSettings();
  return (
    <PolicyPage title="Privacy Policy">
      <section>
        <h2>Who we are</h2>
        <p>
          {settings.brandName} is an independent handmade business based in the UK. This draft explains how personal
          information submitted through this website would be handled.
        </p>
      </section>
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>Details you provide in the contact or custom enquiry forms (name, email address and your message).</li>
          <li>
            When you place an order: your name, email address, optional phone number, delivery address and the items you
            ordered. Card payments are handled by Stripe - your card details are entered on Stripe's secure page and are
            never stored by us.
          </li>
          <li>
            When you book a sewing class: your name, email address, phone number and the date you booked. Payment is again
            handled by Stripe.
          </li>
          <li>Your email address if you subscribe to the newsletter.</li>
          <li>
            Your bag and wishlist are stored only in your own browser (local storage) and are not sent to us.
          </li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          Order details are used to make, pack and deliver your order and to keep the records a business is required to
          keep. Class booking details are used to manage the class and to contact you about it. Enquiry details are used only to respond to you. Newsletter emails are used only to send updates about new pieces
          and can be removed at any time on request.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          Under UK data protection law you can ask to access, correct or delete your personal information. Please{' '}
          <Link to="/contact" className="text-terracotta underline">
            contact us
          </Link>{' '}
          to make a request.
        </p>
      </section>
    </PolicyPage>
  );
}

export function Terms() {
  return (
    <PolicyPage title="Terms & Conditions">
      <section>
        <h2>About this website</h2>
        <p>
          This website sells handmade products to customers in the United Kingdom and takes bookings for sewing classes in
          Leamington Spa. Custom creations are arranged directly after an enquiry.
        </p>
      </section>
      <section>
        <h2>Ordering &amp; payment</h2>
        <ul>
          <li>Payment is taken securely by Stripe when you place your order. Prices are shown in pounds sterling (GBP).</li>
          <li>Your order is confirmed once payment has been received; you'll see an order number on the confirmation page.</li>
          <li>
            If an item turns out to be unavailable after you have paid, we will contact you and offer an alternative or a full
            refund.
          </li>
        </ul>
      </section>
      <section>
        <h2>Delivery</h2>
        <p>
          We currently deliver within the UK only. The delivery charge is shown in your bag and at checkout before you pay.
          Handmade items may need a little extra time to prepare before dispatch.
        </p>
      </section>
      <section>
        <h2>Cancellations &amp; returns</h2>
        <p>
          Details of cancellation and return rights, including for personalised items, will be confirmed by the business
          owner before the site goes live.
        </p>
      </section>
      <section>
        <h2>Products &amp; prices</h2>
        <ul>
          <li>Each item is handmade, so small variations in fabric placement, colour and stitching are part of its character.</li>
          <li>Prices and availability shown on this site may change before you order.</li>
          <li>Photographs are for illustration and may not show the exact fabric of your piece.</li>
        </ul>
      </section>
      <section>
        <h2>Custom &amp; personalised items</h2>
        <p>
          Details, timings and any costs for custom or personalised pieces will be agreed with you directly before any work
          begins.
        </p>
      </section>
      <section>
        <h2>Sewing class bookings</h2>
        <ul>
          <li>
            Class places are paid for in full when you book. Your place is confirmed once payment has been received and you
            see a booking number on the confirmation page.
          </li>
          <li>Each class has a limited number of places. Class times are UK time.</li>
          <li>
            If a class has to be cancelled by us, we will contact you using the details you gave when booking to offer
            another date or a full refund.
          </li>
          <li>
            The policy for cancelling or changing a booking yourself will be confirmed by the business owner before the site
            goes live.
          </li>
        </ul>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms? Please{' '}
          <Link to="/contact" className="text-terracotta underline">
            get in touch
          </Link>
          .
        </p>
      </section>
    </PolicyPage>
  );
}
