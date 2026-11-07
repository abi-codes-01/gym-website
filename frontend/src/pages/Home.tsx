import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { apiClient } from '../api/client';
import { gymAssets } from '../assets/images';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  badge: string;
  popular: boolean;
  description: string;
  features: string[];
}

type ProgramCategory = 'ALL' | 'STRENGTH' | 'HIIT' | 'COMBAT' | 'TRANSFORMATION';

interface FitnessProgram {
  id: string;
  title: string;
  category: Exclude<ProgramCategory, 'ALL'>;
  tagline: string;
  calories: string;
  duration: string;
  intensity: string;
  image: string;
  description: string;
  highlights: string[];
}

interface FacilityItem {
  title: string;
  metric: string;
  image: string;
  description: string;
}

const DEFAULT_PRICING_TIERS: PricingTier[] = [
  {
    id: 'pulse-starter',
    name: 'Iron Starter',
    price: '₹999',
    period: '/month',
    badge: 'Essential',
    popular: false,
    description:
      'Full strength & cardio floor access designed for self-driven lifters.',
    features: [
      'Unlimited gym floor & free-weights access',
      'Olympic lifting & power racks',
      'Standard locker room & shower access',
      '1 Initial InBody biometric scan',
    ],
  },
  {
    id: 'pulse-pro',
    name: 'Pro Transformation',
    price: '₹1,999',
    period: '/month',
    badge: 'Most Popular',
    popular: true,
    description:
      'Our signature functional training, HIIT turf classes, and strength coaching.',
    features: [
      '24/7 Unlimited access to all training zones',
      'Unlimited Group HIIT, CrossFit & Boxing sessions',
      '4 Personal Trainer assessment sessions / month',
      'Monthly InBody 770 composition tracking',
      'Custom macro & nutrition blueprint',
    ],
  },
  {
    id: 'pulse-elite',
    name: 'Apex Athlete',
    price: '₹3,499',
    period: '/month',
    badge: 'All-Inclusive',
    popular: false,
    description:
      'Dedicated 1-on-1 transformation coaching with full recovery suite access.',
    features: [
      'Everything in Pro Transformation',
      '12 Dedicated 1-on-1 Personal Training sessions / month',
      'Infrared sauna & cold-plunge recovery lounge',
      'Priority guest passes (4 per month)',
      'Weekly accountability check-ins with Head Coach',
    ],
  },
];

const PROGRAMS: FitnessProgram[] = [
  {
    id: 'prog-strength',
    title: 'Hypertrophy & Power Lab',
    category: 'STRENGTH',
    tagline: 'Progressive overload & compound strength',
    calories: '550 - 750 kcal',
    duration: '60 Mins',
    intensity: 'High',
    image: gymAssets.programs.strength,
    description:
      'Periodized strength blocks utilizing competition bumper plates, deadlift platforms, and biomechanical isolation machines.',
    highlights: ['Olympic Lifting Racks', '1RM Tracking', 'Biomechanical Coaching'],
  },
  {
    id: 'prog-hiit',
    title: 'Pulse MetCon Turf Burn',
    category: 'HIIT',
    tagline: 'Explosive metabolic conditioning',
    calories: '750 - 1,000 kcal',
    duration: '45 Mins',
    intensity: 'Extreme',
    image: gymAssets.programs.hiit,
    description:
      'High-octane sled pushes, battle ropes, assault bikes, and kettlebell complexes engineered to torch fat and elevate VO2 max.',
    highlights: ['40m Prowler Sled Track', 'Heart-Rate Telemetry', 'Team WODs'],
  },
  {
    id: 'prog-combat',
    title: 'Strike & Combat Conditioning',
    category: 'COMBAT',
    tagline: 'Boxing, kickboxing & rotational core',
    calories: '650 - 900 kcal',
    duration: '50 Mins',
    intensity: 'Extreme',
    image: gymAssets.programs.combat,
    description:
      'Heavy bag combinations, pad work, footwork drills, and athletic conditioning led by certified combat coaches.',
    highlights: ['Pro Heavy Bag Arena', 'Reflex & Agility Drills', 'Core Shred'],
  },
  {
    id: 'prog-transform',
    title: '90-Day Body Transformation',
    category: 'TRANSFORMATION',
    tagline: 'End-to-end physique recomposition',
    calories: '600 - 850 kcal',
    duration: '60 Mins',
    intensity: 'Moderate-High',
    image: gymAssets.programs.transformation,
    description:
      'Structured body recomposition combining resistance training, customized macro nutrition, and bi-weekly InBody 770 scans.',
    highlights: ['Dedicated Coach', 'Custom Meal Blueprints', 'Bi-Weekly InBody Scans'],
  },
];

