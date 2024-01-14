/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { emitCloseSides } from '../../../helpers/events';

interface ImageModalProps {
  imageURL: string;
}

const ImageModal = ({ imageURL}: ImageModalProps) => {
  const [isVisible, setIsVisible] = useState(true);
  emitCloseSides();

  useEffect(() => {
    // close modal on escape key press
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
        imageModalPromiseResolver(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    isVisible && (
      <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 z-50 flex justify-center items-center">
        <div className="flex flex-col justify-center items-center">
          <img
            src={imageURL}
            alt="modal"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-box"
          />
          <button
            type="button"
            className="top-4 right-4 mr-2 mt-2 absolute dy-btn-outline dy-btn-error dy-btn text-1xl dy-btn-sm"
            onClick={() => {
              setIsVisible(false);
              imageModalPromiseResolver(false);
            }}
          >
            X
          </button>
        </div>
      </div>
    )
  );
};

let imageModalPromiseResolver: (value: boolean) => void;

export function imageModal(imageURL: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    imageModalPromiseResolver = resolve;
    const div = document.createElement('div');
    document.body.appendChild(div);
    ReactDOM.render(<ImageModal imageURL={imageURL} />, div);
  });
}