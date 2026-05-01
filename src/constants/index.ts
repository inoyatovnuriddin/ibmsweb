import {
  PATH_ABOUT,
  PATH_ACCOUNT,
  PATH_AUTH,
  PATH_BLOG,
  PATH_CALENDAR,
  PATH_CAREERS,
  PATH_CHANGELOG,
  PATH_CONTACTS,
  PATH_COURSE,
  PATH_DASHBOARD,
  PATH_DOCS,
  PATH_ERROR,
  PATH_FILE,
  PATH_GITHUB,
  PATH_INBOX,
  PATH_INVOICE,
  PATH_LANDING,
  PATH_LAYOUT,
  PATH_PROJECTS,
  PATH_SOCIAL,
  PATH_SOCIALS,
  PATH_START,
  PATH_SUBSCRIPTION,
  PATH_USER_MGMT,
  PATH_USER_PROFILE,
} from './routes.ts';

const DASHBOARD_ITEMS = [
  { title: 'Фойдаланувчилар', path: PATH_DASHBOARD.users },
  { title: 'QR-код', path: PATH_DASHBOARD.qrCode },
  { title: 'Курслар', path: PATH_DASHBOARD.courses },
  { title: 'Мавзулар', path: PATH_DASHBOARD.topics },
  { title: 'Видеолар', path: PATH_DASHBOARD.topics },
];

const USER_PROFILE_ITEMS = [
  {
    label: 'Ma’lumotlar',
    title: 'details',
    path: PATH_USER_PROFILE.details,
    disabled: false,
  },
  {
    label: 'Xavfsizlik',
    title: 'security',
    path: PATH_USER_PROFILE.security,
    disabled: false,
  },
  {
    label: 'Mening o‘qishlarim',
    title: 'my-learning',
    path: PATH_USER_PROFILE.myLearning,
    disabled: false,
  },
  {
    label: 'Afzalliklar',
    title: 'preferences',
    path: PATH_USER_PROFILE.preferences,
    disabled: true,
  },
  {
    label: 'Shaxsiy ma’lumot',
    title: 'information',
    path: PATH_USER_PROFILE.personalInformation,
    disabled: true,
  },
  {
    label: 'Faoliyat',
    title: 'activity',
    path: PATH_USER_PROFILE.activity,
    disabled: true,
  },
  {
    label: 'Harakatlar',
    title: 'actions',
    path: PATH_USER_PROFILE.action,
    disabled: true,
  },
  {
    label: 'Yordam',
    title: 'help',
    path: PATH_USER_PROFILE.help,
    disabled: true,
  },
  {
    label: 'Fikr-mulohaza',
    title: 'feedback',
    path: PATH_USER_PROFILE.feedback,
    disabled: true,
  },
];

const AUTHENTICATION_ITEMS = [
  { title: 'sign in', path: PATH_AUTH.signin },
  { title: 'sign up', path: PATH_AUTH.signup },
  { title: 'welcome', path: PATH_AUTH.welcome },
  { title: 'verify email', path: PATH_AUTH.verifyEmail },
  { title: 'password reset', path: PATH_AUTH.passwordReset },
  { title: 'account deleted', path: PATH_AUTH.accountDelete },
];

const ERROR_ITEMS = [
  { title: '400', path: PATH_ERROR.error400 },
  { title: '403', path: PATH_ERROR.error403 },
  { title: '404', path: PATH_ERROR.error404 },
  { title: '500', path: PATH_ERROR.error500 },
  { title: '503', path: PATH_ERROR.error503 },
];

const API_URL = '/api/v1';

export {
  PATH_CALENDAR,
  PATH_USER_MGMT,
  PATH_INBOX,
  PATH_PROJECTS,
  PATH_LAYOUT,
  PATH_CONTACTS,
  PATH_DASHBOARD,
  PATH_COURSE,
  PATH_CHANGELOG,
  PATH_CAREERS,
  PATH_ACCOUNT,
  PATH_GITHUB,
  PATH_AUTH,
  PATH_INVOICE,
  PATH_BLOG,
  PATH_ERROR,
  PATH_DOCS,
  PATH_SUBSCRIPTION,
  PATH_USER_PROFILE,
  PATH_FILE,
  PATH_SOCIAL,
  PATH_START,
  PATH_LANDING,
  DASHBOARD_ITEMS,
  USER_PROFILE_ITEMS,
  PATH_SOCIALS,
  AUTHENTICATION_ITEMS,
  ERROR_ITEMS,
  PATH_ABOUT,
  API_URL,
};
