import React from "react";
import { GenericAIApp } from "../GenericAIApp";

const local_rag_agent: React.FC<any> = (props) => {
  return <GenericAIApp {...props} appName="local-rag-agent" />;
};

export default local_rag_agent;
