const { db } = require('../models');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const crypto = require('crypto');

require('dotenv').config();

// Initialize Razorpay (in practice, you'd use the official SDK)
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

// Create Razorpay order
exports.createOrder = catchAsync(async (req, res, next) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;
  const userId = req.user.id;
  
  // Validate amount
  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }
  
  // Validate currency
  if (!['INR', 'USD'].includes(currency)) {
    return next(new AppError('Invalid currency', 400));
  }
  
  // Check if amount is too small
  if (amount < 1) {
    return next(new AppError('Minimum amount is ₹1', 400));
  }
  
  // Generate receipt if not provided
  const receiptId = receipt || `receipt_${crypto.randomBytes(16).toString('hex')}`;
  
  // In a real implementation, you would call Razorpay API here
  // For this example, we'll simulate the response
  
  const razorpayOrder = {
    id: `order_${crypto.randomBytes(10).toString('hex')}`,
    amount: amount * 100, // Razorpay expects amount in paise
    currency,
    receipt: receiptId,
    status: 'created',
    notes: notes || {}
  };
  
  // Create payment record in our database
  const payment = await db.Payment.create({
    userId,
    razorpayOrderId: razorpayOrder.id,
    amount,
    currency,
    status: 'created',
    receipt: receiptId,
    notes: razorpayOrder.notes
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      order: razorpayOrder,
      paymentId: payment.id
    }
  });
});

// Verify and process payment
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
  const userId = req.user.id;
  
  // Validate required fields
  if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    return next(new AppError('Missing required payment verification fields', 400));
  }
  
  // Find payment record
  const payment = await db.Payment.findOne({
    where: {
      razorpayOrderId,
      userId
    }
  });
  
  if (!payment) {
    return next(new AppError('Payment order not found', 404));
  }
  
  // Check if already processed
  if (payment.status !== 'created' && payment.status !== 'pending') {
    return next(new AppError('Payment already processed', 400));
  }
  
  // Verify signature
  const isValidSignature = payment.verifySignature(razorpayKeySecret);
  
  if (!isValidSignature) {
    // Update payment status to failed
    await payment.update({
      razorpayPaymentId,
      razorpaySignature,
      status: 'failed'
    });
    
    return next(new AppError('Invalid payment signature', 400));
  }
  
  // Start transaction
  const transaction = await db.sequelize.transaction();
  
  try {
    // Update payment record
    await payment.update(
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'success',
        processedAt: new Date()
      },
      { transaction }
    );
    
    // Credit wallet through wallet service (ensures proper locking)
    const user = await db.User.findByPk(userId, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!user) {
      await transaction.rollback();
      return next(new AppError('User not found', 404));
    }
    
    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = balanceBefore + parseFloat(payment.amount);
    
    // Update user balance
    await user.update(
      { walletBalance: balanceAfter },
      { transaction }
    );
    
    // Create wallet transaction record
    await db.WalletTransaction.create(
      {
        userId,
        amount: payment.amount,
        type: 'credit',
        category: 'deposit',
        description: `Razorpay payment ${razorpayPaymentId}`,
        referenceId: razorpayPaymentId,
        referenceType: 'payment',
        balanceBefore,
        balanceAfter,
        processedBy: userId
      },
      { transaction }
    );
    
    // Create audit log
    await db.AuditLog.create(
      {
        userId,
        action: 'payment_success',
        entityType: 'Payment',
        entityId: payment.id,
        changes: {
          status: ['created', 'success'],
          amount: payment.amount
        }
      },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Payment verified and wallet credited successfully',
        payment: {
          id: payment.id,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    
    // Update payment status to failed
    await payment.update({
      razorpayPaymentId,
      razorpaySignature,
      status: 'failed'
    });
    
    return next(new AppError('Failed to process payment', 500));
  }
});

// Handle Razorpay webhook (secondary verification)
exports.webhook = catchAsync(async (req, res, next) => {
  const { event, payload } = req.body;
  
  // Verify webhook signature (in practice)
  // const webhookSignature = req.headers['x-razorpay-signature'];
  // const isValid = validateWebhookSignature(webhookSignature, req.body, razorpayKeySecret);
  
  // if (!isValid) {
  //   return res.status(400).json({ error: 'Invalid webhook signature' });
  // }
  
  // Handle payment.captured event
  if (event === 'payment.captured') {
    const { entity: paymentData } = payload.payment;
    
    // Find our payment record
    const payment = await db.Payment.findOne({
      where: {
        razorpayOrderId: paymentData.order_id
      }
    });
    
    if (payment && payment.status === 'success') {
      // Already processed, just acknowledge
      return res.status(200).json({ status: 'ok' });
    }
    
    if (payment) {
      // Update with webhook data
      await payment.update({
        razorpayPaymentId: paymentData.id,
        status: 'success',
        processedAt: new Date()
      });
      
      // Credit wallet (similar to verifyPayment)
      // ... wallet crediting logic ...
    }
  }
  
  // Acknowledge webhook
  res.status(200).json({ status: 'ok' });
});

// Get payment status
exports.getPaymentStatus = catchAsync(async (req, res, next) => {
  const { paymentId } = req.params;
  const userId = req.user.id;
  
  const payment = await db.Payment.findOne({
    where: {
      id: paymentId,
      userId
    }
  });
  
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      payment: {
        id: payment.id,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt
      }
    }
  });
});

// Get user payment history
exports.getUserPaymentHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, status } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  // Build where clause
  const whereClause = { userId };
  if (status) whereClause.status = status;
  
  // Get payments
  const { count, rows } = await db.Payment.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset: offset
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      payments: rows,
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
