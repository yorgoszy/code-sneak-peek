
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from "@/components/ui/input";

interface DebouncedInputProps {
  value: string | number;
  onChange: (value: string) => void;
  debounceMs?: number;
  type?: string;
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  min?: number;
  max?: number;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = React.memo(({
  value,
  onChange,
  debounceMs = 300,
  type = 'text',
  inputMode,
  className,
  style,
  placeholder,
  min,
  max
}) => {
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState(String(value ?? ''));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Sync local state when prop value changes (but not on first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Only sync if the external value is different from what we have locally
    // This prevents overwriting during active typing
    const stringValue = String(value ?? '');
    if (stringValue !== localValue && !timeoutRef.current) {
      setLocalValue(stringValue);
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced update
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
      timeoutRef.current = null;
    }, debounceMs);
  }, [onChange, debounceMs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Flush pending changes on blur
  const handleBlur = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      onChange(localValue);
    }
  }, [localValue, onChange]);

  return (
    <Input
      type={type}
      inputMode={inputMode}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      style={style}
      placeholder={placeholder}
      min={min}
      max={max}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';
