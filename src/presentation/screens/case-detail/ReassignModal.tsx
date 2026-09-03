import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, Select, Text, colors, radii, spacing } from '@/design-system';
import type { Case, CatalogItem, Member, ReassignInput } from '@/domain';

import { useReassign } from '@/presentation/hooks/use-reassign';

/** Estados del caso (StatusCase) — coincide 1:1 con /api/StatusCase/todos. */
const STATUS_OPTIONS = [
  { label: 'En espera de respuesta soporte', value: 1 },
  { label: 'Devolver a cola', value: 2 },
  { label: 'Resuelto', value: 3 },
  { label: 'Cerrado', value: 4 },
  { label: 'En espera de respuesta AIG', value: 5 },
  { label: 'En espera de respuesta cliente', value: 6 },
];

export interface ReassignModalProps {
  visible: boolean;
  caseItem: Case;
  onClose: () => void;
  /** Se invoca tras reasignar con éxito (con el caso ya actualizado). */
  onDone: () => void;
}

const toOptions = (items: CatalogItem[]) =>
  items.map((i) => ({ label: i.description, value: i.id }));

const descById = (items: { value: number; label: string }[], id: number | undefined) =>
  items.find((o) => o.value === id)?.label ?? null;

/** Modal "Reasignar Caso": técnico, estado, subestado, categoría, tipo y descripción. */
export function ReassignModal({ visible, caseItem, onClose, onDone }: ReassignModalProps) {
  const {
    members,
    statusSubStatuses,
    equipmentTypes,
    serviceTypes,
    loading,
    submitting,
    error,
    load,
    submit,
  } = useReassign();
  const insets = useSafeAreaInsets();

  const [technician, setTechnician] = useState<string | undefined>(
    caseItem.technician ?? undefined,
  );
  const [statusCaseId, setStatusCaseId] = useState<number>(caseItem.statusCaseId || 1);
  const [subStatusId, setSubStatusId] = useState<number | undefined>();
  const [equipmentTypeId, setEquipmentTypeId] = useState<number | undefined>(
    caseItem.equipmentTypeId || undefined,
  );
  const [serviceTypeId, setServiceTypeId] = useState<number | undefined>(
    caseItem.serviceTypeId ?? undefined,
  );
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState<string | undefined>();

  // Carga las opciones al abrir el modal.
  useEffect(() => {
    if (visible) void load();
  }, [visible, load]);

  const memberOptions = useMemo(
    () => members.map((m: Member) => ({ label: m.fullName, value: m.fullName })),
    [members],
  );
  const subStatusOptions = useMemo(() => toOptions(statusSubStatuses), [statusSubStatuses]);
  const equipmentOptions = useMemo(() => toOptions(equipmentTypes), [equipmentTypes]);
  const serviceOptions = useMemo(() => toOptions(serviceTypes), [serviceTypes]);

  const onSubmit = async (): Promise<void> => {
    if (!technician) {
      setLocalError('Selecciona a quién asignar el caso');
      return;
    }
    setLocalError(undefined);
    const input: ReassignInput = {
      technician,
      statusCaseId,
      statusCaseDesc: descById(STATUS_OPTIONS, statusCaseId),
      statusCaseSubStatusId: subStatusId ?? null,
      statusCaseSubStatusDesc: descById(subStatusOptions, subStatusId),
      equipmentTypeId: equipmentTypeId ?? null,
      equipmentTypeDesc: descById(equipmentOptions, equipmentTypeId),
      serviceTypeId: serviceTypeId ?? null,
      serviceTypeDesc: descById(serviceOptions, serviceTypeId),
      caseDetails: description.trim() ? description.trim() : null,
    };
    const ok = await submit(caseItem.id, input);
    if (ok) onDone();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing['3xl']) }]}>
          <View style={styles.headerRow}>
            <Text variant="sectionTitle" color={colors.brandDark}>
              Reasignar Caso
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose}>
              <Text color={colors.inkFaint}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.brandTeal} />
              <Text variant="caption" color={colors.inkFaint} style={styles.loadingText}>
                Cargando técnicos…
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Input
                label="Número de caso"
                readonly
                value={`Caso #${caseItem.caseClientId ?? '—'}`}
              />
              <Select
                label="Asignar a"
                required
                placeholder="Seleccionar..."
                value={technician}
                options={memberOptions}
                onChange={(v) => setTechnician(v)}
                error={localError}
              />
              <Select
                label="Estado del caso"
                value={statusCaseId}
                options={STATUS_OPTIONS}
                onChange={(v) => setStatusCaseId(v)}
              />
              <Select
                label="Sub Estado"
                placeholder="Seleccionar..."
                value={subStatusId}
                options={subStatusOptions}
                onChange={(v) => setSubStatusId(v)}
              />
              <Input
                label="Descripción"
                multiline
                placeholder="Motivo de la reasignación…"
                value={description}
                onChangeText={setDescription}
              />
              <Select
                label="Categoría"
                placeholder="Seleccionar..."
                value={equipmentTypeId}
                options={equipmentOptions}
                onChange={(v) => setEquipmentTypeId(v)}
              />
              <Select
                label="Tipo de servicio"
                placeholder="Seleccionar..."
                value={serviceTypeId}
                options={serviceOptions}
                onChange={(v) => setServiceTypeId(v)}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text variant="caption" color={colors.cola}>
                    {error}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={onClose}
              style={styles.action}
              disabled={submitting}
            />
            <Button
              title={submitting ? 'Guardando…' : 'Aceptar'}
              onPress={() => void onSubmit()}
              style={styles.action}
              disabled={submitting || loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30,42,58,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing['3xl'],
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  body: { flexGrow: 0 },
  loading: { paddingVertical: spacing['5xl'], alignItems: 'center' },
  loadingText: { marginTop: spacing.md },
  errorBox: {
    backgroundColor: colors.colaSoft,
    borderRadius: radii.input,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing['2xl'] },
  action: { flex: 1 },
});
