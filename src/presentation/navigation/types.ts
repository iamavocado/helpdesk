import type { Classification } from '@/domain';

/** Rutas del stack raíz (post-login). */
export type RootStackParamList = {
  Main: undefined;
  CaseDetail: { caseId: string };
  NewCase: undefined;
};

/** Pestañas inferiores. */
export type TabParamList = {
  Home: undefined;
  Cases: { classification?: Classification } | undefined;
  Search: undefined;
  Profile: undefined;
};
