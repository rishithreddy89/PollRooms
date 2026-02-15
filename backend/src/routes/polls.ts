import { Router } from 'express';
import { createPollController, getPollController } from '../controllers/pollController';

const router = Router();

router.post('/', createPollController);
router.get('/:id', getPollController);

export default router;
