export type BrandDirectionSlug = 'campus-press' | 'signal-atlas' | 'future-commons'

export function isBrandDirectionSlug(value: unknown): value is BrandDirectionSlug {
  return value === 'campus-press' || value === 'signal-atlas' || value === 'future-commons'
}

export interface BrandDirection {
  slug: BrandDirectionSlug
  name: string
  tagline: string
  status: string
  role: string
  thesis: string
  personality: readonly string[]
  bestFor: string
  watchOut: string
  assets: {
    markSrc: string
    markName: string
    motif: string
    pattern: string
    posterTreatment: string
    usesOfficialIntiLogo: boolean
  }
  palette: {
    canvas: string
    surface: string
    elevated: string
    ink: string
    muted: string
    accent: string
    accentSoft: string
    navy: string
    gold: string
    line: string
    darkCanvas: string
    darkSurface: string
    darkInk: string
  }
  typography: {
    display: string
    body: string
    label: string
    displayName: string
    bodyName: string
    labelName: string
  }
  motion: {
    principle: string
    load: string
    reducedMotion: string
  }
  components: {
    navigation: string
    cards: string
    filters: string
    dashboard: string
  }
  layout: {
    dashboard: string
  }
  sample: {
    issue: string
    ticker: string
    heroTitle: string
    heroBody: string
    posterSrc: string
    categoryOne: string
    categoryTwo: string
    leadTitle: string
    detailDeck: string
    leadMeta: string
    secondaryTitle: string
    detailTitle: string
    dashboardTitle: string
    dashboardMetric: string
  }
}

