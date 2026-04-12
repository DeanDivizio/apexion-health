export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

const COST_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gpt-5-mini": { input: 0.75, output: 4.5 },
  "gpt-5-mini-batch": { input: 0.375, output: 2.25 },
};

export class TokenAccumulator {
  private phases: Record<string, TokenUsage> = {};
  private _callCount = 0;

  add(
    phase: string,
    usage: { prompt_tokens?: number; completion_tokens?: number } | undefined | null,
  ) {
    if (!usage) return;
    if (!this.phases[phase]) {
      this.phases[phase] = { promptTokens: 0, completionTokens: 0 };
    }
    this.phases[phase].promptTokens += usage.prompt_tokens ?? 0;
    this.phases[phase].completionTokens += usage.completion_tokens ?? 0;
    this._callCount++;
  }

  get callCount() {
    return this._callCount;
  }

  get totalInputTokens(): number {
    return Object.values(this.phases).reduce((s, p) => s + p.promptTokens, 0);
  }

  get totalOutputTokens(): number {
    return Object.values(this.phases).reduce(
      (s, p) => s + p.completionTokens,
      0,
    );
  }

  phaseUsage(phase: string): TokenUsage {
    return this.phases[phase] ?? { promptTokens: 0, completionTokens: 0 };
  }

  estimateCost(model: string, batch = false): number {
    const key = batch ? `${model}-batch` : model;
    const rates = COST_PER_MILLION[key] ?? COST_PER_MILLION[model];
    if (!rates) return 0;
    const inputCost = (this.totalInputTokens / 1_000_000) * rates.input;
    const outputCost = (this.totalOutputTokens / 1_000_000) * rates.output;
    return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
  }

  toJSON() {
    return {
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      callCount: this._callCount,
      phases: { ...this.phases },
    };
  }
}