const FACILITIES: FacilityItem[] = [
  {
    title: '12,000 Sq. Ft. Strength Arena',
    metric: '60+ Stations',
    image: gymAssets.facilities.arena,
    description:
      'Spacious climate-controlled training floor featuring competition squat racks, dumbbell walls up to 60kg, and zero peak-hour waiting.',
  },
  {
    title: '40m Indoor Athletic Turf',
    metric: 'Functional Zone',
    image: gymAssets.facilities.turf,
    description:
      'Shock-absorbent sprint turf engineered for weighted prowler sleds, farmer carries, tire flips, and explosive plyometrics.',
  },
  {
    title: 'InBody 770 Biometric Lab',
    metric: 'Clinical Precision',
    image: gymAssets.facilities.biometrics,
    description:
      'Track skeletal muscle mass, segmental lean balance, and visceral fat levels every month with medical-grade accuracy.',
  },
  {
    title: 'Infrared & Cryo Recovery Suite',
    metric: 'Full Regeneration',
    image: gymAssets.facilities.recovery,
    description:
      'Accelerate muscle recovery with our infrared sauna, cold-plunge tubs, percussion therapy bar, and guided mobility zone.',
  },
];

const Home: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProgramCategory>('ALL');

  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }
  }, []);

  const { data: fetchedPlans } = useQuery<PricingTier[]>({
    queryKey: ['publicPricingPlans'],
    queryFn: async () => {
      const response = await apiClient.get<PricingTier[]>('/public/plans');
      return response.data;
    },
    initialData: DEFAULT_PRICING_TIERS,
    retry: 1,
  });

  const pricingTiers =
    fetchedPlans && fetchedPlans.length > 0 ? fetchedPlans : DEFAULT_PRICING_TIERS;

  const filteredPrograms =
    selectedCategory === 'ALL'
      ? PROGRAMS
      : PROGRAMS.filter((program) => program.category === selectedCategory);

  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ): void => {
    event.currentTarget.src = gymAssets.fallbackCard;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-600 selection:text-white">
      {/* Sticky Dark-Themed Public Navbar */}
      <Navbar />

      {/* ================= HERO SECTION WITH DYNAMIC BACKGROUND IMAGE & DARK OVERLAY ================= */}
      <section
        className="relative flex min-h-[88vh] items-center overflow-hidden bg-cover bg-center bg-no-repeat py-24 sm:py-32"
        style={{ backgroundImage: `url('${gymAssets.heroBg}')` }}
      >
        {/* Multi-layered Dark Overlay so Typography Pops */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/65"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50"
        />

        {/* Ambient Color Accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-36 left-1/4 h-96 w-96 rounded-full bg-rose-600/20 blur-[130px]"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-slate-950/75 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-rose-400 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>PulseFit Performance Studio • Open 24/7</span>
            </div>

            <h1 className="mt-6 text-4xl font-black uppercase leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
              FORGE YOUR{' '}
              <span className="bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                STRONGEST
              </span>{' '}
              PHYSIQUE.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-200 drop-shadow sm:text-lg">
              Train in a 12,000 sq. ft. high-performance arena featuring Olympic lifting
              platforms, a 40m indoor functional sprint turf, combat conditioning, and
              precision InBody 770 transformation coaching.
            </p>

            {/* Hero CTA Buttons */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/member-login"
                className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-rose-600/35 transition-all duration-300 hover:-translate-y-0.5 hover:from-rose-500 hover:to-orange-500"
              >
                <span>Join Now</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>

              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/90 bg-slate-950/75 px-7 py-4 text-sm font-extrabold uppercase tracking-wider text-slate-100 backdrop-blur-md transition-all duration-300 hover:border-rose-500/60 hover:text-white"
              >
                <span>View Pricing Tiers</span>
              </a>
            </div>

            {/* Key Metrics */}
            <div className="mt-14 grid grid-cols-3 gap-6 border-t border-slate-800/80 pt-8 sm:max-w-xl">
              <div>
                <p className="text-2xl font-black text-white sm:text-4xl">12,000+</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-300">
                  Sq. Ft. Arena
                </p>
              </div>
              <div>
                <p className="text-2xl font-black text-rose-500 sm:text-4xl">45+</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pro Coaches
                </p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-400 sm:text-4xl">2,400+</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-300">
                  Transformations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PROGRAMS SECTION WITH IMAGE CARDS ================= */}
      <section
        id="programs"
        className="border-t border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-rose-500">
                Training Disciplines
              </span>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Signature Fitness Programs
              </h2>
            </div>

            {/* Interactive Category Filter */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'ALL', label: 'All Programs' },
                  { id: 'STRENGTH', label: 'Strength' },
                  { id: 'HIIT', label: 'HIIT & Turf' },
                  { id: 'COMBAT', label: 'Combat' },
                  { id: 'TRANSFORMATION', label: 'Transformation' },
                ] as { id: ProgramCategory; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-all ${
                    selectedCategory === tab.id
                      ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-600/25'
                      : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {filteredPrograms.map((program) => (
              <div
                key={program.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/85 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/50"
              >
                {/* Top Card Image with Hover Zoom */}
                <div className="relative h-60 w-full overflow-hidden bg-slate-950">
                  <img
                    src={program.image}
                    alt={program.title}
                    onError={handleImageError}
                    loading="lazy"
                    className="h-full w-full rounded-t object-cover transition-transform duration-500 hover:scale-105 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <span className="rounded-lg border border-rose-500/40 bg-slate-950/85 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-rose-400 backdrop-blur-sm">
                      {program.category}
                    </span>
                    <span className="rounded-lg bg-slate-950/85 px-3 py-1 text-xs font-bold text-amber-400 backdrop-blur-sm">
                      {program.calories} • {program.duration}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="text-xl font-black uppercase text-white transition-colors group-hover:text-rose-400">
                      {program.title}
                    </h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {program.tagline}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {program.description}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
                    {program.highlights.map((item) => (
                      <span
                        key={item}
                        className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FACILITIES SECTION WITH IMAGE CARDS ================= */}
      <section
        id="facilities"
        className="border-t border-slate-900 bg-slate-950 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-400">
              World-Class Infrastructure
            </span>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
              PulseFit Facility Highlights
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Engineered for serious athletes and everyday transformations with zero
              equipment bottlenecks.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FACILITIES.map((facility) => (
              <div
                key={facility.title}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-500/50"
              >
                <div>
                  {/* Facility Top Image with Hover Zoom */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img
                      src={facility.image}
                      alt={facility.title}
                      onError={handleImageError}
                      loading="lazy"
                      className="h-full w-full rounded-t object-cover transition-transform duration-500 hover:scale-105 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-4 inline-block rounded-lg border border-rose-500/30 bg-slate-950/85 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-rose-400 backdrop-blur-sm">
                      {facility.metric}
                    </span>
                  </div>

                  <div className="p-6 pb-4">
                    <h3 className="text-lg font-black uppercase text-white transition-colors group-hover:text-rose-400">
                      {facility.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {facility.description}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="h-1 w-12 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-300 group-hover:w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PRICING SECTION ================= */}
      <section
        id="pricing"
        className="border-t border-slate-900 bg-gradient-to-b from-slate-950 to-slate-900 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-rose-500">
              Membership Plans
            </span>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Select a membership tier below to create your account in the Member Portal
              and complete instant activation via Razorpay Checkout.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1.5 ${
                  tier.popular
                    ? 'border-rose-500/60 bg-gradient-to-b from-rose-950/30 via-slate-900 to-slate-900 shadow-2xl shadow-rose-600/15'
                    : 'border-slate-800 bg-slate-900/75'
                }`}
              >
                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${
                      tier.popular
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tier.badge}
                  </span>

                  <h3 className="mt-5 text-2xl font-black uppercase text-white">
                    {tier.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">{tier.description}</p>

                  <div className="mt-6 flex items-baseline gap-1 border-b border-slate-800 pb-6">
                    <span className="text-4xl font-black tracking-tight text-white">
                      {tier.price}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      {tier.period}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-3.5 text-sm text-slate-300">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    to="/member-login"
                    className={`flex w-full items-center justify-center rounded-xl py-3.5 text-xs font-extrabold uppercase tracking-wider transition-all ${
                      tier.popular
                        ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-orange-500'
                        : 'border border-slate-700 bg-slate-950 text-white hover:border-rose-500 hover:bg-rose-600'
                    }`}
                  >
                    Choose {tier.name} ({tier.price}
                    {tier.period})
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="font-bold uppercase tracking-wider text-slate-400">
            © {new Date().getFullYear()} PulseFit Studio. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#programs" className="hover:text-slate-300">
              Programs
            </a>
            <a href="#facilities" className="hover:text-slate-300">
              Facilities
            </a>
            <a href="#pricing" className="hover:text-slate-300">
              Pricing
            </a>
            <Link
              to="/member-login"
              className="font-semibold text-rose-400 hover:text-rose-300"
            >
              Member Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
