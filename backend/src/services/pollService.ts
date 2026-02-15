import prisma from '../lib/prisma';
import { getIO } from '../lib/socket';
import { randomUUID } from 'crypto';

interface CreatePollData {
  question: string;
  options: string[];
  expiresAt: string;
}

export const createPoll = async (data: CreatePollData) => {
  const creatorToken = randomUUID();
  const expirationDate = new Date(data.expiresAt);

  const poll = await prisma.poll.create({
    data: {
      question: data.question,
      creatorToken,
      expiresAt: expirationDate,
      isActive: true,
      totalVotes: 0,
      options: {
        create: data.options.map(text => ({
          text,
          voteCount: 0
        }))
      }
    },
    include: {
      options: true
    }
  });

  return { ...poll, creatorToken };
};

export const getPollById = async (pollId: string) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        orderBy: { text: 'asc' }
      }
    }
  });

  return poll;
};

export const castVote = async (pollId: string, optionId: string, voterIp: string) => {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!poll) {
      throw new Error('POLL_NOT_FOUND');
    }

    if (new Date() > poll.expiresAt) {
      await prisma.poll.update({
        where: { id: pollId },
        data: { isActive: false }
      });
      
      const io = getIO();
      io.to(pollId).emit('poll-closed', { pollId });
      
      throw new Error('POLL_EXPIRED');
    }

    if (!poll.isActive) {
      throw new Error('POLL_CLOSED');
    }

    await prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findUnique({
        where: {
          pollId_voterIp: {
            pollId,
            voterIp
          }
        }
      });

      if (existingVote) {
        throw new Error('ALREADY_VOTED');
      }

      await tx.vote.create({
        data: {
          pollId,
          optionId,
          voterIp
        }
      });

      await tx.option.update({
        where: { id: optionId },
        data: {
          voteCount: {
            increment: 1
          }
        }
      });

      await tx.poll.update({
        where: { id: pollId },
        data: {
          totalVotes: {
            increment: 1
          }
        }
      });
    });

    const updatedPoll = await getPollById(pollId);
    
    const io = getIO();
    io.to(pollId).emit('poll-update', updatedPoll);

    return updatedPoll;
  } catch (error: any) {
    if (['ALREADY_VOTED', 'POLL_EXPIRED', 'POLL_CLOSED', 'POLL_NOT_FOUND'].includes(error.message)) {
      throw error;
    }
    throw new Error('Failed to cast vote');
  }
};

export const hasVoted = async (pollId: string, voterIp: string): Promise<boolean> => {
  const vote = await prisma.vote.findUnique({
    where: {
      pollId_voterIp: {
        pollId,
        voterIp
      }
    }
  });

  return !!vote;
};
