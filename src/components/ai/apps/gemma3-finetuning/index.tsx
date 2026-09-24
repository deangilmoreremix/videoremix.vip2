import React from "react";
import { GenericAIApp } from "../GenericAIApp";

const gemma3_finetuning: React.FC<any> = (props) => {
  return <GenericAIApp {...props} appName="gemma3-finetuning" />;
};

export default gemma3_finetuning;
