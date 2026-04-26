const { db } = require('../models');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

require('dotenv').config();

// Get VIP status
exports.getVipStatus = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // Get active VIP subscription
  const vipSubscription = await db.VipSubscription.findOne({
    where: {
      userId,
      isActive: true
    },
    order: [['endDate', 'DESC']],
    include: [
      {
        model: db.Payment,
        as: 'payment',
        attributes: ['id', 'amount', 'currency', 'status', 'createdAt']
      }
    ]
  });
  
  if (!vipSubscription) {
    return res.status(200).json({
      status: 'success',
      data: {
        isVip: false,
        message: 'User does not have an active VIP subscription'
      }
    });
  }
  
  // Check if expired
  if (vipSubscription.isExpired()) {
    // Deactivate expired subscription
    await vipSubscription.update({ isActive: false });
    
    return res.status(200).json({
      status: 'success',
      data: {
        isVip: false,
        message: 'VIP subscription has expired'
      }
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      isVip: true,
      subscription: {
        id: vipSubscription.id,
        plan: vipSubscription.plan,
        amount: vipSubscription.amount,
        startDate: vipSubscription.startDate,
        endDate: vipSubscription.endDate,
        daysRemaining: vipSubscription.daysRemaining(),
        isActive: vipSubscription.isActive,
        autoRenew: vipSubscription.autoRenew
      },
      payment: vipSubscription.payment ? {
        id: vipSubscription.payment.id,
        amount: vipSubscription.payment.amount,
        currency: vipSubscription.payment.currency,
        status: vipSubscription.payment.status,
        createdAt: vipSubscription.payment.createdAt
      } : null
    }
  });
};

// Purchase VIP subscription
exports.purchaseVip = catchAsync(async (req, res, next) => {
  const { plan, amount } = req.body;
  const userId = req.user.id;
  
  // Validate plan
  if (!['weekly', 'monthly'].includes(plan)) {
    return next(new AppError('Invalid VIP plan. Must be weekly or monthly', 400));
  }
  
  // Validate amount
  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }
  
  // Check if user already has active VIP subscription
  const activeSubscription = await db.VipSubscription.findOne({
    where: {
      userId,
      isActive: true
    }
  });
  
  if (activeSubscription) {
    // If not expired, extend existing subscription
    if (!activeSubscription.isExpired()) {
      // Extend by plan duration
      const extensionDays = plan === 'weekly' ? 7 : 30;
      const newEndDate = new Date(activeSubscription.endDate);
      newEndDate.setDate(newEndDate.getDate() + extensionDays);
      
      await activeSubscription.update({
        endDate: newEndDate,
        amount: activeSubscription.amount + amount, // Add to existing amount
        updatedAt: new Date()
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'VIP subscription extended successfully',
        data: {
          subscription: {
            id: activeSubscription.id,
            plan: activeSubscription.plan,
            endDate: activeSubscription.endDate,
            daysRemaining: activeSubscription.daysRemaining()
          }
        }
      });
    }
  }
  
  // Create new VIP subscription
  const startDate = new Date();
  const endDate = new Date(startDate);
  
  if (plan === 'weekly') {
    endDate.setDate(endDate.getDate() + 7);
  } else if (plan === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Create VIP subscription
    const vipSubscription = await db.VipSubscription.create(
      {
        userId,
        plan,
        amount,
        startDate,
        endDate,
        isActive: true,
        autoRenew: false
      },
      { transaction }
    );
    
    // TODO: Create payment record and process payment
    // For now, we'll just create the subscription
    
    await transaction.commit();
    
    res.status(201).json({
      status: 'success',
      message: 'VIP subscription purchased successfully',
      data: {
        subscription: {
          id: vipSubscription.id,
          plan: vipSubscription.plan,
          amount: vipSubscription.amount,
          startDate: vipSubscription.startDate,
          endDate: vipSubscription.endDate,
          daysRemaining: vipSubscription.daysRemaining()
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to purchase VIP subscription', 500));
  }
});

// Cancel VIP subscription
exports.cancelVip = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // Get active VIP subscription
  const vipSubscription = await db.VipSubscription.findOne({
    where: {
      userId,
      isActive: true
    }
  });
  
  if (!vipSubscription) {
    return next(new AppError('No active VIP subscription found', 404));
  }
  
  try {
    // Deactivate subscription
    await vipSubscription.update({
      isActive: false,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      status: 'success',
      message: 'VIP subscription cancelled successfully'
    });
  } catch (error) {
    return next(new AppError('Failed to cancel VIP subscription', 500));
  }
});

// Get VIP-only tournaments
exports.getVipTournaments = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  // Check if user has VIP status
  const vipSubscription = await db.VipSubscription.findOne({
    where: {
      userId,
      isActive: true
    }
  });
  
  if (!vipSubscription || vipSubscription.isExpired()) {
    return next(new AppError('VIP subscription required to access VIP tournaments', 403));
  }
  
  try {
    const { count, rows } = await db.Tournament.findAndCountAll({
      where: {
        isVipOnly: true,
        status: { [db.Sequelize.Op.not]: 'completed' }
      },
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
          status: tournament.status,
          startTime: tournament.startTime,
          registrationDeadline: tournament.registrationDeadline
        })),
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch VIP tournaments', 500));
  }
});

module.exports = exports;
