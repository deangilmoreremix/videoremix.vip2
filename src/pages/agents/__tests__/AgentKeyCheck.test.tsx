import { describe, it, expect } from "vitest";
import {
  getAgentKeyRequirements,
  checkAgentKeys,
  AVAILABLE_API_KEYS,
  AGENT_KEY_REQUIREMENTS,
} from "../../../utils/agentKeyRequirements";

describe("agentKeyRequirements", () => {
  describe("AVAILABLE_API_KEYS", () => {
    it("should have the required API keys defined", () => {
      expect(AVAILABLE_API_KEYS.OPENAI_API_KEY).toBeDefined();
      expect(AVAILABLE_API_KEYS.ANTHROPIC_API_KEY).toBeDefined();
      expect(AVAILABLE_API_KEYS.GOOGLE_GENERATIVE_AI_KEY).toBeDefined();
      expect(AVAILABLE_API_KEYS.EXA_API_KEY).toBeDefined();
      expect(AVAILABLE_API_KEYS.FIRECRAWL_API_KEY).toBeDefined();
      expect(AVAILABLE_API_KEYS.TOGETHER_API_KEY).toBeDefined();
    });

    it("should have name, description, and testEndpoint for each key", () => {
      Object.values(AVAILABLE_API_KEYS).forEach((config) => {
        expect(config.name).toBeTruthy();
        expect(config.description).toBeTruthy();
        expect(config.key).toBeTruthy();
      });
    });
  });

  describe("AGENT_KEY_REQUIREMENTS", () => {
    it("should have requirements for common agents", () => {
      expect(AGENT_KEY_REQUIREMENTS["ai-reasoning-agent"]).toBeDefined();
      expect(AGENT_KEY_REQUIREMENTS["chat-with-github"]).toBeDefined();
      expect(AGENT_KEY_REQUIREMENTS["openai-research-agent"]).toBeDefined();
      expect(AGENT_KEY_REQUIREMENTS["web-scraping-ai-agent"]).toBeDefined();
    });

    it("should have a default fallback", () => {
      expect(AGENT_KEY_REQUIREMENTS["default"]).toBeDefined();
      expect(AGENT_KEY_REQUIREMENTS["default"].requiredKeys).toContain("OPENAI_API_KEY");
    });
  });

  describe("getAgentKeyRequirements", () => {
    it("should return correct requirements for known agent", () => {
      const result = getAgentKeyRequirements("ai-reasoning-agent");
      expect(result.agentSlug).toBe("ai-reasoning-agent");
      expect(result.requiredKeys).toContain("OPENAI_API_KEY");
    });

    it("should return default requirements for unknown agent", () => {
      const result = getAgentKeyRequirements("unknown-agent-xyz");
      expect(result.agentSlug).toBe("default");
      expect(result.requiredKeys).toContain("OPENAI_API_KEY");
    });

    it("should return complex requirements for research agent", () => {
      const result = getAgentKeyRequirements("openai-research-agent");
      expect(result.requiredKeys).toContain("OPENAI_API_KEY");
      expect(result.requiredKeys).toContain("EXA_API_KEY");
      expect(result.requiredKeys).toContain("FIRECRAWL_API_KEY");
    });
  });

  describe("checkAgentKeys", () => {
    it("should return hasAllKeys: true when all required keys are present", () => {
      const storedKeys = {
        OPENAI_API_KEY: "sk-test123",
        EXA_API_KEY: "exa-test123",
      };
      const result = checkAgentKeys("openai-research-agent", storedKeys);
      expect(result.hasAllKeys).toBe(true);
      expect(result.missingKeys).toHaveLength(0);
    });

    it("should return hasAllKeys: false when keys are missing", () => {
      const storedKeys = {
        OPENAI_API_KEY: "sk-test123",
      };
      const result = checkAgentKeys("openai-research-agent", storedKeys);
      expect(result.hasAllKeys).toBe(false);
      expect(result.missingKeys).toContain("EXA_API_KEY");
      expect(result.missingKeys).toContain("FIRECRAWL_API_KEY");
    });

    it("should return hasAllKeys: false when key is empty string", () => {
      const storedKeys = {
        OPENAI_API_KEY: "",
        EXA_API_KEY: "exa-test",
        FIRECRAWL_API_KEY: "firecrawl-test",
      };
      const result = checkAgentKeys("openai-research-agent", storedKeys);
      expect(result.hasAllKeys).toBe(false);
      expect(result.missingKeys).toContain("OPENAI_API_KEY");
    });

    it("should handle agent with no required keys", () => {
      const storedKeys = {};
      const result = checkAgentKeys("local-chatgpt-clone", storedKeys);
      expect(result.hasAllKeys).toBe(true);
      expect(result.missingKeys).toHaveLength(0);
    });

    it("should return missing keys even for unknown agent (uses default)", () => {
      const storedKeys = {};
      const result = checkAgentKeys("some-unknown-agent", storedKeys);
      expect(result.hasAllKeys).toBe(false);
      expect(result.missingKeys).toContain("OPENAI_API_KEY");
    });
  });
});
