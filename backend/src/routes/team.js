const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team/teamController');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { z } = require('zod');

// All routes require authentication
router.use(protect);

// Create team
router.post(
  '/',
  validate(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional()
    })
  ),
  teamController.createTeam
);

// Get team details
router.get(
  '/:teamId',
  validate(
    z.object({
      teamId: z.string()
    })
  ),
  teamController.getTeam
);

// Get user's teams
router.get(
  '/my-teams',
  teamController.getUserTeams
);

// Join team
router.post(
  '/:teamId/join',
  validate(
    z.object({
      teamId: z.string()
    })
  ),
  teamController.joinTeam
);

// Leave team
router.post(
  '/:teamId/leave',
  validate(
    z.object({
      teamId: z.string()
    })
  ),
  teamController.leaveTeam
);

// Get team tournaments
router.get(
  '/:teamId/tournaments',
  validate(
    z.object({
      teamId: z.string()
    })
  ),
  teamController.getTeamTournaments
);

module.exports = router;
