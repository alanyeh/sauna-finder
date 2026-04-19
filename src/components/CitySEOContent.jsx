import { getCityContent } from '../lib/cityContent';
import { getCityFullName } from '../lib/cities';

const KORIBOSHI_PRODUCT_URL = 'https://koriboshi.com';

// Use native <details>/<summary> so every FAQ answer is always present in the
// rendered HTML. Crawlers index the collapsed content; the FAQPage JSON-LD
// gives Google/Bing structured data for rich results.
function FAQItem({ q, a, defaultOpen }) {
  return (
    <details
      className="group border-b border-light-border last:border-b-0"
      open={defaultOpen || undefined}
    >
      <summary className="flex items-start justify-between gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="font-serif text-[15px] md:text-[17px] text-charcoal leading-snug">
          {q}
        </span>
        <span
          className="flex-shrink-0 text-warm-gray text-xl transition-transform group-open:rotate-45"
          aria-hidden="true"
        >
          +
        </span>
      </summary>
      <p className="pb-5 pr-8 text-[14px] md:text-[15px] leading-relaxed text-warm-gray">
        {a}
      </p>
    </details>
  );
}

export default function CitySEOContent({ citySlug }) {
  const content = getCityContent(citySlug);
  const cityFullName = getCityFullName(citySlug);

  return (
    <section className="bg-cream border-t border-light-border">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-5 md:mb-6 leading-tight">
          About the Sauna Scene in {cityFullName}
        </h2>
        <div className="space-y-4 mb-10 md:mb-14">
          {content.intro.map((paragraph, i) => (
            <p
              key={i}
              className="text-[15px] md:text-[16px] leading-relaxed text-charcoal"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="border border-light-border rounded-xl bg-white p-5 md:p-6 mb-10 md:mb-14">
          <p className="text-[11px] md:text-[12px] uppercase tracking-wider text-warm-gray mb-2">
            What to Bring
          </p>
          <h3 className="font-serif text-xl md:text-2xl text-charcoal mb-2">
            A Koriboshi Sauna Hat
          </h3>
          <p className="text-[14px] md:text-[15px] leading-relaxed text-warm-gray mb-4">
            A sauna hat protects your hair and helps regulate head temperature
            during longer sessions — a staple in Russian and Finnish sauna
            traditions. Koriboshi makes a wool felt sauna hat designed for real
            bathhouse use.
          </p>
          <a
            href={KORIBOSHI_PRODUCT_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 text-[13px] md:text-[14px] font-medium text-accent-red hover:text-charcoal transition-colors"
          >
            Shop Koriboshi <span aria-hidden="true">›</span>
          </a>
        </div>

        <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-3 md:mb-4 leading-tight">
          Frequently Asked Questions
        </h2>
        <div>
          {content.faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
