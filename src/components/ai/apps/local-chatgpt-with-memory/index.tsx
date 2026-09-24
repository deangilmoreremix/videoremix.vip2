import React from "react";
import { GenericAIApp } from "../GenericAIApp";

const local_chatgpt_with_memory: React.FC<any> = (props) => {
  return <GenericAIApp {...props} appName="local-chatgpt-with-memory" />;
};

export default local_chatgpt_with_memory;
