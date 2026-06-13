const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const findAllAssets = async ({ search, status, page, limit, employeeId }) => {
  const where = {};
  if (status) where.status = status;
  if (employeeId) {
    where.allocations = {
      some: {
        employeeId: parseInt(employeeId),
        status: 'allocated'
      }
    };
  }
  if (search) {
    where.OR = [
      { assetName: { contains: search, mode: 'insensitive' } },
      { assetCode: { contains: search, mode: 'insensitive' } },
      { assetType: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [assets, total] = await Promise.all([
    prisma.asset.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { allocations: { include: { employee: { select: { id: true, name: true } } } } } }),
    prisma.asset.count({ where }),
  ]);
  return { assets, total, page, limit };
};

const findAssetById = async (id) => {
  return prisma.asset.findUnique({ where: { id }, include: { allocations: true, history: true } });
};

const createAsset = async (data) => {
  return prisma.asset.create({
    data: {
      assetCode: data.assetCode,
      assetName: data.assetName,
      assetType: data.assetType,
      status: data.status || 'available',
      purchaseCost: data.purchaseCost ? parseFloat(data.purchaseCost) : null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
    }
  });
};

const updateAsset = async (id, data) => {
  return prisma.asset.update({
    where: { id },
    data: {
      assetCode: data.assetCode,
      assetName: data.assetName,
      assetType: data.assetType,
      status: data.status,
      purchaseCost: data.purchaseCost ? parseFloat(data.purchaseCost) : null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
    }
  });
};

const deleteAsset = async (id) => {
  return prisma.asset.delete({ where: { id } });
};

const allocateAsset = async ({ assetId, employeeId, allocatedById }) => {
  return prisma.$transaction(async (tx) => {
    const allocation = await tx.assetAllocation.create({
      data: { assetId, employeeId, allocatedById, status: 'allocated' },
    });
    await tx.asset.update({ where: { id: assetId }, data: { status: 'allocated' } });
    await tx.assetHistory.create({
      data: { assetId, action: 'ALLOCATED', remarks: 'Allocated to employee ID ' + employeeId, createdById: allocatedById },
    });
    return allocation;
  });
};

const returnAsset = async ({ assetId, employeeId, returnedById }) => {
  return prisma.$transaction(async (tx) => {
    await tx.assetAllocation.updateMany({
      where: { assetId, employeeId, status: 'allocated' },
      data: { status: 'returned', returnDate: new Date() },
    });
    await tx.asset.update({ where: { id: assetId }, data: { status: 'available' } });
    await tx.assetHistory.create({
      data: { assetId, action: 'RETURNED', remarks: 'Returned by employee ID ' + employeeId, createdById: returnedById },
    });
  });
};

module.exports = { findAllAssets, findAssetById, createAsset, updateAsset, deleteAsset, allocateAsset, returnAsset };
