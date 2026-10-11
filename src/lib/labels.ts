export const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "已安排",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  PENDING: "待完成",
  IN_PROGRESS: "进行中",
  DONE: "已完成",
};

export function statusLabel(s: string) {
  return STATUS_LABEL[s] || s;
}
