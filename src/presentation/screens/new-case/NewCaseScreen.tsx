import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { formatDateTime } from '@/core/utils/date';
import { Button, Input, Select, Text, colors, radii, spacing } from '@/design-system';
import type { Catalogs, CatalogItem, NewCaseInput, NewCommentInput } from '@/domain';

import {
  EQUIPMENT_HARDWARE_ID,
  EQUIPMENT_SOFTWARE_ID,
  validateNewCase,
  type NewCaseDraft,
  type NewCaseErrors,
} from './new-case-validation';

export interface NewCaseScreenProps {
  catalogs: Catalogs | null;
  countries?: CatalogItem[];
  /** Carga las provincias/departamentos de un país (select dependiente). */
  loadDepartments?: (idCountry: number) => Promise<CatalogItem[]>;
  userName: string;
  userEmail: string;
  /** Username de login: la API lo exige como solicitante y filtra los casos por él. */
  requesterUsername: string;
  /** Departamento del usuario autenticado (fallback si el campo está vacío). */
  userDepartmentName?: string | null;
  /** Cargo del usuario autenticado (fallback si el campo está vacío). */
  userJobFunction?: string | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (input: NewCaseInput, comment?: Omit<NewCommentInput, 'caseId'>) => void;
}

const STATUS_OPTIONS = [
  { label: 'En espera de respuesta soporte', value: 1 },
  { label: 'Devolver a cola', value: 2 },
  { label: 'Resuelto', value: 3 },
  { label: 'Cerrado', value: 4 },
  { label: 'En espera AIG', value: 5 },
  { label: 'En espera de respuesta cliente', value: 6 },
];

const toOptions = (items: CatalogItem[]) =>
  items.map((i) => ({ label: i.description, value: i.id }));

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

/**
 * Formulario de nuevo caso alineado al "Registro / Datos del Caso" del portal web:
 * datos del solicitante, clasificación (categoría + condicionales), urgencia,
 * tipo de servicio, ubicación y asunto. Envía con `onSubmit`.
 */
