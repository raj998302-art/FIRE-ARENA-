const { db } = require('../models');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

require('dotenv').config();

// Create tournament
exports.createTournament = catchAsync(async (req, res, next) => {
  const {
    title, description, gameMode, maxPlayers, entryFee, 
    prizeDistribution, startTime, endTime, registrationDeadline,
    isVipOnly, minVipLevel, autoStartWhenFull
  } = req.body;
  const userId = req.user.id;
  
  // Validate required fields
  if (!title || !gameMode || !maxPlayers) {
    return next(new AppError('Please provide title, game mode, and max players', 400));
  }
  
  // Validate game mode
  if (!['solo', 'duo', 'squad'].includes(gameMode)) {
    return next(new AppError('Invalid game mode', 400));
  }
  
  // Validate max players based on game mode
  const maxPlayersMap = {
    solo: 48,
    duo: 24, // 24 teams = 48 players
    squad: 12 // 12 teams = 48 players
  };
  
  if (maxPlayers > maxPlayersMap[gameMode]) {
    return next(new AppError(`Maximum players for ${gameMode} mode is ${maxPlayersMap[gameMode]}`, 400));
  }
  
  // Validate entry fee
  const entryFeeNum = parseFloat(entryFee) || 0;
  if (entryFeeNum < 0) {
    return next(new AppError('Entry fee cannot be negative', 400));
  }
  
  // Validate prize distribution if provided
  if (prizeDistribution) {
    const totalPercentage = Object.values(prizeDistribution).reduce((sum, val) => sum + val, 0);
    if (totalPercentage !== 100) {
      return next(new AppError('Prize distribution must total 100%', 400));
    }
  }
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Create tournament
    const tournament = await db.Tournament.create(
      {
        title,
        description: description || '',
        gameMode,
        maxPlayers,
        entryFee: entryFeeNum,
        prizeDistribution: prizeDistribution || {},
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        isVipOnly: !!isVipOnly,
        minVipLevel: minVipLevel || 0,
        autoStartWhenFull: !!autoStartWhenFull,
        createdBy: userId,
        updatedBy: userId
      },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(201).json({
      status: 'success',
      data: {
        tournament: {
          id: tournament.id,
          title: tournament.title,
          description: tournament.description,
          gameMode: tournament.gameMode,
          maxPlayers: tournament.maxPlayers,
          currentPlayers: tournament.currentPlayers,
          entryFee: tournament.entryFee,
          prizePool: tournament.prizePool,
          prizeDistribution: tournament.prizeDistribution,
          status: tournament.status,
          startTime: tournament.startTime,
          endTime: tournament.endTime,
          registrationDeadline: tournament.registrationDeadline,
          isVipOnly: tournament.isVipOnly,
          minVipLevel: tournament.minVipLevel,
          autoStartWhenFull: tournament.autoStartWhenFull,
          createdAt: tournament.createdAt,
          createdBy: tournament.createdBy
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to create tournament', 500));
  }
});

// Get tournament details
exports.getTournament = catchAsync(async (req, res, next) => {
  const { tournamentId } = req.params;
  
  const tournament = await db.Tournament.findByPk(tournamentId, {
    include: [
      {
        model: db.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }
    ]
  });
  
  if (!tournament) {
    return next(new AppError('Tournament not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      tournament: {
        id: tournament.id,
        title: tournament.title,
        description: tournament.description,
        gameMode: tournament.gameMode,
        maxPlayers: tournament.maxPlayers,
        currentPlayers: tournament.currentPlayers,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        prizeDistribution: tournament.prizeDistribution,
        status: tournament.status,
          startTime: tournament.startTime,
          endTime: tournament.endTime,
          registrationDeadline: tournament.registrationDeadline,
          roomId: tournament.roomId,
          roomPassword: tournament.roomPassword,
          isVipOnly: tournament.isVipOnly,
          minVipLevel: tournament.minVipLevel,
          autoStartWhenFull: tournament.autoStartWhenFull,
          createdAt: tournament.createdAt,
          updatedAt: tournament.updatedAt,
          createdBy: {
            id: tournament.creator.id,
            username: tournament.creator.username,
            firstName: tournament.creator.firstName,
            lastName: tournament.creator.lastName
          }
      }
    }
  });
});

// Get list of tournaments
exports.getTournaments = catchAsync(async (req, res, next) => {
  const { 
    page = 1, limit = 20, 
    gameMode, status, isVipOnly,
    search
  } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  // Build where clause
  const whereClause = {};
  if (gameMode) whereClause.gameMode = gameMode;
  if (status) whereClause.status = status;
  if (isVipOnly !== undefined) whereClause.isVipOnly = isVipOnly === 'true';
  if (search) {
    whereClause.title = {
      [db.Sequelize.Op.like]: `%${search}%`
    };
  }
  
  // Get tournaments
  const { count, rows } = await db.Tournament.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: db.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset: offset
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      tournaments: rows.map(tournament => ({
        id: tournament.id,
        title: tournament.title,
        description: tournament.description,
        gameMode: tournament.gameMode,
        maxPlayers: tournament.maxPlayers,
        currentPlayers: tournament.currentPlayers,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        prizeDistribution: tournament.prizeDistribution,
        status: tournament.status,
        startTime: tournament.startTime,
        endTime: tournament.endTime,
        registrationDeadline: tournament.registrationDeadline,
        roomId: tournament.roomId,
        isVipOnly: tournament.isVipOnly,
        minVipLevel: tournament.minVipLevel,
        autoStartWhenFull: tournament.autoStartWhenFull,
        createdAt: tournament.createdAt,
        createdBy: {
          id: tournament.creator.id,
          username: tournament.creator.username,
          firstName: tournament.creator.firstName,
          lastName: tournament.creator.lastName
        }
      })),
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(count / limitNum)
      }
    }
  });
});

