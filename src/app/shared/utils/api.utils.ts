/**
 * Converts the internal team ID used by the UI to the API team ID format.
 * The sentinel value '1' means "all teams", which the API represents as no teamId param.
 */
export function toApiTeamId(teamId: string): string | undefined {
  return teamId === '1' ? undefined : teamId;
}
