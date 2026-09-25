import dayjs, { Dayjs } from 'dayjs';

/**
 * Даты сертификата хранятся не одним полем, а россыпью плейсхолдеров бланка:
 * день / название месяца / год лежат в разных ключах, а где-то — целой фразой
 * ("от 06 апреля 2023г."). Формат у каждого ключа свой, его задаёт бэкенд
 * (CertificateValueBuilder) и, для части шаблонов, сама форма через extraValues.
 *
 * Здесь один календарь на группу: мы РАСПОЗНАЁМ формат уже сохранённого значения
 * и записываем новую дату ровно в том же виде. Так редактирование не ломает
 * Word-документ: меняется дата, а не оформление бланка.
 */

const RU_NOM = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

const RU_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const UZ = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

const EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const day2 = (d: Dayjs) => String(d.date()).padStart(2, '0');
const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Индекс месяца (0–11) по названию на любом из четырёх языков/падежей. */
const monthIndex = (raw: string): number => {
  const s = raw.trim().toLowerCase();
  const lists = [RU_GEN, RU_NOM, UZ, EN];
  for (const list of lists) {
    const i = list.findIndex((m) => m.toLowerCase() === s);
    if (i >= 0) return i;
  }
  return -1;
};

const MONTH_ALT = '[A-Za-zА-Яа-яЁё]+';

/**
 * Формат одного ключа: как прочитать из него дату и как записать новую,
 * сохранив исходный вид (падеж месяца, ведущий ноль, обрамляющий текст).
 */
interface KeyFormat {
  /** Что даёт это значение: часть даты или дату целиком. */
  reads: 'day' | 'month' | 'year' | 'full';
  parse: (raw: string) => { day?: number; month?: number; year?: number } | null;
  write: (d: Dayjs) => string;
}

/** Хвостовые пробелы бланка (например, ISMR у template7) сохраняем как есть. */
const keepTail = (raw: string, write: (d: Dayjs) => string) => {
  const tail = raw.match(/\s+$/)?.[0] ?? '';
  return (d: Dayjs) => write(d) + tail;
};

/**
 * Ключи, где бэкенд пишет день с ведущим нулём (day2), — в остальных он использует
 * String.valueOf(day). Бэкенд сам смешивает оба стиля в одном документе, поэтому
 * следуем его соглашению по имени ключа, а явный ноль в значении важнее всего.
 */
const PADDED_DAY_KEYS = new Set(['PRTD', 'COMD', 'ISD']);

/** Ключи, которые заполняются вместе и потому обязаны выглядеть одинаково. */
const DAY_FAMILIES = [['DFD', 'DTD'], ['PRTD'], ['COMD'], ['ISD', 'ISDAY']];

/**
 * Где в документе день пишется с ведущим нулём. Если хоть один ключ семьи
 * сохранён как "01", нулю следуют все ключи этой семьи — иначе в одном бланке
 * оказались бы «03» и «3».
 */
function paddedDayKeys(values: Record<string, string>): Set<string> {
  const padded = new Set<string>();
  for (const family of DAY_FAMILIES) {
    const explicit = family.some((k) => /^0\d$/.test((values[k] ?? '').trim()));
    const byConvention = family.some((k) => PADDED_DAY_KEYS.has(k) && values[k] != null);
    if (explicit || byConvention) family.forEach((k) => padded.add(k));
  }
  return padded;
}

