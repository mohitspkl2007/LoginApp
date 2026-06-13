const express = require('express');
const router = express.Router();
const controller = require('../controllers/assetController');
const verifyToken = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');

router.get('/', verifyToken, controller.getAllAssets);
router.get('/:id', verifyToken, controller.getAssetById);
router.post('/', verifyToken, authorize('admin', 'hr', 'manager'), controller.createAsset);
router.put('/:id', verifyToken, authorize('admin', 'hr', 'manager'), controller.updateAsset);
router.delete('/:id', verifyToken, authorize('admin', 'hr', 'manager'), controller.deleteAsset);
router.post('/allocate', verifyToken, authorize('admin', 'hr', 'manager'), controller.allocateAsset);
router.post('/return', verifyToken, authorize('admin', 'hr', 'manager'), controller.returnAsset);

module.exports = router;
