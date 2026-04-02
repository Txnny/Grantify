'use client';

import { useState } from 'react';
import { ClientProfile, CareerStage } from '@/lib/types';

interface Props {
  initial?: Partial<ClientProfile>;
  onSubmit: (profile: ClientProfile) => void;
  onBack: () => void;
}

const CAREER_STAGES: CareerStage[] = ['Emerging', 'Mid-career', 'Established'];

const PRESET_DISCIPLINES = [
  'Music', 'Visual Art', 'Film / Video', 'Dance', 'Theatre',
  'Literature / Writing', 'Photography', 'Digital Media', 'Interdisciplinary',
];

const PRESET_EQUITY = [
  'Black', 'Indigenous', 'Caribbean diaspora', 'Person of Colour',
  'LGBTQ+', 'Deaf / Disabled', 'Woman / Non-binary', 'Newcomer / Immigrant',
];

const PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
];

// ── small helpers ─────────────────────────────────────────────────────────────

function ChipGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(val: string) {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={[
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            selected.includes(o)
              ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
              : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300',
          ].join(' ')}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function AddableChipGroup({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [custom, setCustom] = useState('');

  function addCustom() {
    const val = custom.trim();
    if (!val || selected.includes(val)) { setCustom(''); return; }
    onChange([...selected, val]);
    setCustom('');
  }

  return (
    <div className="space-y-3">
      <ChipGroup options={options} selected={selected} onChange={onChange} />
      <div className="flex gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] transition-colors"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:border-neutral-500 hover:text-neutral-300 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </div>
      {/* custom chips not in presets */}
      {selected.filter((s) => !options.includes(s)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected
            .filter((s) => !options.includes(s))
            .map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 rounded-full border border-[#C9A84C] bg-[#C9A84C]/10 px-3 py-1 text-xs font-medium text-[#C9A84C]"
              >
                {s}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((v) => v !== s))}
                  className="ml-0.5 opacity-60 hover:opacity-100"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

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
        {required && <span className="ml-1 text-[#C9A84C]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] transition-colors';

// ── Main form ─────────────────────────────────────────────────────────────────

export default function ClientForm({ initial = {}, onSubmit, onBack }: Props) {
  const [artistName, setArtistName] = useState(initial.artistName ?? '');
  const [orgName, setOrgName] = useState(initial.organizationName ?? '');
  const [city, setCity] = useState(initial.city ?? '');
  const [province, setProvince] = useState(initial.province ?? 'ON');
  const [disciplines, setDisciplines] = useState<string[]>(initial.disciplines ?? []);
  const [careerStage, setCareerStage] = useState<CareerStage>(
    initial.careerStage ?? 'Emerging'
  );
  const [equityIdentities, setEquityIdentities] = useState<string[]>(
    initial.equityIdentities ?? []
  );
  const [grantName, setGrantName] = useState(initial.grantName ?? '');
  const [projectDescription, setProjectDescription] = useState(
    initial.projectDescription ?? ''
  );
  const [credentials, setCredentials] = useState(initial.credentials ?? '');

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!artistName.trim()) e.artistName = 'Required';
    if (!city.trim()) e.city = 'Required';
    if (disciplines.length === 0) e.disciplines = 'Select at least one';
    if (!grantName.trim()) e.grantName = 'Required';
    if (!projectDescription.trim()) e.projectDescription = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      artistName: artistName.trim(),
      organizationName: orgName.trim() || undefined,
      city: city.trim(),
      province,
      disciplines,
      careerStage,
      equityIdentities,
      grantName: grantName.trim(),
      projectDescription: projectDescription.trim(),
      credentials: credentials.trim() || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Client Intake</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Fill this out before the interview. The AI uses it to ask the right questions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Artist + Org */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Artist / Client name" required>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Txnic"
              className={inputClass}
            />
            {errors.artistName && (
              <p className="text-xs text-red-400">{errors.artistName}</p>
            )}
          </Field>
          <Field label="Organization name">
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="VinCity Entertainment"
              className={inputClass}
            />
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
              {errors.city && (
                <p className="text-xs text-red-400">{errors.city}</p>
              )}
            </Field>
          </div>
          <Field label="Province">
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className={inputClass}
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Disciplines */}
        <Field label="Discipline(s)" required>
          <AddableChipGroup
            options={PRESET_DISCIPLINES}
            selected={disciplines}
            onChange={setDisciplines}
            placeholder="Other discipline…"
          />
          {errors.disciplines && (
            <p className="text-xs text-red-400">{errors.disciplines}</p>
          )}
        </Field>

        {/* Career stage */}
        <Field label="Career stage">
          <div className="flex gap-3">
            {CAREER_STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCareerStage(s)}
                className={[
                  'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                  careerStage === s
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        {/* Equity identities */}
        <Field label="Equity identities">
          <AddableChipGroup
            options={PRESET_EQUITY}
            selected={equityIdentities}
            onChange={setEquityIdentities}
            placeholder="Other identity…"
          />
        </Field>

        {/* Grant name */}
        <Field label="Grant being applied for" required>
          <input
            type="text"
            value={grantName}
            onChange={(e) => setGrantName(e.target.value)}
            placeholder="TAC Black Arts Projects Program"
            className={inputClass}
          />
          {errors.grantName && (
            <p className="text-xs text-red-400">{errors.grantName}</p>
          )}
        </Field>

        {/* Project description */}
        <Field label="Brief project description" required>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="A short paragraph describing the project — what it is, who it's for, and why it matters."
            rows={4}
            className={`${inputClass} resize-y`}
          />
          {errors.projectDescription && (
            <p className="text-xs text-red-400">{errors.projectDescription}</p>
          )}
        </Field>

        {/* Credentials */}
        <Field label="Known credentials, achievements & media">
          <textarea
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
            placeholder="Notable releases, performances, press mentions, awards, past grants, partnerships…"
            rows={3}
            className={`${inputClass} resize-y`}
          />
        </Field>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ← Back to Ingest
          </button>
          <button
            type="submit"
            className="rounded-md bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-black hover:bg-[#b8963f] transition-colors"
          >
            Start Interview →
          </button>
        </div>
      </form>
    </div>
  );
}
