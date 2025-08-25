'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrTicketProps {
  registrationId: string;
  eventTitle: string;
  userName: string;
}

export default function QrTicket({ registrationId, eventTitle, userName }: QrTicketProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const checkInUrl = `${window.location.origin}/checkin?rid=${registrationId}`;
        const url = await QRCode.toDataURL(checkInUrl, {
          color: {
            dark: '#2E7D32',
            light: '#0B0B0B'
          },
          width: 256
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [registrationId]);

  return (
    <div className="card text-center">
      <h3 className="text-xl font-semibold mb-4">כרטיס כניסה</h3>
      <p className="text-gray-300 mb-6">{eventTitle}</p>
      
      {qrCodeUrl && (
        <div className="bg-white p-4 rounded-lg inline-block mb-4">
          <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
        </div>
      )}
      
      <div className="text-sm text-gray-400">
        <p>שם: {userName}</p>
        <p>מספר רישום: {registrationId.slice(-8).toUpperCase()}</p>
        <p className="mt-2">הצג את הקוד למדריך ביום האירוע</p>
      </div>
    </div>
  );
}