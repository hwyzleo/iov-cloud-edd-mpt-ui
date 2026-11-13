/**
 * 个人中心头像上传规则（EDD-MPT-DSN-CR-001 §4.3）
 *
 * 说明：设计 §8.3 要求校验逻辑内联在 userAvatar.vue、不抽 src/utils 共用模块（不影响 OTD 营销图片组件）；
 * 这里放在页面同级目录，仅服务于个人中心头像，同时便于 tests/system/avatarUpload.test.js 单测。
 */

// 单张头像最大字节数（与 EDD-OSS §5.2 对齐，10 MiB）
export const MAX_AVATAR_SIZE = 10 * 1024 * 1024

// 服务端接受的 MIME 白名单（与 EDD-OSS ImageMimeType 一致）
export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// 裁剪输出固定为 PNG，上传文件名必须与扩展名一致，否则 EDD-OSS 会以 MIME 与扩展名不匹配拒绝
export const AVATAR_FILENAME = 'avatar.png'
export const AVATAR_CONTENT_TYPE = 'image/png'

// 三阶段失败提示（US-004）
export const UPLOAD_STAGE = {
  TICKET: '申请上传凭证',
  COS: '头像直传 COS',
  COMPLETE: '完成确认'
}

/**
 * 选择图片前置校验：image/*、非空、不超过 10 MiB
 *
 * @param {File} file 浏览器选择的文件
 * @returns {{ok: boolean, message?: string}} 校验结果
 */
export function validateAvatarFile(file) {
  if (!file) {
    return { ok: false, message: '请选择头像图片' }
  }
  const type = (file.type || '').toLowerCase()
  if (type.indexOf('image/') !== 0) {
    return { ok: false, message: '文件格式错误，请上传图片类型，如 JPG、PNG 后缀的文件' }
  }
  if (!file.size || file.size < 1) {
    return { ok: false, message: '图片内容为空，请重新选择' }
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { ok: false, message: '图片大小不能超过 10 MiB，请压缩后重试' }
  }
  return { ok: true }
}

/**
 * 浏览器直传 COS：独立 fetch，仅携带 Content-Type，不携带平台凭证或 Cookie
 *
 * @param {string} uploadUrl 预签名地址
 * @param {Blob} blob 裁剪后的 PNG
 * @param {string} contentType 必须与预签名声明一致
 * @param {Function} [fetchImpl] 便于测试注入
 * @returns {Promise<Response>} 直传结果
 */
export function putAvatarToCos(uploadUrl, blob, contentType, fetchImpl) {
  const httpFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null)
  if (!httpFetch) {
    return Promise.reject(new Error('当前浏览器不支持直传，请升级浏览器后重试'))
  }
  if (!uploadUrl) {
    return Promise.reject(new Error('上传凭证缺少直传地址'))
  }
  return httpFetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType || AVATAR_CONTENT_TYPE },
    body: blob,
    credentials: 'omit'
  }).then(response => {
    if (!response || !response.ok) {
      throw new Error('COS 返回 HTTP ' + (response ? response.status : '未知'))
    }
    return response
  })
}

/**
 * 按阶段生成可操作的失败提示
 *
 * @param {string} stage 失败阶段
 * @param {*} error 异常
 * @returns {{message: string, alreadyNotified: boolean}} 提示内容与是否已由拦截器提示
 */
export function stageFailureMessage(stage, error) {
  const detail = error && error.message ? error.message : '未知错误'
  if (stage === UPLOAD_STAGE.COS) {
    return {
      message: '头像直传 COS 失败（' + detail + '）。请用浏览器开发者工具 Network 查看 OPTIONS/PUT 请求：' +
        '多为 Bucket CORS 未允许当前站点执行 PUT 或未允许 Content-Type 请求头，' +
        '也可能是预签名地址已过期或图片超出限制。',
      alreadyNotified: false
    }
  }
  // 申请与完成确认走平台 axios 拦截器，HTTP 错误已由拦截器提示，避免重复弹框
  const alreadyNotified = !!(error && error.response)
  return {
    message: stage + '失败：' + detail,
    alreadyNotified
  }
}
