import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { NewCaseInput, NewCommentInput } from '@/domain';
import { useNewCase } from '@/presentation/hooks/use-new-case';
import { useAuthStore } from '@/presentation/stores';

import type { RootStackParamList } from '../../navigation/types';
import { NewCaseScreen } from './NewCaseScreen';

/** Conecta NewCaseScreen con catálogos, creación de caso y navegación. */
export function NewCaseContainer() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const { catalogs, countries, submitting, loadDepartments, submit } = useNewCase();

  return (
    <NewCaseScreen
      catalogs={catalogs}
      countries={countries}
      loadDepartments={loadDepartments}
      userName={user?.name ?? 'Usuario'}
      userEmail={user?.email ?? ''}
      requesterUsername={user?.username ?? ''}
      submitting={submitting}
      onCancel={() => navigation.goBack()}
      onSubmit={async (input: NewCaseInput, comment?: Omit<NewCommentInput, 'caseId'>) => {
        console.log('[DEBUG] NewCaseContainer.onSubmit — input:', JSON.stringify(input));
        console.log(
          '[DEBUG] NewCaseContainer.onSubmit — comment:',
          comment ? JSON.stringify(comment) : 'sin comentario',
        );
        const created = await submit(input, comment);
        console.log('[DEBUG] NewCaseContainer.onSubmit — resultado created:', created);
        if (created) navigation.goBack();
      }}
    />
  );
}
