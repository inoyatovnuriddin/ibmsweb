import CertificateBasicTemplate1Form from './CertificateBasicTemplate1';
import CertificateBasicTemplate4Form from './CertificateBasicTemplate4';
import CompactPermitTemplateForm from './CompactPermitTemplate';
import DgsdPermitTemplateForm from './DgsdPermitTemplate';
import DiplomaTemplateForm from './DiplomaTemplate';
import EquipmentPermitTemplateForm from './EquipmentPermitTemplate';
import GuvohnomaTemplateForm from './GuvohnomaTemplate';
import RazryadTemplateForm from './RazryadTemplate';
import SertifikatTemplateForm from './SertifikatTemplate';
import SvidetelstvoTemplateForm from './SvidetelstvoTemplate';
import { TemplateDefinition } from './types';
import template1 from './images/template1.webp';
import template2 from './images/template2.webp';
import template3 from './images/template3.webp';
import template4 from './images/template4.webp';
import template5 from './images/template5.webp';
import template6 from './images/template6.webp';
import template7 from './images/template7.webp';
import template8 from './images/template8.webp';
import template9 from './images/template9.webp';
import template10 from './images/template10.png';

export type { TemplateDefinition } from './types';

export const qrTemplates: TemplateDefinition[] = [
  {
    id: 'diploma-template',
    title: 'Diploma QR template',
    image: template1,
    description:
      '',
    isSystem: true,
    FormComponent: DiplomaTemplateForm,
  },
  {
    id: 'certificate-basic',
    title: 'Sertifikat basic',
    image: template2,
    description: '',
    FormComponent: SertifikatTemplateForm,
  },
  {
    id: 'certificate-basic1',
    title: 'DIPLOMA (RU + EN)',
    image: template3,
    description:
      '',
    FormComponent: CertificateBasicTemplate1Form,
  },
  {
    id: 'certificate-basic2',
    title: 'Udostoverenie (jihoz ruxsati)',
    image: template4,
    description:
      '',
    FormComponent: EquipmentPermitTemplateForm,
  },
  {
    id: 'certificate-basic4',
    title: 'Event sertifikati',
    image: template5,
    description:
      '',
    FormComponent: CertificateBasicTemplate4Form,
  },
  {
    id: 'certificate-basic5',
    title: 'Udostoverenie (svidetelstvo)',
    image: template6,
    description: '',
    FormComponent: SvidetelstvoTemplateForm,
  },
  {
    id: 'certificate-basic6',
    title: 'Udostoverenie (ixcham)',
    image: template7,
    description:
      '',
    FormComponent: CompactPermitTemplateForm,
  },
  {
    id: 'certificate-basic7',
    title: 'Stropalshik guvohnomasi',
    image: template8,
    description:
      '',
    FormComponent: GuvohnomaTemplateForm,
  },
  {
    id: 'certificate-basic8',
    title: 'Udostoverenie (razryad)',
    image: template9,
    description:
      '',
    FormComponent: RazryadTemplateForm,
  },
  {
    id: 'certificate-basic9',
    title: 'Udostoverenie (ДГСД)',
    image: template10,
    description:
      '',
    FormComponent: DgsdPermitTemplateForm,
  },
];