/** Распознаёт формат сохранённого значения. null — формат неизвестен, ключ не трогаем. */
export function detectFormat(raw: string, key = '', padDays?: Set<string>): KeyFormat | null {
  const s = (raw ?? '').trim();
  if (!s) return null;

  // "01" / "5" — день месяца.
  if (/^\d{1,2}$/.test(s)) {
    const padded = /^0\d$/.test(s) || (padDays ? padDays.has(key) : PADDED_DAY_KEYS.has(key));
    return {
      reads: 'day',
      parse: () => ({ day: Number(s) }),
      write: keepTail(raw, (d) => (padded ? day2(d) : String(d.date()))),
    };
  }

  // "2026" — год.
  if (/^\d{4}$/.test(s)) {
    return { reads: 'year', parse: () => ({ year: Number(s) }), write: keepTail(raw, (d) => String(d.year())) };
  }

  // "25.09.2026"
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) {
    return {
      reads: 'full',
      // без customParseFormat: разбираем строку сами
      parse: () => {
        const [dd, mm, yyyy] = s.split('.').map(Number);
        return mm >= 1 && mm <= 12 ? { day: dd, month: mm - 1, year: yyyy } : null;
      },
      write: keepTail(raw, (d) => d.format('DD.MM.YYYY')),
    };
  }

  // "от 06 апреля 2023г." — PRTDR
  const ruProtocol = s.match(new RegExp(`^от\\s+(\\d{1,2})\\s+(${MONTH_ALT})\\s+(\\d{4})\\s*г\\.$`, 'i'));
  if (ruProtocol) {
    return {
      reads: 'full',
      parse: () => ({ day: Number(ruProtocol[1]), month: monthIndex(ruProtocol[2]), year: Number(ruProtocol[3]) }),
      write: keepTail(raw, (d) => `от ${day2(d)} ${RU_GEN[d.month()]} ${d.year()}г.`),
    };
  }

  // "2023 year 06 - April" — PRTDE
  const enProtocol = s.match(new RegExp(`^(\\d{4})\\s+year\\s+(\\d{1,2})\\s*-\\s*(${MONTH_ALT})$`, 'i'));
  if (enProtocol) {
    return {
      reads: 'full',
      parse: () => ({ day: Number(enProtocol[2]), month: monthIndex(enProtocol[3]), year: Number(enProtocol[1]) }),
      write: keepTail(raw, (d) => `${d.year()} year ${day2(d)} - ${EN[d.month()]}`),
    };
  }

  // "«07» Апреля 2023 г." / "«07» April 2023 y." — ISYR / ISYE
  const quoted = s.match(new RegExp(`^«(\\d{1,2})»\\s+(${MONTH_ALT})\\s+(\\d{4})\\s*([гy])\\.$`, 'i'));
  if (quoted) {
    const suffix = quoted[4].toLowerCase();
    const english = suffix === 'y';
    return {
      reads: 'full',
      parse: () => ({ day: Number(quoted[1]), month: monthIndex(quoted[2]), year: Number(quoted[3]) }),
      write: keepTail(raw, (d) =>
        english
          ? `«${day2(d)}» ${EN[d.month()]} ${d.year()} y.`
          : `«${day2(d)}» ${capitalize(RU_GEN[d.month()])} ${d.year()} г.`
      ),
    };
  }

  // "21 сентябрь" / "21 sentabr" — день + месяц одной строкой (ISMR / ISMU)
  const dayMonth = s.match(new RegExp(`^(\\d{1,2})\\s+(${MONTH_ALT})$`));
  if (dayMonth && monthIndex(dayMonth[2]) >= 0) {
    const idx = monthIndex(dayMonth[2]);
    const list = RU_NOM[idx].toLowerCase() === dayMonth[2].toLowerCase() ? RU_NOM
      : RU_GEN[idx].toLowerCase() === dayMonth[2].toLowerCase() ? RU_GEN
      : UZ[idx].toLowerCase() === dayMonth[2].toLowerCase() ? UZ
      : EN;
    const gap = s.slice(dayMonth[1].length).match(/^\s+/)?.[0] ?? ' ';
    return {
      reads: 'full',
      parse: () => ({ day: Number(dayMonth[1]), month: idx }),
      write: keepTail(raw, (d) => `${d.date()}${gap}${list[d.month()]}`),
    };
  }

  // "сентября" / "сентябрь" / "sentabr" / "September" — только месяц.
  const only = monthIndex(s);
  if (only >= 0) {
    const list = RU_GEN[only].toLowerCase() === s.toLowerCase() ? RU_GEN
      : RU_NOM[only].toLowerCase() === s.toLowerCase() ? RU_NOM
      : UZ[only].toLowerCase() === s.toLowerCase() ? UZ
      : EN;
    return { reads: 'month', parse: () => ({ month: only }), write: keepTail(raw, (d) => list[d.month()]) };
  }

  return null;
}

