import { Button, Space, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { FcGoogle } from 'react-icons/fc';
import { RiTelegram2Fill } from 'react-icons/ri';
import { useMediaQuery } from 'react-responsive';

type AuthProviderButtonsProps = {
  googleLabel: string;
  googleLoading?: boolean;
  onGoogleClick: () => void;
  fullWidth?: boolean;
};

const iconWrapStyle = {
  width: 28,
  height: 28,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
};

const providerButtonBase = {
  width: '100%',
  height: 60,
  borderRadius: 999,
  border: '1px solid rgba(37, 99, 235, 0.18)',
  background: '#ffffff',
  boxShadow: '0 14px 30px rgba(15, 23, 42, 0.06)',
  paddingInline: 22,
};

const providerContentStyle = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '40px 1fr 40px',
  alignItems: 'center',
  fontSize: 18,
  fontWeight: 600,
  color: '#102a43',
  lineHeight: 1.2,
  columnGap: 12,
};

export const AuthProviderButtons = ({
  googleLabel,
  googleLoading = false,
  onGoogleClick,
  fullWidth = true,
}: AuthProviderButtonsProps) => {
  const isMobile = useMediaQuery({ maxWidth: 576 });
  const googleIndicator = (
    <Spin
      indicator={<LoadingOutlined spin style={{ color: '#2563eb', fontSize: 18 }} />}
      size="small"
    />
  );

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Button
        type="default"
        size="large"
        onClick={onGoogleClick}
        disabled={googleLoading}
        block={fullWidth}
        style={{
          ...providerButtonBase,
          height: isMobile ? 56 : 60,
        }}
      >
        <span
          style={{
            ...providerContentStyle,
            fontSize: isMobile ? 16 : 18,
          }}
        >
          <span style={iconWrapStyle}>
            {googleLoading ? googleIndicator : <FcGoogle size={26} />}
          </span>
          <span style={{ textAlign: 'center' }}>
            {googleLoading ? 'Yo‘naltirilmoqda...' : googleLabel}
          </span>
          <span />
        </span>
      </Button>

      <Button
        type="default"
        size="large"
        disabled
        block={fullWidth}
        style={{
          ...providerButtonBase,
          height: isMobile ? 56 : 60,
          border: '1px solid rgba(14, 165, 233, 0.18)',
          background: '#f8fbff',
          boxShadow: 'none',
          opacity: 1,
          cursor: 'not-allowed',
        }}
      >
        <span
          style={{
            ...providerContentStyle,
            fontSize: isMobile ? 16 : 18,
          }}
        >
          <span style={iconWrapStyle}>
            <RiTelegram2Fill size={24} color="#229ED9" />
          </span>
          <span style={{ textAlign: 'center' }}>Telegram orqali kirish</span>
          <span />
        </span>
      </Button>
    </Space>
  );
};