// Update tournament (FIXED: Was missing)
exports.updateTournament = catchAsync(async (req, res, next) => {
  const { tournamentId } = req.params;
  const {
    title, description, gameMode, maxPlayers, entryFee, 
    prizeDistribution, startTime, endTime, registrationDeadline,
    isVipOnly, minVipLevel, autoStartWhenFull
  } = req.body;
  const userId = req.user.id;
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Get tournament with lock to prevent race conditions
    const tournament = await db.Tournament.findByPk(tournamentId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!tournament) {
      await transaction.rollback();
      return next(new AppError('Tournament not found', 404));
    }
    
    // Check if tournament can be edited
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      await transaction.rollback();
      return next(new AppError('Cannot edit completed or cancelled tournament', 400));
    }
    
    // Validate game mode if provided
    if (gameMode && !['solo', 'duo', 'squad'].includes(gameMode)) {
      await transaction.rollback();
      return next(new AppError('Invalid game mode', 400));
    }
    
    // Validate max players if provided
    if (maxPlayers) {
      const maxPlayersMap = {
        solo: 48,
        duo: 24, // 24 teams = 48 players
        squad: 12 // 12 teams = 48 players
      };
      
      if (maxPlayers > maxPlayersMap[gameMode || tournament.gameMode]) {
        await transaction.rollback();
        return next(new AppError(`Maximum players for ${gameMode || tournament.gameMode} mode is ${maxPlayersMap[gameMode || tournament.gameMode]}`, 400));
      }
    }
    
    // Validate entry fee if provided
    if (entryFee !== undefined && entryFee !== null) {
      const entryFeeNum = parseFloat(entryFee);
      if (isNaN(entryFeeNum) || entryFeeNum < 0) {
        await transaction.rollback();
        return next(new AppError('Entry fee cannot be negative', 400));
      }
    }
    
    // Validate prize distribution if provided
    if (prizeDistribution) {
      const totalPercentage = Object.values(prizeDistribution).reduce((sum, val) => sum + val, 0);
      if (totalPercentage !== 100) {
        await transaction.rollback();
        return next(new AppError('Prize distribution must total 100%', 400));
      }
    }
    
    // Build update object
    const updateData = {
      updatedBy: userId,
      updatedAt: new Date()
    };
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (gameMode !== undefined) updateData.gameMode = gameMode;
    if (maxPlayers !== undefined) updateData.maxPlayers = maxPlayers;
    if (entryFee !== undefined && entryFee !== null) updateData.entryFee = parseFloat(entryFee);
    if (prizeDistribution !== undefined) updateData.prizeDistribution = prizeDistribution;
    if (startTime !== undefined) updateData.startTime = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (registrationDeadline !== undefined) updateData.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    if (isVipOnly !== undefined) updateData.isVipOnly = !!isVipOnly;
    if (minVipLevel !== undefined) updateData.minVipLevel = minVipLevel;
    if (autoStartWhenFull !== undefined) updateData.autoStartWhenFull = !!autoStartWhenFull;
    
    // Update tournament
    await tournament.update(updateData, { transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Tournament updated successfully',
        tournament: {
          id: tournament.id,
          title: tournament.title,
          description: tournament.description,
          gameMode: tournament.gameMode,
          maxPlayers: tournament.maxPlayers,
          entryFee: tournament.entryFee,
          prizePool: tournament.prizePool,
          prizeDistribution: tournament.prizeDistribution,
          status: tournament.status,
          updatedAt: tournament.updatedAt
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to update tournament', 500));
  }
});

// Join tournament
exports.joinTournament = catchAsync(async (req, res, next) => {
  const { tournamentId } = req.params;
  const userId = req.user.id;
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Get tournament with lock to prevent race conditions
    const tournament = await db.Tournament.findByPk(tournamentId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!tournament) {
      await transaction.rollback();
      return next(new AppError('Tournament not found', 404));
    }
    
    // Check if user can join
    if (!tournament.canJoin(userId)) {
      await transaction.rollback();
      return next(new AppError('Cannot join tournament at this time', 400));
    }
    
    // Check if user is already participating
    const existingParticipant = await db.TournamentParticipant.findOne({
      where: {
        tournamentId,
        userId
      },
      transaction
    });
    
    if (existingParticipant) {
      await transaction.rollback();
      return next(new AppError('You are already participating in this tournament', 400));
    }
    
    // Lock funds for entry fee
    if (tournament.entryFee > 0) {
      const walletResult = await db.WalletTransaction.create(
        {
          userId,
          amount: tournament.entryFee,
          type: 'debit',
          category: 'tournament_entry',
          description: `Entry fee for ${tournament.title}`,
          referenceId: tournament.id,
          referenceType: 'tournament',
          balanceBefore: req.user.walletBalance,
          balanceAfter: req.user.walletBalance - tournament.entryFee,
          isLocked: true,
          processedBy: userId
        },
        { transaction }
      );
      
      // Update user's locked balance
      await req.user.update(
        { 
          lockedBalance: req.user.lockedBalance + tournament.entryFee
        },
        { transaction }
      );
    }
    
    // Create participant record
    const participant = await db.TournamentParticipant.create(
      {
        tournamentId,
        userId,
        joinedAt: new Date()
      },
      { transaction }
    );
    
    // Update tournament current players count
    await tournament.increment('currentPlayers', { 
      by: 1,
      transaction 
    });
    
    await transaction.commit();
    
    res.status(201).json({
      status: 'success',
      data: {
        message: 'Successfully joined tournament',
        participant: {
          id: participant.id,
          tournamentId: participant.tournamentId,
          userId: participant.userId,
          joinedAt: participant.joinedAt
        },
        tournament: {
          id: tournament.id,
          title: tournament.title,
          currentPlayers: tournament.currentPlayers,
          maxPlayers: tournament.maxPlayers
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to join tournament', 500));
  }
});

// Leave tournament
exports.leaveTournament = catchAsync(async (req, res, next) => {
  const { tournamentId } = req.params;
  const userId = req.user.id;
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Get tournament
    const tournament = await db.Tournament.findByPk(tournamentId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!tournament) {
      await transaction.rollback();
      return next(new AppError('Tournament not found', 404));
    }
    
    // Check if tournament has started
    if (tournament.startTime && new Date() >= tournament.startTime) {
      await transaction.rollback();
      return next(new AppError('Cannot leave tournament after it has started', 400));
    }
    
    // Get participant record
    const participant = await db.TournamentParticipant.findOne({
      where: {
        tournamentId,
        userId
      },
      transaction
    });
    
    if (!participant) {
      await transaction.rollback();
      return next(new AppError('You are not participating in this tournament', 400));
    }
    
    // Unlock funds if entry fee was paid
    if (tournament.entryFee > 0) {
      const walletResult = await db.WalletTransaction.create(
        {
          userId,
          amount: tournament.entryFee,
          type: 'credit',
          category: 'tournament_entry_refund',
          description: `Refund for leaving ${tournament.title}`,
          referenceId: tournament.id,
          referenceType: 'tournament',
          balanceBefore: req.user.walletBalance,
          balanceAfter: req.user.walletBalance + tournament.entryFee,
          isLocked: false,
          processedBy: userId
        },
        { transaction }
      );
      
      // Update user's locked balance
      await req.user.update(
        { 
          lockedBalance: req.user.lockedBalance - tournament.entryFee
        },
        { transaction }
      );
    }
    
    // Update participant record
    await participant.update(
      { 
        leftAt: new Date(),
        isActive: false
      },
      { transaction }
    );
    
    // Update tournament current players count
    await tournament.decrement('currentPlayers', { 
      by: 1,
      transaction 
    });
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Successfully left tournament',
        refundedAmount: tournament.entryFee
      }
    );
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to leave tournament', 500));
  }
});

// Start tournament (admin only)
exports.startTournament = catchAsync(async (req, res, next) => {
  const { tournamentId } = req.params;
  const userId = req.user.id;
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Get tournament
    const tournament = await db.Tournament.findByPk(tournamentId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!tournament) {
      await transaction.rollback();
      return next(new AppError('Tournament not found', 404));
    }
    
    // Check if user has permission to start tournament
    // In practice, you'd check roles/permissions here
    
    // Check if tournament is ready to start
    if (tournament.status !== 'registration_closed' && tournament.status !== 'in_progress') {
      await transaction.rollback();
      return next(new AppError('Tournament is not ready to start', 400));
    }
    
    // Check if tournament has minimum participants (for demo, we'll allow any number)
    // In practice, you might want a minimum number
    
    // Generate room credentials
    const roomId = `room_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const roomPassword = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Update tournament
    await tournament.update(
      {
        status: 'in_progress',
        startTime: new Date(),
        roomId,
        roomPassword,
        updatedBy: userId
      },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Tournament started successfully',
        tournament: {
          id: tournament.id,
          title: tournament.title,
          status: tournament.status,
          roomId: tournament.roomId,
          roomPassword: tournament.roomPassword,
          startTime: tournament.startTime
        }
      }
    );
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to start tournament', 500));
  }
});

// Complete tournament and distribute prizes
exports.completeTournament = catchAsync(async (req, res, next) => {
  const { tournamentId } = req.params;
  const { results } = req.body; // Array of {userId, position, prizeAmount}
  const userId = req.user.id;
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Get tournament
    const tournament = await db.Tournament.findByPk(tournamentId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!tournament) {
      await transaction.rollback();
      return next(new AppError('Tournament not found', 404));
    }
    
    // Check if tournament is in progress
    if (tournament.status !== 'in_progress') {
      await transaction.rollback();
      return next(new AppError('Tournament is not in progress', 400));
    }
    
    // Validate results
    if (!Array.isArray(results) || results.length === 0) {
      await transaction.rollback();
      return next(new AppError('Please provide valid results', 400));
    }
    
    // Process each result
    let totalPrizeDistributed = 0;
    
    for (const result of results) {
      const { userId: participantId, position, prizeAmount } = result;
      
      // Validate position
      if (!position || position < 1) {
        await transaction.rollback();
        return next(new AppError('Invalid position', 400));
      }
      
      // Validate prize amount
      const prizeAmountNum = parseFloat(prizeAmount) || 0;
      if (prizeAmountNum < 0) {
        await transaction.rollback();
        return next(new AppError('Prize amount cannot be negative', 400));
      }
      
      totalPrizeDistributed += prizeAmountNum;
      
      // Find participant
      const participant = await db.TournamentParticipant.findOne({
        where: {
          tournamentId,
          userId: participantId
        },
        transaction
      });
      
      if (!participant) {
        await transaction.rollback();
        return next(new AppError('Participant not found in tournament', 400));
      }
      
      // Update participant
      await participant.update(
        {
          position: position,
          prizeAmount: prizeAmountNum,
          isCheckedIn: true,
          checkedInAt: new Date()
        },
        { transaction }
      );
      
      // Credit prize to user's wallet (if prize amount > 0)
      if (prizeAmountNum > 0) {
        const participantUser = await db.User.findByPk(participantId, { transaction });
        
        if (participantUser) {
          const balanceBefore = participantUser.walletBalance;
          const balanceAfter = participantUser.walletBalance + prizeAmountNum;
          
          await participantUser.update(
            { walletBalance: balanceAfter },
            { transaction }
          );
          
          // Create wallet transaction for prize
          await db.WalletTransaction.create(
            {
              userId: participantId,
              amount: prizeAmountNum,
              type: 'credit',
              category: 'tournament_prize',
              description: `Prize for position ${position} in ${tournament.title}`,
              referenceId: tournamentId,
              referenceType: 'tournament',
              balanceBefore,
              balanceAfter,
              processedBy: userId
            },
            { transaction }
          );
        }
      }
    }
    
    // Update tournament status
    await tournament.update(
      {
        status: 'completed',
        endTime: new Date(),
        updatedBy: userId
      },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Tournament completed successfully',
        tournament: {
          id: tournament.id,
          title: tournament.title,
          status: tournament.status,
          endTime: tournament.endTime
        },
        prizesDistributed: totalPrizeDistributed,
        participantsProcessed: results.length
      }
    );
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to complete tournament', 500));
  }
});

// Cancel tournament
exports.cancelTournament = catchAsync(async (req, res, next) => {
  const { tournamentId } = req.params;
  const userId = req.user.id;
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Get tournament
    const tournament = await db.Tournament.findByPk(tournamentId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!tournament) {
      await transaction.rollback();
      return next(new AppError('Tournament not found', 404));
    }
    
    // Check if tournament can be cancelled
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      await transaction.rollback();
      return next(new AppError('Tournament cannot be cancelled', 400));
    }
    
    // Refund entry fees to all participants
    if (tournament.entryFee > 0) {
      const participants = await db.TournamentParticipant.findAll({
        where: {
          tournamentId,
          isActive: true
        },
        transaction
      });
      
      for (const participant of participants) {
        const participantUser = await db.User.findByPk(participant.userId, { transaction });
        
        if (participantUser) {
          const balanceBefore = participantUser.walletBalance;
          const balanceAfter = participantUser.walletBalance + tournament.entryFee;
          
          await participantUser.update(
            { walletBalance: balanceAfter },
            { transaction }
          );
          
          // Create wallet transaction for refund
          await db.WalletTransaction.create(
            {
              userId: participant.userId,
              amount: tournament.entryFee,
              type: 'credit',
              category: 'tournament_entry_refund',
              description: `Refund for cancelled tournament: ${tournament.title}`,
              referenceId: tournamentId,
              referenceType: 'tournament',
              balanceBefore,
              balanceAfter,
              processedBy: userId
            },
            { transaction }
          );
        }
        
        // Update participant record
        await participant.update(
          { 
            leftAt: new Date(),
            isActive: false
          },
          { transaction }
        );
      }
    }
    
    // Update tournament status
    await tournament.update(
      {
        status: 'cancelled',
        endTime: new Date(),
        updatedBy: userId
      },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Tournament cancelled successfully',
        tournament: {
          id: tournament.id,
          title: tournament.title,
          status: tournament.status,
          endTime: tournament.endTime
        },
        entryFee: tournament.entryFee
      }
    );
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to cancel tournament', 500));
  }
});

module.exports = exports;
