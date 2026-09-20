import { Alert } from 'antd';
import { useEffect, useRef } from 'react';
import type { TelegramWidgetUser } from '../redux/auth/authApi.ts';

declare global {
  interface Window {
    [key: string]: unknown;
  }
}

type TelegramAuthWidgetProps = {
  callbackName: string;
  onAuth: (user: TelegramWidgetUser) => Promise<void> | void;
  botUsername?: string;
  radius?: number;
  size?: 'large' | 'medium' | 'small';
  requestAccess?: 'write' | 'read';
};

export const TelegramAuthWidget = ({
  callbackName,
  onAuth,
  botUsername,
  radius = 14,
  size = 'large',
  requestAccess = 'write',
}: TelegramAuthWidgetProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onAuthRef = useRef(onAuth);

  useEffect(() => {
    onAuthRef.current = onAuth;
  }, [onAuth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    if (!botUsername) {
      return;
    }

    window[callbackName] = (user: TelegramWidgetUser) => {
      void onAuthRef.current(user);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', size);
    script.setAttribute('data-radius', String(radius));
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-onauth', `${callbackName}(user)`);

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
      delete window[callbackName];
    };
  }, [botUsername, callbackName, radius, requestAccess, size]);

  if (!botUsername) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Telegram bot username sozlanmagan"
        description="VITE_TELEGRAM_BOT_USERNAME environment qiymatini kiriting."
      />
    );
  }

  return <div ref={containerRef} style={{ minHeight: 52 }} />;
};