export const brandDirections: BrandDirection[] = [
  {
    slug: 'campus-press',
    name: 'Campus Press',
    tagline: 'Editorial authority rooted in print tradition',
    status: 'Concept',
    role: 'The record of record',
    thesis:
      'INTI deserves a bulletin that feels like it was typeset, not templated. Campus Press borrows from broadsheet grids and editorial weight systems to make every announcement feel considered.',
    personality: ['Authoritative', 'Precise', 'Legible at distance', 'Editorially neutral'],
    bestFor: 'Communities that value permanence and institutional trust',
    watchOut: 'Can feel cold without warm photography and real content',
    assets: {
      markSrc: '/brand-lab/campus-press-mark.svg',
      markName: 'The Press Mark',
      motif: 'Justified column rules and ink-spread halftone',
      pattern: 'Broadsheet column grid with editorial rule lines',
      posterTreatment: 'Full-bleed editorial photography with type-on-dark treatment',
      usesOfficialIntiLogo: false,
    },
    palette: {
      canvas: '#FAFAF8',
      surface: '#F2F0EB',
      elevated: '#FFFFFF',
      ink: '#1A1A1A',
      muted: '#6B6B6B',
      accent: '#C8102E',
      accentSoft: '#F5E6E9',
      navy: '#1B2E4B',
      gold: '#B8860B',
      line: '#D4D0C8',
      darkCanvas: '#111110',
      darkSurface: '#1C1C1A',
      darkInk: '#F0EDE8',
    },
    typography: {
      display: 'var(--font-brand-press-display)',
      body: 'var(--font-brand-body)',
      label: 'var(--font-brand-mono)',
      displayName: 'Literata',
      bodyName: 'Atkinson Hyperlegible',
      labelName: 'Geist Mono',
    },
    motion: {
      principle: 'Minimal and purposeful — motion reserved for state changes only',
      load: 'Content fades in column by column, replicating a page load',
      reducedMotion: 'Static load, no transitions',
    },
    components: {
      navigation: 'Horizontal masthead with justified rule, section tabs below',
      cards: 'Full-width article rows with headline, deck, and category flag',
      filters: 'Inline tab strip, typeset as pull quotes',
      dashboard: 'Table-first layout with status columns and editorial stamps',
    },
    layout: {
      dashboard: 'Tabular queue with status flags and scheduled date columns',
    },
    sample: {
      issue: 'Vol. 4 — May 2026',
      ticker: 'Exam schedules out · Library closes 8pm Fri · Senate elections open',
      heroTitle: 'Convocation 2026: A record 1,240 graduates cross the stage this July',
      heroBody:
        'INTI International University confirms its largest graduating cohort, with ceremony details released to students via portal this week.',
      posterSrc: '/brand-lab/campus-press-mark.svg',
      categoryOne: 'Academic',
      categoryTwo: 'Student Life',
      leadTitle: 'Final exam timetable released — check your portal before Thursday',
      detailDeck:
        'The Academic Registrar has published the May–June examination schedule. Students are advised to verify their personal timetables before the amendment window closes.',
      leadMeta: 'Academic Affairs · 3 days to register',
      secondaryTitle: 'Campus library extends Saturday hours through finals fortnight',
      detailTitle: 'Senate elections: nomination period closes Friday at 5pm',
      dashboardTitle: 'Publisher workspace — editorial queue',
      dashboardMetric: '3 announcements awaiting review',
    },
  },
  {
    slug: 'signal-atlas',
    name: 'Signal Atlas',
    tagline: 'Information architecture for a connected campus',
    status: 'Concept',
    role: 'The navigation layer',
    thesis:
      'Campus information is noisy. Signal Atlas cuts through with a data-forward, map-inspired visual language — every announcement is a coordinate, every category a route.',
    personality: ['Systematic', 'Dense', 'Wayfinding-first', 'Information-dense without clutter'],
    bestFor: 'Power users who scan for specific content quickly',
    watchOut: 'Requires disciplined tagging and category hygiene to work well',
    assets: {
      markSrc: '/brand-lab/signal-atlas-mark.svg',
      markName: 'The Atlas Mark',
      motif: 'Contour lines and coordinate grid overlay',
      pattern: 'Topographic contour lines at 12% opacity on surface',
      posterTreatment: 'Colour-field blocks with coordinate-label overlays',
      usesOfficialIntiLogo: false,
    },
    palette: {
      canvas: '#F5F5F0',
      surface: '#EBEBE5',
      elevated: '#FFFFFF',
      ink: '#111827',
      muted: '#6B7280',
      accent: '#C8102E',
      accentSoft: '#FEE2E2',
      navy: '#1E3A5F',
      gold: '#D97706',
      line: '#D1D5DB',
      darkCanvas: '#0F172A',
      darkSurface: '#1E293B',
      darkInk: '#F1F5F9',
    },
    typography: {
      display: 'var(--font-brand-atlas-display)',
      body: 'var(--font-brand-body)',
      label: 'var(--font-brand-mono)',
      displayName: 'Archivo Narrow',
      bodyName: 'Atkinson Hyperlegible',
      labelName: 'Geist Mono',
    },
    motion: {
      principle: 'Data-state transitions — charts and counts animate on load, not decoration',
      load: 'Grid tiles load left-to-right with a 40ms stagger',
      reducedMotion: 'Instant load, no stagger',
    },
    components: {
      navigation: 'Sidebar with icon-first nav and collapsible category tree',
      cards: 'Dense tile grid with category badge, date chip, and urgency dot',
      filters: 'Multi-select filter bar with active-count pill',
      dashboard: 'Split-pane: queue list left, detail preview right',
    },
    layout: {
      dashboard: 'Split-pane layout — queue on left, announcement preview on right',
    },
    sample: {
      issue: 'W19 — 12 May 2026',
      ticker: 'New: Engineering lab booking · Finance deadline Fri · 4 events this week',
      heroTitle: 'Student Senate opens nominations — seven seats across four faculties',
      heroBody:
        'Eligible students may submit nominations through the portal until Friday 16 May at 17:00. Seats are open across Business, Engineering, Health Sciences, and Computing.',
      posterSrc: '/brand-lab/signal-atlas-mark.svg',
      categoryOne: 'Governance',
      categoryTwo: 'Facilities',
      leadTitle: 'Engineering lab booking system launches — reserve slots from Monday',
      detailDeck:
        'The new lab reservation system goes live on 19 May. Students must link their student ID before booking. Priority slots are reserved for final-year project groups.',
      leadMeta: 'Facilities · 5 days left',
      secondaryTitle: 'Cafeteria C closes for renovation — alternative outlets listed',
      detailTitle: 'Finance: payment deadline for Semester 2 resits is 16 May',
      dashboardTitle: 'Content operations — signal queue',
      dashboardMetric: '7 items in queue · 2 urgent',
    },
  },
  {
    slug: 'future-commons',
    name: 'Future Commons',
    tagline: 'Warm, open, and built for community',
    status: 'Selected for production',
    role: 'The community layer',
    thesis:
      'INTI is a community before it is an institution. Future Commons builds a bulletin that feels like a gathering — warm surfaces, generous spacing, and a visual language that says "this is yours."',
    personality: ['Warm', 'Generous', 'Accessible', 'Community-first'],
    bestFor: 'Broad student audiences who want to feel included, not processed',
    watchOut: 'Warmth must be earned by real content — empty states need care',
    assets: {
      markSrc: '/brand-lab/future-commons-mark.svg',
      markName: 'The Commons Mark',
      motif: 'Interlocking arcs suggesting shared space and overlap',
      pattern: 'Soft grain texture at 8% opacity, warm-toned',
      posterTreatment: 'Warm-toned photography with rounded-corner crops and ribbon badges',
      usesOfficialIntiLogo: false,
    },
    palette: {
      canvas: '#FAF7F2',
      surface: '#F2EDE4',
      elevated: '#FFFFFF',
      ink: '#1C1917',
      muted: '#78716C',
      accent: '#C8102E',
      accentSoft: '#FEF2F2',
      navy: '#1E3A5F',
      gold: '#B45309',
      line: '#E7E0D6',
      darkCanvas: '#141210',
      darkSurface: '#1F1B18',
      darkInk: '#F5F0EA',
    },
    typography: {
      display: 'var(--font-brand-commons-display)',
      body: 'var(--font-brand-body)',
      label: 'var(--font-brand-commons-label)',
      displayName: 'Bricolage Grotesque',
      bodyName: 'Atkinson Hyperlegible',
      labelName: 'Faculty Glyphic',
    },
    motion: {
      principle: 'Gentle and breathing — motion should feel like the campus slowing down',
      load: 'Cards bloom in from slight scale with a warm ease, 60ms stagger',
      reducedMotion: 'Opacity fade only, no scale or translate',
    },
    components: {
      navigation: 'Floating pill navbar with brand mark and soft drop shadow',
      cards: 'Bento-style cards with rounded corners, poster images, and pill badges',
      filters: 'Scrollable chip row with soft active state',
      dashboard: 'Section-first layout with board headers and status chips',
    },
    layout: {
      dashboard: 'Board sections with status columns — feels like a shared notice board',
    },
    sample: {
      issue: 'May 2026',
      ticker: 'Happening today: Career Fair Hall B · Finals week begins Mon · Club grants open',
      heroTitle: 'Career Fair 2026 — 80 employers, one afternoon. Make it count.',
      heroBody:
        "INTI's biggest annual recruitment event returns to Hall B this Thursday. Bring your CV, dress the part, and show up early — slots fill fast.",
      posterSrc: '/brand-lab/future-commons-mark.svg',
      categoryOne: 'Careers',
      categoryTwo: 'Clubs & Societies',
      leadTitle: 'Club grant applications open — RM 500 to RM 3,000 for approved activities',
      detailDeck:
        'Student clubs may apply for activity grants before 23 May. Applications must include a proposed budget and a faculty advisor signature. Awards announced in June.',
      leadMeta: 'Student Affairs · 11 days left',
      secondaryTitle: 'Photography Society opens membership drive — free darkroom access included',
      detailTitle: 'Wellness Week: free counselling drop-ins available Mon–Wed',
      dashboardTitle: 'Your bulletin — upcoming and live',
      dashboardMetric: '2 announcements live · 1 draft',
    },
  },
]

