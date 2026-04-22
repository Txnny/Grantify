'use client';

import { useState } from 'react';
import { BusinessProfile, CompanyStage } from '@/lib/types';

interface Props {
  initial?: Partial<BusinessProfile>;
  onSubmit: (profile: BusinessProfile) => void;
  onBack: () => void;
}

const COMPANY_STAGES: CompanyStage[] = ['Pre-revenue', 'Early-stage', 'Growth', 'Established'];

const PRESET_SECTORS = [
  'Technology / Software', 'AgriTech / Food Tech', 'CleanTech / Energy',
  'Health / MedTech', 'Manufacturing', 'Creative Industries',
  'Retail / E-commerce', 'Professional Services', 'Social Enterprise',
  'Education / EdTech', 'Fintech', 'Tourism / Hospitality',
];

const PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
];

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-300">
        {label}
        {required && <span className="ml-1 text-blue-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors';

export default function ClientForm({ initial = {}, onSubmit, onBack }: Props) {
  const [companyName, setCompanyName] = useState(initial.companyName ?? '');
  const [contactName, setContactName] = useState(initial.contactName ?? '');
  const [sector, setSector] = useState(initial.sector ?? '');
  const [companyStage, setCompanyStage] = useState<CompanyStage>(
    initial.companyStage ?? 'Early-stage'
  );
  const [annualRevenue, setAnnualRevenue] = useState(initial.annualRevenue ?? '');
  const [employeeCount, setEmployeeCount] = useState(initial.employeeCount ?? '');
  const [city, setCity] = useState(initial.city ?? '');
  const [province, setProvince] = useState(initial.province ?? 'ON');
  const [grantName, setGrantName] = useState(initial.grantName ?? '');
  const [projectTitle, setProjectTitle] = useState(initial.projectTitle ?? '');
  const [projectDescription, setProjectDescription] = useState(initial.projectDescription ?? '');
  const [fundingRequested, setFundingRequested] = useState(initial.fundingRequested ?? '');
  const [website, setWebsite] = useState(initial.website ?? '');
  const [womenLed, setWomenLed] = useState(initial.womenLed ?? false);
  const [indigenousLed, setIndigenousLed] = useState(initial.indigenousLed ?? false);
  const [socialEnterprise, setSocialEnterprise] = useState(initial.socialEnterprise ?? false);

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!companyName.trim()) e.companyName = 'Required';
    if (!contactName.trim()) e.contactName = 'Required';
    if (!sector.trim()) e.sector = 'Required';
    if (!city.trim()) e.city = 'Required';
    if (!grantName.trim()) e.grantName = 'Required';
    if (!projectTitle.trim()) e.projectTitle = 'Required';
    if (!projectDescription.trim()) e.projectDescription = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      sector: sector.trim(),
      companyStage,
      annualRevenue: annualRevenue.trim(),
      employeeCount: employeeCount.trim(),
      city: city.trim(),
      province,
      grantName: grantName.trim(),
      projectTitle: projectTitle.trim(),
      projectDescription: projectDescription.trim(),
      fundingRequested: fundingRequested.trim(),
      website: website.trim() || undefined,
      womenLed,
      indigenousLed,
      socialEnterprise,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Business Intake</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Tell us about your company. The AI uses this to ask the right questions for your grant.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Company + Contact */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company name" required>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Technologies Inc."
              className={inputClass}
            />
            {errors.companyName && <p className="text-xs text-red-400">{errors.companyName}</p>}
          </Field>
          <Field label="Contact name" required>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jane Smith"
              className={inputClass}
            />
            {errors.contactName && <p className="text-xs text-red-400">{errors.contactName}</p>}
          </Field>
        </div>

        {/* Sector */}
        <Field label="Business sector" required>
          <div className="flex gap-2">
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a sector…</option>
              {PRESET_SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {sector === '' && (
            <input
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Or type your sector…"
              className={`${inputClass} mt-2`}
            />
          )}
          {errors.sector && <p className="text-xs text-red-400">{errors.sector}</p>}
        </Field>

        {/* Company stage */}
        <Field label="Company stage">
          <div className="grid grid-cols-4 gap-2">
            {COMPANY_STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCompanyStage(s)}
                className={[
                  'rounded-md border py-2 text-xs font-medium transition-colors',
                  companyStage === s
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        {/* Revenue + Employees */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Annual revenue">
            <select value={annualRevenue} onChange={(e) => setAnnualRevenue(e.target.value)} className={inputClass}>
              <option value="">Select range…</option>
              <option>$0 (Pre-revenue)</option>
              <option>Under $50K</option>
              <option>$50K – $250K</option>
              <option>$250K – $1M</option>
              <option>$1M – $5M</option>
              <option>$5M – $10M</option>
              <option>Over $10M</option>
            </select>
          </Field>
          <Field label="Full-time employees">
            <select value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} className={inputClass}>
              <option value="">Select range…</option>
              <option>1 (Sole proprietor)</option>
              <option>2–5</option>
              <option>6–10</option>
              <option>11–25</option>
              <option>26–50</option>
              <option>51–100</option>
              <option>Over 100</option>
            </select>
          </Field>
        </div>

        {/* City + Province */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="City" required>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Toronto"
                className={inputClass}
              />
              {errors.city && <p className="text-xs text-red-400">{errors.city}</p>}
            </Field>
          </div>
          <Field label="Province">
            <select value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass}>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Grant + Funding */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Grant being applied for" required>
            <input
              type="text"
              value={grantName}
              onChange={(e) => setGrantName(e.target.value)}
              placeholder="NRC IRAP, ISED CDAP, BDC…"
              className={inputClass}
            />
            {errors.grantName && <p className="text-xs text-red-400">{errors.grantName}</p>}
          </Field>
          <Field label="Funding amount requested">
            <input
              type="text"
              value={fundingRequested}
              onChange={(e) => setFundingRequested(e.target.value)}
              placeholder="$50,000"
              className={inputClass}
            />
          </Field>
        </div>

        {/* Project */}
        <Field label="Project title" required>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="AI-Powered Inventory Optimization System"
            className={inputClass}
          />
          {errors.projectTitle && <p className="text-xs text-red-400">{errors.projectTitle}</p>}
        </Field>

        <Field label="Project description" required>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="What are you building, who is it for, what problem does it solve, and what outcomes do you expect?"
            rows={4}
            className={`${inputClass} resize-y`}
          />
          {errors.projectDescription && <p className="text-xs text-red-400">{errors.projectDescription}</p>}
        </Field>

        {/* Website */}
        <Field label="Company website">
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourcompany.com"
            className={inputClass}
          />
        </Field>

        {/* Equity flags */}
        <Field label="Equity designations (if applicable)">
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Women-led', value: womenLed, set: setWomenLed },
              { label: 'Indigenous-led', value: indigenousLed, set: setIndigenousLed },
              { label: 'Social enterprise', value: socialEnterprise, set: setSocialEnterprise },
            ].map(({ label, value, set }) => (
              <button
                key={label}
                type="button"
                onClick={() => set(!value)}
                className={[
                  'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
                  value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300',
                ].join(' ')}
              >
                {value ? '✓ ' : ''}{label}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500">
            Many programs have dedicated streams or bonus points for these designations.
          </p>
        </Field>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            Start Interview →
          </button>
        </div>
      </form>
    </div>
  );
}
