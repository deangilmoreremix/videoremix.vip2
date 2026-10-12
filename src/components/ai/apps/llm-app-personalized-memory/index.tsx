import React from "react";
import { MemoryChatApp } from "../MemoryChatApp";

const LlmAppPersonalizedMemory: React.FC<any> = (props) => {
  return <MemoryChatApp {...props} appName="LLM App with Personalized Memory" />;
};

export default LlmAppPersonalizedMemory;
