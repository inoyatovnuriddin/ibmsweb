import { useEffect, useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';

import { HelmetProvider } from 'react-helmet-async';
import { StylesContext } from './context';
import routes from './routes/routes.tsx';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';
import { getBackendLanguageCode, setApiLanguage } from './i18n';
import './App.css';

export const COLOR = {
  50: '#e0f1ff',
  100: '#b0d2ff',
  200: '#7fb0ff',
  300: '#4d8bff',
  400: '#1e79fe',
  500: '#076ee5',
  600: '#0062b3',
  700: '#004f81',
  800: '#003650',
  900: '#001620',
  borderColor: '#E7EAF3B2',
};

function App() {
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const language = useSelector((state: RootState) => state.language.current);
  const isDark = mytheme === 'dark';

  const themePalette = useMemo(
    () =>
      isDark
        ? {
            colorBgLayout: '#0f1117',
            colorBgContainer: '#151922',
            colorBgElevated: '#181d27',
            colorBorder: 'rgba(255, 255, 255, 0.09)',
            colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
            colorText: 'rgba(255, 255, 255, 0.9)',
            colorTextSecondary: 'rgba(255, 255, 255, 0.62)',
            colorTextTertiary: 'rgba(255, 255, 255, 0.4)',
            colorFillSecondary: 'rgba(255, 255, 255, 0.08)',
            colorFillTertiary: 'rgba(255, 255, 255, 0.06)',
            colorFillQuaternary: 'rgba(255, 255, 255, 0.04)',
            surfaceAccent: 'rgba(37, 99, 235, 0.18)',
            surfaceHover: 'rgba(255, 255, 255, 0.06)',
          }
        : {
            colorBgLayout: '#f6f8fc',
            colorBgContainer: '#ffffff',
            colorBgElevated: '#ffffff',
            colorBorder: 'rgba(148, 163, 184, 0.18)',
            colorBorderSecondary: 'rgba(148, 163, 184, 0.14)',
            colorText: '#102a43',
            colorTextSecondary: '#64748b',
            colorTextTertiary: '#829ab1',
            colorFillSecondary: '#f8fafc',
            colorFillTertiary: '#eef2f7',
            colorFillQuaternary: '#e9eef5',
            surfaceAccent: '#eef4ff',
            surfaceHover: '#f8fafc',
          },
    [isDark]
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mytheme);
    document.documentElement.style.setProperty('color-scheme', mytheme);
    document.documentElement.lang = getBackendLanguageCode(language);
    document.body.style.background = themePalette.colorBgLayout;
    document.body.style.color = themePalette.colorText;
    window.localStorage.setItem('ibms-theme', mytheme);
    setApiLanguage(language);
  }, [language, mytheme, themePalette.colorBgLayout, themePalette.colorText]);

  return (
    <HelmetProvider>
   
      
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: COLOR['500'],
            borderRadius: 6,
            fontFamily: 'Lato, sans-serif',
            colorBgLayout: themePalette.colorBgLayout,
            colorBgContainer: themePalette.colorBgContainer,
            colorBgElevated: themePalette.colorBgElevated,
            colorBorder: themePalette.colorBorder,
            colorBorderSecondary: themePalette.colorBorderSecondary,
            colorText: themePalette.colorText,
            colorTextSecondary: themePalette.colorTextSecondary,
            colorTextTertiary: themePalette.colorTextTertiary,
            colorFillSecondary: themePalette.colorFillSecondary,
            colorFillTertiary: themePalette.colorFillTertiary,
            colorFillQuaternary: themePalette.colorFillQuaternary,
          },
          components: {
            Breadcrumb: {
              // linkColor: 'rgba(0,0,0,.8)',
              // itemColor: 'rgba(0,0,0,.8)',
            },
            Button: {
              colorLink: COLOR['500'],
              colorLinkActive: COLOR['700'],
              colorLinkHover: COLOR['300'],
              defaultBg: themePalette.colorBgContainer,
              defaultBorderColor: themePalette.colorBorderSecondary,
              defaultColor: themePalette.colorText,
            },
            Calendar: {
              colorBgContainer: 'none',
            },
            Card: {
              colorBorderSecondary: COLOR['borderColor'],
              colorBgContainer: themePalette.colorBgContainer,
            },
            Carousel: {
              colorBgContainer: COLOR['800'],
              dotWidth: 8,
            },
            DatePicker: {
              colorBgContainer: themePalette.colorBgContainer,
              colorBorder: themePalette.colorBorderSecondary,
              colorText: themePalette.colorText,
              colorTextPlaceholder: themePalette.colorTextTertiary,
            },
            Drawer: {
              colorBgElevated: themePalette.colorBgElevated,
              colorText: themePalette.colorText,
              colorTextHeading: themePalette.colorText,
              colorIcon: themePalette.colorTextSecondary,
            },
            Dropdown: {
              colorBgElevated: themePalette.colorBgElevated,
              colorText: themePalette.colorText,
            },
            Input: {
              colorBgContainer: themePalette.colorBgContainer,
              colorBorder: themePalette.colorBorderSecondary,
              colorText: themePalette.colorText,
              colorTextPlaceholder: themePalette.colorTextTertiary,
              activeBg: themePalette.colorBgContainer,
              hoverBg: themePalette.colorBgContainer,
            },
            Layout: {
              bodyBg: themePalette.colorBgLayout,
              headerBg: 'transparent',
              siderBg: 'transparent',
              footerBg: 'transparent',
            },
            Modal: {
              contentBg: themePalette.colorBgElevated,
              headerBg: themePalette.colorBgElevated,
              footerBg: themePalette.colorBgElevated,
              titleColor: themePalette.colorText,
              titleFontSize: 20,
            },
            Popover: {
              colorBgElevated: themePalette.colorBgElevated,
              colorText: themePalette.colorText,
            },
            Rate: {
              colorFillContent: COLOR['100'],
              colorText: COLOR['600'],
            },
            Segmented: {
              colorBgLayout: themePalette.colorFillSecondary,
              borderRadius: 6,
              colorTextLabel: themePalette.colorText,
            },
            Select: {
              colorBgContainer: themePalette.colorBgContainer,
              colorBorder: themePalette.colorBorderSecondary,
              colorText: themePalette.colorText,
              colorTextPlaceholder: themePalette.colorTextTertiary,
              optionSelectedBg: themePalette.surfaceAccent,
              optionActiveBg: themePalette.surfaceHover,
            },
            Switch: {
              colorPrimary: COLOR['500'],
              colorPrimaryHover: COLOR['400'],
            },
            Table: {
              borderColor: themePalette.colorBorderSecondary,
              colorBgContainer: 'none',
              headerBg: themePalette.colorFillSecondary,
              rowHoverBg: themePalette.surfaceHover,
            },
            Tabs: {
              colorBorderSecondary: themePalette.colorBorderSecondary,
            },
            Timeline: {
              dotBg: 'none',
            },
            Tooltip: {
              colorBgSpotlight: isDark ? '#223049' : '#102a43',
              colorTextLightSolid: '#ffffff',
            },
            Typography: {
              colorLink: COLOR['500'],
              colorLinkActive: COLOR['700'],
              colorLinkHover: COLOR['300'],
              linkHoverDecoration: 'underline',
            },
          },
          algorithm:
            isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        }}
      >
        <StylesContext.Provider
          value={{
            rowProps: {
              gutter: [
                { xs: 8, sm: 16, md: 24, lg: 32 },
                { xs: 8, sm: 16, md: 24, lg: 32 },
              ],
            },
            carouselProps: {
              autoplay: true,
              dots: true,
              dotPosition: 'bottom',
              infinite: true,
              slidesToShow: 3,
              slidesToScroll: 1,
            },
          }}
        >
          <RouterProvider router={routes} />
        </StylesContext.Provider>
      </ConfigProvider>
    </HelmetProvider>
  );
}

export default App;
