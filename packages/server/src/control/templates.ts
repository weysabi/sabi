import type { Message } from "weysabi";
import { ControlError } from "./errors";

const TEMPLATE_REGEX = /\{(\w+)\}/g;

export function renderMessages(
  messages: Message[],
  inputs: Record<string, unknown>,
  context: string
): Message[] {
  return messages.map((message) => ({
    ...message,
    content:
      typeof message.content === "string"
        ? message.content.replace(TEMPLATE_REGEX, (_match, key: string) => {
            if (!(key in inputs)) {
              throw new ControlError(
                `Missing input "${key}" in template "${context}"`,
                "MISSING_TEMPLATE_INPUT",
                400
              );
            }
            return String(inputs[key]);
          })
        : message.content,
  }));
}
