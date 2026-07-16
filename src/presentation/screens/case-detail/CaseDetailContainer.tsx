import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useCaseDetail } from '@/presentation/hooks/use-case-detail';

import type { RootStackParamList } from '../../navigation/types';
import { CaseDetailScreen } from './CaseDetailScreen';

/** Conecta CaseDetailScreen con datos, adjuntos y navegación. */
export function CaseDetailContainer() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CaseDetail'>>();
  const {
    caseItem,
    comments,
    attachments,
    loading,
    submitting,
    uploadingFor,
    addComment,
    uploadAttachment,
  } = useCaseDetail(route.params.caseId);

  const pickAndUpload = useCallback(
    async (commentServerId: number) => {
      const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets?.length) return;
      const file = picked.assets[0];
      const ok = await uploadAttachment(commentServerId, {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType ?? 'application/octet-stream',
      });
      if (!ok) Alert.alert('Adjunto', 'No se pudo subir el archivo. Intenta de nuevo.');
    },
    [uploadAttachment],
  );

  return (
    <CaseDetailScreen
      caseItem={caseItem}
      comments={comments}
      attachments={attachments}
      loading={loading}
      submitting={submitting}
      uploadingFor={uploadingFor}
      onBack={() => navigation.goBack()}
      onSubmitComment={(input) => void addComment(input)}
      onPickAttachment={(commentServerId) => void pickAndUpload(commentServerId)}
    />
  );
}
