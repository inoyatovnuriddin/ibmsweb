import { Layout, theme } from 'antd';

const { Footer } = Layout;

type FooterNavProps = React.HTMLAttributes<HTMLDivElement>;

const FooterNav = ({ ...others }: FooterNavProps) => {
  const { token } = theme.useToken();

  return (
    <Footer
      {...others}
      style={{
        color: token.colorTextSecondary,
        textAlign: 'left',
        ...others.style,
      }}
    >
      {new Date().getFullYear()} IBMS admin paneli. Barcha boshqaruv amallari shu muhitda bajariladi.
    </Footer>
  );
};

export default FooterNav;
