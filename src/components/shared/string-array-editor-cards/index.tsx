/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useState } from 'react';
import './StringArrayEditorCards.scss'
import { ArrowLeft, ArrowRight, Minus, Plus } from 'lucide-react';
import { confirmModal } from '../confirm-modal';
interface MultiInputEditorPropsBase {
  value: string[];
  className?: string;
  id?: string;
  disabled?: boolean;
  label?: string;
}

interface MultiInputEditorPropsEnabled extends MultiInputEditorPropsBase {
  disabled?: false;
  onChange: (value: string[]) => void;
}

interface MultiInputEditorPropsDisabled extends MultiInputEditorPropsBase {
  disabled: true;
  onChange?: (value: string[]) => void;
}

type MultiInputEditorProps = MultiInputEditorPropsEnabled | MultiInputEditorPropsDisabled;

const StringArrayEditorCards = (props: MultiInputEditorProps) => {
  const { value, onChange, className, id, disabled, label } = props;
  const [index, setIndex] = useState<number>(0);

  const handleIndexChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < value?.length) {
      setIndex(newIndex);
    }
  }

  return (
    <div className="w-full h-full" id={id}>
      <label className="font-bold">{label} ({index + 1}/{value?.length})</label>
      <div className="flex flex-row h-full overflow-y-auto gap-1 flex-grow">
        <button className="hover:dy-btn-warning dy-btn w-1/12 h-full flex justify-center items-center flex-grow" onClick={() => handleIndexChange(index - 1)}>
          <ArrowLeft size={32} />
          ({index > 0 ? index : 0}/{value?.length})
        </button>
        {disabled ? null : (
          <div className='flex flex-col w-1/12 gap-1'>
            <button
              className="flex-grow dy-btn hover:dy-btn-warning w-full h-1/2 flex justify-center items-center"
              onClick={async () => {
                if (!await confirmModal(`Are you sure you want to delete this? This cannot be undone.`)) return;
                if (onChange) {
                  const newValue = [...value];
                  newValue.splice(index, 1);
                  onChange(newValue);
                  handleIndexChange(index - 1);
                }
              }}
            >
              <Minus size={32} />
            </button>
          </div>
        )}
        {Array.isArray(value) && value[index] !== undefined ? (
          <textarea
            className={(disabled ? "dy-input w-10/12" : "dy-input w-9/12") + " flex-grow h-full"}
            value={value[index]}
            disabled={disabled}
            onChange={(e) => {
              if (onChange && !disabled) {
                const newValue = [...value];
                newValue[index] = e.target?.value;
                onChange(newValue);
              }
            }}
          />
        ) : (
          <textarea
            className={(disabled ? "dy-input w-10/12" : "dy-input w-9/12") + " flex-grow h-full"}
            value={value && value[index]}
            disabled={disabled}
            onChange={(e) => {
              if (onChange && !disabled) {
                const newValue = [...value];
                newValue[index] = e.target?.value;
                onChange(newValue);
              }
            }}
          />
        )}
        {disabled ? null : (
          <div className='flex flex-col w-1/12 gap-1'>
            <button
              className="flex-grow dy-btn hover:dy-btn-accent w-full h-1/2 flex justify-center items-center"
              onClick={() => {
                if (onChange) {
                  onChange([...value, '']);
                  setIndex(index + 1);
                }
              }}
            >
              <Plus size={32} />
            </button>
          </div>
        )}
        <button className="flex-grow dy-btn hover:dy-btn-accent w-1/12 h-full flex justify-center items-center" onClick={() => handleIndexChange(index + 1)}>
          <ArrowRight size={32} />
          ({index > 0 ? index + 2 : 1}/{value?.length})
        </button>
      </div>
    </div>
  )
};


export default StringArrayEditorCards;