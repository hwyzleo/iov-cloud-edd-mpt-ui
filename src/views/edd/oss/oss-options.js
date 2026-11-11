// 对象存储管理端共用枚举与展示辅助（EDD-OSS-DSN-CR-001）

// 图片对象状态：过期是时间属性，不引入 EXPIRED 状态
export const IMAGE_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待上传', type: 'warning', desc: '上传任务已创建，尚未完成确认' },
  { value: 'UPLOADED', label: '已上传', type: 'success', desc: '已完成确认并通过 COS 元数据核验' },
  { value: 'DELETED', label: '已删除', type: 'info', desc: 'COS 对象已删除，记录保留' }
]

// 第一阶段允许的图片 MIME（后端 ImageMimeType 白名单）
export const IMAGE_CONTENT_TYPE_OPTIONS = [
  { value: 'image/jpeg', label: 'JPEG (image/jpeg)' },
  { value: 'image/png', label: 'PNG (image/png)' },
  { value: 'image/webp', label: 'WebP (image/webp)' }
]

// 对象存储提供方
export const STORAGE_PROVIDER_LABELS = {
  TENCENT_COS: '腾讯云 COS'
}

// 对象访问权限
export const ACCESS_PERMISSION_LABELS = {
  PUBLIC_READ_PRIVATE_WRITE: '公有读私有写'
}

/** 状态显示文案 */
export function imageStatusLabel(status) {
  if (!status) return ''
  const item = IMAGE_STATUS_OPTIONS.find(o => o.value === status)
  return item ? item.label : status
}

/** 状态标签类型 */
export function imageStatusTagType(status) {
  const item = IMAGE_STATUS_OPTIONS.find(o => o.value === status)
  return item ? item.type : 'info'
}

/** 图片类型显示文案（未识别时原样展示） */
export function imageContentTypeLabel(contentType) {
  if (!contentType) return '-'
  const item = IMAGE_CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)
  return item ? item.label : contentType
}

/** 存储提供方显示文案 */
export function storageProviderLabel(provider) {
  if (!provider) return '-'
  return STORAGE_PROVIDER_LABELS[provider] || provider
}

/** 访问权限显示文案 */
export function accessPermissionLabel(permission) {
  if (!permission) return '-'
  return ACCESS_PERMISSION_LABELS[permission] || permission
}

/** 字节数格式化（后端只返回字节，最大 10 MiB） */
export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || bytes === '') return '-'
  const size = Number(bytes)
  if (isNaN(size)) return '-'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / 1024 / 1024).toFixed(2) + ' MB'
}
