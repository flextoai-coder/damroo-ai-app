/**
 * Enforces two guarantees the client can't be trusted to enforce itself by
 * merely arranging text in the composer UI:
 *
 * 1. A template's guided-flow selections (pose, angle, style, etc.) are
 *    stated as mandatory and layered on top of — never replaced by — the
 *    user's free-text prompt.
 * 2. Reference images are given an explicit role: the product must be
 *    preserved as-is (it's what gets swapped into the scene), while
 *    everything else is a flexible supporting reference (face, background,
 *    or whatever the prompt directs).
 */

/**
 * Combines a template's locked instruction text with the user's free-text
 * prompt, framing the locked text as non-negotiable. If there's no locked
 * text, this is just the free text unchanged.
 */
export function withPromptPriority(lockedPrompt: string | null, freePrompt: string): string {
  const locked = lockedPrompt?.trim();
  const free = freePrompt.trim();
  if (!locked) return free;

  const parts = [
    `Mandatory composition (from the user's explicit template selections — follow exactly, do not alter, drop, or reinterpret any part of it, even if it seems to conflict with anything below): ${locked}`,
    `This composition describes the STYLE, framing, pose, lighting, and mood to replicate — never a specific product or person to copy. Always feature the exact product from the user's own attached reference image(s); never invent, substitute, or borrow a product from anywhere else. If a person is depicted, generate their face and identity freshly — never reproduce a specific real person's likeness.`,
  ];
  if (free) {
    parts.push(
      `Additional direction from the user (apply this only where it does not contradict the mandatory composition above): ${free}`,
    );
  }
  return parts.join('\n\n');
}

/**
 * Appends role instructions for the attached reference images, given how
 * many of the product/other images are in `reference_images` (the product
 * ones come first, per `modelReferenceAttachments`) — mirrors
 * `withBrandContext`'s append style. `logoPrepended` accounts for a brand
 * logo having been inserted at the very front of `reference_images`
 * server-side, after these counts were computed — without the offset, "the
 * first N images" would wrongly point at the logo instead of the product.
 * The logo's own role is covered separately by the brand kit instructions.
 */
export function withReferenceRoleContext(
  prompt: string,
  productCount: number,
  otherCount: number,
  logoPrepended = false,
): string {
  const base = prompt.trim();
  if (productCount <= 0 && otherCount <= 0) return base;

  const lines: string[] = [];
  if (productCount > 0) {
    const noun = productCount === 1 ? 'image shows' : 'images show';
    lines.push(
      `${logoPrepended ? 'After the brand logo, the next' : 'The first'} ${productCount} reference ${noun} the exact product to feature in the result — this is what gets swapped into the scene. Preserve its identity, shape, label, and design exactly as shown; do not substitute, redesign, or reinterpret it.`,
    );
  }
  if (otherCount > 0) {
    const noun = otherCount === 1 ? 'image is' : 'images are';
    lines.push(
      `The remaining reference ${noun} supporting reference only (e.g. a face to use, a background, or a style cue) — apply ${otherCount === 1 ? 'it' : 'them'} only as directed by the prompt text above. ${otherCount === 1 ? 'It must' : 'They must'} never replace or alter the product.`,
    );
  }
  if (!lines.length) return base;

  const block = `Reference image roles (in attachment order):\n${lines.map((l) => `- ${l}`).join('\n')}`;
  return base ? `${base}\n\n${block}` : block;
}

const VARIATION_COPY: Record<'subtle' | 'balanced' | 'bold', string> = {
  subtle:
    'very close to each other — the same pose, camera angle, and styling throughout, with only minor, natural differences (e.g. lighting or framing)',
  balanced:
    'clearly distinct from each other — vary the pose, camera angle, and styling noticeably across images while keeping the same overall concept',
  bold: 'strongly distinct from each other — give each image a different pose, camera angle, background treatment, and visual style, pushing creative range while staying on the same core idea',
};

/**
 * Appends batch-variation instructions when generating more than one image
 * at once — meaningless (and skipped) for a single image. Always reinforces
 * that the product/reference subject's identity must not vary between
 * images, since "make these different" is exactly the kind of instruction a
 * model could otherwise misapply to the subject itself, not just the style.
 */
export function withVariationContext(
  prompt: string,
  variation: 'subtle' | 'balanced' | 'bold',
  imageCount: number,
): string {
  const base = prompt.trim();
  if (imageCount <= 1) return base;

  const copy = VARIATION_COPY[variation] ?? VARIATION_COPY.balanced;
  const block =
    `Generating ${imageCount} images in this batch, as ${imageCount} separate, independent, full-frame outputs — ` +
    `each one is its own single standalone photo. Never combine multiple poses, angles, or looks into one frame, ` +
    `and never add a dividing line, border, split-screen, before/after layout, grid, or collage within any single ` +
    `image — that only belongs in one image if the user explicitly asked for a comparison/grid image. Keep the ` +
    `exact same core subject, setting, and concept across all of them, but make the images ${copy}. The product and ` +
    `any reference subject/face shown in the attached images must stay exactly as shown in every image — never ` +
    `redesign, restyle, or change their identity between variations. Only the composition, pose, camera angle, and ` +
    `surrounding style should vary.`;
  return base ? `${base}\n\n${block}` : block;
}
