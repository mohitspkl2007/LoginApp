const repo = require('../repositories/assetRepository');
const auditLogger = require('../utils/auditLogger');
const createNotification = require('../utils/notificationHelper');

const getAllAssets = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const { search, status, employeeId } = query;
  return repo.findAllAssets({ search, status, page, limit, employeeId });
};

const getAssetById = async (id) => {
  const asset = await repo.findAssetById(parseInt(id));
  if (!asset) throw { statusCode: 404, message: 'Asset not found' };
  return asset;
};

const createAsset = async (data, performedBy) => {
  const asset = await repo.createAsset(data);
  await auditLogger({ tableName: 'Asset', actionType: 'CREATE', recordId: asset.id, newData: asset, performedBy });
  return asset;
};

const updateAsset = async (id, data, performedBy) => {
  const old = await repo.findAssetById(parseInt(id));
  if (!old) throw { statusCode: 404, message: 'Asset not found' };
  const updated = await repo.updateAsset(parseInt(id), data);
  await auditLogger({ tableName: 'Asset', actionType: 'UPDATE', recordId: updated.id, oldData: old, newData: updated, performedBy });
  return updated;
};

const deleteAsset = async (id, performedBy) => {
  const old = await repo.findAssetById(parseInt(id));
  if (!old) throw { statusCode: 404, message: 'Asset not found' };
  await repo.deleteAsset(parseInt(id));
  await auditLogger({ tableName: 'Asset', actionType: 'DELETE', recordId: parseInt(id), oldData: old, performedBy });
};

const allocateAsset = async ({ assetId, employeeId, allocatedById }) => {
  const asset = await repo.findAssetById(parseInt(assetId));
  if (!asset) throw { statusCode: 404, message: 'Asset not found' };
  if (asset.status !== 'available') throw { statusCode: 400, message: 'Asset is not available for allocation' };

  const allocation = await repo.allocateAsset({ assetId: parseInt(assetId), employeeId: parseInt(employeeId), allocatedById });

  await createNotification({
    userId: parseInt(employeeId),
    title: 'Asset Assigned',
    message: `${asset.assetName} (${asset.assetCode}) has been assigned to you.`,
  });

  await auditLogger({ tableName: 'AssetAllocation', actionType: 'CREATE', recordId: allocation.id, newData: allocation, performedBy: allocatedById });

  return allocation;
};

const returnAsset = async ({ assetId, employeeId, returnedById }) => {
  await repo.returnAsset({ assetId: parseInt(assetId), employeeId: parseInt(employeeId), returnedById });

  await createNotification({
    userId: parseInt(employeeId),
    title: 'Asset Returned',
    message: `Your asset has been marked as returned successfully.`,
  });
};

module.exports = { getAllAssets, getAssetById, createAsset, updateAsset, deleteAsset, allocateAsset, returnAsset };
