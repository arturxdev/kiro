import { GRID } from "@/constants/layout";
import type { MonthData } from "@/utils/calendar";
import { formatDateKey } from "@/utils/calendar";

const { CELL_SIZE, CELL_GAP, ROW_GAP, PADDING_LEFT, PADDING_TOP, DOT_SIZE, DOT_GAP } = GRID;

const ROW_HEIGHT = CELL_SIZE + ROW_GAP + DOT_SIZE + DOT_GAP;

export function getCellPosition(monthIndex: number, dayIndex: number) {
  return {
    x: PADDING_LEFT + dayIndex * (CELL_SIZE + CELL_GAP),
    y: PADDING_TOP + monthIndex * ROW_HEIGHT,
  };
}

export function calculateCanvasSize() {
  return {
    width: PADDING_LEFT + 31 * (CELL_SIZE + CELL_GAP),
    height: PADDING_TOP + 12 * ROW_HEIGHT,
  };
}

export function getMonthLabelPosition(monthIndex: number) {
  return {
    x: 4,
    y: PADDING_TOP + monthIndex * ROW_HEIGHT + CELL_SIZE / 2 + 3,
  };
}

export function hitTestCell(
  tapX: number,
  tapY: number,
  months: MonthData[],
  year: number
): string | null {
  for (let mi = 0; mi < months.length; mi++) {
    const month = months[mi];
    for (let d = 0; d < month.days; d++) {
      const pos = getCellPosition(mi, d);
      if (
        tapX >= pos.x &&
        tapX <= pos.x + CELL_SIZE &&
        tapY >= pos.y &&
        tapY <= pos.y + CELL_SIZE
      ) {
        return formatDateKey(year, mi, d + 1);
      }
    }
  }
  return null;
}
