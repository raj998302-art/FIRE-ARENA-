const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournaments/tournamentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { z } = require('zod');

// All routes require authentication
router.use(protect);

// Create tournament (requires appropriate permissions)
router.post(
  '/',
  validate(
    z.object({
      title: z.string().min(3).max(100),
      description: z.string().optional(),
      gameMode: z.enum(['solo', 'duo', 'squad']),
      maxPlayers: z.number().int().positive(),
      entryFee: z.number().nonnegative().optional(),
      prizeDistribution: z.object({}).optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      registrationDeadline: z.string().datetime().optional(),
      isVipOnly: z.boolean().optional(),
      minVipLevel: z.number().int().nonnegative().optional(),
      autoStartWhenFull: z.boolean().optional()
    })
  ),
  tournamentController.createTournament
);

// Get tournament details
router.get(
  '/:tournamentId',
  validate(
    z.object({
      tournamentId: z.string()
    })
  ),
  tournamentController.getTournament
);

// Get list of tournaments
router.get(
  '/',
  tournamentController.getTournaments
);

// Join tournament
router.post(
  '/:tournamentId/join',
  validate(
    z.object({
      tournamentId: z.string()
    })
  ),
  tournamentController.joinTournament
);

// Leave tournament
router.post(
  '/:tournamentId/leave',
  validate(
    z.object({
      tournamentId: z.string()
    })
  ),
  tournamentController.leaveTournament
);

// Start tournament (requires tournament manager or higher)
router.post(
  '/:tournamentId/start',
  validate(
    z.object({
      tournamentId: z.string()
    })
  ),
  authorize(
    'HEAD_TOURNAMENT_MANAGER',
    'SENIOR_TOURNAMENT_MANAGER',
    'TOURNAMENT_MANAGER',
    'HEAD_TECHNICAL_MANAGER',
    'TECHNICAL_MANAGER',
    'HEAD_ADMIN',
    'SENIOR_ADMIN',
    'ADMIN',
    'OWNER',
    'CO_OWNER',
    'FAM_MANAGER'
  ),
  tournamentController.startTournament
);

// Complete tournament (requires tournament manager or higher)
router.post(
  '/:tournamentId/complete',
  validate(
    z.object({
      tournamentId: z.string(),
      results: z.array(
        z.object({
          userId: z.string(),
          position: z.number().int().positive(),
          prizeAmount: z.number().nonnegative()
        })
      )
    })
  ),
  authorize(
    'HEAD_TOURNAMENT_MANAGER',
    'SENIOR_TOURNAMENT_MANAGER',
    'TOURNAMENT_MANAGER',
    'HEAD_TECHNICAL_MANAGER',
    'TECHNICAL_MANAGER',
    'HEAD_ADMIN',
    'SENIOR_ADMIN',
    'ADMIN',
    'OWNER',
    'CO_OWNER',
    'FAM_MANAGER'
  ),
  tournamentController.completeTournament
);

// Cancel tournament (requires tournament manager or higher)
router.post(
  '/:tournamentId/cancel',
  validate(
    z.object({
      tournamentId: z.string()
    })
  ),
  authorize(
    'HEAD_TOURNAMENT_MANAGER',
    'SENIOR_TOURNAMENT_MANAGER',
    'TOURNAMENT_MANAGER',
    'HEAD_TECHNICAL_MANAGER',
    'TECHNICAL_MANAGER',
    'HEAD_ADMIN',
    'SENIOR_ADMIN',
    'ADMIN',
    'OWNER',
    'CO_OWNER',
    'FAM_MANAGER'
  ),
  tournamentController.cancelTournament
);

module.exports = router;
