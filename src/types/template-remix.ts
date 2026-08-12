/** A single selectable choice within a guided remix step. */
export type TemplateStepOption = {
  id: string;
  label: string;
  /** Substituted for every {step.id} token in base_prompt when this option is selected. */
  promptFragment: string;
  thumbnailUrl?: string;
  /** Only meaningful when attachAsReference is true. Falls back to thumbnailUrl if absent. */
  referenceImageUrl?: string;
  /** When true, this option's image is attached as a Seedream reference image. */
  attachAsReference?: boolean;
};

/** One step of a guided template remix wizard (e.g. "Choose a model"). */
export type TemplateStep = {
  /** Also the {token} name substituted into base_prompt, and the key in TemplateStepSelections. */
  id: string;
  title: string;
  subtitle?: string;
  /** Guaranteed non-empty by parseTemplateRemixConfig. */
  options: TemplateStepOption[];
};

/** Parsed shape of templates.remix_steps. Null/absent on the row = instant remix, no wizard. */
export type TemplateRemixConfig = {
  version: 1;
  /** Guaranteed non-empty by parseTemplateRemixConfig. */
  steps: TemplateStep[];
};

/** stepId -> optionId */
export type TemplateStepSelections = Record<string, string>;
