import { INPUT_STATE, type InputResult } from "@/types";

const classifications = [
  {
    keywords: ["糊掉", "麻木", "浪费时间"],
    result: {
      state: INPUT_STATE.TIME_LOSS,
      suggestion: "今天不补救整天，只恢复一个小动作。",
      next_action: "先离开屏幕两分钟，再重新进入一个最小动作。",
    },
  },
  {
    keywords: ["计划", "明天", "我要改变"],
    result: {
      state: INPUT_STATE.PLAN_HYPE,
      suggestion: "先不扩张整套计划，把注意力放回一个锚点。",
      next_action: "写下一个十分钟内可以重新进入的动作。",
    },
  },
  {
    keywords: ["ai", "claude", "chatgpt", "问了很多"],
    result: {
      state: INPUT_STATE.AI_SPIRAL,
      suggestion: "暂停继续提问，把注意力恢复到已有答案上。",
      next_action: "关闭一个对话窗口，重新进入已有答案的第一步。",
    },
  },
  {
    keywords: ["事情太多", "多个目标", "同时推进", "几条轨道", "顾不过来"],
    result: {
      state: INPUT_STATE.MULTI_TRACK,
      suggestion: "不需要同时推进所有轨道，先重新分配今天的时间。",
      next_action: "选择一条轨道，重新进入其中最小的锚点动作。",
    },
  },
] satisfies ReadonlyArray<{
  keywords: readonly string[];
  result: InputResult;
}>;

const fallbackResult: InputResult = {
  state: INPUT_STATE.UNCLASSIFIED,
  suggestion: "暂时不用判断得很准确，先确认此刻的偏移。",
  next_action: "写下此刻最容易重新进入的一个锚点动作。",
};

export function classifyEntry(input: string): InputResult {
  const normalizedInput = input.toLowerCase();

  return (
    classifications.find(({ keywords }) =>
      keywords.some((keyword) => normalizedInput.includes(keyword)),
    )?.result ?? fallbackResult
  );
}
