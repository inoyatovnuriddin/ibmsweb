import { Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { LANGUAGE_OPTIONS } from '../../i18n';
import { setLanguage } from '../../redux/language/languageSlice.ts';
import type { RootState } from '../../redux/store.ts';
import uzbekistanFlag from '../../assets/flags/uzbekistan.svg';
import russiaFlag from '../../assets/flags/russia.svg';

/**
 * Переключатель языка — один и тот же на лендинге, в админке и в кабинете,
 * чтобы язык менялся одинаково во всём приложении.
 */

const LANGUAGE_FLAG_MAP = {
  uz: uzbekistanFlag,
  ru: russiaFlag,
  'uz-Cyrl': uzbekistanFlag,
} as const;

const renderLanguageOption = (option: (typeof LANGUAGE_OPTIONS)[number], compact: boolean) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 12, minWidth: 0 }}>
    <img
      src={LANGUAGE_FLAG_MAP[option.value]}
      alt={option.label}
      style={{
        width: 22,
        height: 16,
        objectFit: 'cover',
        borderRadius: 999,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
        flexShrink: 0,
      }}
    />
    <span
      style={{
        color: 'var(--color-text)',
        fontWeight: 600,
        fontSize: compact ? 14 : 16,
        lineHeight: 1.2,
        flex: 1,
        minWidth: 0,
      }}
    >
      {option.label}
    </span>
  </div>
);

interface LanguageSelectProps {
  /** Компактный вид для шапки админки. */
  compact?: boolean;
  size?: 'small' | 'middle' | 'large';
  width?: number | string;
  style?: React.CSSProperties;
}

export const LanguageSelect = ({
  compact = false,
  size = 'large',
  width = 176,
  style,
}: LanguageSelectProps) => {
  const dispatch = useDispatch();
  const language = useSelector((state: RootState) => state.language.current);

  const options = LANGUAGE_OPTIONS.map((option) => ({
    value: option.value,
    label: renderLanguageOption(option, compact),
  }));

  return (
    <Select
      value={language}
      options={options}
      size={size}
      className="theme-language-select"
      popupClassName="theme-language-dropdown"
      dropdownStyle={{ borderRadius: 18, padding: 6 }}
      style={{ width, flexShrink: 0, ...style }}
      onChange={(value) => dispatch(setLanguage(value))}
    />
  );
};

export default LanguageSelect;
