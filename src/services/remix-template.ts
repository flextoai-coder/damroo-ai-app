import { track } from '@/lib/analytics';
import {
  defaultTemplateSelections,
  interpolateTemplatePrompt,
  parseTemplateRemixConfig,
  templatePreviewUrl,
  type Template,
} from '@/services/templates';
import { useChatComposerStore } from '@/stores/chat-composer-store';
import { usePlaygroundStore } from '@/stores/playground-store';
import { toast } from '@/stores/toast-store';
import type { TemplateStepSelections } from '@/types/template-remix';

export function applyTemplateToComposer(
  template: Template,
  selections?: TemplateStepSelections | null,
) {
  const composer = useChatComposerStore.getState();
  const config = parseTemplateRemixConfig(template);
  const resolvedSelections = config
    ? (selections ?? defaultTemplateSelections(config.steps))
    : null;

  const finalPrompt =
    config && resolvedSelections
      ? interpolateTemplatePrompt(template.base_prompt, config.steps, resolvedSelections)
      : template.base_prompt;

  // The interpolated template text is locked, not dropped into the editable
  // prompt field — otherwise the user's own edits could silently erase the
  // explicit choices they just made in the guided flow. Free text starts
  // clean; whatever the user types is additional direction layered on top.
  composer.setTemplateLockedPrompt(finalPrompt);
  composer.setPrompt('');
  composer.setAspectRatio(template.default_aspect_ratio);
  composer.setQuality(template.default_quality);
  composer.setTemplateId(template.id);

  // Whitelist user uploads/product images only — two template-origin kinds
  // exist ('template' preview + 'template-option' picks), both rebuilt below.
  const preserved = composer.attachments.filter(
    (a) => a.kind === 'reference' || a.kind === 'product',
  );
  composer.reorderAttachments(preserved);

  let truncated = false;

  const preview = templatePreviewUrl(template.preview_storage_path);
  if (preview) {
    const added = composer.addAttachment({
      id: `tpl_${template.id}`,
      uri: preview,
      kind: 'template',
      title: template.title,
      status: 'ready',
    });
    if (!added) truncated = true;
  }

  if (config && resolvedSelections) {
    for (const step of config.steps) {
      const option =
        step.options.find((o) => o.id === resolvedSelections[step.id]) ?? step.options[0];
      const uri = option?.referenceImageUrl || option?.thumbnailUrl;
      if (!option || !uri) continue;
      // Every picked step option shows in the Reference stack, matching the
      // guided flow the user actually stepped through — but only options
      // explicitly marked `attachAsReference` are sent to the model as an
      // image reference. The rest are tagged 'template' (display-only, same
      // as the template's own cover shot) purely for visual continuity.
      const added = composer.addAttachment({
        id: `tplopt_${template.id}_${step.id}`,
        uri,
        kind: option.attachAsReference ? 'template-option' : 'template',
        title: `${step.title}: ${option.label}`,
        status: 'ready',
      });
      if (!added) truncated = true;
    }
  }

  if (truncated) {
    toast('Some reference images were skipped (14 max)', 'error');
  }

  track('template_remix', {
    template_id: template.id,
    title: template.title,
    configured: Boolean(selections),
  });
}

/** Full remix from Templates tab — clears chat memory then prefills composer. */
export function loadTemplateIntoPlayground(
  template: Template,
  selections?: TemplateStepSelections | null,
) {
  usePlaygroundStore.getState().clear();
  useChatComposerStore.getState().reset();
  applyTemplateToComposer(template, selections);
}

/**
 * In-Playground picker — prefills composer without wiping the conversation.
 * Swaps the template attachment while preserving reference uploads.
 */
export function pickTemplateInPlayground(
  template: Template,
  selections?: TemplateStepSelections | null,
) {
  applyTemplateToComposer(template, selections);
}
