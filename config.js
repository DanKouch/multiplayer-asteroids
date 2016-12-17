var config = {};

// Server management config
config.maxPlayersPerSession = 6;

// Game mechanics config
config.jetpackPower = 0.2;
config.maxSpeed = 10;
config.ambientFriction = 0.05;

config.unsafeDistance = 50000;
config.unsafeDistanceDamageTime = 100;

// Weapons
config.laserSpeed = 10;
config.laserHealth = 400;
config.laserDamage = 10;

module.exports = config;
