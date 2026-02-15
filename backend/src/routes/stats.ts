import { Router } from 'express';
import { getPollStatsController } from '../controllers/creatorController';

const router = Router();

router.get('/:id/stats', getPollStatsController);

export default router;
