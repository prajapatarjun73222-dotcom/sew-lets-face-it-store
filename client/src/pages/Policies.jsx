import { Link } from 'react-router-dom';
import Alert from '../components/ui/Alert';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../context/SettingsContext';

function PolicyPage({ title, children, draft = false }) {
  useDocumentTitle(title);
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <h1 className="text-5xl text-charcoal">{title}</h1>
      {draft && (
        <Alert type="warning" title="Draft - pending owner approval" className="mt-6">
          This page is placeholder wording prepared for the website demo. It has not been reviewed or approved by the
          business owner and is not legal advice. It must be reviewed before the site goes live.
        </Alert>
      )}
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-charcoal/80 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:text-charcoal [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:text-charcoal [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5">
        {children}
      </div>
    </div>
  );
}

export function PrivacyPolicy() {
  const { settings } = useSettings();
  return (
    <PolicyPage title="Privacy Policy" draft>
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
            ordered. Card and Clearpay payments are handled by Stripe. Your card details are entered on Stripe&apos;s
            secure page and are never stored by us.
          </li>
          <li>
            When you book a sewing class: your name, email address, phone number and the date you booked. Payment is again
            handled by Stripe.
          </li>
          <li>Your email address if you subscribe to the newsletter.</li>
          <li>Your bag and wishlist are stored only in your own browser (local storage) and are not sent to us.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          Order details are used to make, pack and deliver your order and to keep the records a business is required to
          keep. Class booking details are used to manage the class and to contact you about it. Enquiry details are used
          only to reply to you. Newsletter emails are used only to send updates about new pieces and can be removed at any
          time on request.
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
      <p className="text-sm text-muted">Last updated: 18 October 2026</p>

      <section>
        <h2>1. About Us</h2>
        <p>
          Sew Lets Face It is a small independent business offering handmade products, accessories, gifts and sewing
          classes.
        </p>
        <p className="mt-3">
          These Terms &amp; Conditions apply to purchases and bookings made through the Sew Lets Face It website. By
          placing an order or booking a class, you agree to these terms, subject to your statutory rights under UK law.
        </p>
      </section>

      <section>
        <h2>2. Handmade Products</h2>
        <p>
          Each handmade item is created with care and attention to detail. As products are handmade, minor variations in
          fabric pattern, colour, finish or appearance may occur. These variations are part of the individual character of
          handmade products.
        </p>
        <p className="mt-3">
          Product photographs and descriptions are provided as accurately as possible. Colours may appear slightly
          different depending on your screen or device.
        </p>
        <p className="mt-3">
          If an item is personalised or made to order, the relevant details will be confirmed before production where
          necessary.
        </p>
      </section>

      <section>
        <h2>3. Prices and Payment</h2>
        <p>All prices will be displayed on the website and will be in pounds sterling (£), unless stated otherwise.</p>
        <p className="mt-3">
          Payment must be completed using the payment methods offered at checkout. An order or class booking will be
          treated as confirmed in accordance with the confirmation provided by the website.
        </p>
        <p className="mt-3">
          Where a payment instalment option is available, its eligibility, payment schedule and applicable terms will be
          displayed during checkout. Approval and payment arrangements may be subject to the provider&apos;s own terms.
        </p>
        <p className="mt-3">Sew Lets Face It reserves the right to correct genuine pricing errors before accepting an order.</p>
      </section>

      <section>
        <h2>4. Orders and Delivery</h2>
        <p>
          Orders will be processed as soon as reasonably practicable. Estimated delivery times will be provided where
          available, but delivery dates cannot be guaranteed unless expressly agreed.
        </p>
        <p className="mt-3">Delivery charges, where applicable, will be shown before payment.</p>
        <p className="mt-3">
          Customers should ensure that the delivery address supplied at checkout is correct. Please contact us promptly if
          you notice an error.
        </p>
        <p className="mt-3">
          If an order is delayed, lost or arrives damaged, please contact us so that the matter can be investigated and an
          appropriate resolution arranged.
        </p>
      </section>

      <section>
        <h2>5. Returns, Refunds and Faulty Items</h2>
        <p>Your statutory rights are not affected by these Terms &amp; Conditions.</p>
        <p className="mt-3">
          For most goods purchased online, UK consumer law provides a 14-day cancellation period from the day after you
          receive your order. You must notify us within the applicable period if you wish to cancel. You will normally then
          have a further 14 days to return the goods.
        </p>
        <p className="mt-3">
          Returned goods should be handled with reasonable care. Where the law permits, you may be responsible for the
          direct cost of returning goods if you were informed of this before purchase.
        </p>
        <p className="mt-3">
          Exceptions may apply to certain items, including genuinely personalised or made-to-specification goods, and goods
          that are exempt from cancellation rights under applicable law.
        </p>
        <p className="mt-3">
          These exceptions do not remove your rights if an item is faulty, damaged, misdescribed or otherwise fails to meet
          legal requirements.
        </p>
        <p className="mt-3">
          If you receive a faulty or incorrect item, please contact us with your order details and, where helpful,
          photographs. We will explain the next steps and provide the remedy required by law.
        </p>
      </section>

      <section>
        <h2>6. Sewing Class Bookings</h2>
        <p>
          Sewing classes must be booked through the website or another booking method expressly offered by Sew Lets Face
          It.
        </p>
        <p className="mt-3">
          Class descriptions will state the relevant price, date, time, duration and venue. Customers are responsible for
          checking these details before completing a booking.
        </p>
        <p className="mt-3">
          A booking is confirmed when the website or Sew Lets Face It provides confirmation in accordance with the booking
          arrangements.
        </p>
        <p className="mt-3">
          Customers should arrive promptly and follow any reasonable safety instructions provided during the class. Please
          tell us in advance about any requirements that may affect your participation.
        </p>
      </section>

      <section>
        <h2>7. Class Cancellations and Changes</h2>
        <p>If you need to cancel or change a class booking, please contact Sew Lets Face It as soon as possible.</p>
        <p className="mt-3">
          Any cancellation charges, refund arrangements or transfer options will be explained in the class booking
          information before payment.
        </p>
        <p className="mt-3">
          If Sew Lets Face It needs to cancel or reschedule a class, customers will be informed as soon as reasonably
          practicable and offered an appropriate alternative or refund, as required by law and the circumstances.
        </p>
        <p className="mt-3">Nothing in this section limits any statutory cancellation rights that apply to the booking.</p>
      </section>

      <section>
        <h2>8. Special Offers and Discount Codes</h2>
        <p>Special offers and discount codes are subject to the conditions displayed alongside each promotion.</p>
        <p className="mt-3">Unless otherwise stated, offers:</p>
        <ul>
          <li>Apply only to the products or classes specified.</li>
          <li>Must be used within the stated promotional period.</li>
          <li>Cannot be exchanged for cash.</li>
          <li>Cannot be combined with other promotions unless expressly permitted.</li>
        </ul>
        <p className="mt-3">
          Any minimum spend, eligibility requirement or other restriction will be made clear before purchase.
        </p>
        <p className="mt-3">
          Sew Lets Face It reserves the right to correct errors in promotional listings and to withdraw or amend an offer
          prospectively, subject to existing orders, applicable law and any specific terms of the promotion.
        </p>
      </section>

      <section>
        <h2>9. Gift Vouchers</h2>
        <p>
          If gift vouchers are offered, their value, validity period, redemption instructions and any restrictions will be
          stated at the time of purchase.
        </p>
        <p className="mt-3">Applicable consumer rights remain unaffected.</p>
      </section>

      <section>
        <h2>10. Intellectual Property</h2>
        <p>
          Unless otherwise stated, the photographs, product descriptions, designs, branding and written content on the Sew
          Lets Face It website belong to Sew Lets Face It or are used with permission.
        </p>
        <p className="mt-3">They must not be copied, reproduced or used commercially without appropriate permission.</p>
        <p className="mt-3">
          Purchasing a handmade item does not transfer ownership of the underlying design or intellectual property.
        </p>
      </section>

      <section>
        <h2>11. Website Information</h2>
        <p>We aim to keep website information accurate and up to date. However, occasional errors or omissions may occur.</p>
        <p className="mt-3">
          If a material error affects an order or booking, we will contact the customer to discuss an appropriate
          resolution.
        </p>
        <p className="mt-3">We will not exclude or limit liability where doing so would be unlawful.</p>
      </section>

      <section>
        <h2>12. Privacy and Personal Information</h2>
        <p>
          Personal information provided when placing an order or booking a class will be handled in accordance with our{' '}
          <Link to="/privacy" className="text-terracotta underline">
            Privacy Policy
          </Link>{' '}
          and applicable UK data protection law.
        </p>
        <p className="mt-3">
          Booking confirmation emails and other messages necessary to administer an order or class may be sent as part of
          providing the service.
        </p>
        <p className="mt-3">
          Marketing emails and promotional communications will be sent in accordance with applicable privacy and electronic
          marketing rules, including where consent is required.
        </p>
      </section>

      <section>
        <h2>13. Contact Us</h2>
        <p>
          If you have a question about an order, a product, a class booking or these Terms &amp; Conditions, please contact
          Sew Lets Face It using the{' '}
          <Link to="/contact" className="text-terracotta underline">
            contact details
          </Link>{' '}
          provided on our website.
        </p>
      </section>

      <section>
        <h2>14. Governing Law</h2>
        <p>
          These Terms &amp; Conditions are governed by the laws of England and Wales, where applicable. Consumers retain any
          mandatory rights and protections available under the laws that apply to them.
        </p>
      </section>

      <section>
        <h2>Sewing Class Booking, Cancellation and Rescheduling Policy</h2>
        <p>
          When booking a sewing class with Sew Lets Face It, please ensure you can attend on your chosen date and time.
        </p>
        <h3 className="mt-4">Cancellations and rescheduling</h3>
        <p className="mt-2">If you are unable to attend your booked class, please contact me as soon as possible.</p>
        <ul className="mt-3">
          <li>
            <strong>No cash refunds:</strong> Class fees are not normally refundable if you cancel or are unable to attend,
            subject to your statutory rights.
          </li>
          <li>
            <strong>Rescheduling your class:</strong> If you cancel, you may rearrange your booking to another available
            class, provided you attend within one month of your original class date.
          </li>
          <li>
            <strong>Notice:</strong> Please give as much notice as possible if you need to cancel or rearrange your booking.
          </li>
          <li>
            <strong>Missed classes:</strong> If you do not attend your class and have not contacted me beforehand, your
            booking may be treated as a missed session and you may lose the fee paid for that session.
          </li>
          <li>
            <strong>Availability:</strong> Any rearranged session will be subject to availability and must be agreed in
            advance with Sew Lets Face It.
          </li>
        </ul>
        <p className="mt-3">
          If Sew Lets Face It needs to cancel a class, you will be offered an alternative date or an appropriate refund.
        </p>
        <p className="mt-3">
          These conditions do not override any cancellation or refund rights you may have under applicable consumer law,
          including any rights relating to online bookings.
        </p>
        <p className="mt-3">By completing your booking, you confirm that you have read and understood this policy.</p>
      </section>

      <section>
        <h2>Bespoke and Made-to-Order Products – Returns and Refunds</h2>
        <p>
          At Sew Lets Face It, bespoke and personalised items are made specifically to meet each customer&apos;s individual
          requirements.
        </p>
        <p className="mt-3">
          Before work begins, we will discuss the requested design, materials, colours, dimensions, personalisation and any
          other relevant details with you. Where appropriate, the final agreed specifications will be confirmed before
          production starts.
        </p>
        <p className="mt-3">
          Please check your order carefully before confirming your purchase. Once you have approved the final design and
          specifications and production has begun, changes may not be possible.
        </p>
        <p className="mt-3">
          As bespoke items are made to your individual requirements, we do not normally accept cancellations, returns or
          refunds simply because you change your mind, no longer want the item or decide that it does not suit your
          preferences after it has been made to the agreed specifications.
        </p>
        <p className="mt-3">
          However, this policy does not affect your statutory rights. If an item is faulty, damaged, not as described or
          does not conform to the agreed specifications, you may be entitled to a repair, replacement, refund or another
          remedy under applicable consumer law.
        </p>
        <p className="mt-3">
          Where a bespoke order is agreed, please retain any written confirmation of the final design and specifications so
          that we both have a clear record of what has been requested.
        </p>
        <p className="mt-3">
          Thank you for supporting handmade products and allowing the time and care needed to create something especially
          for you.
        </p>
      </section>

      <section>
        <h2>Deposits on Orders Over £50</h2>
        <p>
          For bespoke, personalised or made-to-order items priced over £50, a 15% deposit is required when placing the
          order. This deposit secures your order and covers the initial commitment to materials and preparation. The deposit
          is non-refundable if you cancel your order or change your mind, subject to your statutory rights. The remaining
          balance must be paid as agreed before the item is dispatched or collected.
        </p>
      </section>
    </PolicyPage>
  );
}
