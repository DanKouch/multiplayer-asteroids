var config = {};

// Server management config
config.maxPlayersPerSession = 6;

// Game mechanics config
config.jetpackPower = 0.2;
config.maxSpeed = 10;
config.ambientFriction = 0.05;

config.unsafeDistance = 50000;
config.unsafeDistanceDamageTime = 100;

// Laser
config.laserSpeed = 15;
config.laserHealth = 200;
config.laserDamage = 2;
config.laserStartingAmmo = 20;

// Mine
config.mineTimer = 300;
config.mineExplosionRadius = 120;
config.mineStartingAmmo = 5;
config.mineFrictionMultiplier = 2;
config.mineDamage = 10;

// Torpedo
config.torpedoTimer = 50;
config.torpedoSpeed = 10;
config.torpedoExplosionRadius = 120;
config.torpedoStartingAmmo = 5;
config.torpedoSpeedMultiplier = 1.005;
config.torpedoDamage = 6;

module.exports = config;
