// Manus Forge notification — removed. Stub preserved for import compatibility.
export type NotificationPayload = {
  title: string;
  content: string;
};

export async function sendNotification(_payload: NotificationPayload): Promise<void> {
  console.warn("[notification] sendNotification: not available in self-hosted mode");
}

export async function notifyOwner(_payload: NotificationPayload): Promise<boolean> {
  console.warn("[notification] notifyOwner: not available in self-hosted mode");
  return false;
}
