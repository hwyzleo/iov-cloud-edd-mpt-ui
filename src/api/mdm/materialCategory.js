import request from '@/utils/request'

// 查询物料分类列表
export function listMaterialCategory(query) {
  return request({
    url: '/edd-mdm/api/mpt/material/category/v1/list',
    method: 'get',
    params: query
  })
}

// 查询物料分类详细
export function getMaterialCategory(code) {
  return request({
    url: '/edd-mdm/api/mpt/material/category/v1/' + code,
    method: 'get'
  })
}

// 新增物料分类
export function addMaterialCategory(data) {
  return request({
    url: '/edd-mdm/api/mpt/material/category/v1/create',
    method: 'post',
    data: data
  })
}

// 修改物料分类
export function updateMaterialCategory(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/material/category/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除物料分类
export function delMaterialCategory(code, operator) {
  return request({
    url: '/edd-mdm/api/mpt/material/category/v1/' + code,
    method: 'delete',
    params: { operator }
  })
}

// 停用物料分类
export function deactivateMaterialCategory(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/material/category/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询物料分类树形结构
export function listMaterialCategoryTree() {
  return request({
    url: '/edd-mdm/api/mpt/material/category/v1/listAll',
    method: 'get'
  })
}

// 查询物料分类历史版本
export function listMaterialCategoryHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/material/category/v1/' + code + '/history',
    method: 'get'
  })
}

// 标准目录预检（CR-039）：返回 catalogVersion、total=101、level1/2/3Count、catalogStatus 及每项 Initialized/Missing/Conflict
// GET /api/mpt/material/category/v1/catalog/preview
export function previewMaterialCategoryCatalog() {
  return request({
    url: '/edd-mdm/api/mpt/material/category/v1/catalog/preview',
    method: 'get'
  })
}

// 标准目录初始化（CR-039）：按 L1→L2→L3 拓扑幂等导入 101 项（4 L1 + 19 L2 + 78 L3）为 ACTIVE，不覆盖已有业务数据
// POST /api/mpt/material/category/v1/catalog/bootstrap
// 权限点：mdm:material:category:catalog:bootstrap
export function bootstrapMaterialCategory() {
  return request({
    url: '/edd-mdm/api/mpt/material/category/v1/catalog/bootstrap',
    method: 'post'
  })
}