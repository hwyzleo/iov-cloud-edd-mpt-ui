# 组织管理页面设计文档

## 背景

企业管理模块需要在org目录下新增部门管理、岗位管理、员工管理三个页面，使用iov-cloud-edd-org项目的MptDepartmentController、MptPositionController、MptEmployeeController三个新接口，逐步替代现有的system下对应页面。

## 需求确认

- **页面关系**: 替代关系，逐步迁移
- **菜单位置**: org目录下新建直接子目录
- **字段映射**: 完全适配新接口字段
- **权限标识**: 完全使用新权限标识（org:department:*、org:position:*、org:employee:*）
- **员工功能**: 基础信息管理，不包含角色分配、密码管理、导入导出等功能

## 方案选择

采用**方案A：直接复制并适配**，从system下复制页面到org目录，直接修改代码适配新接口字段和权限。理由：
1. 新旧接口差异较大，直接修改比抽象复用更清晰
2. 替代迁移背景下，保持简洁更重要
3. 未来system页面可废弃，无需保留复杂继承

## 目录结构

```
src/views/org/
├── department/          # 部门管理
│   └── index.vue
├── position/            # 岗位管理  
│   └── index.vue
├── employee/            # 员工管理
│   └── index.vue

src/api/org/
├── department.js        # 部门API
├── position.js          # 岗位API
├── employee.js          # 员工API
```

## API接口设计

### 部门API (department.js)

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| listDept | GET | /mpt/department/list | 列表查询 |
| getDeptTree | GET | /mpt/department/tree | 查询部门树 |
| getDept | GET | /mpt/department/{id} | 详情查询 |
| addDept | POST | /mpt/department | 新增 |
| updateDept | PUT | /mpt/department | 修改 |
| delDept | DELETE | /mpt/department/{ids} | 删除 |
| listDeptExcludeChild | GET | /mpt/department/list/exclude/{id} | 排除节点查询 |
| deptTreeSelect | GET | /mpt/department/deptTree | 部门树结构 |

### 岗位API (position.js)

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| listPosition | GET | /mpt/position/list | 列表查询(分页) |
| getPosition | GET | /mpt/position/{id} | 详情查询 |
| addPosition | POST | /mpt/position | 新增 |
| updatePosition | PUT | /mpt/position | 修改 |
| delPosition | DELETE | /mpt/position/{ids} | 删除 |

### 员工API (employee.js)

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| listEmployee | GET | /mpt/employee/list | 列表查询(分页) |
| getEmployee | GET | /mpt/employee/{id} | 详情查询 |
| addEmployee | POST | /mpt/employee | 新增 |
| updateEmployee | PUT | /mpt/employee | 修改 |
| delEmployee | DELETE | /mpt/employee/{ids} | 删除 |

## 字段映射规则

### 部门页面

| 旧字段 | 新字段 | 类型变化 | 说明 |
|--------|--------|----------|------|
| deptId | id | Long | 主键 |
| parentId | parentId | Long | 父ID（不变） |
| deptName | name | String | 名称 |
| orderNum | sort | Integer | 排序 |
| status | enable | String→Boolean | 状态转换："0"→true, "1"→false |
| leader | leader | String | 负责人（不变） |
| phone | phone | String | 电话（不变） |
| email | email | String | 邮箱（不变） |
| createTime | createTime | Date | 创建时间（不变） |
| children | children | List | 子节点（不变） |
| - | code | String | 新增：部门编码 |
| - | ancestors | String | 新增：祖级列表 |

### 岗位页面

| 旧字段 | 新字段 | 类型变化 | 说明 |
|--------|--------|----------|------|
| postId | id | Long | 主键 |
| postCode | code | String | 编码 |
| postName | name | String | 名称 |
| postSort | sort | Integer | 排序 |
| status | enable | String→Boolean | 状态转换 |
| createTime | createTime | Date | 创建时间（不变） |
| remark | - | 删除 | 无备注字段 |

### 员工页面

| 旧字段 | 新字段 | 类型变化 | 说明 |
|--------|--------|----------|------|
| userId | id | Long | 主键 |
| userName | code | String | 工号 |
| nickName | name | String | 姓名 |
| phonenumber | phone | String | 手机号 |
| email | email | String | 邮箱（不变） |
| sex | gender | String→Integer | 性别转换："0"→0, "1"→1, "2"→2 |
| status | enable | String→Boolean | 状态转换 |
| createTime | createTime | Date | 创建时间（不变） |
| deptId | - | 删除 | 无部门关联字段 |
| - | eiamUserId | Long | 新增：EIAM用户ID |
| - | eiamAccount | String | 新增：EIAM账号 |

## 页面功能设计

### 部门管理页面

**功能列表:**
- 树形表格展示部门结构
- 搜索条件：部门名称、状态
- 新增/修改/删除部门
- 展开/折叠功能
- 上级部门选择树

**权限配置:**
- org:department:list - 列表查询
- org:department:add - 新增
- org:department:edit - 修改
- org:department:remove - 删除
- org:department:query - 详情查询

**表单字段:**
- 上级部门（parentId）
- 部门编码（code）- 新增字段
- 部门名称（name）- 必填
- 显示排序（sort）- 必填
- 负责人（leader）
- 联系电话（phone）
- 邮箱（email）
- 部门状态（enable）- Boolean类型，默认true

