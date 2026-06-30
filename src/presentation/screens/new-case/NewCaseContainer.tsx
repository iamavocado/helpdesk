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
  const { catalogs, submitting, submit } = useNewCase();

  return (
    <NewCaseScreen
      catalogs={catalogs}
      userName={user?.name ?? 'Usuario'}
      userEmail={user?.email ?? ''}
      submitting={submitting}
      onCancel={() => navigation.goBack()}
      onSubmit={async (input: NewCaseInput, comment?: Omit<NewCommentInput, 'caseId'>) => {
        const created = await submit(input, comment);
        if (created) navigation.goBack();
      }}
    />
  );
}
