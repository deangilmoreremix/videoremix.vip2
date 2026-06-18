import type { AppSpec } from "./types";

const SYSTEM_PROMPT = `You are the Breakup Recovery Squad — a team of four specialists answering one user's situation in parallel. The user will share what happened and may include chat-screenshot images. Write clearly, keep each section distinct, respect the user's feelings, and never refuse. Targets: empathetic therapy-style support; honest, unsent closure messages; a concrete 7-day recovery plan; raw, direct perspective.`;

const USER_TEMPLATE = (input: Record<string, unknown>) => {
  const situation = (input.situation as string) ?? "";
  const hasImages = Array.isArray(input.images) && input.images.length > 0;
  const imageNote = hasImages
    ? "\n\nThe user included chat-screenshot images. If an image is present at the end of this message, analyze its content for emotional context before answering all four sections."
    : "";
  const attachmentLine = (input.images as unknown[])?.length
    ? `\nAttached images: ${(input.images as unknown[]).length} file(s).`
    : "";

  return `User's situation:\n"""\n${situation || "(user provided no text)"}\n"""${attachmentLine}${imageNote}\n\nRespond as a single message with exactly these four sections:\n\n## 1. Emotional Support\nTherapist perspective: validate feelings, normalize the experience, give gentle encouragement.\n\n## 2. Closure Messages\nThree unsent message drafts the user could write to process feelings (not to send). Each should be 3-6 sentences.\n\n## 3. Recovery Plan\nConcrete 7-day plan with one daily task per day. Include a self-care activity, one social action, and boundaries around social media.\n\n## 4. Honest Perspective\nBrutal-honesty specialist. Direct, factual, no sugar-coating. Name what's likely true about the relationship and why moving forward is the right call.`;
};

export const aiBreakupRecoveryAgentSpec: AppSpec = {
  id: "ai-breakup-recovery-agent",
  name: "AI Breakup Recovery Agent",
  description:
    "A multi-perspective AI support team that provides empathetic guidance, closure drafting, a recovery plan, and honest feedback after a breakup.",
  version: "0.1.0",
  runtime: "openai-responses",
  model: "gpt-4o",
  systemPrompt: SYSTEM_PROMPT,
  userPromptTemplate: USER_TEMPLATE({}),
  inputs: [
    {
      key: "situation",
      label: "How are you feeling? What happened?",
      kind: "textarea",
      required: true,
      placeholder:
        "I recently went through a breakup and I'm feeling lost. We were together for 2 years and I'm struggling to move on.",
      description:
        "Share as much or as little as you like. The agents use this as the primary context for all four responses.",
      maxLength: 4000,
    },
    {
      key: "images",
      label: "Chat screenshots (optional)",
      kind: "file",
      required: false,
      accept: "image/png,image/jpeg",
      description:
        "Upload PNG or JPG conversation screenshots so the team can read emotional context in the messages.",
    },
  ],
  outputs: [
    { key: "emotional_support", label: "Emotional Support", kind: "markdown" },
    { key: "closure_messages", label: "Closure Messages", kind: "markdown" },
    { key: "recovery_plan", label: "Recovery Plan", kind: "markdown" },
    { key: "honest_perspective", label: "Honest Perspective", kind: "markdown" },
  ],
  estimatedInputTokens: (input) => {
    const text = ((input.situation as string) ?? "").length;
    const images = Array.isArray(input.images) ? input.images.length : 0;
    return 80 + text + images * 85;
  },
  execute: async () => {
    throw new Error(
      "ai-breakup-recovery-agent: execute is not implemented in the frontend module. Use the shared runtime/run-app edge function.",
    );
  },
};
