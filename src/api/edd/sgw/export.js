import request from '@/utils/request'
import { saveAs } from 'file-saver'

// 导出路由配置
export function exportRoutes() {
  return request({
    url: '/system/sgw/exports/routes',
    method: 'get'
  }).then(response => download(response, 'sgw-routes'))
}

// 导出策略配置
export function exportPolicies(type) {
  return request({
    url: '/system/sgw/exports/policies/' + type,
    method: 'get'
  }).then(response => download(response, 'sgw-' + type + '-policies'))
}

// 导出完整草稿配置
export function exportConfig() {
  return request({
    url: '/system/sgw/exports/config',
    method: 'get'
  }).then(response => download(response, 'sgw-config'))
}

function download(response, prefix) {
  const content = response && response.data && response.data.content ? response.data.content : '{}'
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  saveAs(blob, prefix + '-' + Date.now() + '.json')
  return response
}
