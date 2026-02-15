import { Router } from 'express';
import { createPollController, getAllPollsController, getPollController } from '../controllers/pollController';

const router = Router();

router.post('/', createPollController);
router.get('/', getAllPollsController);
router.get('/:id', getPollController);

export default router;
