import type { ReactNode } from 'react';
import { DivisionPageHeader } from '../ui/DivisionPageHeader';

type AccountingPageHeaderProps = {
  area: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

/** Shared visual contract for every Accounting workspace page. */
export function AccountingPageHeader({ area, title, description, actions }: AccountingPageHeaderProps) {
  return (
    <DivisionPageHeader
      division="Divisi Accounting"
      descriptor={area}
      title={title}
      description={description}
      actions={actions}
    />
  );
}
