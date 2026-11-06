/**
 * Topic labels for English Learning stories: the common IELTS themes plus the GK
 * areas of the syllabus. Rule-based (word lists), so it is free, instant and the
 * same everywhere. The headline counts more than the summary.
 */

export const ENGLISH_TOPICS = [
  "Education",
  "Economy",
  "Environment",
  "Health",
  "Technology",
  "Science",
  "Governance",
  "International",
  "Society",
  "Sport & Culture",
] as const;
export type EnglishTopic = (typeof ENGLISH_TOPICS)[number];

const SIGNALS: Record<Exclude<EnglishTopic, "Society">, RegExp> = {
  Education:
    /\b(?:school|student|exam|exams|examination|university|universities|college|education|educational|teacher|teachers|HSC|SSC|JSC|GPA|admission|curriculum|scholarship|study abroad|pass rate|board|re-scrutiny|alim|dakhil|madrasa)\b/i,
  Economy:
    /\b(?:economy|economic|budget|inflation|GDP|bank|banks|banking|loan|loans|export|exports|import|imports|remittance|tax|taxes|revenue|wage|wages|salary|salaries|price|prices|market|investment|investor|IMF|World Bank|ADB|trade|tariff|garment|RMG|entrepreneur|entrepreneurs|business|industry|reserve|reserves|fund|funds|embezzle\w*|Tk|taka|dollar|billion|million)\b/i,
  Environment:
    /\b(?:climate|environment|environmental|pollution|polluted|river|rivers|forest|forests|flood|floods|cyclone|emission|emissions|carbon|wildlife|biodiversity|plastic|weather|heatwave|drought|erosion|hilsa|fish|fishery|fisheries|ban on fishing|tree|trees)\b/i,
  Health:
    /\b(?:health|hospital|hospitals|disease|diseases|dengue|chikungunya|vaccine|vaccines|medical|medicine|doctor|doctors|patient|patients|covid|virus|nutrition|malnutrition|mental health|cancer)\b/i,
  Technology:
    /\b(?:technology|technologies|tech|AI|artificial intelligence|internet|digital|cyber|app|apps|startup|startups|semiconductor|mobile|telecom|spectrum|BTRC|software|data|online|smartphone|5G|satellite|SMS)\b/i,
  Science:
    /\b(?:science|scientist|scientists|research|researchers|space|NASA|planet|planets|telescope|discovery|physics|chemistry|biology|study finds|asteroid|prime number)\b/i,
  Governance:
    /\b(?:government|govt|minister|ministry|parliament|election|elections|candidate|vote|voting|court|police|law|laws|policy|policies|party|BNP|Awami|Jamaat|NCP|adviser|commission|corruption|arrest|arrested|dismissed|officer|officers|DB|RAB|DMP|charge|verdict|murder|accused|blockade|colony|colonies|inspection)\b/i,
  International:
    /\b(?:UN|United Nations|US|USA|United States|America|American|Iran|Israel|Israeli|India|Indian|China|Chinese|Russia|Russian|Ukraine|Gaza|Palestin\w*|Saudi|Netanyahu|Trump|Switzerland|Swiss|Japan|Myanmar|Rohingya|summit|treaty|diplomat\w*|foreign|war|ceasefire|sanction\w*|missile|NATO|EU|Australia|Pakistan)\b/i,
  "Sport & Culture":
    /\b(?:cricket|football|Test|ODI|T20|wicket|wickets|match|tournament|Olympic\w*|athlete|film|films|cinema|music|festival|culture|cultural|art|book|books|Puja|Eid)\b/i,
};

function count(re: RegExp, text: string): number {
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  return (text.match(g) || []).length;
}

/** The topic of an English story, from its headline (counts double) and summary. */
export function englishTopic(title: string, summary = ""): EnglishTopic {
  let best: EnglishTopic = "Society";
  let bestScore = 0;
  for (const topic of Object.keys(SIGNALS) as (keyof typeof SIGNALS)[]) {
    const score = count(SIGNALS[topic], title) * 2 + count(SIGNALS[topic], summary);
    // On a tie the earlier topic in ENGLISH_TOPICS wins (education and economy before the rest)
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return best;
}
