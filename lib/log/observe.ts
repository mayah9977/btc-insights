export function observe(
  tag: string,
  payload: any,
) {
  if (process.env.LOG_OBSERVATION === 'true') {
    console.debug(`[OBS][${tag}]`, payload)
  }
}
