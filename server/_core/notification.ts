/**
 * 알림 서비스 — 현재 콘솔 로그 출력 (stub)
 * 추후 이메일/슬랙 등으로 교체 가능
 */
import { TRPCError } from "@trpc/server";

export type NotificationPayload = { title: string; content: string };

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title))
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title is required." });
  if (!isNonEmptyString(input.content))
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification content is required." });
  const title = input.title.trim();
  const content = input.content.trim();
  if (title.length > TITLE_MAX_LENGTH)
    throw new TRPCError({ code: "BAD_REQUEST", message: `Title too long (max ${TITLE_MAX_LENGTH}).` });
  if (content.length > CONTENT_MAX_LENGTH)
    throw new TRPCError({ code: "BAD_REQUEST", message: `Content too long (max ${CONTENT_MAX_LENGTH}).` });
  return { title, content };
};

export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const { title, content } = validatePayload(payload);
  console.log(`[Notification] ${title}\n${content}`);
  return true;
}
