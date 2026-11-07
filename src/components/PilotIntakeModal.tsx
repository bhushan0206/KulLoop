import React, { useState } from 'react';
import { PilotIntakeFormState, LanguageCode } from '../types';
import { X, CheckCircle, FileText, Shield, ArrowRight, ArrowLeft } from 'lucide-react';

interface PilotIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (data: PilotIntakeFormState) => void;
}

export const PilotIntakeModal: React.FC<PilotIntakeModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PilotIntakeFormState>({
    fullName: '',
    whatsappNumber: '+91 ',
    email: '',
    preferredLanguage: 'mr',
    howDidYouHear: 'MyDharohar (partner)',

    familyName: '',
    homeLocation: '',
    secondLocation: '',
    convention: 'Amanta',
    traditionNotes: '',
    consultedEntity: 'An elder',

    ancestorName: '',
    ancestorRelation: '',
    knowsTithi: 'yes',
    ancestorPaksha: 'Krishna',
    ancestorMonth: '',
    ancestorTithi: '',
    ancestorPassingDate: '',
    mahalayaPractice: 'Same tithi in Pitru Paksha',

    otherOccasionType: 'Birthday',
    otherPerson: '',
    otherKeptBy: 'Tithi',
    otherDateOrTithi: '',

    selectedFestivals: [],
    selectedVrats: [],

    membersList: [],

    consentAgreed: true,
    paymentAcknowledged: true,
    privacyAgreed: true,
  });

  if (!isOpen) return null;

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitSuccess(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
              <span>Appendix A & B</span>
              <span aria-hidden="true">·</span>
              <span>Pilot Intake Questionnaire (Stage A)</span>
            </div>
            <h3 className="text-xl font-bold text-stone-900 font-serif-display mt-0.5">
              Family Tithi Loop — Concierge Intake
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs font-medium text-stone-500 border-b border-stone-100 pb-3">
          <span className={currentStep === 1 ? 'text-amber-800 font-bold' : ''}>
            1. You & Family Place
          </span>
          <span className={currentStep === 2 ? 'text-amber-800 font-bold' : ''}>
            2. Ancestors & Tithis
          </span>
          <span className={currentStep === 3 ? 'text-amber-800 font-bold' : ''}>
            3. Vrats & Festivals
          </span>
          <span className={currentStep === 4 ? 'text-amber-800 font-bold' : ''}>
            4. Consent & Pilot ₹299
          </span>
        </div>

        {/* Form Contents */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Configurator & Home Location */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-xs text-stone-600 bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
                You tell us your family's occasions once. We calculate each date for your home location and tradition, check the tithi dates with a reviewer, and send automated email (plus optional push) reminders. WhatsApp is share-yourself from the Reminders hub — no Business API broadcasts yet.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Your Full Name (Configurator)</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Your WhatsApp Number (with country code)</label>
                  <input
                    type="text"
                    required
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Family Name</label>
                  <input
                    type="text"
                    required
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">
                    Family Home Location (Town / City, State)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune, Maharashtra"
                    value={formData.homeLocation}
                    onChange={(e) => setFormData({ ...formData, homeLocation: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                  />
                  <p className="text-[10px] text-stone-400">The location whose local sunrise is followed.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">Calendar Convention Followed</label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="convention"
                      checked={formData.convention === 'Amanta'}
                      onChange={() => setFormData({ ...formData, convention: 'Amanta' })}
                    />
                    <span>Amanta (Month ends on Amavasya - Maharashtra, Gujarat, South)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="convention"
                      checked={formData.convention === 'Purnimanta'}
                      onChange={() => setFormData({ ...formData, convention: 'Purnimanta' })}
                    />
                    <span>Purnimanta (North India)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Ancestors & Tithis */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-600 border border-stone-200">
                Add an ancestor whose shraddha the family observes. If you know only the Gregorian date of passing, we estimate the tithi and mark it for confirmation.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Ancestor Name</label>
                  <input
                    type="text"
                    value={formData.ancestorName}
                    onChange={(e) => setFormData({ ...formData, ancestorName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Relationship</label>
                  <input
                    type="text"
                    value={formData.ancestorRelation}
                    onChange={(e) => setFormData({ ...formData, ancestorRelation: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Lunar Month</label>
                  <input
                    type="text"
                    value={formData.ancestorMonth}
                    onChange={(e) => setFormData({ ...formData, ancestorMonth: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Paksha</label>
                  <input
                    type="text"
                    value={formData.ancestorPaksha}
                    onChange={(e) => setFormData({ ...formData, ancestorPaksha: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Tithi</label>
                  <input
                    type="text"
                    value={formData.ancestorTithi}
                    onChange={(e) => setFormData({ ...formData, ancestorTithi: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">Mahalaya (Pitru Paksha) Practice</label>
                <select
                  value={formData.mahalayaPractice}
                  onChange={(e) => setFormData({ ...formData, mahalayaPractice: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                >
                  <option value="Same tithi in Pitru Paksha">Same tithi in Pitru Paksha</option>
                  <option value="Sarvapitri Amavasya">Sarvapitri Amavasya</option>
                  <option value="Other custom">Other custom</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Vrats & Festivals */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-xs text-stone-600">
                Tick only the ones your family actually observes. We never send festival reminders you have not chosen.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-800">Festivals Observed:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {['Ganesh Chaturthi', 'Diwali / Lakshmi Puja', 'Bhau-beej', 'Raksha Bandhan', 'Karva Chauth', 'Makar Sankranti', 'Gudi Padwa', 'Maha Shivratri'].map((fest) => {
                    const isChecked = formData.selectedFestivals.includes(fest);
                    return (
                      <label key={fest} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, selectedFestivals: [...formData.selectedFestivals, fest] });
                            } else {
                              setFormData({ ...formData, selectedFestivals: formData.selectedFestivals.filter((f) => f !== fest) });
                            }
                          }}
                        />
                        <span>{fest}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-stone-800">Vrats & Special Days:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {['Sankashti Chaturthi', 'Angarki Sankashti', 'Ekadashi (both)', 'Satyanarayan puja', 'Kuldevta day', 'Pradosh'].map((vr) => {
                    const isChecked = formData.selectedVrats.includes(vr);
                    return (
                      <label key={vr} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, selectedVrats: [...formData.selectedVrats, vr] });
                            } else {
                              setFormData({ ...formData, selectedVrats: formData.selectedVrats.filter((v) => v !== vr) });
                            }
                          }}
                        />
                        <span>{vr}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Consent, Payment & Privacy */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Pilot Payment Acknowledgement (Section 8)
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  I understand the pilot season (Nov 2026 – Feb 2027) costs <strong>₹299 for the whole family</strong> — a founding-family price. It is paid upfront after I have checked the read-back of my family's dates and before any reminder is sent. There is no free trial in the pilot.
                </p>
                <label className="flex items-center gap-2 text-xs font-semibold text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.paymentAcknowledged}
                    onChange={(e) => setFormData({ ...formData, paymentAcknowledged: e.target.checked })}
                  />
                  <span>I understand and agree to the ₹299 founding-family season price.</span>
                </label>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs text-stone-700">
                <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span>Privacy & Family Data Boundary (Section 9)</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-600">
                  <li>Your family record is private family data, used only to compute dates and send reminders.</li>
                  <li>It is not published, not shared, not used for astrology, and never sold.</li>
                  <li>MyDharohar is our launch partner but does not receive your private family record.</li>
                  <li>Exporting your family record as PDF/spreadsheet is always free.</li>
                </ul>
                <label className="flex items-center gap-2 font-semibold text-stone-900 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    required
                    checked={formData.privacyAgreed}
                    onChange={(e) => setFormData({ ...formData, privacyAgreed: e.target.checked })}
                  />
                  <span>I have read the privacy note and agree.</span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Submit Pilot Intake Form</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
