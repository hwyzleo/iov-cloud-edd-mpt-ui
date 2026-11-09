

/**
 * 通用js方法封装处理
 * Copyright (c) 2019 ruoyi
 */

// 日期格式化
export function parseTime(time, pattern) {
  if (arguments.length === 0 || !time) {
    return null
  }
  const format = pattern || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
      time = parseInt(time)
    } else if (typeof time === 'string') {
      time = time.replace(new RegExp(/-/gm), '/').replace('T', ' ').replace(new RegExp(/\.[\d]{3}/gm), '');
    }
    if ((typeof time === 'number') && (time.toString().length === 10)) {
      time = time * 1000
    }
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value] }
    if (result.length > 0 && value < 10) {
      value = '0' + value
    }
    return value || 0
  })
  return time_str
}

/**
 * TSP 时间字段展示格式化（TSP-DSN-CR-015：传输为展示墙钟，直接按组件格式化）。
 * 兼容三种传输格式：
 * 1) epoch 毫秒/秒数字（绝对时刻）——本地化输出（兼容旧数据）；
 * 2) 带时区标记字符串（如 "...Z" / "...+08:00"，绝对时刻）——解析后本地化输出；
 * 3) 无偏移 ISO 字符串——后端已按展示时区（X-Timezone/默认 Asia/Shanghai）输出的展示墙钟，
 *    直接取年月日时分秒格式化，不做 UTC/本地二次换算（禁止 new Date(无时区字符串) 猜时区）。
 */
export function parseTspTime(time, pattern) {
  if (time === null || time === undefined || time === '') {
    return null
  }
  if (typeof time === 'string') {
    const trimmed = time.trim()
    if (/^[0-9]+$/.test(trimmed)) {
      // epoch 数字字符串（10 位秒 / 13 位毫秒）
      time = parseInt(trimmed, 10)
    } else if (/(Z|[+-]\d{2}:\d{2})$/.test(trimmed)) {
      // 带时区标记：绝对时刻，直接解析
      time = new Date(trimmed)
    } else {
      // 展示墙钟（= 浏览器时区）：按组件构造本地 Date 仅用于格式化，不再做时区换算
      const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/.exec(trimmed)
      if (!m) {
        return null
      }
      time = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0))
    }
  }
  return parseTime(time, pattern)
}

/**
 * 将后端时间值归一化为 epoch 毫秒（用于 el-date-picker 的 timestamp 值格式）。
 *
 * OTA 后端 JSON 时间契约已从 epoch-millis 切换为 ISO-8601（CR-021），响应中的
 * java.util.Date / java.time 字段会返回 "2026-10-31T16:00:00.000+00:00" 这类字符串。
 * el-date-picker 在 value-format="timestamp" 下只接受数字，直接回填 ISO 字符串会解析失败、
 * 编辑弹窗显示为空，故回显与提交均需经过本工具转换。
 *
 * 支持：Date、13 位毫秒/10 位秒数字、数字字符串、带偏移 ISO（Z / +08:00）、
 * 无偏移 ISO 或墙钟字符串（按浏览器本地时区解释）。无法解析返回 null（不返回 NaN）。
 *
 * @param {*} time 后端/组件时间值
 * @returns {number|null} epoch 毫秒
 */
export function toEpochMillis(time) {
  if (time === null || time === undefined || time === '') {
    return null
  }
  if (time instanceof Date) {
    const t = time.getTime()
    return isNaN(t) ? null : t
  }
  if (typeof time === 'number') {
    if (!isFinite(time)) return null
    // 10 位为 epoch 秒，其余按毫秒处理
    return Math.abs(time) < 1e11 ? Math.round(time * 1000) : Math.round(time)
  }
  if (typeof time === 'string') {
    const s = time.trim()
    if (s === '') return null
    if (/^[0-9]+$/.test(s)) {
      const n = parseInt(s, 10)
      return s.length <= 10 ? n * 1000 : n
    }
    if (/(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
      // 带偏移：绝对时刻，直接解析
      const t = new Date(s).getTime()
      return isNaN(t) ? null : t
    }
    // 无偏移：按墙钟（浏览器时区）构造，避免 new Date 猜时区
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?(?:\.\d+)?$/.exec(s)
    if (m) {
      return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)).getTime()
    }
    const t = new Date(s).getTime()
    return isNaN(t) ? null : t
  }
  return null
}

/**
 * 将时间值转换为后端 JSON 契约要求的 ISO-8601 绝对时刻（带偏移，统一输出 UTC 'Z'）。
 *
 * 用于提交 java.util.Date / java.time 入参（CR-021：禁止新增 epoch-millis 写）。
 * 无值返回 null。
 *
 * @param {*} time 组件/后端时间值
 * @returns {string|null} 形如 2026-10-31T16:00:00.000Z
 */
