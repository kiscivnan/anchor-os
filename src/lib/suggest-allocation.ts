import type {
  AllocationSuggestion,
  DailyReview,
  SuggestedTrackWeight,
  Track,
} from "@/types";
import { SUGGESTION_STATUS } from "@/types";

function getYesterdayReviews(reviews: DailyReview[]): DailyReview[] {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yd = yesterday.toDateString();
  return reviews.filter((r) => new Date(r.created_at).toDateString() === yd);
}

function countTag(reviews: DailyReview[], tag: string): number {
  return reviews.reduce(
    (n, r) => n + (r.triggered_tags.includes(tag) ? 1 : 0),
    0,
  );
}

export function computeAllocationSuggestion(
  reviews: DailyReview[],
  tracks: Track[],
  currentBudget: number,
): AllocationSuggestion | null {
  const ydReviews = getYesterdayReviews(reviews);
  if (ydReviews.length === 0) return null;

  const fatigueCount = countTag(ydReviews, "mode:fatigue_check");
  const completionCount = countTag(ydReviews, "mode:completion_check");

  let suggestedBudget = currentBudget;
  let reason = "";
  const suggestedWeights: SuggestedTrackWeight[] = tracks.map((t) => ({
    track_id: t.id,
    weight: t.weight,
  }));

  if (fatigueCount >= 2) {
    suggestedBudget = Math.max(20, Math.round(currentBudget * 0.6));
    reason = `昨天出现了 ${fatigueCount} 次疲惫信号，把今天的安排调轻了一些（${currentBudget} → ${suggestedBudget} 分钟）。`;

    // 第一条活跃轨道权重提高，作为恢复/低强度代表
    const firstActive = tracks.find((t) => t.status === "active");
    if (firstActive) {
      for (const sw of suggestedWeights) {
        if (sw.track_id === firstActive.id) {
          sw.weight = Math.min(sw.weight + 2, 5);
        }
      }
    }
  } else if (completionCount >= 1 && fatigueCount === 0) {
    suggestedBudget = Math.min(120, Math.round(currentBudget * 1.1));
    reason = `昨天完成感不错，今天可以稍微多给一点时间（${currentBudget} → ${suggestedBudget} 分钟）。`;
  } else {
    // 无明显信号，维持不变，不生成建议
    return null;
  }

  return {
    suggested_budget: suggestedBudget,
    suggested_weights: suggestedWeights,
    suggestion_reason: reason,
    suggestion_status: SUGGESTION_STATUS.PENDING,
    generated_at: new Date().toISOString(),
  };
}
