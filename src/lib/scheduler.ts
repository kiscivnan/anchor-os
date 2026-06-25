import {
  ALLOCATION_REASON,
  type Track,
  type TrackAllocation,
} from "@/types";

function nonNegative(value: number): number {
  return Math.max(value, 0);
}

export function allocateTrackMinutes(
  tracks: readonly Track[],
  total_budget_minutes: number,
): TrackAllocation[] {
  const budgetMinutes = nonNegative(total_budget_minutes);
  const manualTotal = tracks.reduce(
    (total, track) =>
      total +
      (track.manual_minutes === undefined
        ? 0
        : nonNegative(track.manual_minutes)),
    0,
  );
  const remainingBudget = nonNegative(budgetMinutes - manualTotal);
  const automaticWeightTotal = tracks.reduce(
    (total, track) =>
      total +
      (track.manual_minutes === undefined ? nonNegative(track.weight) : 0),
    0,
  );

  return tracks.map((track) => {
    if (track.manual_minutes !== undefined) {
      return {
        track_id: track.id,
        allocated_minutes: nonNegative(track.manual_minutes),
        reason: ALLOCATION_REASON.MANUAL,
      };
    }

    const allocatedMinutes =
      automaticWeightTotal > 0
        ? Math.floor(
            (remainingBudget * nonNegative(track.weight)) /
              automaticWeightTotal,
          )
        : 0;

    return {
      track_id: track.id,
      allocated_minutes: allocatedMinutes,
      reason: ALLOCATION_REASON.WEIGHT,
    };
  });
}
