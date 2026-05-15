# 员工关联部门和岗位设计

**目标:** 为员工管理页面添加部门和岗位关联功能，支持多部门多岗位，首个为主部门/主岗位。

**架构:** 前端使用 el-select 多选下拉，后端扩展 VO/Cmd/Dto 并处理关联表操作。

**技术栈:** Vue 2 + Element UI, Spring Boot + MyBatis Plus

---

## 数据设计

### 前端字段
- `departmentIds`: List<Long> - 部门ID数组，第一个为主部门
- `positionIds`: List<Long> - 岗位ID数组，第一个为主岗位

### 后端字段
- `EmployeeMpt`: 添加 `departmentIds`, `positionIds`, `departmentNames`, `positionNames`
- `CreateEmployeeCmd`: 添加 `departmentIds`, `positionIds`
- `UpdateEmployeeCmd`: 添加 `departmentIds`, `positionIds`
- `EmployeeDto`: 添加部门岗位信息

### 关联表
- `tb_employee_department`: employee_id, department_id, is_primary
- `tb_employee_position`: employee_id, position_id, is_primary

---

## 功能设计

### 表单
1. 部门选择器：el-select multiple，选项来自 getDeptTree 扁平化
2. 岗位选择器：el-select multiple，选项来自 listPosition
3. 第一个选项自动为主部门/主岗位

### 列表
1. 所属部门列：显示部门名称，主部门标记"(主)"
2. 岗位列：显示岗位名称，主岗位标记"(主)"

### API
- 创建/更新员工时传入 departmentIds/positionIds
- 查询员工时返回 departmentNames/positionNames

---

## 后端实现要点

1. **EmployeeMpt**: 扩展 VO 字段
2. **CreateEmployeeCmd/UpdateEmployeeCmd**: 扩展 Cmd 字段
3. **EmployeeDto**: 扩展 Dto 字段
4. **EmployeeAssembler**: 处理部门岗位转换
5. **EmployeeAppService**: 
   - 创建时保存关联表（首个设 isPrimary=true）
   - 更新时先删旧关联再保存新关联
   - 查询时关联查询名称
6. **EmployeeRepository**: 新增关联表操作方法