/**
 * 车辆证书人工补申请的类别—Profile 治理常量（SEC-VIAM-DSN-CR-004 / D-VIAM-026）。
 *
 * 前端联动只用于减少误操作：服务端仍以固定组合
 * TBOX→TBOX_TSP_CLIENT、IVI→IVI_DEVICE_IDENTITY 为权威门禁，
 * 不得因前端限制而省略服务端校验。
 */

/** 设备类别选项（保持 TBOX 为默认） */
export const DEVICE_CATEGORY_OPTIONS = [
  { value: 'TBOX', label: 'TBOX' },
  { value: 'IVI', label: 'IVI' }
]

/** 人工补申请默认设备类别（沿用既有操作习惯） */
export const DEFAULT_DEVICE_CATEGORY = 'TBOX'

/** 设备类别 → 唯一允许的证书 Profile（与后端 D-VIAM-023 保持一一对应） */
export const PROFILE_BY_CATEGORY = {
  TBOX: 'TBOX_TSP_CLIENT',
  IVI: 'IVI_DEVICE_IDENTITY'
}

/** TBOX/IVI 通用提示：受信工位 CSR + 唯一 Subject CN = 目标 hsmUid */
export const COMPENSATE_HINT = '后台不生成设备密钥或CSR，CSR必须来自目标设备（TBOX/IVI）对应受信工位的回读结果；'
  + '且CSR的Subject CN必须为目标安全主体的HSM UID（由绑定关系解析，非设备SN；IVI 同样不得使用设备SN），'
  + '否则将因身份不一致被拒。'

/** 类别对应的唯一 Profile；未知类别返回 undefined */
export function profileForCategory(category) {
  return PROFILE_BY_CATEGORY[category]
}

/** 类别对应的可选 Profile 列表（联动唯一值，不提供多选） */
export function profileOptionsFor(category) {
  const profile = profileForCategory(category)
  return profile ? [{ value: profile, label: profile }] : []
}

/** 打开人工补申请对话框时的默认表单（TBOX + TBOX_TSP_CLIENT） */
export function defaultCompensateForm() {
  return {
    vin: undefined,
    deviceCategory: DEFAULT_DEVICE_CATEGORY,
    deviceSn: undefined,
    certificateProfile: profileForCategory(DEFAULT_DEVICE_CATEGORY),
    csrDerBase64: undefined,
    requestId: undefined,
    originalRequestId: undefined,
    facilityNo: undefined,
    lineCode: undefined,
    ticketNo: undefined,
    reason: undefined
  }
}
