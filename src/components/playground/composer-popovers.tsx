import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import {
  BrandIcon,
  CheckIcon,
  PasteIcon,
  SparkleIcon,
  TemplateIcon,
  UploadIcon,
} from '@/components/playground/icons';
import { brand } from '@/constants/brand';
import {
  PLAYGROUND_FORMATS,
  PLAYGROUND_MODELS,
  type PlaygroundFormat,
} from '@/constants/playground';

export type ComposerPopover = 'attach' | 'model' | 'format' | 'paste' | null;

type PopoverShellProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Measured height of the composer card below, so the popover sits just above it instead of overlapping. */
  composerHeight: number;
};

export function ComposerPopoverShell({
  visible,
  onClose,
  children,
  composerHeight,
}: PopoverShellProps) {
  if (!visible) return null;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Dismiss" />
      <View style={[styles.sheetWrap, { paddingBottom: composerHeight + 10 }]}>
        <BlurView intensity={48} tint="light" style={styles.sheet}>
          {children}
        </BlurView>
      </View>
    </View>
  );
}

type AttachPopoverProps = {
  onUpload: () => void;
  onTemplate: () => void;
  onSelectModel: () => void;
  activeModelName: string;
  useBrandLogo: boolean;
  useBrandName: boolean;
  useBrandColors: boolean;
  onToggleBrandLogo: (value: boolean) => void;
  onToggleBrandName: (value: boolean) => void;
  onToggleBrandColors: (value: boolean) => void;
};

export function AttachPopover({
  onUpload,
  onTemplate,
  onSelectModel,
  activeModelName,
  useBrandLogo,
  useBrandName,
  useBrandColors,
  onToggleBrandLogo,
  onToggleBrandName,
  onToggleBrandColors,
}: AttachPopoverProps) {
  return (
    <View style={styles.list}>
      <Row
        icon={<UploadIcon />}
        title="Upload reference image"
        subtitle="Keep attachment order for Seedream"
        onPress={onUpload}
      />
      <View style={styles.divider} />
      <Row
        icon={<TemplateIcon />}
        title="Use a template"
        subtitle="Remix a branded starting point"
        onPress={onTemplate}
      />
      <View style={styles.divider} />
      <Row
        icon={<SparkleIcon size={16} color={brand.orangeDeep} />}
        title="Select model"
        subtitle={`Currently: ${activeModelName}`}
        onPress={onSelectModel}
      />
      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>Brand kit for this generation</Text>
      <ToggleRow
        icon={<BrandIcon />}
        title="Use brand logo"
        subtitle="Attach your logo as a reference image"
        value={useBrandLogo}
        onValueChange={onToggleBrandLogo}
      />
      <ToggleRow
        icon={<BrandIcon />}
        title="Use brand name"
        subtitle="Mention your business name in the prompt"
        value={useBrandName}
        onValueChange={onToggleBrandName}
      />
      <ToggleRow
        icon={<BrandIcon />}
        title="Use brand colors"
        subtitle="Apply your brand color palette"
        value={useBrandColors}
        onValueChange={onToggleBrandColors}
      />
    </View>
  );
}

type PastePopoverProps = {
  onPaste: () => void;
};

/** Revealed by long-pressing the attach button when the clipboard has an image. */
export function PastePopover({ onPaste }: PastePopoverProps) {
  return (
    <View style={styles.list}>
      <Row
        icon={<PasteIcon />}
        title="Paste"
        subtitle="Use the image you've copied"
        onPress={onPaste}
      />
    </View>
  );
}

type ModelPopoverProps = {
  activeId: string;
  onSelect: (id: string) => void;
};

export function ModelPopover({ activeId, onSelect }: ModelPopoverProps) {
  return (
    <View style={styles.list}>
      {PLAYGROUND_MODELS.map((model, index) => (
        <View key={model.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <Row
            icon={<SparkleIcon size={16} color={brand.orangeDeep} />}
            title={model.name}
            subtitle={model.description}
            trailing={activeId === model.id ? <CheckIcon /> : null}
            onPress={() => onSelect(model.id)}
          />
        </View>
      ))}
    </View>
  );
}

type FormatPopoverProps = {
  activeId: string;
  onSelect: (id: string) => void;
};

export function FormatPopover({ activeId, onSelect }: FormatPopoverProps) {
  return (
    <View style={styles.formatRow}>
      {PLAYGROUND_FORMATS.map((format) => (
        <FormatSwatch
          key={format.id}
          format={format}
          active={activeId === format.id}
          onPress={() => onSelect(format.id)}
        />
      ))}
    </View>
  );
}

function FormatSwatch({
  format,
  active,
  onPress,
}: {
  format: PlaygroundFormat;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.swatchCard, active && styles.swatchActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={format.label}>
      <View
        style={[
          styles.swatch,
          {
            width: format.swatchW,
            height: format.swatchH,
            backgroundColor: active ? brand.orange : 'rgba(249,115,22,0.22)',
          },
        ]}
      />
      <Text style={[styles.swatchLabel, active && styles.swatchLabelActive]}>{format.label}</Text>
    </Pressable>
  );
}

function Row({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {trailing}
    </Pressable>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={styles.row}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={title}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: brand.orange }}
        thumbColor="#FFFFFF"
        style={styles.toggleSwitch}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 40,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
  },
  sheetWrap: {
    paddingHorizontal: 14,
  },
  sheet: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  list: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orangeSoft,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.ink,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: brand.muted,
  },
  toggleSwitch: {
    pointerEvents: 'none',
  },
  sectionLabel: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 2,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: brand.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148,163,184,0.35)',
    marginHorizontal: 14,
  },
  formatRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  swatchCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: brand.orange,
    backgroundColor: 'rgba(255,237,213,0.85)',
  },
  swatch: {
    borderRadius: 6,
  },
  swatchLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.muted,
  },
  swatchLabelActive: {
    color: brand.orangeDeep,
  },
});
