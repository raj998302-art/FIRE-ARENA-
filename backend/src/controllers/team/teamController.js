const { db } = require('../models');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

require('dotenv').config();

// Create team
exports.createTeam = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  const userId = req.user.id;
  
  // Validate input
  if (!name || name.trim() === '') {
    return next(new AppError('Team name is required', 400));
  }
  
  try {
    // Check if user already captains a team
    const existingTeamAsCaptain = await db.Team.findOne({
      where: {
        captainId: userId,
        status: 'active'
      }
    });
    
    if (existingTeamAsCaptain) {
      return next(new AppError('You are already captain of an active team', 400));
    }
    
    // Check if team name already exists
    const existingTeam = await db.Team.findOne({
      where: {
        name: name.trim(),
        status: 'active'
      }
    });
    
    if (existingTeam) {
      return next(new AppError('Team name already exists', 400));
    }
    
    // Start transaction
    const transaction = await db.sequelize.transaction();
    
    // Create team
    const team = await db.Team.create(
      {
        name: name.trim(),
        description: description || '',
        captainId: userId,
        maxMembers: 4,
        currentMembers: 1, // Captain is first member
        status: 'active',
        createdBy: userId,
        updatedBy: userId
      },
      { transaction }
    );
    
    // Add captain as team member
    await db.TeamMember.create(
      {
        teamId: team.id,
        userId: userId,
        role: 'captain',
        joinedAt: new Date(),
        isActive: true
      },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(201).json({
      status: 'success',
      message: 'Team created successfully',
      data: {
        team: {
          id: team.id,
          name: team.name,
          description: team.description,
          captainId: team.captainId,
          maxMembers: team.maxMembers,
          currentMembers: team.currentMembers,
          status: team.status,
          createdAt: team.createdAt
        }
      }
    });
  } catch (error) {
    return next(new AppError('Failed to create team', 500));
  }
});

