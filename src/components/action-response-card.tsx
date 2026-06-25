"use client";

import { useState } from "react";

import {
  getSystemReply,
  shouldCreateRecoveryPoint,
} from "@/lib/action-response-rules";
import { useStore } from "@/lib/store-context";
import {
  ACTION_RESPONSE,
  TRACK_STATUS,
  type ActionResponse,
} from "@/types";

const PRIMARY_BUTTONS: ActionResponse[] = [
  ACTION_RESPONSE.DONE,
  ACTION_RESPONSE.SWAP,
  ACTION_RESPONSE.SKIPPED,
  ACTION_RESPONSE.RESEARCHING,
];

const SECONDARY_BUTTONS: ActionResponse[] = [
  ACTION_RESPONSE.NUMB,
  ACTION_RESPONSE.SELF_BLAME,
];

const LABELS: Record<ActionResponse, string> = {
  [ACTION_RESPONSE.DONE]: "完成了",
  [ACTION_RESPONSE.SWAP]: "换一个",
  [ACTION_RESPONSE.SKIPPED]: "没做",
  [ACTION_RESPONSE.RESEARCHING]: "我在查资料",
  [ACTION_RESPONSE.NUMB]: "我现在很麻木",
  [ACTION_RESPONSE.SELF_BLAME]: "我开始自责了",
};

export function ActionResponseCard() {
  const { state, addActionResponse, addRecoveryPoint } = useStore();
  const [reply, setReply] = useState<string | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);

  const primaryTrack = state.tracks.find(
    (t) => t.status === TRACK_STATUS.ACTIVE,
  );

  if (!primaryTrack) return null;

  function handleResponse(response: ActionResponse) {
    const systemReply = getSystemReply(response);
    setReply(systemReply);

    addActionResponse({
      track_id: primaryTrack!.id,
      action: primaryTrack!.today_action,
      response,
      system_reply: systemReply,
    });

    if (shouldCreateRecoveryPoint(response)) {
      addRecoveryPoint({
        from_state: null,
        action_taken: primaryTrack!.today_action,
        note: `完成：${primaryTrack!.name}`,
      });
    }
  }

  function handleReset() {
    setReply(null);
    setShowSecondary(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          当前行动
        </p>
        <p className="mt-1 text-base font-semibold text-slate-900">
          {primaryTrack.name}
        </p>
        <p className="mt-0.5 text-sm text-slate-600">{primaryTrack.today_action}</p>
      </div>

      {reply ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-700">{reply}</p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            重置回报
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {PRIMARY_BUTTONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleResponse(r)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
              >
                {LABELS[r]}
              </button>
            ))}
          </div>

          {showSecondary ? (
            <div className="grid grid-cols-2 gap-2">
              {SECONDARY_BUTTONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleResponse(r)}
                  className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm font-medium text-orange-700 transition hover:bg-orange-100"
                >
                  {LABELS[r]}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSecondary(true)}
              className="w-full text-center text-xs text-slate-400 py-1 hover:text-slate-600"
            >
              更多状态 ↓
            </button>
          )}
        </div>
      )}
    </div>
  );
}
