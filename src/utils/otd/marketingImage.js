/**
 * 销售策略营销图片上传规则
 * 来源：OTD-VSO-DSN-CR-004 §4.1，与 OTD-VSO-DSN-CR-003 §7 的前端预校验保持一致
 * 说明：此处只放纯函数与常量，便于脱离组件做单元测试；上传链路本身在 MarketingImageField.vue 中。
 */

// 单张图片最大字节数（10 MiB），与 EDD-OSS 图片白名单一致
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024

// 允许的 MIME 与扩展名映射（与后端 ImageMimeType 白名单一致）
export const ALLOWED_EXTENSIONS = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp']
}

// 上传阶段标识，用于分阶段错误提示
export const UPLOAD_STAGE = {
  TICKET: '申请上传凭证',
  COS: '图片直传 COS',
  COMPLETE: '完成确认'
}

/**
 * 解析并校验文件 MIME 与扩展名一致性
 * @param {File|Object} file 至少包含 name / type / size
 * @returns {string|null} 可用的 MIME，校验不通过返回 null
 */
export function resolveContentType(file) {
  if (!file) return null
  const name = file.name || ''
  const ext = (name.indexOf('.') >= 0 ? name.split('.').pop() : '').toLowerCase()
  let contentType = (file.type || '').toLowerCase()
  if (!ALLOWED_EXTENSIONS[contentType]) {
    // 浏览器未给出 MIME 或 MIME 不可用时，退回按扩展名推断
    contentType = Object.keys(ALLOWED_EXTENSIONS).find(mime => ALLOWED_EXTENSIONS[mime].indexOf(ext) >= 0)
  }
  if (!contentType) return null
  if (ALLOWED_EXTENSIONS[contentType].indexOf(ext) < 0) return null
  return contentType
}

/**
 * 上传前预校验：类型 → 扩展名一致性 → 大小
 * @param {File|Object} file
 * @returns {{ok: boolean, contentType?: string, message?: string}}
 */
export function validateImageFile(file) {
  if (!file) {
    return { ok: false, message: '请选择要上传的图片' }
  }
  const contentType = resolveContentType(file)
  if (!contentType) {
    return { ok: false, message: '仅支持 JPEG / PNG / WebP 图片，且扩展名需与文件类型一致' }
  }
  if (!file.size || file.size > MAX_IMAGE_SIZE) {
    return { ok: false, message: '图片大小必须大于 0 且不超过 10 MiB' }
  }
  return { ok: true, contentType: contentType }
}

/**
 * 是否可预览：手工粘贴的 URL 与上传回填的地址等价，不要求必须来自 EDD-OSS，
 * 因此只做协议判断，不去校验扩展名（COS 公开地址可能不带后缀）。
 * @param {string} url
 * @returns {boolean}
 */
export function isPreviewableUrl(url) {
  if (!url || typeof url !== 'string') return false
  const value = url.trim()
  if (!value) return false
  return /^https?:\/\//i.test(value) || value.indexOf('//') === 0 || /^data:image\//i.test(value)
}
