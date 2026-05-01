import { Flex, FlexProps } from 'antd';
import { Link } from 'react-router-dom';
import { CSSProperties } from 'react';
import logo from './ibms.svg';

import './styles.css';

type LogoProps = {
  color: CSSProperties['color'];
  imgSize?: {
    h?: number | string;
    w?: number | string;
  };
  asLink?: boolean;
  href?: string;
  bgColor?: CSSProperties['backgroundColor'];
} & Partial<FlexProps>;

export const Logo = ({
  asLink,
  href,
  imgSize,
  ...others
}: LogoProps) => {
  const content = (
    <Flex gap={others.gap || 'middle'} align="center" {...others}>
      <div className="logo-shell">
        <img
          src={logo}
          alt="IBMS logo"
          height={imgSize?.h || 62}
          className="logo-image"
        />
      </div>
    </Flex>
  );

  return asLink ? (
    <Link to={href || '#'} className="logo-link">
      {content}
    </Link>
  ) : (
    content
  );
};
