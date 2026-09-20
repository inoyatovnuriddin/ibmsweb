import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Image, Modal, Result, Spin } from 'antd';
import {
  CheckCircleFilled,
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

const V = (values: Values, ...keys: string[]): string => {
  for (const key of keys) {
    const raw = values[key];
    if (raw != null && String(raw).trim()) return String(raw).trim();
  }
  return '';
};

/** Join the "day / month-name / year" fragments the templates store separately into one label. */
const composeDate = (day?: string, month?: string, year?: string): string => {
  const parts = [day, month, year]
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter(Boolean);
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

interface Signatory {
  label: string;
  value: string;
}

interface TemplateView {
  /** Название типа документа на странице (не зависит от того, что ввёл админ). */
  docLabel: string;
  /** Подзаголовок под названием документа. */
  docSub: string;
  rows: DetailRow[];
  signatories: Signatory[];
}

class RowBuilder {
  rows: DetailRow[] = [];
  add(label: string, value: string): this {
    if (value && value.trim()) this.rows.push({ label, value: value.trim() });
    return this;
  }
}

const sign = (label: string, value: string): Signatory[] =>
  value && value.trim() ? [{ label, value: value.trim() }] : [];

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
    // ГУВОҲНОМА / УДОСТОВЕРЕНИЕ о переподготовке и повышении квалификации
    case 'template1': {
      const from = composeDate(v.DFD, V(v, 'DFMR', 'DFMU'), v.DFY);
      const to = composeDate(v.DTD, V(v, 'DTMR', 'DTMU'), v.DTY);
      const issue = composeDate(undefined, V(v, 'ISMR', 'ISMU'), v.ISY && `${v.ISY} г.`);
      const b = new RowBuilder()
        .add('Специальность', V(v, 'PROFESSION_RU', 'PROFESSION_UZ'))
        .add('Разряд', asGradeRu(V(v, 'GRADE')))
        .add('Учебный центр', V(v, 'ORG_NAME', 'CER_TYPE'))
        .add('Период обучения', period(from, to))
        .add('Протокол комиссии №', V(v, 'PRT'))
        .add('Дата выдачи', issue);
      return {
        docLabel: 'Удостоверение',
        docSub: 'о переподготовке и повышении квалификации',
        rows: b.rows,
        signatories: [
          ...sign('Председатель комиссии', V(v, 'CHAIRMANRU', 'CHAIRMANUZ')),
          ...sign('Руководитель учебного заведения', V(v, 'CEORU', 'CEOUZ')),
        ],
      };
    }

    // СЕРТИФИКАТ о повышении квалификации (краткий курс)
    case 'template2': {
      const b = new RowBuilder()
        .add('Курс', V(v, 'COURSE_NAME'))
        .add('Объём программы', asHours(V(v, 'HOURS')))
        .add('Период обучения', period(V(v, 'DATE_FROM'), V(v, 'DATE_TO')))
        .add('Учебный центр', 'НОУ «Buxoro O‘quv»')
        .add('Дата выдачи', V(v, 'ISSUE_DATE'));
      return {
        docLabel: 'Сертификат',
        docSub: 'о повышении квалификации',
        rows: b.rows,
        signatories: sign('Исполнительный директор', V(v, 'DIRECTOR')),
      };
    }

    // ДИПЛОМ (RU + EN) о переподготовке и повышении квалификации
    case 'template3': {
      const prt = V(v, 'PRT');
      const prtDate = V(v, 'PRTDR'); // "от 06 апреля 2023г."
      const b = new RowBuilder()
        .add('Квалификация', V(v, 'PROFESSION_RU', 'PROFESSION_EN'))
        .add('Разряд', asGradeRu(V(v, 'GRADE')))
        .add('Учебный центр', V(v, 'ORG_NAME'))
        .add('Период обучения', period(V(v, 'DATE_FROM'), V(v, 'DATE_TO')))
        .add('Протокол комиссии', prt && `№ ${prt}${prtDate ? ` ${prtDate}` : ''}`)
        .add('Дата выдачи', V(v, 'ISYR'));
      return {
        docLabel: 'Диплом',
        docSub: 'о переподготовке и повышении квалификации',
        rows: b.rows,
        // Подписи в этом шаблоне не заполняются (мастер/директор подписывают от руки).
        signatories: [],
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
        signatories: [
          ...sign('Председатель квалификационной комиссии', V(v, 'CHAIRMANRU')),
          ...sign('Директор', V(v, 'DIRECTOR')),
        ],
      };
    }

    // СВИДЕТЕЛЬСТВО о присвоении профессии — разряда здесь нет,
    // GRADE в этом бланке означает «класс / категория».
    case 'template6': {
      const from = composeDate(v.DFD, v.DFMR, v.DFY && `${v.DFY} г.`);
      const to = composeDate(v.DTD, v.DTMR, v.DTY && `${v.DTY} г.`);
      const commission = composeDate(v.COMD, v.COMM, v.COMY && `${v.COMY} г.`);
      const prt = V(v, 'PRT');
      const issue = composeDate(v.ISDAY, v.ISMON, v.ISY && `${v.ISY} г.`);
      const b = new RowBuilder()
        .add('Профессия', V(v, 'PROFESSION_RU'))
        .add('Класс / категория', V(v, 'GRADE'))
        .add('Форма обучения', capitalize(V(v, 'STUDY_FORM')))
        .add('Предприятие (учебный центр)', V(v, 'ORG_NAME'))
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
        signatories: [
          ...sign('Председатель квалификационной комиссии', V(v, 'CHAIRMANRU')),
          ...sign('Руководитель организации', V(v, 'CEORU')),
        ],
      };
    }

    // УДОСТОВЕРЕНИЕ о присвоении тарифно-квалификационного разряда —
    // как свидетельство, но с разрядом и подписью инспектора Госкомитета
    // промышленной безопасности.
    case 'template9': {
      const from = composeDate(v.DFD, v.DFMR, v.DFY && `${v.DFY} г.`);
      const to = composeDate(v.DTD, v.DTMR, v.DTY && `${v.DTY} г.`);
      const commission = composeDate(v.COMD, v.COMM, v.COMY && `${v.COMY} г.`);
      const prt = V(v, 'PRT');
      const issue = composeDate(v.ISDAY, v.ISMON, v.ISY && `${v.ISY} г.`);
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
        signatories: [
          ...sign('Председатель квалификационной комиссии', V(v, 'CHAIRMANRU')),
          ...sign('Инспектор Госкомитета промышленной безопасности', V(v, 'INSPECTOR')),
          ...sign('Руководитель организации', V(v, 'CEORU')),
        ],
      };
    }

    // УДОСТОВЕРЕНИЕ о прохождении обучения по профессии —
    // с присвоенной квалификацией (разрядом) и допуском к обслуживанию оборудования.
    case 'template7': {
      const issue = composeDate(v.ISD, V(v, 'ISMR', 'ISM'), v.ISY && `${v.ISY} г.`);
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
        // Подписи в этом бланке ставятся от руки (личная подпись / председатель комиссии).
        signatories: [],
      };
    }

    // УДОСТОВЕРЕНИЕ членов ДГСД — допуск к работам в газовзрывоопасной среде.
    case 'template10': {
      const from = composeDate(v.DFD, v.DFMR, v.DFY && `${v.DFY} г.`);
      const to = composeDate(v.DTD, v.DTMR, v.DTY && `${v.DTY} г.`);
      const prt = V(v, 'PRT');
      const prtDate = composeDate(v.PRTD, v.PRTM, v.PRTY && `${v.PRTY} г.`);
      const issue = composeDate(v.ISD, v.ISMR, v.ISY && `${v.ISY} г.`);
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
        signatories: [], // председатель комиссии и директор подписывают от руки
      };
    }

    default:
      return null;
  }
}