export function toIsoDateTime(time) {
  const ms = toEpochMillis(time)
  if (ms === null) {
    return null
  }
  return new Date(ms).toISOString()
}

// 表单重置
export function resetForm(refName) {
  if (this.$refs[refName]) {
    this.$refs[refName].resetFields();
  }
}

// 添加日期范围
export function addDateRange(params, dateRange, propName) {
  let search = params;
  search.params = typeof (search.params) === 'object' && search.params !== null && !Array.isArray(search.params) ? search.params : {};
  dateRange = Array.isArray(dateRange) ? dateRange : [];
  if (typeof (propName) === 'undefined') {
    search.params['beginTime'] = dateRange[0];
    search.params['endTime'] = dateRange[1];
  } else {
    search.params['begin' + propName] = dateRange[0];
    search.params['end' + propName] = dateRange[1];
  }
  return search;
}

// 回显数据字典
export function selectDictLabel(datas, value) {
  if (value === undefined) {
    return "";
  }
  var actions = [];
  Object.keys(datas).some((key) => {
    if (datas[key].value == ('' + value)) {
      actions.push(datas[key].label);
      return true;
    }
  })
  if (actions.length === 0) {
    actions.push(value);
  }
  return actions.join('');
}

// 回显数据字典（字符串、数组）
export function selectDictLabels(datas, value, separator) {
  if (value === undefined || value.length ===0) {
    return "";
  }
  if (Array.isArray(value)) {
    value = value.join(",");
  }
  var actions = [];
  var currentSeparator = undefined === separator ? "," : separator;
  var temp = value.split(currentSeparator);
  Object.keys(value.split(currentSeparator)).some((val) => {
    var match = false;
    Object.keys(datas).some((key) => {
      if (datas[key].value == ('' + temp[val])) {
        actions.push(datas[key].label + currentSeparator);
        match = true;
      }
    })
    if (!match) {
      actions.push(temp[val] + currentSeparator);
    }
  })
  return actions.join('').substring(0, actions.join('').length - 1);
}

// 字符串格式化(%s )
export function sprintf(str) {
  var args = arguments, flag = true, i = 1;
  str = str.replace(/%s/g, function () {
    var arg = args[i++];
    if (typeof arg === 'undefined') {
      flag = false;
      return '';
    }
    return arg;
  });
  return flag ? str : '';
}

// 转换字符串，undefined,null等转化为""
export function parseStrEmpty(str) {
  if (!str || str == "undefined" || str == "null") {
    return "";
  }
  return str;
}

// 数据合并
export function mergeRecursive(source, target) {
  for (var p in target) {
    try {
      if (target[p].constructor == Object) {
        source[p] = mergeRecursive(source[p], target[p]);
      } else {
        source[p] = target[p];
      }
    } catch (e) {
      source[p] = target[p];
    }
  }
  return source;
};

/**
 * 构造树型结构数据
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 孩子节点字段 默认 'children'
 */
export function handleTree(data, id, parentId, children) {
  let config = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children'
  };

  var childrenListMap = {};
  var nodeIds = {};
  var tree = [];

  for (let d of data) {
    let parentId = d[config.parentId];
    if (childrenListMap[parentId] == null) {
      childrenListMap[parentId] = [];
    }
    nodeIds[d[config.id]] = d;
    childrenListMap[parentId].push(d);
  }

  for (let d of data) {
    let parentId = d[config.parentId];
    if (nodeIds[parentId] == null) {
      tree.push(d);
    }
  }

  for (let t of tree) {
    adaptToChildrenList(t);
  }

  function adaptToChildrenList(o) {
    if (childrenListMap[o[config.id]] !== null) {
      o[config.childrenList] = childrenListMap[o[config.id]];
    }
    if (o[config.childrenList]) {
      for (let c of o[config.childrenList]) {
        adaptToChildrenList(c);
      }
    }
  }
  return tree;
}

/**
* 参数处理
* @param {*} params  参数
*/
export function tansParams(params) {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName];
    var part = encodeURIComponent(propName) + "=";
    if (value !== null && value !== "" && typeof (value) !== "undefined") {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== "" && typeof (value[key]) !== 'undefined') {
            let params = propName + '[' + key + ']';
            var subPart = encodeURIComponent(params) + "=";
            result += subPart + encodeURIComponent(value[key]) + "&";
          }
        }
      } else {
        result += part + encodeURIComponent(value) + "&";
      }
    }
  }
  return result
}

// 验证是否为blob格式
export function blobValidate(data) {
  return data.type !== 'application/json'
}
