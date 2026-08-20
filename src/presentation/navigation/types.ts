import type { CaseFilter } from '@/presentation/hooks/use-cases-list';

/** Rutas del stack raíz (post-login). */
export type RootStackParamList = {
  Main: undefined;
  CaseDetail: { caseId: string };
  NewCase: undefined;
};

/** Pestañas inferiores. */
export type TabParamList = {
  Home: undefined;
  Cases: { filter?: CaseFilter } | undefined;
  Search: undefined;
  Profile: undefined;
};
