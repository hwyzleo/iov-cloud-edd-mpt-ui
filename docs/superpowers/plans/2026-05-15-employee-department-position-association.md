# 员工关联部门和岗位实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为员工管理添加部门和岗位关联功能，支持多部门多岗位，首个为主部门/主岗位。

**Architecture:** 后端扩展VO/Cmd/Dto处理关联表，前端使用el-select多选下拉展示。

**Tech Stack:** Vue 2 + Element UI, Spring Boot + MyBatis Plus

---

## 文件结构

### 后端修改
- `iov-cloud-edd-org/edd-org-api/.../EmployeeMpt.java` - 扩展VO字段
- `iov-cloud-edd-org/edd-org-service/.../CreateEmployeeCmd.java` - 扩展Cmd字段
- `iov-cloud-edd-org/edd-org-service/.../UpdateEmployeeCmd.java` - 扩展Cmd字段
- `iov-cloud-edd-org/edd-org-service/.../EmployeeDto.java` - 扩展Dto字段
- `iov-cloud-edd-org/edd-org-service/.../EmployeeAssembler.java` - 处理转换逻辑
- `iov-cloud-edd-org/edd-org-service/.../EmployeeAppService.java` - 处理关联表操作
- `iov-cloud-edd-org/edd-org-service/.../EmployeeRepository.java` - 新增关联操作方法
- `iov-cloud-edd-org/edd-org-service/.../EmployeeRepositoryImpl.java` - 实现关联操作
- `iov-cloud-edd-org/edd-org-service/.../EmployeeMptAssembler.java` - 处理VO转换

### 前端修改
- `iov-cloud-edd-mpt-ui/src/views/org/enterprise/employee/index.vue` - 添加部门和岗位选择器

---

### Task 1: 扩展后端VO和Cmd字段

**Files:**
- Modify: `iov-cloud-edd-org/edd-org-api/.../EmployeeMpt.java`
- Modify: `iov-cloud-edd-org/edd-org-service/.../CreateEmployeeCmd.java`
- Modify: `iov-cloud-edd-org/edd-org-service/.../UpdateEmployeeCmd.java`
- Modify: `iov-cloud-edd-org/edd-org-service/.../EmployeeDto.java`

- [ ] **Step 1: 扩展 EmployeeMpt VO**

在 `EmployeeMpt.java` 末尾添加字段：

```java
/**
 * 部门ID列表，第一个为主部门
 */
private List<Long> departmentIds;

/**
 * 岗位ID列表，第一个为主岗位
 */
private List<Long> positionIds;

/**
 * 所属部门名称，逗号分隔，主部门标记"(主)"
 */
private String departmentNames;

/**
 * 岗位名称，逗号分隔，主岗位标记"(主)"
 */
private String positionNames;
```

添加导入：
```java
import java.util.List;
```

- [ ] **Step 2: 扩展 CreateEmployeeCmd**

在 `CreateEmployeeCmd.java` 末尾添加字段：

```java
private List<Long> departmentIds;
private List<Long> positionIds;
```

添加导入：
```java
import java.util.List;
```

- [ ] **Step 3: 扩展 UpdateEmployeeCmd**

在 `UpdateEmployeeCmd.java` 末尾添加字段：

```java
private List<Long> departmentIds;
private List<Long> positionIds;
```

添加导入：
```java
import java.util.List;
```

- [ ] **Step 4: 扩展 EmployeeDto**

在 `EmployeeDto.java` 末尾添加字段：

```java
private List<Long> departmentIds;
private List<Long> positionIds;
private String departmentNames;
private String positionNames;
```

添加导入：
```java
import java.util.List;
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: 扩展员工VO和Cmd字段支持部门和岗位"
```

---

### Task 2: 扩展Repository处理关联表

**Files:**
- Modify: `iov-cloud-edd-org/edd-org-service/.../EmployeeRepository.java`
- Modify: `iov-cloud-edd-org/edd-org-service/.../EmployeeRepositoryImpl.java`

- [ ] **Step 1: 扩展 EmployeeRepository 接口**

在 `EmployeeRepository.java` 末尾添加方法声明：

```java
void saveDepartments(Long employeeId, List<Long> departmentIds);
void savePositions(Long employeeId, List<Long> positionIds);
void deleteDepartments(Long employeeId);
void deletePositions(Long employeeId);
List<Long> findDepartmentIds(Long employeeId);
List<Long> findPositionIds(Long employeeId);
```

添加导入：
```java
import java.util.List;
```

- [ ] **Step 2: 实现 EmployeeRepositoryImpl 关联方法**

在 `EmployeeRepositoryImpl.java` 添加依赖注入：

```java
private final EmployeeDepartmentMapper employeeDepartmentMapper;
private final EmployeePositionMapper employeePositionMapper;
```

添加实现方法：

