export type AnswerValue = string;
export type Answers = Record<string, AnswerValue | undefined>;
export type MultiAnswers = Record<string, AnswerValue[] | undefined>;

export interface CandidateSignal {
  delta: number;
  label?: string;
}

export interface AssessmentOption {
  v: string;
  l: string;
  signals?: Record<string, CandidateSignal>;
}

export interface AssessmentQuestion {
  key: string;
  q: string;
  multi?: boolean;
  options: AssessmentOption[];
  skipIf?: (answers: Answers) => boolean;
}

export interface SymptomTree {
  candidates: Record<string, string>;
  questions: AssessmentQuestion[];
}

export interface ConfidenceBreakdown {
  baseScore: number;
  supportingContribution: number;
  contradictingContribution: number;
  uncertaintyPenalty: number;
  rawScore: number;
  score: number;
  level: "low" | "moderate" | "high";
}

export interface CandidateEvidence {
  supporting: string[];
  contradicting: string[];
  missing: string[];
  risk: string[];
  confidence: ConfidenceBreakdown;
}

export interface RankedCandidate extends CandidateEvidence {
  key: string;
  label: string;
  pct: number;
}

interface RiskRule {
  candidateKey: string;
  when: (answers: Answers, multiAnswers: MultiAnswers) => boolean;
  signal: string;
}

const BASE_SCORE = 30;
const MISSING_QUESTION_PENALTY = 5;

// Risk text is stored as deterministic rules and is only emitted when its
// corresponding observation was actually collected from the user.
const RISK_RULES: RiskRule[] = [
  {
    candidateKey: "rosacea",
    when: (answers) => answers.flush === "yes",
    signal: "热、酒精或情绪诱发且消退缓慢；继续刺激可能使泛红加重",
  },
  {
    candidateKey: "barrier",
    when: (_answers, multi) => (multi.trigger ?? []).includes("exfoliate"),
    signal: "近期去角质叠加屏障不适；继续使用刺激性活性成分可能加重损伤",
  },
  {
    candidateKey: "overexfoliate",
    when: (_answers, multi) => (multi.trigger ?? []).includes("exfoliate"),
    signal: "已报告近期去角质；继续去角质可能加重刺激和屏障损伤",
  },
  {
    candidateKey: "true_acne",
    when: (answers) => answers.depth === "deep",
    signal: "已报告深层皮下病灶；结节或囊肿风险不能仅依靠护肤品处理",
  },
  {
    candidateKey: "fungal_acne",
    when: (_answers, multi) => (multi.fungal ?? []).includes("no_resolve"),
    signal: "已报告常规祛痘或抗生素处理无效/加重；应避免继续盲目叠加活性成分",
  },
  {
    candidateKey: "photodamage",
    when: (answers) => answers.duration === "years",
    signal: "已报告多年持续改变；护肤只能辅助管理，不能替代对可疑皮损的专业评估",
  },
];

const unique = (values: string[]) => [...new Set(values)];
const clamp = (value: number) => Math.max(5, Math.min(95, value));

function selectedOptions(
  question: AssessmentQuestion,
  answers: Answers,
  multiAnswers: MultiAnswers,
): AssessmentOption[] {
  if (question.multi) {
    const selected = multiAnswers[question.key] ?? [];
    return question.options.filter((option) => selected.includes(option.v));
  }

  const selected = answers[question.key];
  return selected ? question.options.filter((option) => option.v === selected) : [];
}

export function evaluateCandidateEvidence(
  tree: SymptomTree,
  answers: Answers,
  multiAnswers: MultiAnswers,
  candidateKey: string,
): CandidateEvidence {
  const supporting: string[] = [];
  const contradicting: string[] = [];
  const missing: string[] = [];
  let supportingContribution = 0;
  let contradictingContribution = 0;
  let uncertaintyPenalty = 0;

  tree.questions.forEach((question) => {
    if (question.skipIf?.(answers)) return;

    const options = selectedOptions(question, answers, multiAnswers);
    const hasAnswer = question.multi
      ? multiAnswers[question.key] !== undefined
      : answers[question.key] !== undefined;
    const relevant = question.options.some((option) => option.signals?.[candidateKey]);

    if (!hasAnswer && relevant) {
      missing.push(question.q);
      uncertaintyPenalty -= MISSING_QUESTION_PENALTY;
      return;
    }

    options.forEach((option) => {
      const signal = option.signals?.[candidateKey];
      if (!signal) return;

      if (signal.delta > 0) {
        supportingContribution += signal.delta;
        supporting.push(signal.label ?? option.l);
      } else if (signal.delta < 0) {
        contradictingContribution += signal.delta;
        contradicting.push(signal.label ?? option.l);
      }
    });
  });

  const rawScore =
    BASE_SCORE + supportingContribution + contradictingContribution + uncertaintyPenalty;
  const score = clamp(rawScore);
  const risk = RISK_RULES.filter(
    (rule) => rule.candidateKey === candidateKey && rule.when(answers, multiAnswers),
  ).map((rule) => rule.signal);

  return {
    supporting: unique(supporting),
    contradicting: unique(contradicting),
    missing: unique(missing),
    risk: unique(risk),
    confidence: {
      baseScore: BASE_SCORE,
      supportingContribution,
      contradictingContribution,
      uncertaintyPenalty,
      rawScore,
      score,
      level: score >= 70 ? "high" : score >= 45 ? "moderate" : "low",
    },
  };
}

export function scoreCandidates(
  tree: SymptomTree,
  answers: Answers,
  multiAnswers: MultiAnswers,
): RankedCandidate[] {
  return Object.entries(tree.candidates)
    .map(([key, label]) => {
      const evidence = evaluateCandidateEvidence(tree, answers, multiAnswers, key);
      return { key, label, pct: evidence.confidence.score, ...evidence };
    })
    .sort((a, b) => b.pct - a.pct);
}
