import { Layout } from 'antd';

const { Footer } = Layout;

type FooterNavProps = React.HTMLAttributes<HTMLDivElement>;

const FooterNav = ({ ...others }: FooterNavProps) => {
  return (
    <Footer {...others}>
      ©{new Date().getFullYear()} IBMS. All rights reserved.{' '}
    </Footer>
  );
};

export default FooterNav;
