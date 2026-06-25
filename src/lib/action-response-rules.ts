import { ACTION_RESPONSE, type ActionResponse } from "@/types";

const replies: Record<ActionResponse, string[]> = {
  [ACTION_RESPONSE.DONE]: [
    "记下了。这次完成重要的不是任务本身，而是你启动了一次。",
    "已写入恢复点。完成一个小动作就是一次回来。",
    "好的。今天又多了一个证据：你可以从停滞状态重新启动。",
  ],
  [ACTION_RESPONSE.SWAP]: [
    "没问题。说说现在觉得更能进入的是什么？",
    "换一个。当前任务先挂起，找一个门槛更低的动作开始。",
    "好，现在不强求这个任务。下一个轨道的最小动作是什么？",
  ],
  [ACTION_RESPONSE.SKIPPED]: [
    "没做也是一个信号。不需要补救，先记下来，今晚复盘时再看。",
    "记录到了。没做不等于失败，等于还没找到合适的进入点。",
    "好的。跳过这个，今天还有什么是你觉得可以做的？",
  ],
  [ACTION_RESPONSE.RESEARCHING]: [
    "查资料本身没有问题。给自己设一个时间限制：10 分钟后停下来，把现在找到的东西转成一个动作。",
    "收到。查资料很容易变成逃避的通道。现在最重要的问题是：你在找什么，找到后要做什么？",
    "好。提醒你一件事：每次 AI 对话或查资料，最终要落到一个产物、一个行动、或一个可归档的判断。",
  ],
  [ACTION_RESPONSE.NUMB]: [
    "麻木状态收到了。不用分析为什么，先走身体路径：站起来，喝水，走到窗边，坐回桌前。",
    "收到。现在不需要想任何任务。先站起来，做一件和屏幕无关的事，哪怕 5 分钟。",
    "你可能有点漂远了。不用补救整天，先回到身体：站起来，喝水，洗脸，坐回桌前。",
  ],
  [ACTION_RESPONSE.SELF_BLAME]: [
    "先接住你。自责不是证据，它只是一种状态。现在不需要审判今天，只需要做一个 5 分钟的动作。",
    "收到。自责会让启动门槛更高。先停下来，深呼吸一次，然后只看接下来 10 分钟能做什么。",
    "不用评价今天。你现在能来记录这件事，就已经是在回来了。接下来只需要一个最小动作。",
  ],
};

export function getSystemReply(response: ActionResponse): string {
  const pool = replies[response];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function shouldCreateRecoveryPoint(response: ActionResponse): boolean {
  return response === ACTION_RESPONSE.DONE;
}

export function isDistressSignal(response: ActionResponse): boolean {
  return (
    response === ACTION_RESPONSE.NUMB || response === ACTION_RESPONSE.SELF_BLAME
  );
}
