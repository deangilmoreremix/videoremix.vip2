// src/components/ai/YourApiKeyField.tsx
//
// The "your OpenAI API key" field above an app in the runner. Users run the
// apps with their own key (src/lib/userApiKeys.ts): it is saved on this
// device only and sent with each run, apart from the app's inputs.

import { useState } from "react";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { getStoredKey, storeKey } from "@/lib/userApiKeys";

export function YourApiKeyField() {
  const [value, setValue] = useState(() => getStoredKey("openai"));

  return (
    <div className="mb-4 rounded-xl border border-gray-800 bg-gray-900/40 p-4">
      <ApiKeyInput
        label="Your OpenAI API key"
        name="openai_api_key"
        value={value}
        onChange={(next) => {
          setValue(next);
          storeKey("openai", next);
        }}
        placeholder="sk-..."
        helperText="Runs are billed to your own OpenAI account. The key is saved on this device only and is never stored on our servers."
        autoComplete="off"
      />
    </div>
  );
}

export default YourApiKeyField;
