import type { Message } from "weysabi";
import type { Conversation, ConversationMessage, Project, PromptVersion } from "./types";
import { renderMessages } from "./templates";

export interface ContextAssemblyInput {
  project: Project;
  conversation: Conversation;
  promptVersion?: PromptVersion;
  messages: ConversationMessage[];
  userMessage: ConversationMessage;
  promptInputs?: Record<string, unknown>;
  maxContextTokens?: number;
}

const DEFAULT_MAX_CONTEXT_TOKENS = 8000;

function estimateTokens(content: string): number {
  return Math.max(1, Math.ceil(content.length / 4));
}

function toMessage(message: ConversationMessage): Message {
  return {
    role: message.role,
    content: message.content,
  };
}

export function assembleConversationContext(input: ContextAssemblyInput): Message[] {
  const maxContextTokens = input.maxContextTokens ?? DEFAULT_MAX_CONTEXT_TOKENS;
  const promptInputs = {
    input: input.userMessage.content,
    message: input.userMessage.content,
    ...(input.promptInputs ?? {}),
  };
  const assembled: Message[] = [];
  let remainingTokens = maxContextTokens;

  if (input.promptVersion?.messages) {
    const rendered = renderMessages(
      input.promptVersion.messages,
      promptInputs,
      `version:${input.promptVersion.id}`
    );
    for (const message of rendered) {
      assembled.push(message);
      const content = typeof message.content === "string" ? message.content : "";
      remainingTokens -= estimateTokens(content);
    }
  }

  if (input.conversation.summary) {
    const content = `Conversation summary: ${input.conversation.summary}`;
    assembled.push({ role: "system", content });
    remainingTokens -= estimateTokens(content);
  }

  const history = input.messages
    .filter((message) => message.id !== input.userMessage.id)
    .filter((message) => message.status === "complete")
    .filter((message) => message.role !== "system")
    .sort((a, b) => a.createdAt - b.createdAt);

  const selectedHistory: ConversationMessage[] = [];
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const message = history[i];
    if (!message) continue;
    const tokenCount = message.tokenCount ?? estimateTokens(message.content);
    if (remainingTokens - tokenCount <= 0) break;
    selectedHistory.unshift(message);
    remainingTokens -= tokenCount;
  }

  assembled.push(...selectedHistory.map(toMessage));
  assembled.push(toMessage(input.userMessage));

  return assembled;
}
