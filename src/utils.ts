export function parseModel(full: string): { provider: string; modelId: string } {
  const slashIndex = full.indexOf("/");
  if (slashIndex === -1) {
    throw new Error(
      `Invalid model format "${full}" — expected "provider/model" (e.g. "groq/llama-3.1-8b-instant")`
    );
  }
  return {
    provider: full.slice(0, slashIndex),
    modelId: full.slice(slashIndex + 1),
  };
}

export function tryParseJSON<T = Record<string, unknown>>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