```java
@Override
public void saveDepartments(Long employeeId, List<Long> departmentIds) {
    if (departmentIds == null || departmentIds.isEmpty()) return;
    for (int i = 0; i < departmentIds.size(); i++) {
        EmployeeDepartmentPo po = EmployeeDepartmentPo.builder()
            .employeeId(employeeId)
            .departmentId(departmentIds.get(i))
            .isPrimary(i == 0)
            .build();
        employeeDepartmentMapper.insert(po);
    }
}

@Override
public void savePositions(Long employeeId, List<Long> positionIds) {
    if (positionIds == null || positionIds.isEmpty()) return;
    for (int i = 0; i < positionIds.size(); i++) {
        EmployeePositionPo po = EmployeePositionPo.builder()
            .employeeId(employeeId)
            .positionId(positionIds.get(i))
            .isPrimary(i == 0)
            .build();
        employeePositionMapper.insert(po);
    }
}

@Override
public void deleteDepartments(Long employeeId) {
    employeeDepartmentMapper.delete(new LambdaQueryWrapper<EmployeeDepartmentPo>()
        .eq(EmployeeDepartmentPo::getEmployeeId, employeeId));
}

@Override
public void deletePositions(Long employeeId) {
    employeePositionMapper.delete(new LambdaQueryWrapper<EmployeePositionPo>()
        .eq(EmployeePositionPo::getEmployeeId, employeeId));
}

@Override
public List<Long> findDepartmentIds(Long employeeId) {
    return employeeDepartmentMapper.selectList(new LambdaQueryWrapper<EmployeeDepartmentPo>()
        .eq(EmployeeDepartmentPo::getEmployeeId, employeeId)
        .orderByDesc(EmployeeDepartmentPo::getIsPrimary))
        .stream()
        .map(EmployeeDepartmentPo::getDepartmentId)
        .collect(Collectors.toList());
}

@Override
public List<Long> findPositionIds(Long employeeId) {
    return employeePositionMapper.selectList(new LambdaQueryWrapper<EmployeePositionPo>()
        .eq(EmployeePositionPo::getEmployeeId, employeeId)
        .orderByDesc(EmployeePositionPo::getIsPrimary))
        .stream()
        .map(EmployeePositionPo::getPositionId)
        .collect(Collectors.toList());
}
```

添加导入：
```java
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import java.util.stream.Collectors;
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: Repository支持员工部门岗位关联操作"
```

---

### Task 3: 扩展Assembler处理转换

**Files:**
- Modify: `iov-cloud-edd-org/edd-org-service/.../EmployeeAssembler.java`
- Modify: `iov-cloud-edd-org/edd-org-service/.../EmployeeMptAssembler.java`

- [ ] **Step 1: 扩展 EmployeeAssembler**

在 `EmployeeAssembler.java` 的 `toDto` 方法中添加：

```java
dto.setDepartmentIds(employeeRepository.findDepartmentIds(employee.getId()));
dto.setPositionIds(employeeRepository.findPositionIds(employee.getId()));
```

在 `toDomain(CreateEmployeeCmd)` 方法中不处理，关联关系在 AppService 处理。

在 `updateDomain` 方法中不处理，关联关系在 AppService 处理。

需要注入 EmployeeRepository：

```java
private final EmployeeRepository employeeRepository;
```

- [ ] **Step 2: 扩展 EmployeeMptAssembler**

在 `EmployeeMptAssembler.java` 的 `toMpt` 方法中添加名称拼接逻辑：

```java
// 查询部门名称
List<Long> deptIds = dto.getDepartmentIds();
if (deptIds != null && !deptIds.isEmpty()) {
    List<String> deptNames = new ArrayList<>();
    for (int i = 0; i < deptIds.size(); i++) {
        DepartmentDto dept = departmentAppService.getById(deptIds.get(i));
        String name = dept.getName();
        if (i == 0) name += "(主)";
        deptNames.add(name);
    }
    mpt.setDepartmentNames(String.join(",", deptNames));
}

// 查询岗位名称
List<Long> posIds = dto.getPositionIds();
if (posIds != null && !posIds.isEmpty()) {
    List<String> posNames = new ArrayList<>();
    for (int i = 0; i < posIds.size(); i++) {
        PositionDto pos = positionAppService.getById(posIds.get(i));
        String name = pos.getName();
        if (i == 0) name += "(主)";
        posNames.add(name);
    }
    mpt.setPositionNames(String.join(",", posNames));
}
```

