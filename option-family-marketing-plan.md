# OptionFamily 营销策略管理 - 前端重构计划

## 1. 需求概述

### 后端新增接口
- `GET /{saleModelCode}/optionFamilyPolicy` - 获取OptionFamily营销列表
- `POST /{saleModelCode}/optionFamilyPolicy` - 创建/更新营销信息
- `DELETE /{saleModelCode}/optionFamilyPolicy/{optionFamilyCode}` - 删除营销信息

### 手机端返回逻辑
- 如果设置了自定义营销标题 → 返回 `marketingTitle`
- 如果未设置 → `marketingTitle` 为 null，手机端使用 `optionFamilyName`（MDM默认名称）

## 2. 设计方案

### 2.1 UI设计方案（方案A：增强现有分组卡片）

在现有的OptionFamily分组卡片中集成营销编辑功能：

```
┌─────────────────────────────────────────────────────────────────┐
│ [OptionFamily] OF-001                                           │
│ 家族名称: 高级内饰包                                             │
│                                                                 │
│ ┌─ 营销信息 ─────────────────────────────────────────────────┐  │
│ │ 营销标题: [可编辑] 豪华内饰升级套餐                        │  │
│ │ 营销图片: [可编辑] https://example.com/image.jpg           │  │
│ │ 排序权重: [可编辑] 10                                      │  │
│ │                                                           │  │
│ │ [编辑营销] [删除营销]                                      │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ OptionCode列表 ──────────────────────────────────────────┐  │
│ │ OC-001 | 真皮座椅 | 已上架 | ¥5000 | [编辑]              │  │
│ │ OC-002 | 木质装饰 | 未配置 | -     | [添加]              │  │
│ └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据结构

#### OptionFamily营销数据模型
```javascript
{
  id: Number,                    // 主键ID
  saleModelCode: String,         // 销售车型代码
  optionFamilyCode: String,      // 选项族代码
  marketingTitle: String,        // 营销标题（可为空，为空时手机端使用optionFamilyName）
  marketingImage: String,        // 营销图片URL
  marketingDescription: String,  // 营销描述
  sortWeight: Number,            // 排序权重
  effectiveFrom: String,         // 生效时间
  effectiveTo: String            // 失效时间
}
```

## 3. 文件修改计划

### 3.1 新增文件

#### `src/api/otd/optionFamilyPolicy.js` - OptionFamily营销API
```javascript
import request from '@/utils/request'

// 获取OptionFamily营销列表
export function getOptionFamilyPolicyList(saleModelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionFamilyPolicy',
    method: 'get'
  })
}

// 创建/更新OptionFamily营销信息
export function saveOptionFamilyPolicy(saleModelCode, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionFamilyPolicy',
    method: 'post',
    data: data
  })
}

// 删除OptionFamily营销信息
export function deleteOptionFamilyPolicy(saleModelCode, optionFamilyCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionFamilyPolicy/' + optionFamilyCode,
    method: 'delete'
  })
}
```

#### `src/views/otd/salespolicy/components/OptionFamilyMarketingForm.vue` - 营销编辑表单
- 营销标题输入框
- 营销图片URL输入框
- 营销描述文本域
- 排序权重数字输入框
- 生效时间选择器
- 失效时间选择器

### 3.2 修改文件

#### `src/views/otd/salespolicy/components/OptionPolicyList.vue` - 主要修改

**修改内容：**
1. 在OptionFamily分组卡片中添加营销信息区域
2. 集成营销数据的获取和显示
3. 添加编辑/删除营销按钮
4. 添加营销信息表单组件

**代码变更：**
- 导入新的API和表单组件
- 在`data()`中添加营销相关数据
- 在`created()`中获取OptionFamily营销数据
- 添加营销编辑/删除方法
- 修改模板结构，增强分组卡片

## 4. 实现步骤

### 步骤1：创建OptionFamily营销API文件
- 创建 `src/api/otd/optionFamilyPolicy.js`
- 定义三个API函数：getList、save、delete

### 步骤2：创建OptionFamily营销表单组件
- 创建 `src/views/otd/salespolicy/components/OptionFamilyMarketingForm.vue`
- 实现表单字段：marketingTitle、marketingImage、marketingDescription、sortWeight、effectiveFrom、effectiveTo
- 实现表单验证和提交逻辑

### 步骤3：修改OptionPolicyList组件
- 导入新的API和表单组件
- 添加营销数据状态管理
- 修改模板结构，在分组卡片中显示营销信息
- 实现营销编辑/删除功能

### 步骤4：测试验证
- 测试OptionFamily营销信息的获取和显示
- 测试营销信息的创建和更新
- 测试营销信息的删除
- 测试手机端返回逻辑（marketingTitle为空时返回null）

## 5. 预期效果

### 用户体验提升
1. **一站式管理**：用户可以在同一界面管理OptionFamily营销和OptionCode策略
2. **直观显示**：营销信息直接显示在分组卡片中，无需切换页面
3. **快速操作**：支持快速编辑和删除营销信息

### 功能完整性
1. **完整字段支持**：支持营销标题、图片、描述、排序、生效时间等扩展字段
2. **手机端适配**：支持marketingTitle为空时返回null的逻辑
3. **数据一致性**：营销数据与OptionCode数据在同一视图中保持同步

## 6. 注意事项

### 6.1 数据加载优化
- OptionFamily营销数据应与OptionCode数据并行加载
- 考虑使用缓存避免重复请求

### 6.2 错误处理
- API调用失败时应有明确的错误提示
- 删除操作应有二次确认

### 6.3 权限控制
- 营销编辑功能应遵循现有的权限控制机制
- 使用 `v-hasPermi` 指令控制按钮显示

### 6.4 响应式设计
- 营销信息区域应在不同屏幕尺寸下正常显示
- 表单弹窗应适配移动端
