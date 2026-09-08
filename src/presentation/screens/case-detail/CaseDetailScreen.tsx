import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { formatDateTime, formatTime } from '@/core/utils/date';
import { Avatar, Button, Input, Select, Text, colors, radii, spacing } from '@/design-system';
import {
  authorInitials,
  caseDisplayId,
  caseTitle,
  classificationLabel,
  statusCaseLabel,
  type Attachment,
  type Case,
  type Comment,
  type NewCommentInput,
} from '@/domain';

export interface CommentDraft {
  body: string;
  isPrivate: boolean;
  statusCaseId: number;
  statusDesc: string;
}

export interface CaseDetailScreenProps {
  caseItem: Case | null;
  comments: Comment[];
  /** Adjuntos por `serverId` de comentario. */
  attachments?: Record<number, Attachment[]>;
  loading?: boolean;
  submitting?: boolean;
  /** `serverId` del comentario cuyo adjunto se está subiendo. */
  uploadingFor?: number | null;
  onBack: () => void;
  onSubmitComment: (input: Omit<NewCommentInput, 'caseId'>) => void;
  /** Pide elegir un archivo y subirlo al comentario indicado. */
  onPickAttachment?: (commentServerId: number) => void;
  /** Abre el modal de reasignación del caso. */
  onReassign?: () => void;
}