/**
 * Запасной вариант для шаблонов, которых нет в списке выше (новые .docx,
 * добавленные на бэкенд без изменения фронта): показываем только базовые
 * поля, которые точно есть в сохранённых значениях.
 */
function buildGenericView(data: CertificateVerification): TemplateView {
  const v = data.values || {};
  const b = new RowBuilder()
    .add('Специальность', V(v, 'PROFESSION_RU', 'PROFESSION_UZ', 'PROFESSION_EN'))
    .add('Курс', V(v, 'COURSE_NAME'))
    .add('Учебный центр', V(v, 'ORG_NAME', 'CER_TYPE'))
    .add('Период обучения', period(V(v, 'DATE_FROM'), V(v, 'DATE_TO')))
    .add('Протокол №', V(v, 'PRT'))
    .add('Дата выдачи', V(v, 'ISSUE_DATE') || formatIso(data.issuedAt));
  return {
    docLabel: data.templateName || 'Документ',
    docSub: 'о прохождении обучения',
    rows: b.rows,
    signatories: [
      ...sign('Председатель комиссии', V(v, 'CHAIRMANRU', 'CHAIRMANUZ')),
      ...sign('Директор', V(v, 'DIRECTOR')),
      ...sign('Руководитель', V(v, 'CEORU', 'CEOUZ')),
    ],
  };
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

  const view = useMemo(
    () => (data ? buildTemplateView(data) || buildGenericView(data) : null),
    [data]
  );

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
  const issuedAtStr = formatIso(data.issuedAt);

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

          {/* Статус проверки */}
          <div className="cert-status">
            <CheckCircleFilled className="cert-status-icon" />
            <div className="cert-status-text">
              <div className="cert-status-title">Подлинность подтверждена</div>
              <div className="cert-status-sub">
                Документ найден в реестре выданных документов
                {issuedAtStr ? ` · зарегистрирован ${issuedAtStr}` : ''}
              </div>
            </div>
          </div>

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

          {/* Подписи */}
          {view.signatories.length > 0 && (
            <section className="cert-signs">
              {view.signatories.map((s) => (
                <div className="cert-sign" key={s.label}>
                  <div className="cert-sign-value">{s.value}</div>
                  <div className="cert-sign-label">{s.label}</div>
                </div>
              ))}
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