export interface DateGroup {
  /** Подпись календаря. */
  label: string;
  /** Ключи группы, которые мы умеем перезаписывать. */
  keys: string[];
  /** Текущая дата группы; null — собрать не удалось. */
  value: Dayjs | null;
}

/** Ключи одной даты. Порядок важен: сначала те, где дата лежит целиком. */
const GROUP_DEFS: { label: string; keys: string[] }[] = [
  { label: 'Начало обучения', keys: ['DATE_FROM', 'DFD', 'DFMR', 'DFMU', 'DFY'] },
  { label: 'Окончание обучения', keys: ['DATE_TO', 'DTD', 'DTMR', 'DTMU', 'DTY'] },
  { label: 'Дата протокола', keys: ['PRT_DATE', 'PRTDR', 'PRTDE', 'PRTD', 'PRTM', 'PRTY'] },
  { label: 'Дата комиссии', keys: ['COMM_DATE', 'COMD', 'COMM', 'COMY'] },
  {
    label: 'Дата выдачи',
    keys: ['ISSUE_DATE', 'ISYR', 'ISYE', 'ISD', 'ISMR', 'ISMU', 'ISDAY', 'ISMON', 'ISY'],
  },
];

/** Год, если в самой группе его нет: берём из соседней (у template1/8 нет DFY). */
const YEAR_FALLBACK_KEYS = ['DTY', 'DFY', 'ISY', 'PRTY', 'COMY'];

/**
 * Разбирает сохранённые значения на группы-даты. Возвращает группы, у которых
 * есть хотя бы один распознанный ключ, и список ключей, оставшихся под обычный ввод.
 */
export function buildDateGroups(values: Record<string, string>): {
  groups: DateGroup[];
  handledKeys: Set<string>;
} {
  const groups: DateGroup[] = [];
  const handledKeys = new Set<string>();
  const padDays = paddedDayKeys(values);

  for (const def of GROUP_DEFS) {
    const keys = def.keys.filter((k) => values[k] != null && detectFormat(values[k], k, padDays));
    if (!keys.length) continue;

    let day: number | undefined;
    let month: number | undefined;
    let year: number | undefined;
    for (const key of keys) {
      const parsed = detectFormat(values[key], key, padDays)!.parse(values[key]);
      if (!parsed) continue;
      if (parsed.day != null && day == null) day = parsed.day;
      if (parsed.month != null && parsed.month >= 0 && month == null) month = parsed.month;
      if (parsed.year != null && year == null) year = parsed.year;
    }

    if (year == null) {
      for (const key of YEAR_FALLBACK_KEYS) {
        const raw = values[key];
        if (raw && /^\d{4}$/.test(raw.trim())) {
          year = Number(raw.trim());
          break;
        }
      }
    }

    const complete = day != null && month != null && year != null;
    const value = complete ? dayjs(new Date(year!, month!, day!)) : null;
    // Дата не собралась — отдаём ключи обычным полям, чтобы ничего не потерять.
    if (!value || !value.isValid()) continue;

    keys.forEach((k) => handledKeys.add(k));
    groups.push({ label: def.label, keys, value });
  }

  return { groups, handledKeys };
}

/** Новые значения для ключей группы после выбора даты в календаре. */
export function applyDate(
  values: Record<string, string>,
  keys: string[],
  date: Dayjs
): Record<string, string> {
  const next = { ...values };
  const padDays = paddedDayKeys(values);
  for (const key of keys) {
    const fmt = detectFormat(values[key], key, padDays);
    if (fmt) next[key] = fmt.write(date);
  }
  return next;
}
