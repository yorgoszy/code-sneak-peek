import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface MetricOption {
  key: string;
  label: string;
  unit: string;
}

interface Props {
  value: string;
  onChange: (key: string) => void;
  options: MetricOption[];
  placeholder?: string;
}

export const MetricSelector: React.FC<Props> = ({ value, onChange, options, placeholder = "Select metric" }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="rounded-none w-[220px]">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent className="rounded-none">
      {options.map((o) => (
        <SelectItem key={o.key} value={o.key}>
          {o.label} {o.unit ? <span className="text-muted-foreground ml-1">({o.unit})</span> : null}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
