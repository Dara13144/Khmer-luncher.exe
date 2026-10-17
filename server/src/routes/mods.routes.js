const express = require('express');
const router = express.Router();

const SERVER_MODS_MANIFEST = [
  {
    id: 'fabric-api',
    name: 'Fabric API (1.21.1)',
    filename: 'fabric-api-0.104.0+1.21.1.jar',
    downloadUrl: 'https://cdn.modrinth.com/data/P7dR8mSH/versions/cugB9t8X/fabric-api-0.104.0%2B1.21.1.jar',
    version: '0.104.0+1.21.1',
    required: true,
    sizeBytes: 2452735,
    description: 'Core hook library required by Fabric mods.'
  },
  {
    id: 'sodium',
    name: 'Sodium Performance Optimizer',
    filename: 'sodium-fabric-0.5.11+mc1.21.1.jar',
    downloadUrl: 'https://cdn.modrinth.com/data/AANobbMI/versions/gG95fV5Y/sodium-fabric-0.5.11%2Bmc1.21.1.jar',
    version: '0.5.11',
    required: true,
    sizeBytes: 1542000,
    description: 'Modern rendering engine providing massive FPS gains.'
  },
  {
    id: 'nmc-hud',
    name: 'NMC PvP Client & HUD Mod',
    filename: 'SimplePvP-1.21.1-1.0.0.jar',
    downloadUrl: 'https://files.nmccityrp.com/mods/SimplePvP-1.21.1-1.0.0.jar',
    version: '1.0.0',
    required: true,
    sizeBytes: 614381,
    description: 'In-game Reach distance, Keystrokes, CPS tracker, and Durability HUD.'
  }
];

router.get('/list', (req, res) => {
  return res.json({
    success: true,
    count: SERVER_MODS_MANIFEST.length,
    data: {
      mods: SERVER_MODS_MANIFEST
    },
    mods: SERVER_MODS_MANIFEST
  });
});

module.exports = router;
