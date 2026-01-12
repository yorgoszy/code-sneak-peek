
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from "@/components/ui/input";

interface RollingTimeInputProps {
  value: string | number;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}

/**
 * Rolling Time Input - Always shows format MM:SS (00:00)
 * When typing, digits shift left: 00:30 + 3 = 03:03
 * Only accepts numbers, automatically formats with colon
 */
export const RollingTimeInput: React.FC<RollingTimeInputProps> = React.memo(({
  value,
  onChange,
  debounceMs = 300,
  className,
  style,
  placeholder = '00:00',
  onClick
}) => {
  // Extract 4 digits from current value
  const getDigitsFromValue = (val: string | number): string => {
    const str = String(val ?? '').replace(/\D/g, '');
    return str.padStart(4, '0').slice(-4);
  };

  const formatDigits = (digits: string): string => {
    const padded = digits.padStart(4, '0').slice(-4);
    return `${padded.slice(0, 2)}:${padded.slice(2)}`;
  };

  const [localValue, setLocalValue] = useState(formatDigits(getDigitsFromValue(value)));
  const [digits, setDigits] = useState(getDigitsFromValue(value));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external value changes
  useEffect(() => {
    const newDigits = getDigitsFromValue(value);
    if (newDigits !== digits && !timeoutRef.current) {
      setDigits(newDigits);
      setLocalValue(formatDigits(newDigits));
    }
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace to clear last digit (shift right, add 0 at start)
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = '0' + digits.slice(0, 3);
      setDigits(newDigits);
      setLocalValue(formatDigits(newDigits));
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Debounce the update
      timeoutRef.current = setTimeout(() => {
        onChange(formatDigits(newDigits));
        timeoutRef.current = null;
      }, debounceMs);
      return;
    }

    // Only allow numeric keys
    if (!/^\d$/.test(e.key)) {
      // Allow navigation keys
      if (!['ArrowLeft', 'ArrowRight', 'Tab', 'Delete', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
      }
      return;
    }

    e.preventDefault();
    
    // Rolling: shift left and add new digit at the end
    const newDigits = digits.slice(1) + e.key;
    setDigits(newDigits);
    setLocalValue(formatDigits(newDigits));
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the update
    timeoutRef.current = setTimeout(() => {
      onChange(formatDigits(newDigits));
      timeoutRef.current = null;
    }, debounceMs);
  }, [digits, onChange, debounceMs]);

  // Handle paste - extract digits and use last 4
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedDigits = pastedText.replace(/\D/g, '');
    if (pastedDigits.length > 0) {
      const newDigits = pastedDigits.padStart(4, '0').slice(-4);
      setDigits(newDigits);
      setLocalValue(formatDigits(newDigits));
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        onChange(formatDigits(newDigits));
        timeoutRef.current = null;
      }, debounceMs);
    }
  }, [onChange, debounceMs]);

  // Prevent default input behavior
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Do nothing - we handle everything in keydown
  }, []);

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
      onChange(formatDigits(digits));
    }
  }, [digits, onChange]);

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onBlur={handleBlur}
      onClick={onClick}
      className={className}
      style={style}
      placeholder={placeholder}
      maxLength={5}
    />
  );
});

RollingTimeInput.displayName = 'RollingTimeInput';
