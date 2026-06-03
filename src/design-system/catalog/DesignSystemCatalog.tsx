import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Input,
  Select,
  Text,
  colors,
  spacing,
  type StatusKey,
} from '..';

const STATUSES: { key: StatusKey; label: string }[] = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'cola', label: 'En Cola' },
  { key: 'resuelto', label: 'Resuelto' },
  { key: 'cerrado', label: 'Cerrado' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="sectionLabel" color={colors.inkFaint} style={styles.sectionLabel}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/**
 * Catálogo navegable del sistema de diseño (Fase 2).
 * Muestra tokens y todos los componentes atómicos para revisión visual.
 * Es temporal: se reemplaza por la navegación real en la Fase 5.
 */
export function DesignSystemCatalog() {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<number | undefined>();
  const [activeChip, setActiveChip] = useState<string>('todos');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="screenTitle" color={colors.brandDark}>
        Sistema de{' '}
        <Text variant="screenTitle" color={colors.brandTeal}>
          diseño
        </Text>
      </Text>
      <Text variant="subtitle" color={colors.inkFaint} style={styles.subtitle}>
        DOZZIER · tokens y componentes
      </Text>

      <Section title="Colores de estado">
        <View style={styles.row}>
          {STATUSES.map((s) => (
            <Badge key={s.key} status={s.key} label={s.label} />
          ))}
        </View>
      </Section>

      <Section title="Tipografía">
        <Text variant="screenTitle" color={colors.brandDark}>
          Fraunces 30
        </Text>
        <Text variant="detailTitle" color={colors.brandDark}>
          Fraunces 22
        </Text>
        <Text variant="bodyStrong">Inter Tight semibold 14</Text>
        <Text variant="body" color={colors.inkSoft}>
          Inter Tight regular 13 — cuerpo de texto.
        </Text>
      </Section>

      <Section title="Botones">
        <Button title="Enviar caso" variant="primary" onPress={() => undefined} />
        <View style={styles.gap} />
        <Button title="Cancelar" variant="secondary" onPress={() => undefined} />
        <View style={styles.gap} />
        <Button title="Deshabilitado" disabled onPress={() => undefined} />
      </Section>

      <Section title="Campos">
        <Input
          label="Asunto"
          required
          placeholder="Resume el problema"
          value={text}
          onChangeText={setText}
        />
        <Input label="Solicitante" readonly value="Saulo Bravo" />
        <Input label="Correo" placeholder="usuario@empresa.com" error="Correo inválido" />
        <Select
          label="Categoría"
          required
          value={category}
          onChange={setCategory}
          options={[
            { label: 'Software', value: 2 },
            { label: 'Hardware', value: 1 },
            { label: 'Sala de Audiencia', value: 3 },
          ]}
        />
      </Section>

      <Section title="Chips de filtro">
        <View style={styles.row}>
          <Chip
            label="Todos"
            active={activeChip === 'todos'}
            onPress={() => setActiveChip('todos')}
          />
          {STATUSES.slice(0, 3).map((s) => (
            <Chip
              key={s.key}
              label={s.label}
              dotStatus={s.key}
              active={activeChip === s.key}
              onPress={() => setActiveChip(s.key)}
            />
          ))}
        </View>
      </Section>

      <Section title="Tarjeta de caso">
        <Card statusStripe="cola" elevated onPress={() => undefined} style={styles.caseCard}>
          <View style={styles.caseHeader}>
            <View style={styles.flex}>
              <Text variant="caption" color={colors.inkFaint}>
                Caso #341
              </Text>
              <Text variant="bodyStrong" color={colors.ink}>
                Error al generar reporte mensual de ventas
              </Text>
            </View>
            <Badge status="cola" label="En Cola" />
          </View>
          <Text variant="caption" color={colors.inkFaint}>
            Software · Producción · 2h
          </Text>
        </Card>
      </Section>

      <Section title="Avatares">
        <View style={styles.row}>
          <Avatar initials="SB" variant="requester" />
          <Avatar initials="MR" variant="support" />
          <Avatar initials="JG" variant="requester" size={40} />
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, paddingBottom: 60 },
  subtitle: { marginBottom: spacing['5xl'] },
  section: { marginBottom: spacing['5xl'] },
  sectionLabel: { marginBottom: spacing.xl },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' },
  gap: { height: spacing.lg },
  caseCard: { paddingLeft: spacing['5xl'] },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  flex: { flex: 1 },
});