export const selectedBrandDirection = brandDirections.find((d) => d.slug === 'future-commons')!

export const brandLabResearchAnchors: readonly { label: string; url: string; note: string }[] = [
  {
    label: 'INTI Brand Guidelines',
    url: 'https://www.newinti.edu.my',
    note: 'Institutional identity — red authority, academic tone, official mark usage rules',
  },
  {
    label: 'Malaysian HE Digital Comms',
    url: 'https://www.mohe.gov.my',
    note: 'How Malaysian universities publish announcements and manage student information',
  },
  {
    label: 'Student News UX Benchmarks',
    url: 'https://nus.edu.sg/nusbulletin',
    note: "NUS, Monash, and Taylor's campus bulletin patterns studied for navigation and content density",
  },
  {
    label: 'Accessible Color Contrast',
    url: 'https://www.w3.org/TR/WCAG21/',
    note: 'WCAG 2.1 AA compliance — warm neutral palettes require careful contrast checking',
  },
  {
    label: 'Multilingual Typography',
    url: 'https://fonts.google.com/knowledge',
    note: 'EN/BM/ZH legibility — Atkinson Hyperlegible chosen for low-vision accessibility',
  },
  {
    label: 'Community-First IA',
    url: 'https://www.nngroup.com/articles/information-architecture/',
    note: 'NN/g research on announcement-heavy information architectures for campus apps',
  },
  {
    label: 'Future Commons — Final Implementation Plan',
    url: '/brand-lab?direction=future-commons',
    note: 'Selected direction: warm palette, bento layout, Bricolage Grotesque + Atkinson Hyperlegible',
  },
]
