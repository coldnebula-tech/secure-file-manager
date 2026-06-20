const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../storage/database.sqlite');

// Ensure parent storage directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

async function initDb() {
  // Sync schema
  await sequelize.sync();

  // If table is empty, seed from users.json
  const count = await User.count();
  if (count === 0) {
    const usersJsonPath = path.resolve(__dirname, 'users.json');
    if (fs.existsSync(usersJsonPath)) {
      try {
        const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
        if (Array.isArray(usersData)) {
          for (const u of usersData) {
            await User.create({
              id: u.id,
              username: u.username,
              password: u.password
            });
          }
          console.log(`Successfully seeded ${usersData.length} users from users.json`);
        }
      } catch (err) {
        console.error('Failed to seed database from users.json:', err);
      }
    }
  }
}

module.exports = {
  sequelize,
  User,
  initDb
};
