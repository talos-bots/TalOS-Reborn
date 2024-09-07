import React, { useState } from 'react';
import './RequiredInputField.css';

const RequiredInputField = ({ characterLimit = null, label, required, className, ...props }) => {
  const [touched, setTouched] = useState(false);
  const isError = () => required && touched && !props.value;

  const handleChange = (event) => {
    if (characterLimit && event?.target?.value?.length > characterLimit) {
      event.target.value = event?.target?.value?.slice(0, characterLimit);
    }
    props.onChange(event);
  }

  return (
    <div className={'flex flex-col gap-1 ' + className}>
      <label className={`${required ? 'required-field' : ''} ${isError() ? 'error-field' : ''} font-bold w-full `}>
        {label}
      </label>
      <input
        {...props}
        onChange={handleChange}
        required={required}
        onBlur={() => setTouched(true)}
        className={(isError() ? 'error-field' : '') + ' dy-input dy-input-bordered flex-grow' + className}
      />
      <p className='w-full justify-between flex flex-row'><span className={'text-right text-xs text-gray-500 mb-0' + (!characterLimit && ' hidden')}>{characterLimit ? `${props?.value?.length}/${characterLimit}` : ''}</span><span className={"error-field text-left" + (!isError() && ' hidden')}>{isError() && 'This field is required.'}</span></p>
    </div>
  );
};
export default RequiredInputField;

export const RequiredTextAreaField = ({ label, required, className, characterLimit = null, ...props }) => {
  const [touched, setTouched] = useState(false);
  const isError = () => required && touched && !props.value;

  const handleChange = (event) => {
    if (characterLimit && event?.target?.value?.length > characterLimit) {
      event.target.value = event?.target?.value?.slice(0, characterLimit);
    }
    props.onChange(event);
  }

  return (
    <div className={'flex flex-col gap-2 ' + className}>
      <label className={`${required ? 'required-field' : ''} ${isError() ? 'error-field' : ''} font-bold w-full `}>
        {label}
      </label>
      <textarea
        {...props}
        onChange={handleChange}
        required={required}
        onBlur={() => setTouched(true)}
        className={(isError() ? 'error-field' : '') + ' dy-textarea dy-textarea-bordered flex-grow' + className}
      />
      <p className='w-full justify-between flex flex-row'><span className={'text-right text-xs text-gray-500 mb-0' + (!characterLimit && ' hidden')}>{characterLimit ? `${props?.value?.length}/${characterLimit}` : ''}</span><span className={"error-field text-left" + (!isError() && ' hidden')}>{isError() && 'This field is required.'}</span></p>
    </div>
  );
}

export const RequiredSelectField = ({ label = null, required, className, ...props }) => {
  const [touched, setTouched] = useState(false);
  const isError = () => required && touched && (!props.value || props.value === null) && props.value !== 0;

  return (
    <div className={'flex flex-col gap-2 ' + className}>
      {label && <label className={`${required ? 'required-field' : ''} ${isError() ? 'error-field' : ''} font-bold w-full `}>
        {label}
      </label>}
      <select
        {...props}
        required={required}
        onBlur={() => setTouched(true)}
        className={(isError() ? 'error-field ' : '') + ' dy-input dy-input-bordered ' + className}
      >
        {props.children}
      </select>
      <span className={"error-field" + (!isError() && ' hidden')}>{isError() && '* Indicates that this field is required.'}</span>
    </div>
  );
}