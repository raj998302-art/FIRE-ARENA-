const { db } = require('../models');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const crypto = require('crypto');

require('dotenv').config();

// Get wallet balance
exports.getBalance = catchAsync(async (req, res, next) => {
  const user = req.user;
  
  res.status(200).json({
    status: 'success',
    data: {
      walletBalance: user.walletBalance || 0,
      lockedBalance: user.lockedBalance || 0,
      availableBalance: (user.walletBalance || 0) - (user.lockedBalance || 0)
    }
  });
});

// Add funds to wallet (internal use)
exports.addFunds = catchAsync(async (req, res, next) => {
  const { amount, category, description, referenceId, referenceType } = req.body;
  const userId = req.user.id;
  
  // Validate amount
  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Get current balance with lock to prevent race conditions
    const user = await db.User.findByPk(userId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!user) {
      await transaction.rollback();
      return next(new AppError('User not found', 404));
    }
    
    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = balanceBefore + parseFloat(amount);
    
    // Update user balance
    await user.update(
      { walletBalance: balanceAfter },
      { transaction }
    );
    
    // Create wallet transaction record
    const walletTransaction = await db.WalletTransaction.create(
      {
        userId,
        amount,
        type: 'credit',
        category,
        description: description || `Funds added via ${category}`,
        referenceId,
        referenceType,
        balanceBefore,
        balanceAfter,
        isLocked: false,
        processedBy: userId
      },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction: walletTransaction,
        newBalance: balanceAfter,
        message: 'Funds added successfully'
      }
    });
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to add funds', 500));
  }
});

// Deduct funds from wallet (internal use)
exports.deductFunds = catchAsync(async (req, res, next) => {
  const { amount, category, description, referenceId, referenceType } = req.body;
  const userId = req.user.id;
  
  // Validate amount
  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Get current balance with lock to prevent race conditions
    const user = await db.User.findByPk(userId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!user) {
      await transaction.rollback();
      return next(new AppError('User not found', 404));
    }
    
    // Check sufficient balance
    const availableBalance = (user.walletBalance || 0) - (user.lockedBalance || 0);
    if (availableBalance < amount) {
      await transaction.rollback();
      return next(new AppError('Insufficient balance', 400));
    }
    
    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = balanceBefore - parseFloat(amount);
    
    // Update user balance
    await user.update(
      { walletBalance: balanceAfter },
      { transaction }
    );
    
    // Create wallet transaction record
    const walletTransaction = await db.WalletTransaction.create(
      {
        userId,
        amount,
        type: 'debit',
        category,
        description: description || `Funds deducted via ${category}`,
        referenceId,
        referenceType,
        balanceBefore,
        balanceAfter,
        isLocked: false,
        processedBy: userId
      },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction: walletTransaction,
        newBalance: balanceAfter,
        message: 'Funds deducted successfully'
      }
    );
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to deduct funds', 500));
  }
});

// Lock funds in wallet (for tournament entries, etc.)
exports.lockFunds = catchAsync(async (req, res, next) => {
  const { amount, category, description, referenceId, referenceType } = req.body;
  const userId = req.user.id;
  
  // Validate amount
  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Get current balance with lock to prevent race conditions
    const user = await db.User.findByPk(userId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!user) {
      await transaction.rollback();
      return next(new AppError('User not found', 404));
    }
    
    // Check sufficient available balance
    const availableBalance = (user.walletBalance || 0) - (user.lockedBalance || 0);
    if (availableBalance < amount) {
      await transaction.rollback();
      return next(new AppError('Insufficient available balance', 400));
    }
    
    const balanceBefore = user.walletBalance || 0;
    const lockedBefore = user.lockedBalance || 0;
    const balanceAfter = balanceBefore; // Wallet balance doesn't change
    const lockedAfter = lockedBefore + parseFloat(amount); // Locked balance increases
    
    // Update user balances
    await user.update(
      { 
        walletBalance: balanceAfter,
        lockedBalance: lockedAfter
      },
      { transaction }
    );
    
    // Create wallet transaction record
    const walletTransaction = await db.WalletTransaction.create(
      {
        userId,
        amount,
        type: 'debit',
        category,
        description: description || `Funds locked via ${category}`,
        referenceId,
        referenceType,
        balanceBefore,
        balanceAfter,
        isLocked: true,
        processedBy: userId
      },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction: walletTransaction,
        walletBalance: balanceAfter,
        lockedBalance: lockedAfter,
        availableBalance: balanceAfter - lockedAfter,
        message: 'Funds locked successfully'
      }
    );
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to lock funds', 500));
  }
});

// Unlock funds from wallet
exports.unlockFunds = catchAsync(async (req, res, next) => {
  const { amount, category, description, referenceId, referenceType } = req.body;
  const userId = req.user.id;
  
  // Validate amount
  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Get current balance with lock to prevent race conditions
    const user = await db.User.findByPk(userId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!user) {
      await transaction.rollback();
      return next(new AppError('User not found', 404));
    }
    
    // Check sufficient locked balance
    if ((user.lockedBalance || 0) < amount) {
      await transaction.rollback();
      return next(new AppError('Insufficient locked balance', 400));
    }
    
    const balanceBefore = user.walletBalance || 0;
    const lockedBefore = user.lockedBalance || 0;
    const balanceAfter = balanceBefore; // Wallet balance doesn't change
    const lockedAfter = lockedBefore - parseFloat(amount); // Locked balance decreases
    
    // Update user balances
    await user.update(
      { 
        walletBalance: balanceBefore,
        lockedBalance: lockedAfter
      },
      { transaction }
    );
    
    // Create wallet transaction record
    const walletTransaction = await db.WalletTransaction.create(
      {
        userId,
        amount,
        type: 'credit',
        category,
        description: description || `Funds unlocked via ${category}`,
        referenceId,
        referenceType,
        balanceBefore,
        balanceAfter,
        isLocked: false,
        processedBy: userId
      },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction: walletTransaction,
        walletBalance: balanceBefore,
        lockedBalance: lockedAfter,
        availableBalance: balanceBefore - lockedAfter,
        message: 'Funds unlocked successfully'
      }
    );
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Failed to unlock funds', 500));
  }
});

// Get transaction history
exports.getTransactionHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, category, type } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  // Build where clause
  const whereClause = { userId };
  if (category) whereClause.category = category;
  if (type) whereClause.type = type;
  
  // Get transactions
  const { count, rows } = await db.WalletTransaction.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset: offset
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      transactions: rows,
      pagination: {
        total: count,
        page: pageNum,
          limit: limitNum,
          pages: Math.ceil(count / limitNum)
      }
    }
  });
});

module.exports = exports;