const STATUS_OPTIONS = [
  { label: 'En espera de respuesta soporte', value: 1 },
  { label: 'Devolver a cola', value: 2 },
  { label: 'Resuelto', value: 3 },
  { label: 'Cerrado', value: 4 },
  { label: 'En espera AIG', value: 5 },
  { label: 'En espera de respuesta cliente', value: 6 },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="body" color={colors.inkFaint}>
        {label}
      </Text>
      <Text variant="body" color={colors.ink} style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function CommentBubble({
  comment,
  isRequester,
  files = [],
  uploading = false,
  onPickAttachment,
}: {
  comment: Comment;
  isRequester: boolean;
  files?: Attachment[];
  uploading?: boolean;
  onPickAttachment?: (commentServerId: number) => void;
}) {
  // Solo se puede adjuntar a comentarios ya sincronizados (necesitan serverId).
  const canAttach = comment.serverId != null && !!onPickAttachment;
  return (
    <View style={[styles.comment, comment.isPrivate && styles.commentPrivate]}>
      <View style={styles.commentHeader}>
        <View style={styles.author}>
          <Avatar
            initials={authorInitials(comment.authorName)}
            variant={isRequester ? 'requester' : 'support'}
          />
          <View>
            <View style={styles.authorNameRow}>
              <Text variant="bodyStrong" color={colors.ink}>
                {comment.authorName || 'Usuario'}
              </Text>
              {comment.isPrivate ? (
                <View style={styles.privateTag}>
                  <Text variant="caption" color={colors.white}>
                    Privado
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="caption" color={colors.inkFaint}>
              {comment.authorRole ?? (isRequester ? 'Solicitante' : 'Soporte')}
            </Text>
          </View>
        </View>
        <Text variant="caption" color={colors.inkFaint}>
          {formatTime(comment.creationDate)}
        </Text>
      </View>
      <Text variant="body" color={colors.inkSoft}>
        {comment.body}
      </Text>

      {files.length > 0 ? (
        <View style={styles.files}>
          {files.map((f) => (
            <View key={f.serverId} style={styles.fileRow}>
              <Ionicons name="document-attach-outline" size={16} color={colors.brandTeal} />
              <Text variant="caption" color={colors.inkSoft} style={styles.fileName}>
                {f.fileName}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {canAttach ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adjuntar archivo"
          disabled={uploading}
          onPress={() => onPickAttachment?.(comment.serverId as number)}
          style={styles.attachAction}
        >
          <Ionicons
            name={uploading ? 'cloud-upload-outline' : 'attach-outline'}
            size={16}
            color={colors.brandTeal}
          />
          <Text variant="caption" color={colors.brandTeal}>
            {uploading ? 'Subiendo…' : 'Adjuntar archivo'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Detalle del caso: cabecera, info, conversación y alta de comentario. */
export function CaseDetailScreen({
  caseItem,
  comments,
  attachments = {},
  submitting = false,
  uploadingFor = null,
  onBack,
  onSubmitComment,
  onPickAttachment,
  onReassign,
}: CaseDetailScreenProps) {
  const [draft, setDraft] = useState<CommentDraft>({
    body: '',
    isPrivate: false,
    statusCaseId: 1,
    statusDesc: 'En espera de respuesta soporte',
  });
  const [error, setError] = useState<string | undefined>();

  // Refleja el estado actual del caso en el selector al cargar/cambiar.
  const currentStatusId = caseItem?.statusCaseId;
  const currentStatusDesc = caseItem?.statusCaseDesc;
  useEffect(() => {
    if (currentStatusId != null) {
      setDraft((d) => ({
        ...d,
        statusCaseId: currentStatusId,
        statusDesc: currentStatusDesc ?? '',
      }));
    }
  }, [currentStatusId, currentStatusDesc]);

  if (!caseItem) {
    return (
      <View style={styles.empty}>
        <Text color={colors.inkFaint}>Caso no encontrado.</Text>
      </View>
    );
  }

  const submit = (): void => {
    if (!draft.body.trim()) {
      setError('Escribe un comentario');
      return;
    }
    setError(undefined);
    onSubmitComment({
      body: draft.body.trim(),
      isPrivate: draft.isPrivate,
      statusCaseId: draft.statusCaseId,
      statusDesc: draft.statusDesc,
    });
    setDraft((d) => ({ ...d, body: '', isPrivate: false }));
  };

  const meta = [caseItem.equipmentTypeDesc, caseItem.softwareEnvironmentDesc].filter(
    (x): x is string => !!x,
  );

  const infoRows = (
    [
      ['Estado', caseItem.statusCaseDesc?.trim() || statusCaseLabel(caseItem.statusCaseId)],
      ['Cliente', caseItem.client],
      ['Categoría', caseItem.equipmentTypeDesc],
      ['Módulo', caseItem.softwareModuleDesc],
      ['Equipo', caseItem.hardwareEquipmentDesc],
      ['Ambiente', caseItem.softwareEnvironmentDesc],
      ['Tipo de servicio', caseItem.serviceTypeDesc],
      ['Prioridad', caseItem.priorityDesc],
      ['Ubicación', caseItem.location],
      ['Solicitante', caseItem.userRequester],
      ['Correo solicitante', caseItem.requesterEmail],
      ['Oficina/usuario que reporta', caseItem.reportingUser],
      ['Correo usuario final', caseItem.reportingUserEmail],
      ['País', caseItem.countryDesc],
      ['Departamento', caseItem.departmentDesc],
      ['Técnico', caseItem.technician],
      ['Creado', formatDateTime(caseItem.creationDate)],
      ['Modificado', formatDateTime(caseItem.modificationDate)],
      ['Solución', caseItem.solutionDate ? formatDateTime(caseItem.solutionDate) : null],
    ] as [string, string | null][]
  )
    .filter((r): r is [string, string] => !!r[1])
    .map(([label, value]) => ({ label, value }));

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Atrás" onPress={onBack}>
          <Text color={colors.white}>← Atrás</Text>
        </Pressable>
        <Text variant="caption" color={colors.brandTealBright} style={styles.headerId}>
          {caseDisplayId(caseItem)}
        </Text>
        <Text variant="detailTitle" color={colors.white}>
          {caseTitle(caseItem)}
        </Text>
        <View style={styles.metaRow}>
          {meta.map((m) => (
            <View key={m} style={styles.metaChip}>
              <Text variant="caption" color={colors.white}>
                {m}
              </Text>
            </View>
          ))}
          <View style={styles.metaChipStatus}>
            <Text variant="caption" color={colors.white}>
              {caseItem.statusCaseDesc?.trim() ||
                statusCaseLabel(caseItem.statusCaseId) ||
                classificationLabel(caseItem.classification)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoGrid}>
        {infoRows.map((r) => (
          <InfoRow key={r.label} label={r.label} value={r.value} />
        ))}
      </View>
      {caseItem.caseDetails ? (
        <View style={styles.detailBlock}>
          <Text variant="sectionLabel" color={colors.inkFaint} style={styles.detailLabel}>
            Asunto
          </Text>
          <Text variant="body" color={colors.inkSoft}>
            {caseItem.caseDetails}
          </Text>
        </View>
      ) : null}

      <Text variant="sectionLabel" color={colors.inkFaint} style={styles.sectionLabel}>
        Conversación
      </Text>
      {comments.length === 0 ? (
        <Text variant="body" color={colors.inkFaint} style={styles.noComments}>
          Sin comentarios todavía.
        </Text>
      ) : (
        comments.map((c) => (
          <CommentBubble
            key={c.id}
            comment={c}
            isRequester={c.authorName === caseItem.userRequester}
            files={c.serverId != null ? attachments[c.serverId] : undefined}
            uploading={uploadingFor === c.serverId}
            onPickAttachment={onPickAttachment}
          />
        ))
      )}

      <View style={styles.formSection}>
        <Text variant="sectionTitle" color={colors.brandDark} style={styles.formTitle}>
          Agregar comentario
        </Text>
        <Select
          label="Estado del caso"
          value={draft.statusCaseId}
          options={STATUS_OPTIONS}
          onChange={(value) => {
            const opt = STATUS_OPTIONS.find((o) => o.value === value);
            setDraft((d) => ({
              ...d,
              statusCaseId: value,
              statusDesc: opt?.label ?? d.statusDesc,
            }));
          }}
        />
        <Input
          label="Descripción"
          multiline
          placeholder="Escribe tu respuesta..."
          value={draft.body}
          onChangeText={(body) => setDraft((d) => ({ ...d, body }))}
          error={error}
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: draft.isPrivate }}
          accessibilityLabel="Marcar como comentario privado"
          onPress={() => setDraft((d) => ({ ...d, isPrivate: !d.isPrivate }))}
          style={styles.checkboxRow}
        >
          <Ionicons
            name={draft.isPrivate ? 'checkbox' : 'square-outline'}
            size={20}
            color={draft.isPrivate ? colors.brandTeal : colors.inkFaint}
          />
          <Text variant="body" color={colors.inkSoft}>
            Marcar como comentario privado
          </Text>
        </Pressable>
        <Button
          title={submitting ? 'Guardando…' : 'Guardar'}
          onPress={submit}
          disabled={submitting}
        />
        {onReassign && caseItem.serverId != null ? (
          <Button
            title="Reasignar"
            variant="secondary"
            onPress={onReassign}
            style={styles.reassignBtn}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 60 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.brandDark,
    paddingTop: 56,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing['5xl'],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerId: { marginTop: spacing.xl, marginBottom: spacing.xs, letterSpacing: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing['2xl'] },
  metaChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
  metaChipStatus: {
    backgroundColor: colors.brandTeal,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
  infoGrid: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing['3xl'],
    margin: spacing.screen,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  infoValue: { flexShrink: 1, textAlign: 'right', marginLeft: spacing.lg },
  detailBlock: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing['3xl'],
    marginHorizontal: spacing.screen,
    marginBottom: spacing.lg,
  },
  detailLabel: { marginBottom: spacing.sm },
  sectionLabel: { marginHorizontal: spacing.screen, marginBottom: spacing.xl },
  noComments: { marginHorizontal: spacing.screen },
  comment: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing['2xl'],
    marginHorizontal: spacing.screen,
    marginBottom: spacing.lg,
  },
  commentPrivate: { backgroundColor: colors.privateBg, borderColor: colors.privateBorder },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  author: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  privateTag: {
    backgroundColor: colors.privateTag,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  files: { marginTop: spacing.md, gap: spacing.xs },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fileName: { flexShrink: 1 },
  attachAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  formSection: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing['4xl'],
    margin: spacing.screen,
  },
  formTitle: { marginBottom: spacing['2xl'] },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  reassignBtn: { marginTop: spacing.lg },
});
