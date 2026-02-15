import { Router } from 'express';
import { getCreatorDashboard } from '../controllers/creatorController';

const router = Router();

router.get('/:creatorToken', getCreatorDashboard);

export default router;
