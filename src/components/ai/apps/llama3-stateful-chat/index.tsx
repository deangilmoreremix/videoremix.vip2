import React from "react";
import { GenericAIApp } from "../GenericAIApp";

const llama3_stateful_chat: React.FC<any> = (props) => {
  return <GenericAIApp {...props} appName="llama3-stateful-chat" />;
};

export default llama3_stateful_chat;
