export type AboutFact = { label: string; value: string };
export type AboutPrinciple = { title: string; body: string };
export type AboutCommunityItem = { title: string; body: string };
export type AboutEducationItem = { school: string; credential: string; years: string };

export const aboutFacts: readonly AboutFact[] = [
  { label: "Based", value: "Lisbon · Remote (US hours)" },
  { label: "Experience", value: "11+ years shipping platforms" },
  { label: "Altitude", value: "Staff IC ⇄ VP of Engineering" },
  { label: "Optimizing for", value: "AI-native product companies" },
] as const;

export const aboutPrinciples: readonly AboutPrinciple[] = [
  {
    title: "Raise the hiring bar, then trust it",
    body: "Leveling and interviewing are leverage. I calibrate the bar, write the rubric, and then give people the autonomy that bar earns — fewer, stronger engineers shipping with conviction.",
  },
  {
    title: "RFCs over heroics",
    body: "Hard calls get written down before they get built. An RFC culture turns architecture into a reviewable artifact, so decisions survive re-orgs and the reasoning outlives the author.",
  },
  {
    title: "AI that survives production",
    body: "Agentic UX is easy to demo and hard to keep honest. I build retrieval, evaluation, and human-in-the-loop surfaces that hold up under real traffic — not just on the happy path.",
  },
  {
    title: "Ship into regulated reality",
    body: "Governance software, automotive, streaming at tens-of-millions scale. I design for audit, accessibility, and release safety from the first commit, not as a compliance retrofit.",
  },
] as const;

export const aboutCommunity: readonly AboutCommunityItem[] = [
  {
    title: "Founder, WebDevPortugal",
    body: "Built and run Portugal's web-engineering community — talks, mentoring, and a hiring network for local engineers.",
  },
  {
    title: "President & Co-Founder, Northern Grade E-Sports",
    body: "Co-founded and led a competitive e-sports organization — operations, sponsorship, and team leadership at altitude.",
  },
  {
    title: "Interviewing, mentoring & coaching",
    body: "Ongoing technical interviewing and engineering coaching — calibrating bars and growing senior engineers.",
  },
] as const;

export const aboutEducation: readonly AboutEducationItem[] = [
  {
    school: "ISEL — Instituto Superior de Engenharia de Lisboa",
    credential: "Engineer's Degree, Computer Engineering",
    years: "2015–2018",
  },
  {
    school: "Universidade Lusófona",
    credential: "Bachelor of Laws (LLB)",
    years: "2011–2014",
  },
] as const;
