import { Layout } from 'antd';

const { Footer } = Layout;

type FooterNavProps = React.HTMLAttributes<HTMLDivElement>;

const FooterNav = ({ ...others }: FooterNavProps) => {
  return (
    <Footer
      {...others}
      style={{
        color: '#64748b',
        textAlign: 'left',
        ...others.style,
      }}
    >
      ©{new Date().getFullYear()} IBMS admin paneli. Barcha boshqaruv amallari shu muhitda bajariladi.
    </Footer>
  );
};

export default FooterNav;