export function NewCaseScreen({
  catalogs,
  countries = [],
  loadDepartments,
  userName,
  userEmail,
  userDepartmentName,
  userJobFunction,
  submitting = false,
  onCancel,
  onSubmit,
}: NewCaseScreenProps) {
  const [draft, setDraft] = useState<NewCaseDraft>({
    client: '',
    reportingUser: '',
    endUserEmail: '',
    requesterEmail: '',
    departamento: userDepartmentName ?? '',
    cargo: userJobFunction ?? '',
    equipmentTypeId: undefined,
    environmentId: undefined,
    moduleId: undefined,
    hardwareEquipmentId: undefined,
    priorityId: undefined,
    serviceTypeId: undefined,
    countryId: undefined,
    departmentId: undefined,
    referenceNumber: '',
    location: '',
    caseDetails: '',
  });
  const [errors, setErrors] = useState<NewCaseErrors>({});
  const [departments, setDepartments] = useState<CatalogItem[]>([]);

  // Al elegir país: carga sus provincias/departamentos y limpia la selección previa.
  const onCountryChange = async (countryId: number): Promise<void> => {
    setDraft((d) => ({ ...d, countryId, departmentId: undefined }));
    setDepartments([]);
    if (loadDepartments) setDepartments(await loadDepartments(countryId));
  };
  const [commentBody, setCommentBody] = useState('');
  const [commentPrivate, setCommentPrivate] = useState(false);
  const [commentStatus, setCommentStatus] = useState({
    id: 1,
    desc: 'En espera de respuesta soporte',
  });

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

    const caseDetails = draft.caseDetails.trim();

    const input: NewCaseInput = {
      equipmentTypeId: draft.equipmentTypeId!,
      caseDetails,
      client: draft.client || null,
      userRequester: userName,
      emailRequester: draft.requesterEmail.trim() || userEmail || null,
      reportingUser: draft.reportingUser.trim() || null,
      reportingUserEmail: draft.endUserEmail.trim() || null,
      softwareModuleId: isSoftware ? (draft.moduleId ?? null) : null,
      softwareEnvironmentId: isSoftware ? (draft.environmentId ?? null) : null,
      hardwareEquipmentId: isHardware ? (draft.hardwareEquipmentId ?? null) : null,
      priorityId: draft.priorityId ?? null,
      serviceTypeId: draft.serviceTypeId ?? null,
      location: draft.location || null,
      countryId: draft.countryId ?? null,
      departmentId: draft.departmentId ?? null,
      statusCaseId: 1,
      classificationCaseId: 1,
      serial: draft.referenceNumber.trim() || null,
      technician: userName,
      positionRequester: draft.cargo || userJobFunction || null,
      departmentRequester: draft.departamento || userDepartmentName || null,
    };

    const initialComment = commentBody.trim()
      ? {
          body: commentBody.trim(),
          isPrivate: commentPrivate,
          statusCaseId: commentStatus.id,
          statusDesc: commentStatus.desc,
          authorUsername: userName,
        }
      : undefined;

    if (initialComment) onSubmit(input, initialComment);
    else onSubmit(input);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      <Pressable accessibilityRole="button" accessibilityLabel="Atrás" onPress={onCancel}>
        <Text color={colors.brandDark}>← Atrás</Text>
      </Pressable>
      <Text variant="screenTitle" color={colors.brandDark} style={styles.title}>
        Nuevo caso
      </Text>
      <Text variant="subtitle" color={colors.inkFaint} style={styles.subtitle}>
        Completa los datos del caso
      </Text>

      <Section title="Registro">
        <Select
          label="Cliente"
          placeholder="Seleccionar..."
          value={draft.client || undefined}
          options={clientOptions}
          onChange={(value) => set('client', value)}
        />
        <Input label="Solicitante" readonly value={userName} />
        <Input
          label="Correo electrónico del solicitante"
          placeholder="correo@ejemplo.com"
          value={draft.requesterEmail}
          error={errors.requesterEmail}
          onChangeText={(v) => set('requesterEmail', v)}
        />
        <Input label="Fecha de creación" readonly value={formatDateTime(Date.now())} />
        <Input
          label="Oficina o usuario que reporta"
          placeholder="Ej: Oficina principal"
          value={draft.reportingUser}
          onChangeText={(v) => set('reportingUser', v)}
        />
        <Input
          label="Correo de usuario final que reporta"
          placeholder="usuario@empresa.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={draft.endUserEmail}
          onChangeText={(v) => set('endUserEmail', v)}
          error={errors.endUserEmail}
        />
        <Input label="Departamento" readonly value={draft.departamento} />
        <Input label="Cargo" readonly value={draft.cargo} />

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

        <Select
          label="Urgencia"
          placeholder="Seleccionar..."
          value={draft.priorityId}
          options={toOptions(catalogs.priorities)}
          onChange={(value) => set('priorityId', value)}
        />
        <Select
          label="Tipo de servicio"
          placeholder="Seleccionar..."
          value={draft.serviceTypeId}
          options={toOptions(catalogs.serviceTypes)}
          onChange={(value) => set('serviceTypeId', value)}
        />
        <Input
          label="Número de referencia"
          placeholder="Opcional"
          value={draft.referenceNumber}
          onChangeText={(v) => set('referenceNumber', v)}
        />
        <Select
          label="País"
          placeholder="Seleccionar..."
          value={draft.countryId}
          options={toOptions(countries)}
          onChange={(value) => void onCountryChange(value)}
        />
        <Select
          label="Provincia o Departamento"
          placeholder={draft.countryId ? 'Seleccionar...' : 'Primero elige un país'}
          value={draft.departmentId}
          options={toOptions(departments)}
          onChange={(value) => set('departmentId', value)}
        />
        <Input
          label="Ubicación"
          placeholder="Ej: Piso 3, oficina 12"
          value={draft.location}
          onChangeText={(v) => set('location', v)}
        />
        <Input
          label="Asunto"
          required
          multiline
          placeholder="Describe el problema con el mayor detalle posible..."
          value={draft.caseDetails}
          onChangeText={(v) => set('caseDetails', v)}
          error={errors.caseDetails}
        />
      </Section>

      <Section title="Comentarios">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: commentPrivate }}
          accessibilityLabel="Marcar como comentario privado"
          onPress={() => setCommentPrivate((p) => !p)}
          style={styles.checkboxRow}
        >
          <Ionicons
            name={commentPrivate ? 'checkbox' : 'square-outline'}
            size={20}
            color={commentPrivate ? colors.brandTeal : colors.inkFaint}
          />
          <Text variant="body" color={colors.inkSoft}>
            Privado
          </Text>
        </Pressable>
        <Input
          label="Descripción"
          multiline
          placeholder="Comentario inicial (opcional)..."
          value={commentBody}
          onChangeText={setCommentBody}
        />
        <Select
          label="Estado del caso"
          value={commentStatus.id}
          options={STATUS_OPTIONS}
          onChange={(value) => {
            const opt = STATUS_OPTIONS.find((o) => o.value === value);
            setCommentStatus({ id: value, desc: opt?.label ?? commentStatus.desc });
          }}
        />
        <View style={styles.attachField}>
          <Text variant="label" color={colors.inkSoft} style={styles.attachLabel}>
            Adjunto
          </Text>
          <View style={styles.attachRow}>
            <View style={styles.attachBtn}>
              <Text variant="caption" color={colors.inkSoft}>
                Elegir archivo
              </Text>
            </View>
            <Text variant="caption" color={colors.inkFaint}>
              Sin archivos seleccionados
            </Text>
          </View>
          <Text variant="caption" color={colors.inkFaint} style={styles.attachNote}>
            Adjuntar archivos estará disponible próximamente.
          </Text>
        </View>
      </Section>

      <View style={styles.actions}>
        <Button title="Cancelar" variant="secondary" onPress={onCancel} style={styles.action} />
        <Button
          title={submitting ? 'Enviando…' : 'Solicitar'}
          onPress={submit}
          disabled={submitting}
          style={[styles.action, styles.solicitar]}
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
  solicitar: { backgroundColor: colors.brandAccent },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  attachField: { marginBottom: spacing['2xl'] },
  attachLabel: { marginBottom: spacing.sm },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  attachBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.input,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f3f6',
  },
  attachNote: { marginTop: spacing.xs, fontStyle: 'italic' },
});
