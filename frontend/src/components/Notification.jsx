import { useEffect } from 'react';
import './Notification.css';

export default function Notification({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        <span className="notification-icon">
          {type === 'success' ? '✓' : '✕'}
        </span>
        <span className="notification-message">{message}</span>
      </div>
    </div>
  );
}

