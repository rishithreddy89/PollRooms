import { Router } from 'express';
import { voteController, checkVoteStatusController } from '../controllers/voteController';

const router = Router();

router.post('/:id/vote', voteController);
router.get('/:id/vote-status', checkVoteStatusController);

export default router;
