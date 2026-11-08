import request from '@/utils/request'

// 查询注册中心服务与获批直连主机
export function getUpstreamOptions() {
  return request({
    url: '/system/sgw/upstreams/options',
    method: 'get'
  })
}
