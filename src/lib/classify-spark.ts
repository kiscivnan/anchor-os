import {
  SPARK_REMINDER_TYPE,
  type SparkClassification,
} from "@/types";

const explicitTimePattern =
  /今天|今晚|明天|后天|周[一二三四五六日天]|星期[一二三四五六日天]|上午|中午|下午|晚上|凌晨|\d{1,2}[点时:]|下周|本周|月底|\d{1,2}月\d{1,2}日/;
const contextualTimePattern = /忙完|结束后|做完|告一段落|等我|稍后/;

function toLocalDateTimeValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function suggestReminderTime(input: string, now: Date): string | null {
  const hasUnsupportedCalendarDate =
    /周[一二三四五六日天]|星期[一二三四五六日天]|下周|本周|月底|\d{1,2}月\d{1,2}日/.test(
      input,
    );

  if (hasUnsupportedCalendarDate) {
    return null;
  }

  const reminderDate = new Date(now);

  if (input.includes("后天")) {
    reminderDate.setDate(reminderDate.getDate() + 2);
  } else if (input.includes("明天")) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  const hourMatch = input.match(/(\d{1,2})[点时]/);
  const explicitHour = hourMatch ? Number(hourMatch[1]) : null;
  const hour =
    explicitHour ??
    (input.includes("下午")
      ? 15
      : input.includes("晚上") || input.includes("今晚")
        ? 20
        : 9);

  reminderDate.setHours(Math.min(Math.max(hour, 0), 23), 0, 0, 0);

  return toLocalDateTimeValue(reminderDate);
}

export function classifySpark(
  input: string,
  now = new Date(),
): SparkClassification {
  if (explicitTimePattern.test(input)) {
    return {
      reminder_type: SPARK_REMINDER_TYPE.MANUAL_TIME,
      suggested_reminder_time: suggestReminderTime(input, now),
      timing_note: "检测到时间线索，请确认提醒时间。",
    };
  }

  if (contextualTimePattern.test(input)) {
    return {
      reminder_type: SPARK_REMINDER_TYPE.AI_JUDGED,
      suggested_reminder_time: null,
      timing_note: "等当前事务告一段落时提醒；若无法判断，则放到晚间复盘。",
    };
  }

  return {
    reminder_type: SPARK_REMINDER_TYPE.AI_JUDGED,
    suggested_reminder_time: null,
    timing_note: "暂定在今天晚间复盘时提醒。",
  };
}
