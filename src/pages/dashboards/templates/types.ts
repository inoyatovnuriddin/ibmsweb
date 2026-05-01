import { ComponentType } from 'react';

export interface TemplateDefinition {
  id: string;
  title: string;
  image: string;
  description?: string;
  isSystem?: boolean;
  FormComponent: ComponentType;
}
