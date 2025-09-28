import React, { useState } from 'react';
import { Button, Popup } from 'pixel-retroui';

export function RetroPopup() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  return (
    <div>
      <Button onClick={openPopup}>Open Popup</Button>
      
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        bg="#ddceb4"
        baseBg="#30210b"
        textColor="#30210b"
        borderColor="#30210b"
      >
        Your popup content here
      </Popup>
    </div>
  );
}