import { PromptNotFoundError, MissingPromptInputError, SabiError } from "../errors";
import type { CompleteRequest, CompleteResponse, Message } from "../types";
import { PromptRegistry } from "./registry";
import { Prompt, type PromptDefinition, type PromptMessage } from "./prompt";

const TEMPLATE_REGEX = /\{(\w+)\}/g;

export { Prompt, PromptRegistry };
export type { PromptDefinition, PromptMessage };

export interface SabiPrompts {
  /** Register a structured prompt definition. */
  register(def: PromptDefinition): void;
  /** Register multiple prompt definitions. */
  registerMany(defs: PromptDefinition[]): void;
  /** Get a structured prompt by id. */
  get(id: string): Prompt | undefined;
  /** List all registered structured prompts. */
  list(): PromptDefinition[];
  /** Remove a structured prompt by id. */
  remove(id: string): boolean;
  /** Check if a structured prompt exists. */
  has(id: string): boolean;
  /** Render a structured prompt's messages with input variables. */
  promptRender(id: string, input: Record<string, unknown>): PromptMessage[];

  /** Legacy: register a string template by name. */
  set(name: string, template: string): void;
  /** Legacy: get a string template by name. */
  getTemplate(name: string): string | undefined;
  /** Legacy: render a string template with input variables. */
  render(name: string, inputs: Record<string, string>): string;

  /** Run a structured prompt through the provider pipeline. */
  run<T = unknown>(
    id: string,
    input?: Record<string, unknown>,
    overrides?: Partial<CompleteRequest>
  ): Promise<CompleteResponse<T>>;

  /** Clear all prompts. */
  clear(): void;
}

export function createSabiPrompts(opts: {
  initialTemplates?: Record<string, string>;
  initialDefinitions?: PromptDefinition[];
  complete: <T>(request: CompleteRequest) => Promise<CompleteResponse<T>>;
}): SabiPrompts {
  const registry = new PromptRegistry();
  const templates = new Map<string, string>();
  const { complete } = opts;

  if (opts.initialTemplates) {
    for (const [name, template] of Object.entries(opts.initialTemplates)) {
      templates.set(name, template);
    }
  }

  if (opts.initialDefinitions) {
    registry.registerMany(opts.initialDefinitions);
  }

  return {
    // --- Structured prompts ---
    register(def: PromptDefinition): void {
      registry.register(def);
    },

    registerMany(defs: PromptDefinition[]): void {
      registry.registerMany(defs);
    },

    get(id: string): Prompt | undefined {
      return registry.get(id);
    },

    list(): PromptDefinition[] {
      return registry.list();
    },

    remove(id: string): boolean {
      return registry.remove(id);
    },

    has(id: string): boolean {
      return registry.has(id);
    },

    promptRender(id: string, input: Record<string, unknown>): PromptMessage[] {
      return registry.render(id, input);
    },

    // --- Legacy string templates ---
    set(name: string, template: string): void {
      templates.set(name, template);
    },

    getTemplate(name: string): string | undefined {
      return templates.get(name);
    },

    render(name: string, inputs: Record<string, string>): string {
      const template = templates.get(name);
      if (template === undefined) throw new PromptNotFoundError(name);
      return template.replace(TEMPLATE_REGEX, (match, key) => {
        if (!(key in inputs)) throw new MissingPromptInputError(key, name);
        return inputs[key]!;
      });
    },

    // --- Run through pipeline ---
    async run<T = unknown>(
      id: string,
      input: Record<string, unknown> = {},
      overrides: Partial<CompleteRequest> = {}
    ): Promise<CompleteResponse<T>> {
      const prompt = registry.get(id);
      if (prompt === undefined) throw new PromptNotFoundError(id);

      const messages: Message[] = prompt
        .render(input)
        .map((m) => ({ role: m.role, content: m.content }));

      const def = prompt.definition;
      const model = overrides.model ?? def.model;
      if (!model) {
        throw new SabiError(
          `Prompt "${id}" has no default model. Provide model in definition or overrides.`
        );
      }

      const request: CompleteRequest = {
        model,
        messages,
        temperature: overrides.temperature ?? def.temperature,
        maxTokens: overrides.maxTokens ?? def.maxTokens,
        schema: overrides.schema ?? def.schema,
        ...overrides,
      };

      return complete<T>(request);
    },

    // --- Clear ---
    clear(): void {
      templates.clear();
      registry.clear();
    },
  };
}
