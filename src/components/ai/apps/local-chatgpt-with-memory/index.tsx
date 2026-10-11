import React from "react";
import { MemoryChatApp } from "../MemoryChatApp";

const local_chatgpt_with_memory: React.FC<any> = (props) => {
  return <MemoryChatApp {...props} appName="Local ChatGPT Clone with Memory" />;
};

export default local_chatgpt_with_memory;
