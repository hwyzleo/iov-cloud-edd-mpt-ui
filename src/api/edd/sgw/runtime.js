import request from '@/utils/request'

// 查询运行时实例状态
export function listRuntimeInstances() {
  return request({
    url: '/system/sgw/runtime/instances',
    method: 'get'
  })
}
