export interface ReviewRule {
  tag: string;
  keywords: RegExp;
  follow_up: string | null;
}

export const REVIEW_RULES: ReviewRule[] = [
  {
    tag: "mode:fatigue_check",
    keywords: /累|瘫|不想动|躺着|没力气|提不起劲/,
    follow_up: "当时有没有人在场，还是你一个人？",
  },
  {
    tag: "mode:completion_check",
    keywords: /完成了|还不错|做完了|搞定|做到了|弄好了/,
    follow_up:
      "这件事有没有一个不得不做的理由，还是你自己主动开始的？",
  },
  {
    tag: "mode:self_starter_cleaning",
    keywords: /打扫|整理|收拾|洗床单|洗碗|洗衣/,
    follow_up: null,
  },
  {
    tag: "mode:family_emotion_check",
    keywords: /(?:父母|爸|妈|家人).{0,10}(?:伤心|难受|生气|委屈|烦|哭)|(?:伤心|难受|生气|委屈|烦|哭).{0,10}(?:父母|爸|妈|家人)/,
    follow_up:
      "这件事有没有伤到你，还是属于可以放过自己的那种？",
  },
];

export const FALLBACK_RULE: ReviewRule = {
  tag: "mode:general_check",
  keywords: /.*/,
  follow_up:
    "今天这件事，过程中有没有什么时刻让你觉得「啊我现在有劲儿了」，或者「啊我现在不想动了」？",
};

export function matchReviewRules(input: string): ReviewRule[] {
  const matched = REVIEW_RULES.filter((r) => r.keywords.test(input));
  return matched.length > 0 ? matched : [FALLBACK_RULE];
}
