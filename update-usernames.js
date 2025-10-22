#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const Redis = require('redis');

const prisma = new PrismaClient();
const redis = Redis.createClient({ url: 'redis://localhost:6379' });

async function updateUsernames() {
  try {
    await redis.connect();
    console.log('✅ Connected to Redis');

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        stats: true
      }
    });

    console.log(`📊 Found ${users.length} users`);

    for (const user of users) {
      let displayName = user.username;
      
      // If username is generic (Player_ID), try to build from Telegram data
      if (user.username.startsWith('Player_')) {
        if (user.firstName) {
          displayName = user.firstName;
          if (user.lastName) {
            displayName += ` ${user.lastName}`;
          }
          if (user.telegramUsername) {
            displayName += ` (@${user.telegramUsername})`;
          }
        } else {
          // Keep generic name if no Telegram data
          displayName = user.username;
        }
      }

      // Update Redis
      await redis.setEx(`username:${user.id}`, 86400, displayName);
      console.log(`✅ Updated user ${user.id}: ${user.username} → ${displayName}`);
    }

    console.log('🎉 All usernames updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redis.disconnect();
    await prisma.$disconnect();
  }
}

updateUsernames();
