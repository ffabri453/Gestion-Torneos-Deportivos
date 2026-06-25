import pool from '../config/db';

export interface Tournament {
  id: number;
  name: string;
  location: string;
  rules: string;
  format: string;
  modality: string;
  max_teams: number;
  status: string;
  created_at: Date;
}

export interface CreateTournamentInput {
  name: string;
  location: string;
  rules: string;
  format: string;
  modality: string;
  max_teams: number;
  status?: string;
}

export type UpdateTournamentInput = Partial<CreateTournamentInput>;

const tournamentColumns: Record<keyof CreateTournamentInput, string> = {
  name: 'name',
  location: 'location',
  rules: 'rules',
  format: 'format',
  modality: 'modality',
  max_teams: 'max_teams',
  status: 'status',
};

export const getAllTournaments = async (): Promise<Tournament[]> => {
  const result = await pool.query(
    `SELECT id, name, location, rules, format, modality, max_teams, status, created_at
     FROM tournaments
     ORDER BY id ASC`
  );

  return result.rows;
};

export const getTournamentById = async (id: number): Promise<Tournament | null> => {
  const result = await pool.query(
    `SELECT id, name, location, rules, format, modality, max_teams, status, created_at
     FROM tournaments
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
};

export const createTournament = async (tournament: CreateTournamentInput): Promise<Tournament> => {
  const result = await pool.query(
    `INSERT INTO tournaments (name, location, rules, format, modality, max_teams, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, location, rules, format, modality, max_teams, status, created_at`,
    [
      tournament.name,
      tournament.location,
      tournament.rules,
      tournament.format,
      tournament.modality,
      tournament.max_teams,
      tournament.status ?? 'open',
    ]
  );

  return result.rows[0];
};

export const updateTournament = async (
  id: number,
  tournament: UpdateTournamentInput
): Promise<Tournament | null> => {
  const entries = Object.entries(tournament) as [keyof UpdateTournamentInput, string | number][];

  if (entries.length === 0) {
    throw new Error('No tournament fields provided to update');
  }

  const setClause = entries
    .map(([field], index) => `${tournamentColumns[field]} = $${index + 2}`)
    .join(', ');
  const values = entries.map(([, value]) => value);

  const result = await pool.query(
    `UPDATE tournaments
     SET ${setClause}
     WHERE id = $1
     RETURNING id, name, location, rules, format, modality, max_teams, status, created_at`,
    [id, ...values]
  );

  return result.rows[0] ?? null;
};

export const deleteTournament = async (id: number): Promise<Tournament | null> => {
  const result = await pool.query(
    `DELETE FROM tournaments
     WHERE id = $1
     RETURNING id, name, location, rules, format, modality, max_teams, status, created_at`,
    [id]
  );

  return result.rows[0] ?? null;
};
