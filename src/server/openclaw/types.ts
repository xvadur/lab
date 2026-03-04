export type WriterTone = "default" | "executive" | "creative" | "concise";

export type GenerateRequest = {
  prompt: string;
  tone?: WriterTone;
  temperature?: number;
  maxTokens?: number;
  stream?: false;
};

export type GenerateResult = {
  text: string;
  model: string;
};

export type GatewayHealth = {
  ok: boolean;
  gateway: "up" | "down";
  checkedAt: string;
};