// Get team details
exports.getTeam = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const userId = req.user.id;
  
  try {
    const team = await db.Team.findByPk(teamId, {
      include: [
        {
          model: db.User,
          as: 'captain',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: db.TeamMember,
          as: 'members',
          include: [
            {
              model: db.User,
              attributes: ['id', 'username', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });
    
    if (!team) {
      return next(new AppError('Team not found', 404));
    }
    
    // Check if user is member of team (or get limited info if not)
    const isMember = team.members.some(member => member.userId === userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        team: {
          id: team.id,
          name: team.name,
          description: team.description,
          captain: team.captain ? {
            id: team.captain.id,
            username: team.captain.username,
            firstName: team.captain.firstName,
            lastName: team.captain.lastName
          } : null,
          maxMembers: team.maxMembers,
          currentMembers: team.currentMembers,
          status: team.status,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          members: isMember ? team.members.map(member => ({
            id: member.id,
            userId: member.userId,
            role: member.role,
            joinedAt: member.joinedAt,
            isActive: member.isActive,
            user: member.User ? {
              id: member.User.id,
              username: member.User.username,
              firstName: member.User.firstName,
              lastName: member.User.lastName
            } : null
          })) : []
        }
      }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch team details', 500));
  }
});

// Get user's teams
exports.getUserTeams = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  try {
    const teams = await db.Team.findAll({
      where: {
        [db.Sequelize.Or]: [
          { captainId: userId },
          { '$members.userId$': userId }
        ]
      },
      include: [
        {
          model: db.User,
          as: 'captain',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: db.TeamMember,
          as: 'members',
          include: [
            {
              model: db.User,
              attributes: ['id', 'username', 'firstName', 'lastName']
            }
          ],
          where: {
            isActive: true
          }
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        teams: teams.map(team => ({
          id: team.id,
          name: team.name,
          description: team.description,
          captain: team.captain ? {
            id: team.captain.id,
            username: team.captain.username,
            firstName: team.captain.firstName,
            lastName: team.captain.lastName
          } : null,
          maxMembers: team.maxMembers,
          currentMembers: team.currentMembers,
          status: team.status,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          memberCount: team.members.filter(m => m.isActive).length,
          isCaptain: team.captainId === userId,
          isMember: team.members.some(m => m.userId === userId && m.isActive)
        }))
      }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch user teams', 500));
  }
});

// Join team
exports.joinTeam = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const userId = req.user.id;
  
  try {
    // Get team
    const team = await db.Team.findByPk(teamId, {
      include: [
        {
          model: db.TeamMember,
          as: 'members',
          where: {
            isActive: true
          }
        }
      ]
    });
    
    if (!team) {
      return next(new AppError('Team not found', 404));
    }
    
    // Check if team is active
    if (team.status !== 'active') {
      return next(new AppError('Team is not active', 400));
    }
    
    // Check if team is full
    if (team.isFull()) {
      return next(new AppError('Team is full', 400));
    }
    
    // Check if user is already a member
    const isAlreadyMember = team.members.some(member => member.userId === userId);
    
    if (isAlreadyMember) {
      return next(new AppError('You are already a member of this team', 400));
    }
    
    // Check if user is already captain of another team
    const otherTeamAsCaptain = await db.Team.findOne({
      where: {
        captainId: userId,
        status: 'active'
      }
    });
    
    if (otherTeamAsCaptain) {
      return next(new AppError('You are already captain of another team', 400));
    }
    
    // Add user to team
    await db.TeamMember.create(
      {
        teamId,
        userId,
        role: 'member',
        joinedAt: new Date(),
        isActive: true
      }
    );
    
    // Update team member count
    await team.increment('currentMembers');
    
    res.status(200).json({
      status: 'success',
      message: 'Joined team successfully',
      data: {
        team: {
          id: team.id,
          name: team.name,
          currentMembers: team.currentMembers + 1
        }
      }
    });
  } catch (error) {
    return next(new AppError('Failed to join team', 500));
  }
});

// Leave team
exports.leaveTeam = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const userId = req.user.id;
  
  try {
    // Get team
    const team = await db.Team.findByPk(teamId, {
      include: [
        {
          model: db.TeamMember,
          as: 'members'
        }
      ]
    });
    
    if (!team) {
      return next(new AppError('Team not found', 404));
    }
    
    // Get user's membership
    const membership = team.members.find(member => member.userId === userId);
    
    if (!membership) {
      return next(new AppError('You are not a member of this team', 400));
    }
    
    // Check if user is captain
    if (membership.role === 'captain') {
      // Check if team has other members
      const otherMembers = team.members.filter(m => m.userId !== userId && m.isActive);
      
      if (otherMembers.length > 0) {
        return next(new AppError('Cannot leave team as captain. Transfer captaincy first or disband team.', 400));
      }
      
      // If no other members, disband team
      await team.update({
        status: 'disbanded',
        updatedBy: userId
      });
      
      // Update memberships
      await db.TeamMember.update(
        { isActive: false },
        { where: { teamId } }
      );
      
      res.status(200).json({
        status: 'success',
        message: 'Team disbanded successfully (no other members)',
        data: {
          team: {
            id: team.id,
            status: team.status
          }
        }
      );
    } else {
      // Regular member leaving
      await membership.update({
        leftAt: new Date(),
        isActive: false
      });
      
      // Update team member count
      await team.decrement('currentMembers');
      
      res.status(200).json({
        status: 'success',
        message: 'Left team successfully',
        data: {
          team: {
            id: team.id,
            currentMembers: team.currentMembers - 1
          }
        }
      });
    }
  } catch (error) {
    return next(new AppError('Failed to leave team', 500));
  }
});

// Get team tournaments
exports.getTeamTournaments = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const userId = req.user.id;
  
  try {
    // Verify user is member of team
    const team = await db.Team.findByPk(teamId, {
      include: [
        {
          model: db.TeamMember,
          as: 'members',
          where: {
            userId: userId,
            isActive: true
          }
        }
      ]
    });
    
    if (!team) {
      return next(new AppError('Team not found or you are not a member', 404));
    }
    
    // Get tournaments where team participated
    const tournaments = await db.Tournament.findAll({
      include: [
        {
          model: db.TournamentParticipant,
          as: 'participants',
          where: {
            teamId
          }
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        tournaments: tournaments.map(tournament => ({
          id: tournament.id,
          title: tournament.title,
          description: tournament.description,
          gameMode: tournament.gameMode,
          maxPlayers: tournament.maxPlayers,
          entryFee: tournament.entryFee,
          prizePool: tournament.prizePool,
          status: tournament.status,
          startTime: tournament.startTime,
          endTime: tournament.endTime,
          participantCount: tournament.participants.length
        }))
      }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch team tournaments', 500));
  }
});

module.exports = exports;