### 岗位管理页面

**功能列表:**
- 分页表格展示岗位列表
- 搜索条件：岗位编码、岗位名称、状态
- 新增/修改/删除岗位
- 批量删除
- 分页组件

**权限配置:**
- org:position:list - 列表查询
- org:position:add - 新增
- org:position:edit - 修改
- org:position:remove - 删除
- org:position:query - 详情查询

**表单字段:**
- 岗位名称（name）- 必填
- 岗位编码（code）- 必填
- 岗位顺序（sort）- 必填
- 岗位状态（enable）- Boolean类型，默认true
- 删除备注字段（remark）

### 员工管理页面

**功能列表:**
- 分页表格展示员工列表
- 搜索条件：工号、姓名、手机号、EIAM账号、性别、状态、创建时间范围
- 新增/修改/删除员工
- 批量删除
- 分页组件

**不包含功能:**
- 部门树形选择
- 角色分配
- 岗位分配
- 密码管理（重置密码、修改密码）
- 用户导入/导出

**权限配置:**
- org:employee:list - 列表查询
- org:employee:add - 新增
- org:employee:edit - 修改
- org:employee:remove - 删除
- org:employee:query - 详情查询

**表单字段:**
- 工号（code）- 必填
- 姓名（name）- 必填
- 性别（gender）- Integer类型（0-未知、1-男、2-女）
- 手机号（phone）
- 邮箱（email）
- EIAM账号（eiamAccount）- 新增字段
- 是否启用（enable）- Boolean类型，默认true
- 排序（sort）

## 数据字典适配

### 状态字段转换

状态字段从字典值转换为Boolean类型：
- `sys_normal_disable` 字典的 "0"(正常) → `true`
- `sys_normal_disable` 字典的 "1"(停用) → `false`

前端展示时，使用Boolean值控制状态开关：
- `el-switch` 组件：`active-value="true"` `inactive-value="false"`
- `el-radio` 组件：`label="true"` 显示"正常"，`label="false"` 显示"停用"

### 性别字段转换（员工页面）

性别字段从字典值转换为Integer类型：
- `sys_user_sex` 字典的 "0"(未知) → `0`
- `sys_user_sex` 字典的 "1"(男) → `1`
- `sys_user_sex` 字典的 "2"(女) → `2`

前端使用Integer值：
- `el-select` 组件选项值直接使用数字：`:value="0"`、`:value="1"`、`:value="2"`

## 路由配置

路由路径和菜单配置需在后台系统中配置，建议路由结构：

```javascript
{
  path: '/org',
  component: Layout,
  redirect: '/org/department',
  name: 'Org',
  meta: { title: '企业管理', icon: 'tree' },
  children: [
    {
      path: 'department',
      component: () => import('@/views/org/department/index'),
      name: 'Department',
      meta: { title: '部门管理', icon: 'tree' }
    },
    {
      path: 'position',
      component: () => import('@/views/org/position/index'),
      name: 'Position',
      meta: { title: '岗位管理', icon: 'post' }
    },
    {
      path: 'employee',
      component: () => import('@/views/org/employee/index'),
      name: 'Employee',
      meta: { title: '员工管理', icon: 'peoples' }
    }
  ]
}
```

## 实施步骤

1. **创建API文件**
   - 创建 `src/api/org/department.js`
   - 创建 `src/api/org/position.js`
   - 创建 `src/api/org/employee.js`

2. **创建页面文件**
   - 复制并改造 `src/views/system/dept/index.vue` → `src/views/org/department/index.vue`
   - 复制并改造 `src/views/system/post/index.vue` → `src/views/org/position/index.vue`
   - 参考 `src/views/system/user/index.vue` 创建 `src/views/org/employee/index.vue`（仅基础信息部分）

3. **适配字段和权限**
   - 所有页面替换API导入路径
   - 修改字段名适配新接口
   - 状态字段转换Boolean类型
   - 权限标识替换为新的org权限

4. **后台配置**
   - 配置菜单路由
   - 配置权限标识
   - 分配角色权限

## 注意事项

1. **数据类型转换**: Boolean和Integer类型的正确处理
2. **权限标识统一**: 所有权限使用org:*前缀，需后台同步配置
3. **删除功能**: 岗位页面的备注字段功能删除
4. **员工页面简化**: 无部门关联、角色分配、密码管理等复杂功能
5. **响应结构**: 新接口返回 `ApiResponse` 包装，需适配 `.data` 取值
6. **分页结构**: 新接口返回 `PageResult`，需适配 `.rows` 和 `.total` 取值
7. **树形数据**: 部门树使用 `id` 和 `children` 字段，`handleTree` 方法需适配
8. **Treeselect组件**: `normalizer` 方法需适配 `id`、`name`、`children` 字段

## 测试验证

1. API接口调用测试
2. 页面渲染和交互测试
3. 权限控制测试
4. 字段映射和数据转换测试
5. 树形结构展示测试
6. 分页功能测试
7. 表单验证测试
8. 删除和批量操作测试

## 后续优化

1. 后端补充岗位备注字段（可选）
2. 后端补充员工部门关联字段（可选）
3. 后端补充员工导出功能实现
4. 后端补充岗位导出功能实现
5. 后端补充部门导出功能实现
6. 后台菜单和权限配置
7. system页面废弃计划（需协调）