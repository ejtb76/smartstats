import type { Team } from '../types';

const TEAMS_KEY = 'smartstats-teams';
const ACTIVE_TEAM_KEY = 'smartstats-active-team';

function migrateIfNeeded() {
  if (localStorage.getItem(TEAMS_KEY)) return;

  const hasRoster = localStorage.getItem('smartstats-roster');
  const hasGames = localStorage.getItem('smartstats-games');

  if (hasRoster || hasGames) {
    const defaultTeam: Team = { id: crypto.randomUUID(), name: 'My Team' };
    localStorage.setItem(TEAMS_KEY, JSON.stringify([defaultTeam]));
    localStorage.setItem(ACTIVE_TEAM_KEY, defaultTeam.id);

    if (hasRoster) {
      localStorage.setItem(`smartstats-roster-${defaultTeam.id}`, hasRoster);
      localStorage.removeItem('smartstats-roster');
    }
    if (hasGames) {
      localStorage.setItem(`smartstats-games-${defaultTeam.id}`, hasGames);
      localStorage.removeItem('smartstats-games');
    }
  }
}

export function loadTeams(): Team[] {
  migrateIfNeeded();
  try {
    const data = localStorage.getItem(TEAMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getActiveTeamId(): string | null {
  migrateIfNeeded();
  return localStorage.getItem(ACTIVE_TEAM_KEY);
}

export function setActiveTeamId(id: string) {
  localStorage.setItem(ACTIVE_TEAM_KEY, id);
}

export function createTeam(name: string): Team {
  const teams = loadTeams();
  const team: Team = { id: crypto.randomUUID(), name };
  teams.push(team);
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  return team;
}

export function renameTeam(id: string, name: string) {
  const teams = loadTeams();
  const team = teams.find(t => t.id === id);
  if (team) {
    team.name = name;
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  }
}

export function deleteTeam(id: string) {
  let teams = loadTeams();
  teams = teams.filter(t => t.id !== id);
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  localStorage.removeItem(`smartstats-roster-${id}`);
  localStorage.removeItem(`smartstats-games-${id}`);

  if (getActiveTeamId() === id) {
    const next = teams[0];
    if (next) {
      setActiveTeamId(next.id);
    } else {
      localStorage.removeItem(ACTIVE_TEAM_KEY);
    }
  }
}

export function ensureActiveTeam(): string {
  migrateIfNeeded();
  let teamId = getActiveTeamId();
  const teams = loadTeams();

  if (teamId && teams.some(t => t.id === teamId)) return teamId;

  if (teams.length > 0) {
    setActiveTeamId(teams[0].id);
    return teams[0].id;
  }

  const team = createTeam('My Team');
  setActiveTeamId(team.id);
  return team.id;
}
