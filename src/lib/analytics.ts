type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type AnalyticsEvent =
  | 'generation_success'
  | 'generation_fail'
  | 'enhance_prompt'
  | 'pay_conversion'
  | 'share_generation'
  | 'template_remix';

/**
 * Lightweight instrumentation hook.
 * Logs in __DEV__; swap `sink` for Segment/Amplitude later without touching call sites.
 */
let sink: ((event: AnalyticsEvent, props?: AnalyticsProps) => void) | null = null;

export function setAnalyticsSink(
  next: ((event: AnalyticsEvent, props?: AnalyticsProps) => void) | null,
) {
  sink = next;
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props ?? {});
  }
  sink?.(event, props);
}
