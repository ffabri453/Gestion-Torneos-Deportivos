import { Router } from 'express';
import { getTournaments } from '../controllers/tournamentController';

const router = Router();

router.get('/tournaments', getTournaments);

export default router;