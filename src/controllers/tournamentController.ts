import { Request, Response } from 'express';
import {
  CreateTournamentInput,
  UpdateTournamentInput,
  createTournament,
  deleteTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament,
} from '../models/Tournament';

const allowedFormats = ['league', 'knockout', 'group_stage'];
const allowedModalities = ['futbol_5', 'futbol_7', 'futbol_8', 'futbol_11'];
const allowedStatuses = ['open', 'in_progress', 'finished'];
const allowedUpdateFields = ['name', 'location', 'rules', 'format', 'modality', 'max_teams', 'status'];

const isObjectBody = (body: unknown): body is Record<string, unknown> => {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
};

const getIdParam = (id: unknown): number | null => {
  if (typeof id !== 'string') {
    return null;
  }

  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const parsePositiveInteger = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
};

const validateCreateTournament = (
  body: unknown
): { data?: CreateTournamentInput; errors: string[] } => {
  const errors: string[] = [];

  if (!isObjectBody(body)) {
    return { errors: ['Request body must be a JSON object'] };
  }

  const name = isNonEmptyString(body.name) ? body.name.trim() : null;
  const location = isNonEmptyString(body.location) ? body.location.trim() : null;
  const rules = isNonEmptyString(body.rules) ? body.rules.trim() : null;
  const format = isNonEmptyString(body.format) ? body.format : null;
  const modality = isNonEmptyString(body.modality) ? body.modality : null;
  const status = isNonEmptyString(body.status) ? body.status : 'open';

  if (!name) errors.push('name is required');
  if (!location) errors.push('location is required');
  if (!rules) errors.push('rules is required');

  if (!format) {
    errors.push('format is required');
  } else if (!allowedFormats.includes(format)) {
    errors.push(`format must be one of: ${allowedFormats.join(', ')}`);
  }

  if (!modality) {
    errors.push('modality is required');
  } else if (!allowedModalities.includes(modality)) {
    errors.push(`modality must be one of: ${allowedModalities.join(', ')}`);
  }

  const maxTeams = parsePositiveInteger(body.max_teams);
  if (maxTeams === null) {
    errors.push('max_teams is required and must be a positive integer');
  }

  if (body.status !== undefined && body.status !== null) {
    if (!isNonEmptyString(body.status) || !allowedStatuses.includes(status)) {
      errors.push(`status must be one of: ${allowedStatuses.join(', ')}`);
    }
  }

  if (errors.length > 0 || maxTeams === null || !name || !location || !rules || !format || !modality) {
    return { errors };
  }

  return {
    errors,
    data: {
      name,
      location,
      rules,
      format,
      modality,
      max_teams: maxTeams,
      status,
    },
  };
};

const validateUpdateTournament = (
  body: unknown
): { data?: UpdateTournamentInput; errors: string[] } => {
  const errors: string[] = [];
  const data: UpdateTournamentInput = {};

  if (!isObjectBody(body)) {
    return { errors: ['Request body must be a JSON object'] };
  }

  const fields = Object.keys(body);

  if (fields.length === 0) {
    return { errors: ['Request body cannot be empty'] };
  }

  for (const field of fields) {
    if (!allowedUpdateFields.includes(field)) {
      errors.push(`${field} is not a valid tournament field`);
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    if (!isNonEmptyString(body.name)) errors.push('name cannot be empty');
    else data.name = body.name.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'location')) {
    if (!isNonEmptyString(body.location)) errors.push('location cannot be empty');
    else data.location = body.location.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'rules')) {
    if (!isNonEmptyString(body.rules)) errors.push('rules cannot be empty');
    else data.rules = body.rules.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'format')) {
    if (!isNonEmptyString(body.format) || !allowedFormats.includes(body.format)) {
      errors.push(`format must be one of: ${allowedFormats.join(', ')}`);
    } else {
      data.format = body.format;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'modality')) {
    if (!isNonEmptyString(body.modality) || !allowedModalities.includes(body.modality)) {
      errors.push(`modality must be one of: ${allowedModalities.join(', ')}`);
    } else {
      data.modality = body.modality;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'max_teams')) {
    const maxTeams = parsePositiveInteger(body.max_teams);

    if (maxTeams === null) {
      errors.push('max_teams must be a positive integer');
    } else {
      data.max_teams = maxTeams;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    if (!isNonEmptyString(body.status) || !allowedStatuses.includes(body.status)) {
      errors.push(`status must be one of: ${allowedStatuses.join(', ')}`);
    } else {
      data.status = body.status;
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { errors, data };
};

export const getTournaments = async (req: Request, res: Response): Promise<void> => {
  try {
    const tournaments = await getAllTournaments();

    res.status(200).json(tournaments);
  } catch (error: any) {
    res.status(500).json({
      error: true,
      message: 'Error getting tournaments',
      detail: error.message
    });
  }
};

export const getTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getIdParam(req.params.id);

    if (id === null) {
      res.status(400).json({ message: 'Invalid tournament id' });
      return;
    }

    const tournament = await getTournamentById(id);

    if (!tournament) {
      res.status(404).json({ message: 'Tournament not found' });
      return;
    }

    res.status(200).json(tournament);
  } catch (error: any) {
    res.status(500).json({
      error: true,
      message: 'Error getting tournament',
      detail: error.message
    });
  }
};

export const postTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateCreateTournament(req.body);

    if (!validation.data) {
      res.status(400).json({
        message: 'Invalid tournament data',
        errors: validation.errors
      });
      return;
    }

    const tournament = await createTournament(validation.data);

    res.status(201).json(tournament);
  } catch (error: any) {
    res.status(500).json({
      error: true,
      message: 'Error creating tournament',
      detail: error.message
    });
  }
};

export const putTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getIdParam(req.params.id);

    if (id === null) {
      res.status(400).json({ message: 'Invalid tournament id' });
      return;
    }

    const validation = validateUpdateTournament(req.body);

    if (!validation.data) {
      res.status(400).json({
        message: 'Invalid tournament data',
        errors: validation.errors
      });
      return;
    }

    const tournament = await updateTournament(id, validation.data);

    if (!tournament) {
      res.status(404).json({ message: 'Tournament not found' });
      return;
    }

    res.status(200).json(tournament);
  } catch (error: any) {
    res.status(500).json({
      error: true,
      message: 'Error updating tournament',
      detail: error.message
    });
  }
};

export const removeTournament = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getIdParam(req.params.id);

    if (id === null) {
      res.status(400).json({ message: 'Invalid tournament id' });
      return;
    }

    const tournament = await deleteTournament(id);

    if (!tournament) {
      res.status(404).json({ message: 'Tournament not found' });
      return;
    }

    res.status(200).json({ message: 'Tournament deleted successfully' });
  } catch (error: any) {
    res.status(500).json({
      error: true,
      message: 'Error deleting tournament',
      detail: error.message
    });
  }
};
