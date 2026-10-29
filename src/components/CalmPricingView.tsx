import React, { useState } from 'react';
import { 
  Check, 
  X as XIcon, 
  ShieldCheck, 
  HeartHandshake, 
  HelpCircle, 
  PhoneCall, 
  Calendar,
  CreditCard,
  MessageCircle
} from 'lucide-react';

interface CalmPricingViewProps {
  onOpenIntakeModal: () => void;
}

export const CalmPricingView: React.FC<CalmPricingViewProps> = ({ onOpenIntakeModal }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'INR' | 'USD' | 'CAD'>('INR');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const objections = [
    {
      q: 'Calendars are free.',
      a: 'They are, and we do not replace them. A calendar doesn’t know your grandfather’s shraddha tithi, work out this year’s date for Pune sunrise, or tell your sister in Canada in time. That is what KulLoop does — for the whole family, for about ₹50 a month.',
    },
    {
      q: 'I will just remember.',
      a: 'You probably do — for everyone. This takes it off your shoulders, so the dates remain safe when you are travelling, unwell, or when the next generation steps forward. And your family always keeps the record.',
    },
    {
      q: 'Is it accurate?',
      a: 'Every tithi date is calculated for your home location and tradition and verified against a named published panchang (e.g. Datar Panchang) before it is sent. Each message shows the tithi used, so your family priest can check it. If an error is ever found, we inform you directly.',
    },
    {
      q: 'Why pay before we try it in the pilot?',
      a: 'You will see all your family’s dates for this year, worked out and checked, before you pay. This is a small paid concierge pilot with 30 families; when we launch, new families get a free trial, and founding families lock in their founding price.',
    },
    {
      q: 'Who are you? I know MyDharohar.',
      a: 'We are an independent family ritual service launching with MyDharohar as our trusted launch partner. Your family’s dates stay private and are never shared.',
    },
    {
      q: 'I don’t want lots of messages.',
      a: 'Only the occasions you choose, with a weekly limit, and a quiet digest for minor dates if you prefer. Anyone can reply STOP or PAUSE at any time.',
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Top Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Calm Business Model · Sold with Dignity, Never Fear</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold font-serif-display text-stone-900 tracking-tight text-balance">
          Priced as a family service, because that is what it is.
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          One plan covers the configurator and all invited relatives across India and abroad. No seat fees, no fear-based astrology upsells, and zero guilt marketing.
        </p>

        {/* Currency switcher for diaspora children */}
        <div className="pt-2 flex items-center justify-center gap-1 text-xs">
          <span className="text-stone-500 mr-2">Payer Location:</span>
          {(['INR', 'USD', 'CAD'] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => setSelectedCurrency(curr)}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                selectedCurrency === curr
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {curr === 'INR' ? 'India (₹ INR)' : curr === 'USD' ? 'US ($ USD)' : 'Canada ($ CAD)'}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
        {/* Pilot Season Card (Active now) */}
        <div className="bg-white rounded-2xl border-2 border-amber-400 p-6 shadow-md flex flex-col justify-between space-y-6 relative">
          <div className="absolute -top-3 left-6 bg-amber-400 text-stone-950 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Active Concierge Pilot
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-stone-900 text-lg">
              Founding Family Pilot
            </h3>
            <p className="text-xs text-stone-500">
              For 30 pilot families (Nov 2026 – Feb 2027 season). Dates hand-checked with named panchang.
            </p>

            <div className="pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-stone-900">
                  {selectedCurrency === 'INR' ? '₹299' : selectedCurrency === 'USD' ? '$5' : '$7'}
                </span>
                <span className="text-xs text-stone-500 font-medium">/ pilot season</span>
              </div>
              <div className="text-[11px] text-amber-800 font-medium mt-1">
                Founding price locked in for the first full year after pilot.
              </div>
            </div>

            <ul className="space-y-2 text-xs text-stone-700 pt-3 border-t border-stone-100">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>All ancestral shraddhas & tithis converted</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>WhatsApp reminders in Marathi, Hindi, English</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Semi-manual review against named validation source</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Priest-ready note + annual printable calendar</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onOpenIntakeModal}
            className="w-full py-2.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-2xs cursor-pointer text-center"
          >
            Join Founding Pilot (Appendix A Form)
          </button>
        </div>

        {/* Standard Annual Family Plan */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-stone-900 text-lg">
              Standard Family Plan
            </h3>
            <p className="text-xs text-stone-500">
              One annual subscription covers the configurator and all invited relatives.
            </p>

            <div className="pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-stone-900">
                  {selectedCurrency === 'INR' ? '₹599' : selectedCurrency === 'USD' ? '$10' : '$14'}
                </span>
                <span className="text-xs text-stone-500 font-medium">/ year per family</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                "About ₹50 a month for the whole family."
              </div>
            </div>

            <ul className="space-y-2 text-xs text-stone-700 pt-3 border-t border-stone-100">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Full family occasions loop (unlimited relatives)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tithi dates checked annually for home location</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Licensed MyDharohar preparation guides</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Forwardable wishes & "Today in our family" notes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Cancel anytime in one click; export always free</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl text-center text-xs text-stone-600">
            Free trial at launch: active until the first reminder lands.
          </div>
        </div>

        {/* Diaspora / Gifting Plan */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-stone-900 text-lg">
              Diaspora Gift Plan
            </h3>
            <p className="text-xs text-stone-500">
              A child living abroad gifts the subscription to parents and relatives in India.
            </p>

            <div className="pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-stone-900">
                  {selectedCurrency === 'INR' ? '₹999' : selectedCurrency === 'USD' ? '$15' : '$19'}
                </span>
                <span className="text-xs text-stone-500 font-medium">/ year</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Includes diaspora timezone formatting & multi-household support.
              </div>
            </div>

            <ul className="space-y-2 text-xs text-stone-700 pt-3 border-t border-stone-100">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Payer in US/Canada/UK/UAE; recipients in India</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Timezone-safe reminders for members overseas</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Personalized invitation message naming the giver</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>International card / PayPal billing</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl text-center text-xs text-stone-600">
            Gifting invite sent directly to parents on WhatsApp.
          </div>
        </div>
      </div>

      {/* Allowed vs Forbidden Practices (Page 18) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-900 font-serif-display">
            The Trust Charter: Allowed vs. Forbidden
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            In a category historically monetized by anxiety and fear, calm and transparency are our biggest differentiators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allowed */}
          <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Allowed & Dignified Extras</span>
            </div>
            <ul className="space-y-2 text-xs text-emerald-950">
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 font-bold">•</span>
                <span><strong>Puja-booking affiliate:</strong> Only if helpful and relationship is fully disclosed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 font-bold">•</span>
                <span><strong>Printed family calendar:</strong> Beautiful annual wall calendar offered once a year.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 font-bold">•</span>
                <span><strong>Free data export:</strong> PDF and spreadsheet always free. Your lineage is yours.</span>
              </li>
            </ul>
          </div>

          {/* Forbidden */}
          <div className="p-5 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900 uppercase tracking-wider">
              <XIcon className="w-4 h-4 text-rose-700" />
              <span>Strictly Forbidden Practices</span>
            </div>
            <ul className="space-y-2 text-xs text-rose-950">
              <li className="flex items-start gap-2">
                <span className="text-rose-700 font-bold">•</span>
                <span><strong>Fear-based astrology:</strong> Never sell dosha warnings, shani remedies, or fear.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-700 font-bold">•</span>
                <span><strong>Guilt around death:</strong> No urgency or emotional manipulation around shraddhas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-700 font-bold">•</span>
                <span><strong>Selling family data:</strong> Never shared with third parties or advertisers.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pilot Sales Conversation & Calm Objection Handling (Page 21) */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200/90 p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Pilot Sales Playbook & Calm Script (PDF Page 21)</span>
          </div>
          <h3 className="text-lg font-bold text-stone-900 font-serif-display mt-1">
            "Name the burden, show the dates, ask once."
          </h3>
          <p className="text-xs text-stone-600 mt-1">
            How we explain KulLoop respectfully to families without pressure or fear.
          </p>
        </div>

        {/* Script excerpt */}
        <div className="p-4 bg-white rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed space-y-2 font-serif">
          <p className="italic text-stone-700">
            "Namaskar — I’m from Family Tithi Loop, a new service launching with MyDharohar as our partner. In most families, one person carries every tithi, birthday and anniversary and works out the tithi dates each year. Is that someone in your family?"
          </p>
          <p className="italic text-stone-700">
            "You tell us your family’s occasions once — by tithi or by date. Each year we work out the right dates for your home town and tradition, a person checks them, and everyone you choose gets a WhatsApp reminder a week before and two days before — in Marathi, Hindi or English."
          </p>
        </div>

        {/* Objections Accordion */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Objection Handling Matrix
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {objections.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-stone-200 space-y-2"
              >
                <div className="font-bold text-xs text-stone-900 flex items-start gap-1.5">
                  <span className="text-amber-700">“</span>
                  <span>{item.q}</span>
                  <span className="text-amber-700">”</span>
                </div>
                <div className="text-xs text-stone-600 leading-relaxed">
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
