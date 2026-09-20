import { Button, Space, Spin, theme } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { FcGoogle } from 'react-icons/fc';
import { useMediaQuery } from 'react-responsive';
import type { ReactNode } from 'react';
import { useAppTranslation } from '../../hooks/useAppTranslation.ts';

type AuthProviderButtonsProps = {
  googleLabel: string;
  googleLoading?: boolean;
  onGoogleClick: () => void;
  fullWidth?: boolean;
  telegramContent?: ReactNode;
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
  paddingInline: 22,
};

const providerContentStyle = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '40px 1fr 40px',
  alignItems: 'center',
  fontSize: 18,
  fontWeight: 600,
  color: 'currentColor',
  lineHeight: 1.2,
  columnGap: 12,
};

export const AuthProviderButtons = ({
  googleLabel,
  googleLoading = false,
  onGoogleClick,
  fullWidth = true,
  telegramContent,
}: AuthProviderButtonsProps) => {
  const { t } = useAppTranslation();
  const {
    token: { colorBgElevated, colorBorderSecondary, colorPrimary, colorText },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 576 });
  const googleIndicator = (
    <Spin
      indicator={<LoadingOutlined spin style={{ color: colorPrimary, fontSize: 18 }} />}
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
          background: colorBgElevated,
          border: `1px solid ${colorBorderSecondary}`,
          boxShadow: 'var(--color-shadow-soft)',
        }}
      >
        <span
          style={{
            ...providerContentStyle,
            fontSize: isMobile ? 16 : 18,
            color: colorText,
          }}
        >
          <span style={iconWrapStyle}>
            {googleLoading ? googleIndicator : <FcGoogle size={26} />}
          </span>
          <span style={{ textAlign: 'center' }}>
            {googleLoading ? t('common.redirecting') : googleLabel}
          </span>
          <span />
        </span>
      </Button>

      {telegramContent}
    </Space>
  );
};
