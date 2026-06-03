import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCaseDetail } from '@/presentation/hooks/use-case-detail';

import type { RootStackParamList } from '../../navigation/types';
import { CaseDetailScreen } from './CaseDetailScreen';

/** Conecta CaseDetailScreen con datos y navegación. */
export function CaseDetailContainer() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CaseDetail'>>();
  const { caseItem, comments, loading, submitting, addComment } = useCaseDetail(
    route.params.caseId,
  );

  return (
    <CaseDetailScreen
      caseItem={caseItem}
      comments={comments}
      loading={loading}
      submitting={submitting}
      onBack={() => navigation.goBack()}
      onSubmitComment={(input) => void addComment(input)}
    />
  );
}
