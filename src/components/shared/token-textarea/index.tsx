/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
//@ts-ignore
import llamaTokenizer from 'llama-tokenizer-js'
import React from 'react';

interface TokenTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
  label?: string;
  required?: boolean;
}

export function getLlamaTokens(text: string): number {
  if (!text) return 0;
  const tokens: number = llamaTokenizer.encode(text).length;
  return tokens;
}

const TokenTextarea = (props: TokenTextareaProps) => {
  const { value, onChange, placeholder, className, disabled, readonly, } = props;
  const [numTokens, setNumTokens] = useState(0);

  const [touched, setTouched] = useState(false);
  const isError = () => props.required && touched && !props.value;

  useEffect(() => {
    setNumTokens(getTokens(value));
  }, [value]);

  const getTokens = (text: string) => {
    let tokens: number = 0;
    tokens = getLlamaTokens(text)
    return tokens;
  };

  return (
    <div className="flex flex-col w-full h-full gap-1">
      <label className={`${props.required ? 'required-field' : ''} ${isError() ? 'error-field' : ''} font-bold w-full `}>{props.label}</label>
      <textarea
        className={'dy-textarea flex-grow h-full ' + className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setNumTokens(getTokens(e.target.value)); }}
        disabled={disabled}
        readOnly={readonly}
        spellCheck={true}
        autoComplete={"on"}
        autoCorrect="on"
        aria-required={props.required}
        onBlur={() => setTouched(true)}
        required={props.required}
      />
      <div className="flex flex-row justify-end">
        <p className='w-full justify-between flex flex-row'><span className={'text-right text-xs text-gray-500 mb-0'}>{numTokens} tokens</span></p>
      </div>
    </div>
  );
};
export default TokenTextarea;