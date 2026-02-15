import prisma from '../lib/prisma';

export const getPollsByCreator = async (creatorToken: string) => {
  const polls = await prisma.poll.findMany({
    where: { creatorToken },
    include: {
      options: true,
      _count: {
        select: { votes: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return polls;
};

export const getPollStats = async (pollId: string) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        orderBy: { voteCount: 'desc' }
      }
    }
  });

  if (!poll) {
    throw new Error('POLL_NOT_FOUND');
  }

  return poll;
};
