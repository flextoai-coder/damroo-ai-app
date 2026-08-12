import { useState } from 'react';

import { parseTemplateRemixConfig, type Template } from '@/services/templates';
import type { TemplateRemixConfig, TemplateStepSelections } from '@/types/template-remix';

type UseTemplateConfigureFlowOptions = {
  /** selections is null only for the short-circuit path (template has no remix_steps). */
  onComplete: (template: Template, selections: TemplateStepSelections | null) => void;
  /** Fired when the user backs out of an in-progress wizard. Not fired on the short-circuit path. */
  onCancel?: () => void;
};

/**
 * Centralizes the "does this template need a guided wizard" gate so every
 * remix entry point (Templates tab, Home rail, deep link, in-chat picker)
 * shares one decision instead of duplicating parseTemplateRemixConfig checks.
 */
export function useTemplateConfigureFlow({ onComplete, onCancel }: UseTemplateConfigureFlowOptions) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [config, setConfig] = useState<TemplateRemixConfig | null>(null);

  const open = (candidate: Template) => {
    const parsed = parseTemplateRemixConfig(candidate);
    if (!parsed) {
      onComplete(candidate, null);
      return;
    }
    setTemplate(candidate);
    setConfig(parsed);
  };

  const close = () => {
    setTemplate(null);
    setConfig(null);
  };

  const finish = (selections: TemplateStepSelections) => {
    if (!template) return;
    const completed = template;
    close();
    onComplete(completed, selections);
  };

  const cancel = () => {
    const wasOpen = template !== null;
    close();
    if (wasOpen) onCancel?.();
  };

  return {
    visible: template !== null && config !== null,
    template,
    config,
    open,
    finish,
    cancel,
  };
}