需要注入 DepartmentAppService 和 PositionAppService（如果不存在需要创建）。

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: Assembler支持部门岗位信息转换"
```

---

### Task 4: 扩展AppService处理关联逻辑

**Files:**
- Modify: `iov-cloud-edd-org/edd-org-service/.../EmployeeAppService.java`

- [ ] **Step 1: 修改 createEmployee 方法**

在 `employeeRepository.save(employee)` 后添加：

```java
employeeRepository.saveDepartments(employee.getId(), cmd.getDepartmentIds());
employeeRepository.savePositions(employee.getId(), cmd.getPositionIds());
```

在查询返回前添加：

```java
dto.setDepartmentIds(cmd.getDepartmentIds());
dto.setPositionIds(cmd.getPositionIds());
```

- [ ] **Step 2: 修改 updateEmployee 方法**

在 `employeeRepository.save(employee)` 后添加：

```java
employeeRepository.deleteDepartments(cmd.getId());
employeeRepository.deletePositions(cmd.getId());
employeeRepository.saveDepartments(cmd.getId(), cmd.getDepartmentIds());
employeeRepository.savePositions(cmd.getId(), cmd.getPositionIds());
```

- [ ] **Step 3: 修改 getEmployeeById 方法**

在返回前添加：

```java
dto.setDepartmentIds(employeeRepository.findDepartmentIds(id));
dto.setPositionIds(employeeRepository.findPositionIds(id));
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: AppService处理员工部门岗位关联"
```

---

### Task 5: 前端添加部门和岗位选择器

**Files:**
- Modify: `iov-cloud-edd-mpt-ui/src/views/org/enterprise/employee/index.vue`

- [ ] **Step 1: 导入API和组件**

在 `<script>` 导入部分添加：

```js
import { getDeptTree } from "@/api/org/enterprise/department";
import { listPosition } from "@/api/org/enterprise/position";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
```

在 components 中添加：
```js
components: { Treeselect },
```

- [ ] **Step 2: 添加data字段**

在 `data()` 中添加：

```js
deptOptions: [],
positionOptions: [],
```

在 `form` reset 中添加：
```js
departmentIds: [],
positionIds: [],
```

- [ ] **Step 3: 添加表单项**

在 `<el-dialog>` 表单中，`<el-form-item label="EIAM账号">` 之后添加：

```html
<el-form-item label="所属部门" prop="departmentIds">
  <el-select 
    v-model="form.departmentIds" 
    multiple 
    collapse-tags 
    placeholder="请选择所属部门"
    style="width: 100%"
  >
    <el-option
      v-for="item in deptOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    />
  </el-select>
</el-form-item>
<el-form-item label="岗位" prop="positionIds">
  <el-select 
    v-model="form.positionIds" 
    multiple 
    collapse-tags 
    placeholder="请选择岗位"
    style="width: 100%"
  >
    <el-option
      v-for="item in positionOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    />
  </el-select>
</el-form-item>
```

- [ ] **Step 4: 添加列表列**

在 `<el-table>` 中，`<el-table-column label="EIAM账号">` 之后添加：

```html
<el-table-column label="所属部门" align="center" prop="departmentNames" :show-overflow-tooltip="true" />
<el-table-column label="岗位" align="center" prop="positionNames" :show-overflow-tooltip="true" />
```

- [ ] **Step 5: 添加获取选项方法**

在 `methods` 中添加：

```js
getDeptOptions() {
  getDeptTree().then(response => {
    this.deptOptions = this.flattenDeptTree(response.data || []);
  });
},
flattenDeptTree(tree) {
  let result = [];
  for (let node of tree) {
    result.push({ id: node.id, name: node.name });
    if (node.children && node.children.length > 0) {
      result = result.concat(this.flattenDeptTree(node.children));
    }
  }
  return result;
},
getPositionOptions() {
  listPosition({ pageNum: 1, pageSize: 1000 }).then(response => {
    this.positionOptions = response.data.items || [];
  });
},
```

- [ ] **Step 6: 调用获取选项**

在 `created()` 中添加：

```js
this.getDeptOptions();
this.getPositionOptions();
```

- [ ] **Step 7: 修改handleAdd**

在 `handleAdd()` 中调用获取选项：

```js
this.getDeptOptions();
this.getPositionOptions();
```

- [ ] **Step 8: 修改handleUpdate**

在 `handleUpdate()` 的 `getEmployee` 回调中，form赋值后确保有数组：

```js
this.form.departmentIds = response.data.departmentIds || [];
this.form.positionIds = response.data.positionIds || [];
```

并调用获取选项：

```js
this.getDeptOptions();
this.getPositionOptions();
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: 前端员工管理添加部门和岗位关联"
```

---

### Task 6: 验证和测试

- [ ] **Step 1: 启动后端服务验证API**

检查员工创建/更新接口是否正确接收和返回 departmentIds/positionIds。

- [ ] **Step 2: 启动前端验证页面**

打开员工管理页面，验证：
- 新增/修改表单显示部门和岗位选择器
- 列表显示所属部门和岗位列
- 多选功能正常
- 主部门/主岗位标记正确显示

- [ ] **Step 3: 功能测试**

测试：
- 创建员工并选择多个部门和岗位
- 修改员工的部门和岗位
- 删除员工的部门和岗位
- 查看员工列表显示

---