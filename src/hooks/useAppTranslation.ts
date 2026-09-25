import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { translate } from '../i18n';
import type { RootState } from '../redux/store.ts';

export const useAppTranslation = () => {
  const language = useSelector((state: RootState) => state.language.current);

  return useMemo(
    () => ({
      language,
      t: (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
        translate(language, key, params),
    }),
    [language]
  );
};
