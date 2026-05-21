import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  flag: string;
}

export const DisabledModuleNotice: React.FC<Props> = ({ flag }) => (
  <Alert className="rounded-none max-w-2xl m-6">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Module disabled</AlertTitle>
    <AlertDescription>
      This module is currently disabled (flag: <code className="font-mono">{flag}</code>).
      Enable it from{" "}
      <Link to="/dashboard/ams-settings" className="underline">
        AMS Settings
      </Link>
      .
    </AlertDescription>
  </Alert>
);

export default DisabledModuleNotice;
