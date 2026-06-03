import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { formatDateTime } from '@/core/utils/date';
import { Button, Input, Select, Text, colors, radii, spacing } from '@/design-system';
import type { Catalogs, CatalogItem, NewCaseInput } from '@/domain';

import {
  EQUIPMENT_HARDWARE_ID,
  EQUIPMENT_SOFTWARE_ID,
  validateNewCase,
  type NewCaseDraft,
  type NewCaseErrors,
} from './new-case-validation';

export interface NewCaseScreenProps {
  catalogs: Catalogs | null;
  userName: string;
  userEmail: string;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (input: NewCaseInput) => void;
}

const toOptions = (items: CatalogItem[]) =>
  items.map((i) => ({ label: i.description, value: i.id }));

const descById = (items: CatalogItem[], id: number | undefined): string | null =>
  items.find((i) => i.id === id)?.description ?? null;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionBar} />
        <Text variant="sectionTitle" color={colors.brandDark}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** Formulario de nuevo caso por secciones, con campos condicionales por categoría. */
export function NewCaseScreen({
  catalogs,
  userName,
  userEmail,
  submitting = false,
  onCancel,
  onSubmit,
}: NewCaseScreenProps) {
  const [draft, setDraft] = useState<NewCaseDraft>({
    client: '',
    reportingUser: '',
    endUserEmail: '',
    equipmentTypeId: undefined,
    environmentId: undefined,
    moduleId: undefined,
    hardwareEquipmentId: undefined,
    caseDetails: '',
  });
  const [errors, setErrors] = useState<NewCaseErrors>({});

  const isSoftware = draft.equipmentTypeId === EQUIPMENT_SOFTWARE_ID;
  const isHardware = draft.equipmentTypeId === EQUIPMENT_HARDWARE_ID;

  const clientOptions = useMemo(
    () => (catalogs?.clients ?? []).map((c) => ({ label: c, value: c })),
    [catalogs],
  );

  const set = <K extends keyof NewCaseDraft>(key: K, value: NewCaseDraft[K]): void =>
    setDraft((d) => ({ ...d, [key]: value }));

  if (!catalogs) {
    return (
      <View style={styles.loading}>
        <Text color={colors.inkFaint}>Cargando catálogos…</Text>
      </View>
    );
  }

  const submit = (): void => {
    const validation = validateNewCase(draft);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const input: NewCaseInput = {
      equipmentTypeId: draft.equipmentTypeId!,
      equipmentTypeDesc: descById(catalogs.equipmentTypes, draft.equipmentTypeId) ?? '',
      caseDetails: draft.caseDetails.trim(),
      client: draft.client || null,
      reportingUser: draft.reportingUser || null,
      reportingUserEmail: draft.endUserEmail || null,
      softwareModuleId: isSoftware ? (draft.moduleId ?? null) : null,
      softwareModuleDesc: isSoftware ? descById(catalogs.modules, draft.moduleId) : null,
      softwareEnvironmentId: isSoftware ? (draft.environmentId ?? null) : null,
      softwareEnvironmentDesc: isSoftware
        ? descById(catalogs.environments, draft.environmentId)
        : null,
      hardwareEquipmentId: isHardware ? (draft.hardwareEquipmentId ?? null) : null,
      hardwareEquipmentDesc: isHardware
        ? descById(catalogs.hardwareEquipment, draft.hardwareEquipmentId)
        : null,
    };
    onSubmit(input);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" accessibilityLabel="Atrás" onPress={onCancel}>
        <Text color={colors.brandDark}>← Atrás</Text>
      </Pressable>
      <Text variant="screenTitle" color={colors.brandDark} style={styles.title}>
        Nuevo caso
      </Text>
      <Text variant="subtitle" color={colors.inkFaint} style={styles.subtitle}>
        Completa la información del soporte
      </Text>

      <Section title="Información del solicitante">
        <Select
          label="Cliente"
          placeholder="Seleccionar..."
          value={draft.client || undefined}
          options={clientOptions}
          onChange={(value) => set('client', value)}
        />
        <Input label="Solicitante" readonly value={userName} />
        <Input label="Correo del solicitante" readonly value={userEmail} />
        <Input label="Fecha de creación" readonly value={formatDateTime(Date.now())} />
        <Input
          label="Oficina o usuario que reporta"
          placeholder="Ej: Oficina principal"
          value={draft.reportingUser}
          onChangeText={(v) => set('reportingUser', v)}
        />
        <Input
          label="Correo del usuario final"
          placeholder="usuario@empresa.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={draft.endUserEmail}
          onChangeText={(v) => set('endUserEmail', v)}
          error={errors.endUserEmail}
        />
      </Section>

      <Section title="Clasificación">
        <Select
          label="Categoría"
          required
          placeholder="Seleccionar..."
          value={draft.equipmentTypeId}
          options={toOptions(catalogs.equipmentTypes)}
          onChange={(value) => set('equipmentTypeId', value)}
          error={errors.equipmentTypeId}
        />
        {isSoftware ? (
          <>
            <Select
              label="Ambiente"
              placeholder="Seleccionar..."
              value={draft.environmentId}
              options={toOptions(catalogs.environments)}
              onChange={(value) => set('environmentId', value)}
            />
            <Select
              label="Módulo"
              placeholder="Seleccionar..."
              value={draft.moduleId}
              options={toOptions(catalogs.modules)}
              onChange={(value) => set('moduleId', value)}
            />
          </>
        ) : null}
        {isHardware ? (
          <Select
            label="Equipo"
            placeholder="Seleccionar..."
            value={draft.hardwareEquipmentId}
            options={toOptions(catalogs.hardwareEquipment)}
            onChange={(value) => set('hardwareEquipmentId', value)}
          />
        ) : null}
      </Section>

      <Section title="Descripción">
        <Input
          label="Detalle"
          required
          multiline
          placeholder="Describe el problema con el mayor detalle posible..."
          value={draft.caseDetails}
          onChangeText={(v) => set('caseDetails', v)}
          error={errors.caseDetails}
        />
      </Section>

      <View style={styles.actions}>
        <Button title="Cancelar" variant="secondary" onPress={onCancel} style={styles.action} />
        <Button
          title={submitting ? 'Enviando…' : 'Enviar caso'}
          onPress={submit}
          disabled={submitting}
          style={styles.action}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, paddingTop: 56, paddingBottom: 60 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { marginTop: spacing.lg },
  subtitle: { marginBottom: spacing['4xl'] },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing['4xl'],
    marginBottom: spacing['2xl'],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  sectionBar: { width: 4, height: 16, borderRadius: 2, backgroundColor: colors.brandTeal },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  action: { flex: 1 },
});
