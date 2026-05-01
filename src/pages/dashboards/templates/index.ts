import CertificateBasicTemplateForm from './CertificateBasicTemplate';
import CertificateBasicTemplate1Form from './CertificateBasicTemplate1';
import CertificateBasicTemplate2Form from './CertificateBasicTemplate2';
import CertificateBasicTemplate4Form from './CertificateBasicTemplate4';
import DiplomaTemplateForm from './DiplomaTemplate';
import { TemplateDefinition } from './types';
import template1 from './images/template1.webp';
import template2 from './images/template2.webp';
// import template3 from './images/template3.webp';
// import template4 from './images/template4.webp';

export type { TemplateDefinition } from './types';

export const qrTemplates: TemplateDefinition[] = [
  {
    id: 'diploma-template',
    title: 'Diploma QR template',
    image: template1,
    description: 'Diploma yaratish, QR kod olish va Word formatda yuklab olish oqimi.',
    isSystem: true,
    FormComponent: DiplomaTemplateForm,
  },
  {
    id: 'certificate-basic',
    title: 'Sertifikat basic',
    image: template2,
    description: 'Oddiy sertifikat uchun full name, kurs va sana maydonlari.',
    FormComponent: CertificateBasicTemplateForm,
  },
  {
    id: 'certificate-basic1',
    title: 'Sertifikat mentor',
    image: '/showcase/dashboard/image2.webp',
    description: 'Mentor, yo‘nalish va tugallangan sana bilan alohida sertifikat formasi.',
    FormComponent: CertificateBasicTemplate1Form,
  },
  {
    id: 'certificate-basic2',
    title: 'Sertifikat trening',
    image: '/showcase/dashboard/image3.webp',
    description: 'Xodim, trening va soatlar soni bo‘yicha alohida sertifikat formasi.',
    FormComponent: CertificateBasicTemplate2Form,
  },
  {
    id: 'certificate-basic4',
    title: 'Sertifikat event',
    image: '/showcase/dashboard/image4.webp',
    description: 'Event, tashkilot va ishtirokchi maʼlumotlari uchun alohida forma.',
    FormComponent: CertificateBasicTemplate4Form,
  },
];
