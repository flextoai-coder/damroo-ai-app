import { track } from '@/lib/analytics';
import { templatePreviewUrl, type Template } from '@/services/templates';
import { useChatComposerStore } from '@/stores/chat-composer-store';
import { usePlaygroundStore } from '@/stores/playground-store';

function applyTemplateToComposer(template: Template) {
  const composer = useChatComposerStore.getState();

  composer.setPrompt(template.base_prompt);
  composer.setAspectRatio(template.default_aspect_ratio);
  composer.setQuality(template.default_quality);
  composer.setTemplateId(template.id);

  // Replace prior template attachments; keep user reference uploads in order.
  const references = composer.attachments.filter((a) => a.kind !== 'template');
  composer.reorderAttachments(references);

  const preview = templatePreviewUrl(template.preview_storage_path);
  if (preview) {
    composer.addAttachment({
      id: `tpl_${template.id}`,
      uri: preview,
      kind: 'template',
      title: template.title,
    });
  }

  track('template_remix', { template_id: template.id, title: template.title });
}

/** Full remix from Templates tab — clears chat memory then prefills composer. */
export function loadTemplateIntoPlayground(template: Template) {
  usePlaygroundStore.getState().clear();
  useChatComposerStore.getState().reset();
  applyTemplateToComposer(template);
}

/**
 * In-Playground picker — prefills composer without wiping the conversation.
 * Swaps the template attachment while preserving reference uploads.
 */
export function pickTemplateInPlayground(template: Template) {
  applyTemplateToComposer(template);
}
