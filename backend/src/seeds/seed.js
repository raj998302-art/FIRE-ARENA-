const { db } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Sync database
    await db.sequelize.sync({ force: true }); // Use force: true only for development
    console.log('Database synced');
    
    // Create roles
    console.log('Creating roles...');
    const roles = [
      { name: 'OWNER', description: 'System owner with full access', level: 1000, isSystemRole: true },
      { name: 'CO_OWNER', description: 'Co-owner with extensive access', level: 900, isSystemRole: true },
      { name: 'FAM_MANAGER', description: 'Family and staff manager', level: 800, isSystemRole: true },
      { name: 'HEAD_PAYMENT_MANAGER', description: 'Head of payment department', level: 700, isSystemRole: true },
      { name: 'SENIOR_PAYMENT_MANAGER', description: 'Senior payment manager', level: 600, isSystemRole: true },
      { name: 'PAYMENT_MANAGER', description: 'Payment manager', level: 500, isSystemRole: true },
      { name: 'HEAD_TOURNAMENT_MANAGER', description: 'Head of tournament department', level: 400, isSystemRole: true },
      { name: 'SENIOR_TOURNAMENT_MANAGER', description: 'Senior tournament manager', level: 300, isSystemRole: true },
      { name: 'TOURNAMENT_MANAGER', description: 'Tournament manager', level: 200, isSystemRole: true },
      { name: 'HEAD_TECHNICAL_MANAGER', description: 'Head of technical department', level: 150, isSystemRole: true },
      { name: 'TECHNICAL_MANAGER', description: 'Technical manager', level: 100, isSystemRole: true },
      { name: 'HEAD_VIP_MANAGER', description: 'Head of VIP department', level: 90, isSystemRole: true },
      { name: 'VIP_MANAGER', description: 'VIP manager', level: 80, isSystemRole: true },
      { name: 'HEAD_ADMIN', description: 'Head of admin department', level: 70, isSystemRole: true },
      { name: 'SENIOR_ADMIN', description: 'Senior admin', level: 60, isSystemRole: true },
      { name: 'ADMIN', description: 'Admin', level: 50, isSystemRole: true },
      { name: 'MODERATOR', description: 'Moderator', level: 40, isSystemRole: true },
      { name: 'TEAM_SYSTEM_MANAGER', description: 'Team system manager', level: 30, isSystemRole: true },
      { name: 'ACHIEVEMENT_MANAGER', description: 'Achievement manager', level: 20, isSystemRole: true },
      { name: 'COMMUNITY_MANAGER', description: 'Community manager', level: 10, isSystemRole: true },
      { name: 'VIP_USER', description: 'VIP user', level: 5, isSystemRole: true },
      { name: 'VIP_PLUS', description: 'VIP Plus user', level: 4, isSystemRole: true },
      { name: 'VIP_ELITE', description: 'VIP Elite user', level: 3, isSystemRole: true },
      { name: 'REGULAR_USER', description: 'Regular user', level: 1, isSystemRole: true }
    ];
    
    const createdRoles = await db.Role.bulkCreate(roles);
    console.log(`Created ${createdRoles.length} roles`);
    
    // Create permissions
    console.log('Creating permissions...');
    const resources = ['auth', 'users', 'wallet', 'payments', 'tournaments', 'chat', 'admin', 'vip', 'team', 'notifications', 'roles', 'permissions'];
    const actions = ['create', 'read', 'update', 'delete', 'approve', 'reject', 'manage', 'execute'];
    
    const permissions = [];
    resources.forEach(resource => {
      actions.forEach(action => {
        permissions.push({
          name: `${resource}:${action}`,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
          resource,
          action,
          isActive: true
        });
      });
    });
    
    const createdPermissions = await db.Permission.bulkCreate(permissions);
    console.log(`Created ${createdPermissions.length} permissions`);
    
    // Assign all permissions to OWNER role
    console.log('Assigning permissions to OWNER role...');
    const ownerRole = await db.Role.findOne({ where: { name: 'OWNER' } });
    if (ownerRole) {
      await ownerRole.addPermissions(createdPermissions.map(p => p.id));
      console.log('Assigned all permissions to OWNER role');
    }
    
    // Create owner user (Zenus_Carlos)
    console.log('Creating owner user (Zenus_Carlos)...');
    const ownerPassword = await bcrypt.hash('SecureOwnerPass123!', 12); // In practice, use secure random password
    
    const ownerUser = await db.User.create({
      username: 'Zenus_Carlos',
      email: 'zenus.carlos@firearenamax.com',
      passwordHash: ownerPassword,
      firstName: 'Zenus',
      lastName: 'Carlos',
      phoneNumber: '+1234567890',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      walletBalance: 10000.00, // Starting balance for owner
      lockedBalance: 0.00
    });
    
    // Assign OWNER role to owner user
    await ownerUser.addRole(ownerRole.id);
    
    // Also assign all other roles for testing (in practice, only assign OWNER)
    // For demo purposes, we'll assign a few key roles
    const keyRoles = await db.Role.findAll({
      where: {
        name: {
          [db.Sequelize.Op.in]: [
            'OWNER',
            'CO_OWNER',
            'FAM_MANAGER',
            'HEAD_PAYMENT_MANAGER',
            'HEAD_TOURNAMENT_MANAGER',
            'HEAD_TECHNICAL_MANAGER',
            'HEAD_VIP_MANAGER',
            'HEAD_ADMIN',
            'MODERATOR'
          ]
        }
      }
    });
    
    await ownerUser.addRoles(keyRoles.map(role => role.id));
    
    console.log('Created owner user and assigned roles');
    
    // Create a few sample users for testing
    console.log('Creating sample users...');
    const sampleUsers = [
      {
        username: 'progamer1',
        email: 'progamer1@example.com',
        firstName: 'Alex',
        lastName: 'Johnson',
        phoneNumber: '+1987654321'
      },
      {
        username: 'skilledplayer2',
        email: 'skilledplayer2@example.com',
        firstName: 'Maria',
        lastName: 'Garcia',
        phoneNumber: '+1987654322'
      },
      {
        username: 'elitecompetitor3',
        email: 'elitecompetitor3@example.com',
        firstName: 'David',
        lastName: 'Wilson',
        phoneNumber: '+1987654323'
      }
    ];
    
    const createdSampleUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash('SamplePass123!', 12);
      const user = await db.User.create({
        ...userData,
        passwordHash: hashedPassword,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        walletBalance: 1000.00 // Starting balance for sample users
      });
      
      // Assign REGULAR_USER role
      const regularRole = await db.Role.findOne({ where: { name: 'REGULAR_USER' } });
      if (regularRole) {
        await user.addRole(regularRole.id);
      }
      
      createdSampleUsers.push(user);
    }
    
    console.log(`Created ${createdSampleUsers.length} sample users`);
    
    // Create sample tournament
    console.log('Creating sample tournament...');
    const sampleTournament = await db.Tournament.create({
      title: 'Summer Clash 2026',
      description: 'Premium summer tournament with great prizes',
      gameMode: 'solo',
      maxPlayers: 32,
      entryFee: 50.00,
      prizePool: 1200.00,
      prizeDistribution: { "1": 50, "2": 30, "3": 20 },
      status: 'registration_open',
      registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      startTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      createdBy: ownerUser.id,
      updatedBy: ownerUser.id
    });
    
    console.log('Created sample tournament');
    
    console.log('Database seeding completed successfully!');
    console.log('Owner credentials:');
    console.log('Username: Zenus_Carlos');
    console.log('Password: SecureOwnerPass123! (change in production!)');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
