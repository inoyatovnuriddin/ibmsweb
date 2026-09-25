import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Image, Modal, Result, Spin } from 'antd';
import {
  ExportOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import {
  CertificateVerification,
  verifyCertificate,
} from '../dashboards/certificatesApi';
import guvohnomaImg from '../../assets/guvohnoma.jpg';
import './styles.css';

// The training centre's own accreditation documents, shown on every verification page.
const LICENSE_PDF_URL = new URL('../../assets/lit.pdf', import.meta.url).href;

type Values = Record<string, string>;

/**
 * В бланках пустые места напечатаны прочерками ("______", "—"). В сохранённых
 * значениях они приходят как обычный текст, поэтому считаем их пустыми — иначе
 * на странице появляются строки из подчёркиваний.
 */
const isFiller = (s: string): boolean => !s || /^[\s_\-–—.·]+$/.test(s);

/**
 * Подписи (директор, председатель комиссии, инспектор) на странице проверки не
 * показываем — в документе они стоят от руки.
 */
const SIGNATURE_KEYS = new Set([
  'CHAIRMANRU',
  'CHAIRMANUZ',
  'CEORU',
  'CEOUZ',
  'DIRECTOR',
  'INSPECTOR',
]);

/** Эти значения уже выведены в шапке страницы, повторять их в таблице не нужно. */
const HEADER_KEYS = new Set([
  'FULLNAME_RU',
  'FULLNAME_UZ',
  'FULLNAME_EN',
  'REG_NO',
  'ORG_NAME',
  'CER_TYPE',
]);

/**
 * Подписи для значений, которые не попали ни в одно поле своего шаблона
 * (например, новый плейсхолдер на бэкенде). Ключа нет в списке — покажем сам ключ,
 * лишь бы данные не пропали со страницы.
 */
const KEY_LABELS: Record<string, string> = {
  PROFESSION_RU: 'Специальность',
  PROFESSION_UZ: 'Специальность',
  PROFESSION_EN: 'Специальность',
  COURSE_NAME: 'Курс',
  QUALIFICATION: 'Квалификация (разряд)',
  GRADE: 'Разряд',
  EQUIPMENT: 'Допуск к обслуживанию',
  ELEC_GROUP: 'Группа по электробезопасности',
  VOLTAGE: 'Напряжение',
  ROLE: 'Должность',
  STUDY_FORM: 'Форма обучения',
  STUDY_PERIOD: 'Период обучения',
  HOURS: 'Объём программы',
  HT: 'Теоретическое обучение',
  HP: 'Производственное обучение',
  MT: 'Оценка — теоретическое обучение',
  MP: 'Оценка — пробная работа',
  COMB: 'Квалификационная комиссия',
  ORG_CITY: 'Город (область, район)',
  PRT: 'Протокол №',
  DATE_FROM: 'Начало обучения',
  DATE_TO: 'Окончание обучения',
  ISSUE_DATE: 'Дата выдачи',
};

/**
 * Ключи, к которым обратились при сборке вида. По ним в конце находим значения,
 * которые ни одно поле не показало, — со страницы не должно пропасть ни одно поле.
 */
let readKeys: Set<string> | null = null;

/**
 * Первое непустое значение из перечисленных ключей. Помечаем прочитанными ВСЕ
 * ключи, а не только совпавший: запасные варианты (PROFESSION_UZ при наличии
 * PROFESSION_RU) — это то же самое поле, и дублировать их внизу не нужно.
 */
const V = (values: Values, ...keys: string[]): string => {
  let found = '';
  for (const key of keys) {
    readKeys?.add(key);
    if (found) continue;
    const raw = values[key];
    if (raw == null) continue;
    const trimmed = String(raw).trim();
    if (trimmed && !isFiller(trimmed)) found = trimmed;
  }
  return found;
};

/** Год с сокращением: "2026 г.". Пустая строка, если года нет. */
const yearOf = (values: Values, key: string): string => {
  const y = V(values, key);
  return y ? `${y} г.` : '';
};

/** Join the "day / month-name / year" fragments the templates store separately into one label. */
const composeDate = (day?: string, month?: string, year?: string): string => {
  const parts = [day, month, year]
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter((p) => p && !isFiller(p));
  return parts.length >= 2 ? parts.join(' ') : '';
};

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "12.05.2026" из ISO "2026-05-12T10:00:00" */
const formatIso = (iso?: string): string => {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
};

interface DetailRow {
  label: string;
  value: string;
}

interface TemplateView {
  /** Название типа документа на странице (не зависит от того, что ввёл админ). */
  docLabel: string;
  /** Подзаголовок под названием документа. */
  docSub: string;
  rows: DetailRow[];
}

class RowBuilder {
  rows: DetailRow[] = [];
  add(label: string, value: string): this {
    const v = value ? value.trim() : '';
    if (v && !isFiller(v)) this.rows.push({ label, value: v });
    return this;
  }
}

const asGradeRu = (raw: string) => (/^\d+$/.test(raw) ? `${raw}-разряд` : raw);

const asHours = (raw: string) => (raw ? `${raw} ч.` : '');

const period = (from: string, to: string): string =>
  from && to ? `${from} — ${to}` : from || to;

/**
 * template7 stores the study period as a full sentence
 * ("с «09» октября 2026 г. по «12» декабря 2026 г. обучался(-лась) на курсах").
 * Pull out just the "с … по … г." date range; fall back to the whole text if it doesn't match.
 */
const cleanStudyPeriod = (raw: string): string => {
  if (!raw) return '';
  const match = raw.match(/с\s+.*?\d{4}\s*г\.\s*по\s+.*?\d{4}\s*г\./i);
  return match ? match[0].trim() : raw.trim();
};

/**
 * Каждый тип документа показывает РОВНО те поля, которые есть в его .docx-шаблоне
 * (src/main/resources/templates на бэкенде). Никаких «лишних» полей: например,
 * у свидетельства (template6) нет разряда — там «класс / категория», а у
 * сертификата (template2) нет ни разряда, ни специальности.
 */
function buildTemplateView(data: CertificateVerification): TemplateView | null {
  const v = data.values || {};

  switch (data.templateCode) {
    // ГУВОҲНОМА / УДОСТОВЕРЕНИЕ о переподготовке и повышении квалификации.
    // template8 — тот же документ на другом бланке (стропальщик) с теми же плейсхолдерами:
    // учебный центр приходит в CER_TYPE, года начала обучения (DFY) в бланке нет.
    case 'template1':
    case 'template8': {
      const from = composeDate(V(v, 'DFD'), V(v, 'DFMR', 'DFMU'), V(v, 'DFY'));
      const to = composeDate(V(v, 'DTD'), V(v, 'DTMR', 'DTMU'), V(v, 'DTY'));
      const issue = composeDate('', V(v, 'ISMR', 'ISMU'), yearOf(v, 'ISY'));
      const b = new RowBuilder()
        .add('Специальность', V(v, 'PROFESSION_RU', 'PROFESSION_UZ'))
        .add('Разряд', asGradeRu(V(v, 'GRADE')))
        .add('Учебный центр', V(v, 'ORG_NAME', 'CER_TYPE'))
        .add('Период обучения', period(from, to))
        .add('Протокол комиссии №', V(v, 'PRT'))
        .add('Дата выдачи', issue);
      return {
        // Бланк template8 озаглавлен по-узбекски — GUVOHNOMA, template1 — Удостоверение.
        docLabel: data.templateCode === 'template8' ? 'Guvohnoma' : 'Удостоверение',
        docSub: 'о переподготовке и повышении квалификации',
        rows: b.rows,
      };
    }

    // СЕРТИФИКАТ о повышении квалификации (краткий курс)
    case 'template2': {
      const b = new RowBuilder()
        .add('Курс', V(v, 'COURSE_NAME'))
        .add('Объём программы', asHours(V(v, 'HOURS')))
        .add('Период обучения', period(V(v, 'DATE_FROM'), V(v, 'DATE_TO')))
        .add('Учебный центр', V(v, 'ORG_NAME', 'CER_TYPE') || 'НОУ «Buxoro O‘quv»')
        .add('Дата выдачи', V(v, 'ISSUE_DATE'));
      return {
        docLabel: 'Сертификат',
        docSub: 'о повышении квалификации',
        rows: b.rows,
      };
    }

    // ДИПЛОМ (RU + EN) о переподготовке и повышении квалификации
    case 'template3': {
      const prt = V(v, 'PRT');
      const prtDate = V(v, 'PRTDR', 'PRTDE'); // "от 06 апреля 2023г."
      const b = new RowBuilder()
        .add('Квалификация', V(v, 'PROFESSION_RU', 'PROFESSION_EN'))
        .add('Разряд', asGradeRu(V(v, 'GRADE')))
        .add('Учебный центр', V(v, 'ORG_NAME'))
        .add('Период обучения', period(V(v, 'DATE_FROM'), V(v, 'DATE_TO')))
        .add('Протокол комиссии', prt && `№ ${prt}${prtDate ? ` ${prtDate}` : ''}`)
        .add('Дата выдачи', V(v, 'ISYR', 'ISYE'));
      return {
        docLabel: 'Диплом',
        docSub: 'о переподготовке и повышении квалификации',
        rows: b.rows,
      };
    }

    // УДОСТОВЕРЕНИЕ о допуске к обслуживанию оборудования — даты выдачи
    // в этом бланке нет, основание — протокол квалификационной комиссии.
    case 'template4': {
      const from = composeDate(V(v, 'DFD'), V(v, 'DFMR'), yearOf(v, 'DFY'));
      const to = composeDate(V(v, 'DTD'), V(v, 'DTMR'), yearOf(v, 'DTY'));
      const prt = V(v, 'PRT');
      const prtDate = composeDate(V(v, 'PRTD'), V(v, 'PRTM'), yearOf(v, 'PRTY'));
      const b = new RowBuilder()
        .add('Курс', V(v, 'COURSE_NAME'))
        .add('Допуск к обслуживанию', V(v, 'EQUIPMENT'))
        .add('Учебный центр', V(v, 'ORG_NAME'))
        .add('Город (область, район)', V(v, 'ORG_CITY'))
        .add('Период обучения', period(from, to))
        .add(
          'Протокол квалификационной комиссии',
          prt && `№ ${prt}${prtDate ? ` от ${prtDate}` : ''}`
        );
      return {
        docLabel: 'Удостоверение',
        docSub: 'о допуске к обслуживанию оборудования',
        rows: b.rows,
      };
    }

    // УДОСТОВЕРЕНИЕ о проверке знаний ПТЭ и ПТБ (электробезопасность)
    case 'template5': {
      const group = V(v, 'ELEC_GROUP');
      const prt = V(v, 'PRT');
      const prtDate = V(v, 'PRTD');
      const b = new RowBuilder()
        .add('Учебный центр', V(v, 'ORG_NAME'))
        .add('Период обучения', period(V(v, 'DATE_FROM'), V(v, 'DATE_TO')))
        .add(
          'Группа по электробезопасности',
          group && (/групп/i.test(group) ? group : `${group} группа`)
        )
        .add('Допуск', 'Электроустановки напряжением до 1000 В')
        .add('Категория персонала', 'Оперативно-ремонтный персонал')
        .add('Протокол квалификационной комиссии', prt && `№ ${prt}${prtDate ? ` от ${prtDate}` : ''}`)
        .add('Дата выдачи', V(v, 'ISD'));
      return {
        docLabel: 'Удостоверение',
        docSub: 'о проверке знаний ПТЭ и ПТБ электроустановок',
        rows: b.rows,
      };
    }

    // СВИДЕТЕЛЬСТВО о присвоении профессии — разряда здесь нет,
    // GRADE в этом бланке означает «класс / категория».
    case 'template6': {
      const from = composeDate(V(v, 'DFD'), V(v, 'DFMR'), yearOf(v, 'DFY'));
      const to = composeDate(V(v, 'DTD'), V(v, 'DTMR'), yearOf(v, 'DTY'));
      const commission = composeDate(V(v, 'COMD'), V(v, 'COMM'), yearOf(v, 'COMY'));
      const prt = V(v, 'PRT');
      const issue = composeDate(V(v, 'ISDAY'), V(v, 'ISMON'), yearOf(v, 'ISY'));
      const b = new RowBuilder()
        .add('Профессия', V(v, 'PROFESSION_RU'))
        .add('Класс / категория', V(v, 'GRADE'))
        .add('Форма обучения', capitalize(V(v, 'STUDY_FORM')))
        .add('Предприятие (учебный центр)', V(v, 'ORG_NAME'))
        .add('Квалификационная комиссия', V(v, 'COMB'))
        .add('Период обучения', period(from, to))
        .add('Теоретическое обучение', asHours(V(v, 'HT')))
        .add('Производственное обучение', asHours(V(v, 'HP')))
        .add('Оценка — теоретическое обучение', capitalize(V(v, 'MT')))
        .add('Оценка — пробная работа', capitalize(V(v, 'MP')))
        .add(
          'Решение квалификационной комиссии',
          prt && `Протокол № ${prt}${commission ? ` от ${commission}` : ''}`
        )
        .add('Дата выдачи', issue);
      return {
        docLabel: 'Свидетельство',
        docSub: 'о присвоении профессии',
        rows: b.rows,
      };
    }

    // УДОСТОВЕРЕНИЕ о присвоении тарифно-квалификационного разряда —
    // как свидетельство, но с разрядом и подписью инспектора Госкомитета
    // промышленной безопасности.
    case 'template9': {
      const from = composeDate(V(v, 'DFD'), V(v, 'DFMR'), yearOf(v, 'DFY'));
      const to = composeDate(V(v, 'DTD'), V(v, 'DTMR'), yearOf(v, 'DTY'));
      const commission = composeDate(V(v, 'COMD'), V(v, 'COMM'), yearOf(v, 'COMY'));
      const prt = V(v, 'PRT');
      const issue = composeDate(V(v, 'ISDAY'), V(v, 'ISMON'), yearOf(v, 'ISY'));
      const orgName = V(v, 'ORG_NAME');
      const b = new RowBuilder()
        .add('Профессия', V(v, 'PROFESSION_RU'))
        .add('Разряд (класс, категория)', asGradeRu(V(v, 'GRADE')))
        .add('Форма обучения', capitalize(V(v, 'STUDY_FORM')))
        .add('Предприятие (учебный центр)', orgName && (orgName.startsWith('НОУ') ? orgName : `НОУ «${orgName}»`))
        .add('Период обучения', period(from, to))
        .add('Теоретическое обучение', asHours(V(v, 'HT')))
        .add('Производственное обучение', asHours(V(v, 'HP')))
        .add('Оценка — теоретическое обучение', capitalize(V(v, 'MT')))
        .add('Оценка — пробная работа', capitalize(V(v, 'MP')))
        .add(
          'Решение экзаменационной комиссии',
          prt && `Протокол № ${prt}${commission ? ` от ${commission}` : ''}`
        )
        .add('Дата выдачи', issue);
      return {
        docLabel: 'Удостоверение',
        docSub: 'о присвоении тарифно-квалификационного разряда',
        rows: b.rows,
      };
    }

    // УДОСТОВЕРЕНИЕ о прохождении обучения по профессии —
    // с присвоенной квалификацией (разрядом) и допуском к обслуживанию оборудования.
    case 'template7': {
      const issue = composeDate(V(v, 'ISD'), V(v, 'ISMR', 'ISM'), yearOf(v, 'ISY'));
      const b = new RowBuilder()
        .add('Профессия', V(v, 'PROFESSION_RU'))
        .add('Квалификация (разряд)', asGradeRu(V(v, 'QUALIFICATION')))
        .add('Допуск к обслуживанию', V(v, 'EQUIPMENT'))
        .add('Период обучения', cleanStudyPeriod(V(v, 'STUDY_PERIOD')))
        .add('Учебный центр', V(v, 'ORG_NAME'))
        .add('Дата выдачи', issue);
      return {
        docLabel: 'Удостоверение',
        docSub: 'о прохождении обучения',
        rows: b.rows,
      };
    }

    // УДОСТОВЕРЕНИЕ членов ДГСД — допуск к работам в газовзрывоопасной среде.
    case 'template10': {
      const from = composeDate(V(v, 'DFD'), V(v, 'DFMR'), yearOf(v, 'DFY'));
      const to = composeDate(V(v, 'DTD'), V(v, 'DTMR'), yearOf(v, 'DTY'));
      const prt = V(v, 'PRT');
      const prtDate = composeDate(V(v, 'PRTD'), V(v, 'PRTM'), yearOf(v, 'PRTY'));
      const issue = composeDate(V(v, 'ISD'), V(v, 'ISMR'), yearOf(v, 'ISY'));
      const orgName = V(v, 'ORG_NAME', 'CER_TYPE');
      const b = new RowBuilder()
        .add('Курс', V(v, 'COURSE_NAME'))
        .add('Объём программы', asHours(V(v, 'HOURS')))
        .add('Период обучения', period(from, to))
        .add(
          'Предоставленное право',
          'Выполнение работ в газовзрывоопасной среде и участие в ликвидации аварий ' +
            'с применением изолирующих дыхательных аппаратов'
        )
        .add('Учебный центр', orgName && (orgName.startsWith('НОУ') ? orgName : `НОУ «${orgName}»`))
        .add('Протокол комиссии', prt && `№ ${prt}${prtDate ? ` от ${prtDate}` : ''}`)
        .add('Дата выдачи', issue);
      return {
        docLabel: 'Удостоверение',
        docSub: 'о допуске к работам в газовзрывоопасной среде',
        rows: b.rows,
      };
    }

    default:
      return null;
  }
}

/**
 * Запасной вариант для шаблонов, которых нет в списке выше (новые .docx,
 * добавленные на бэкенд без изменения фронта): показываем базовые поля,
 * а всё остальное подхватит {@link leftoverRows}.
 */
function buildGenericView(data: CertificateVerification): TemplateView {
  const v = data.values || {};
  // Даты в разных бланках хранятся либо целиком (DATE_FROM), либо по частям
  // (день / месяц / год) — собираем оба варианта, чтобы не потерять период обучения.
  const from =
    V(v, 'DATE_FROM') || composeDate(V(v, 'DFD'), V(v, 'DFMR', 'DFMU'), yearOf(v, 'DFY'));
  const to = V(v, 'DATE_TO') || composeDate(V(v, 'DTD'), V(v, 'DTMR', 'DTMU'), yearOf(v, 'DTY'));
  const issue =
    V(v, 'ISSUE_DATE') ||
    composeDate(V(v, 'ISD', 'ISDAY'), V(v, 'ISMR', 'ISMU', 'ISMON'), yearOf(v, 'ISY')) ||
    formatIso(data.issuedAt);
  const b = new RowBuilder()
    .add('Специальность', V(v, 'PROFESSION_RU', 'PROFESSION_UZ', 'PROFESSION_EN'))
    .add('Разряд', asGradeRu(V(v, 'GRADE')))
    .add('Курс', V(v, 'COURSE_NAME'))
    .add('Допуск к обслуживанию', V(v, 'EQUIPMENT'))
    .add('Учебный центр', V(v, 'ORG_NAME', 'CER_TYPE'))
    .add('Период обучения', period(from, to))
    .add('Протокол №', V(v, 'PRT'))
    .add('Дата выдачи', issue);
  return {
    docLabel: data.templateName || 'Документ',
    docSub: 'о прохождении обучения',
    rows: b.rows,
  };
}

/**
 * Значения, которые не показало ни одно поле шаблона: новый плейсхолдер на
 * бэкенде или поле, которого нет в описании выше. Выводим их в конце, чтобы со
 * страницы не пропало ни одно сохранённое поле. Подписи и то, что уже есть в
 * шапке, пропускаем.
 */
function leftoverRows(values: Values, read: Set<string>): DetailRow[] {
  const b = new RowBuilder();
  for (const key of Object.keys(values)) {
    if (read.has(key) || SIGNATURE_KEYS.has(key) || HEADER_KEYS.has(key)) continue;
    b.add(KEY_LABELS[key] || key, V(values, key));
  }
  return b.rows;
}

/**
 * Объём программы в часах печатается далеко не на каждом бланке, но на странице
 * проверки он нужен всегда. Ставим его рядом с периодом обучения, а не в конец списка.
 */
function withHours(rows: DetailRow[], values: Values): DetailRow[] {
  const hours = V(values, 'HOURS');
  if (!hours) return rows;
  const row: DetailRow = { label: 'Объём программы', value: asHours(hours) };
  const at = rows.findIndex((r) => r.label === 'Период обучения');
  if (at < 0) return [...rows, row];
  return [...rows.slice(0, at), row, ...rows.slice(at)];
}

/** Вид документа + значения, которые шаблон не показал. */
function buildView(data: CertificateVerification): TemplateView {
  const values = data.values || {};
  readKeys = new Set<string>();
  try {
    const view = buildTemplateView(data) || buildGenericView(data);
    // Шаблоны, где часы есть в бланке, уже вывели их сами.
    const rows = readKeys.has('HOURS') ? view.rows : withHours(view.rows, values);
    return { ...view, rows: [...rows, ...leftoverRows(values, readKeys)] };
  } finally {
    readKeys = null;
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '№';
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
}

export function CertificateVerifyPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [certPreview, setCertPreview] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = id ? await verifyCertificate(id) : null;
        if (active) setData(res);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const view = useMemo(() => (data ? buildView(data) : null), [data]);

  if (loading) {
    return (
      <div className="cert-state">
        <Spin tip="Yuklanmoqda..." size="large" />
      </div>
    );
  }

  if (!data || !view) {
    return (
      <div className="cert-state">
        <Result
          status="404"
          title="Sertifikat topilmadi"
          subTitle="Bu QR-kod boʻyicha sertifikat mavjud emas yoki oʻchirilgan."
        />
      </div>
    );
  }

  const v = data.values || {};
  const fullName = V(v, 'FULLNAME_RU', 'FULLNAME_UZ', 'FULLNAME_EN');
  const regNo = V(v, 'REG_NO') || data.serialNumber || '';
  const orgName = V(v, 'ORG_NAME', 'CER_TYPE');

  const verifyUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://ibms.uz/cert/${data.id}`;

  return (
    <div className="cert-page">
      <div className="cert-shell">
        <div className="cert-card">
          {/* Шапка документа */}
          <header className="cert-head">
            <div className="cert-head-org">
              <SafetyCertificateOutlined className="cert-head-org-icon" />
              {orgName || 'Негосударственное образовательное учреждение'}
            </div>
            <h1 className="cert-doc-title">{view.docLabel}</h1>
            <div className="cert-doc-sub">{view.docSub}</div>
            {regNo && <div className="cert-doc-no">№ {regNo}</div>}
          </header>

          {/* Владелец */}
          <section className="cert-holder">
            <div className={`cert-avatar${data.photoUrl ? ' cert-avatar--photo' : ''}`}>
              {data.photoUrl ? (
                <img src={data.photoUrl} alt={fullName || 'Фото'} />
              ) : (
                initials(fullName)
              )}
            </div>
            <div className="cert-holder-body">
              <div className="cert-holder-label">Выдано</div>
              <div className="cert-holder-name">{fullName || '—'}</div>
            </div>
          </section>

          {/* Сведения о документе */}
          {view.rows.length > 0 && (
            <section className="cert-details">
              <h2 className="cert-section-title">Сведения о документе</h2>
              <dl className="cert-dl">
                {view.rows.map((row) => (
                  <div className="cert-dl-row" key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Проверка / QR */}
          <footer className="cert-foot">
            <div className="cert-qr">
              <QRCodeSVG value={verifyUrl} size={104} level="M" />
            </div>
            <div className="cert-foot-body">
              <div className="cert-foot-title">Проверка подлинности</div>
              <div className="cert-foot-hint">
                Отсканируйте QR-код камерой телефона или откройте ссылку, чтобы
                убедиться в подлинности документа.
              </div>
              <div className="cert-foot-url">{verifyUrl}</div>
            </div>
          </footer>

          {/* Официальные документы учебного центра */}
          <div className="cert-docs">
            <button
              type="button"
              className="cert-doc-btn cert-doc-btn--primary"
              onClick={() => setCertPreview(true)}
            >
              <SafetyCertificateOutlined />
              Свидетельство
              <ExportOutlined className="cert-doc-btn-ext" />
            </button>
            <button
              type="button"
              className="cert-doc-btn"
              onClick={() => setLicenseOpen(true)}
            >
              <FileProtectOutlined />
              Лицензия
              <ExportOutlined className="cert-doc-btn-ext" />
            </button>
          </div>
        </div>

        <div className="cert-note">
          Идентификатор документа: <span>{data.id}</span>
        </div>
      </div>

      {/* Свидетельство — зумируемый просмотр изображения */}
      <Image
        src={guvohnomaImg}
        style={{ display: 'none' }}
        preview={{
          visible: certPreview,
          src: guvohnomaImg,
          onVisibleChange: (vis) => setCertPreview(vis),
        }}
      />

      {/* Лицензия — просмотр PDF */}
      <Modal
        open={licenseOpen}
        onCancel={() => setLicenseOpen(false)}
        centered
        width="min(940px, 96vw)"
        title="Лицензия"
        footer={
          <Button
            type="primary"
            icon={<ExportOutlined />}
            href={LICENSE_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Открыть в новой вкладке
          </Button>
        }
        styles={{ body: { padding: 0, height: '78vh' } }}
      >
        <iframe
          src={LICENSE_PDF_URL}
          title="Лицензия"
          style={{ width: '100%', height: '78vh', border: 0, display: 'block' }}
        />
      </Modal>
    </div>
  );
}
