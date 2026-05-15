# 组织管理页面实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在org目录下新增部门、岗位、员工三个管理页面，使用iov-cloud-edd-org的新接口

**Architecture:** 复制system页面并适配新接口，包括字段映射、权限标识、数据类型转换

**Tech Stack:** Vue.js 2.x, Element UI, Axios

---

## 文件结构

```
src/api/org/
├── department.js   # 部门API - 新建
├── position.js     # 岗位API - 新建
├── employee.js     # 员工API - 新建

src/views/org/
├── department/
│   └── index.vue   # 部门管理页面 - 新建
├── position/
│   └── index.vue   # 岗位管理页面 - 新建
├── employee/
│   └── index.vue   # 员工管理页面 - 新建
```

---

### Task 1: 创建部门API文件

**Files:**
- Create: `src/api/org/department.js`

- [ ] **Step 1: 创建API文件**

```javascript
import request from '@/utils/request'

export function listDept(query) {
  return request({
    url: '/mpt/department/list',
    method: 'get',
    params: query
  })
}

export function getDeptTree(query) {
  return request({
    url: '/mpt/department/tree',
    method: 'get',
    params: query
  })
}

export function listDeptExcludeChild(deptId) {
  return request({
    url: '/mpt/department/list/exclude/' + deptId,
    method: 'get'
  })
}

export function getDept(deptId) {
  return request({
    url: '/mpt/department/' + deptId,
    method: 'get'
  })
}

export function addDept(data) {
  return request({
    url: '/mpt/department',
    method: 'post',
    data: data
  })
}

export function updateDept(data) {
  return request({
    url: '/mpt/department',
    method: 'put',
    data: data
  })
}

export function delDept(deptId) {
  return request({
    url: '/mpt/department/' + deptId,
    method: 'delete'
  })
}

export function deptTreeSelect(query) {
  return request({
    url: '/mpt/department/deptTree',
    method: 'get',
    params: query
  })
}
```

- [ ] **Step 2: 提交**

```bash
git add src/api/org/department.js
git commit -m "feat: add department API for org module"
```

---

### Task 2: 创建岗位API文件

**Files:**
- Create: `src/api/org/position.js`

- [ ] **Step 1: 创建API文件**

```javascript
import request from '@/utils/request'

export function listPosition(query) {
  return request({
    url: '/mpt/position/list',
    method: 'get',
    params: query
  })
}

export function getPosition(positionId) {
  return request({
    url: '/mpt/position/' + positionId,
    method: 'get'
  })
}

export function addPosition(data) {
  return request({
    url: '/mpt/position',
    method: 'post',
    data: data
  })
}

export function updatePosition(data) {
  return request({
    url: '/mpt/position',
    method: 'put',
    data: data
  })
}

export function delPosition(positionId) {
  return request({
    url: '/mpt/position/' + positionId,
    method: 'delete'
  })
}
```

- [ ] **Step 2: 提交**

```bash
git add src/api/org/position.js
git commit -m "feat: add position API for org module"
```

---

### Task 3: 创建员工API文件

**Files:**
- Create: `src/api/org/employee.js`

- [ ] **Step 1: 创建API文件**

```javascript
import request from '@/utils/request'

export function listEmployee(query) {
  return request({
    url: '/mpt/employee/list',
    method: 'get',
    params: query
  })
}

export function getEmployee(employeeId) {
  return request({
    url: '/mpt/employee/' + employeeId,
    method: 'get'
  })
}

export function addEmployee(data) {
  return request({
    url: '/mpt/employee',
    method: 'post',
    data: data
  })
}

export function updateEmployee(data) {
  return request({
    url: '/mpt/employee',
    method: 'put',
    data: data
  })
}

export function delEmployee(employeeId) {
  return request({
    url: '/mpt/employee/' + employeeId,
    method: 'delete'
  })
}
```

- [ ] **Step 2: 提交**

```bash
git add src/api/org/employee.js
git commit -m "feat: add employee API for org module"
```

---

### Task 4: 创建部门管理页面

**Files:**
- Create: `src/views/org/department/index.vue`

- [ ] **Step 1: 创建页面文件**

```vue
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="部门名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入部门名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="enable">
        <el-select v-model="queryParams.enable" placeholder="部门状态" clearable>
          <el-option label="正常" value="true" />
          <el-option label="停用" value="false" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['org:department:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-sort"
          size="mini"
          @click="toggleExpandAll"
        >展开/折叠</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="deptList"
      row-key="id"
      :default-expand-all="isExpandAll"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
    >
      <el-table-column prop="name" label="部门名称" width="260"></el-table-column>
      <el-table-column prop="code" label="部门编码" width="150"></el-table-column>
      <el-table-column prop="sort" label="排序" width="200"></el-table-column>
      <el-table-column prop="enable" label="状态" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.enable" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="200">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['org:department:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-plus"
            @click="handleAdd(scope.row)"
            v-hasPermi="['org:department:add']"
          >新增</el-button>
          <el-button
            v-if="scope.row.parentId != 0"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['org:department:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="24" v-if="form.parentId !== 0">
            <el-form-item label="上级部门" prop="parentId">
              <treeselect v-model="form.parentId" :options="deptOptions" :normalizer="normalizer" placeholder="选择上级部门" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="部门编码" prop="code">
              <el-input v-model="form.code" placeholder="请输入部门编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入部门名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="sort">
              <el-input-number v-model="form.sort" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门状态">
              <el-switch v-model="form.enable"></el-switch>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="负责人" prop="leader">
              <el-input v-model="form.leader" placeholder="请输入负责人" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDept, getDept, delDept, addDept, updateDept, listDeptExcludeChild } from "@/api/org/department";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";

export default {
  name: "OrgDepartment",
  components: { Treeselect },
  data() {
    return {
      loading: true,
      showSearch: true,
      deptList: [],
      deptOptions: [],
      title: "",
      open: false,
      isExpandAll: true,
      refreshTable: true,
      queryParams: {
        name: undefined,
        enable: undefined
      },
      form: {},
      rules: {
        parentId: [
          { required: true, message: "上级部门不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "部门名称不能为空", trigger: "blur" }
        ],
        sort: [
          { required: true, message: "显示排序不能为空", trigger: "blur" }
        ],
        email: [
          {
            type: "email",
            message: "请输入正确的邮箱地址",
            trigger: ["blur", "change"]
          }
        ],
        phone: [
          {
            pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
            message: "请输入正确的手机号码",
            trigger: "blur"
          }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listDept(this.queryParams).then(response => {
        this.deptList = this.handleTree(response.data, "id");
        this.loading = false;
      });
    },
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children;
      }
      return {
        id: node.id,
        label: node.name,
        children: node.children
      };
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: undefined,
        parentId: undefined,
        name: undefined,
        code: undefined,
        sort: undefined,
        leader: undefined,
        phone: undefined,
        email: undefined,
        enable: true
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleAdd(row) {
      this.reset();
      if (row != undefined) {
        this.form.parentId = row.id;
      }
      this.open = true;
      this.title = "添加部门";
      listDept().then(response => {
        this.deptOptions = this.handleTree(response.data, "id");
      });
    },
    toggleExpandAll() {
      this.refreshTable = false;
      this.isExpandAll = !this.isExpandAll;
      this.$nextTick(() => {
        this.refreshTable = true;
      });
    },
    handleUpdate(row) {
      this.reset();
      getDept(row.id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改部门";
      });
      listDeptExcludeChild(row.id).then(response => {
        this.deptOptions = this.handleTree(response.data, "id");
      });
    },
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updateDept(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDept(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除名称为"' + row.name + '"的数据项？').then(function() {
        return delDept(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/org/department/index.vue
git commit -m "feat: add org department management page"
```

---

### Task 5: 创建岗位管理页面

**Files:**
- Create: `src/views/org/position/index.vue`

- [ ] **Step 1: 创建页面文件**

```vue
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="岗位编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入岗位编码"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="岗位名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入岗位名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="enable">
        <el-select v-model="queryParams.enable" placeholder="岗位状态" clearable>
          <el-option label="正常" value="true" />
          <el-option label="停用" value="false" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['org:position:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['org:position:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['org:position:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="positionList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="岗位编号" align="center" prop="id" />
      <el-table-column label="岗位编码" align="center" prop="code" />
      <el-table-column label="岗位名称" align="center" prop="name" />
      <el-table-column label="岗位排序" align="center" prop="sort" />
      <el-table-column label="状态" align="center" prop="enable">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.enable" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['org:position:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['org:position:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="岗位名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item label="岗位编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入编码名称" />
        </el-form-item>
        <el-form-item label="岗位顺序" prop="sort">
          <el-input-number v-model="form.sort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="岗位状态" prop="enable">
          <el-switch v-model="form.enable"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPosition, getPosition, delPosition, addPosition, updatePosition } from "@/api/org/position";

export default {
  name: "OrgPosition",
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      positionList: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: undefined,
        name: undefined,
        enable: undefined
      },
      form: {},
      rules: {
        name: [
          { required: true, message: "岗位名称不能为空", trigger: "blur" }
        ],
        code: [
          { required: true, message: "岗位编码不能为空", trigger: "blur" }
        ],
        sort: [
          { required: true, message: "岗位顺序不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listPosition(this.queryParams).then(response => {
        this.positionList = response.data.rows;
        this.total = response.data.total;
        this.loading = false;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: undefined,
        code: undefined,
        name: undefined,
        sort: 0,
        enable: true
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!=1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加岗位";
    },
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getPosition(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改岗位";
      });
    },
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updatePosition(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addPosition(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除岗位编号为"' + ids + '"的数据项？').then(function() {
        return delPosition(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/org/position/index.vue
git commit -m "feat: add org position management page"
```

---

### Task 6: 创建员工管理页面

**Files:**
- Create: `src/views/org/employee/index.vue`

- [ ] **Step 1: 创建页面文件**

```vue
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="工号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入工号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入姓名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input
          v-model="queryParams.phone"
          placeholder="请输入手机号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="EIAM账号" prop="eiamAccount">
        <el-input
          v-model="queryParams.eiamAccount"
          placeholder="请输入EIAM账号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-select v-model="queryParams.gender" placeholder="性别" clearable>
          <el-option label="未知" :value="0" />
          <el-option label="男" :value="1" />
          <el-option label="女" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="enable">
        <el-select v-model="queryParams.enable" placeholder="状态" clearable>
          <el-option label="正常" value="true" />
          <el-option label="停用" value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['org:employee:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['org:employee:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['org:employee:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="employeeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="员工编号" align="center" prop="id" />
      <el-table-column label="工号" align="center" prop="code" />
      <el-table-column label="姓名" align="center" prop="name" />
      <el-table-column label="性别" align="center" prop="gender">
        <template slot-scope="scope">
          <span v-if="scope.row.gender === 1">男</span>
          <span v-else-if="scope.row.gender === 2">女</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="手机号" align="center" prop="phone" width="120" />
      <el-table-column label="邮箱" align="center" prop="email" :show-overflow-tooltip="true" />
      <el-table-column label="EIAM账号" align="center" prop="eiamAccount" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" prop="enable">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.enable" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['org:employee:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['org:employee:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="工号" prop="code">
          <el-input v-model="form.code" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="form.gender" placeholder="请选择性别">
            <el-option label="未知" :value="0" />
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
        </el-form-item>
        <el-form-item label="EIAM账号" prop="eiamAccount">
          <el-input v-model="form.eiamAccount" placeholder="请输入EIAM账号" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="enable">
          <el-switch v-model="form.enable"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listEmployee, getEmployee, delEmployee, addEmployee, updateEmployee } from "@/api/org/employee";

export default {
  name: "OrgEmployee",
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      employeeList: [],
      title: "",
      open: false,
      dateRange: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: undefined,
        name: undefined,
        phone: undefined,
        eiamAccount: undefined,
        gender: undefined,
        enable: undefined
      },
      form: {},
      rules: {
        code: [
          { required: true, message: "工号不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "姓名不能为空", trigger: "blur" }
        ],
        email: [
          {
            type: "email",
            message: "请输入正确的邮箱地址",
            trigger: ["blur", "change"]
          }
        ],
        phone: [
          {
            pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
            message: "请输入正确的手机号码",
            trigger: "blur"
          }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listEmployee(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.employeeList = response.data.rows;
        this.total = response.data.total;
        this.loading = false;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: undefined,
        code: undefined,
        name: undefined,
        gender: 0,
        phone: undefined,
        email: undefined,
        eiamAccount: undefined,
        sort: 0,
        enable: true
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!=1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加员工";
    },
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getEmployee(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改员工";
      });
    },
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updateEmployee(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEmployee(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除员工编号为"' + ids + '"的数据项？').then(function() {
        return delEmployee(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/org/employee/index.vue
git commit -m "feat: add org employee management page"
```

---

## 自检清单

### Spec覆盖率检查

| Spec章节 | 对应Task | 状态 |
|---------|---------|------|
| 部门API接口 | Task 1 | ✅ |
| 岗位API接口 | Task 2 | ✅ |
| 员工API接口 | Task 3 | ✅ |
| 部门页面功能 | Task 4 | ✅ |
| 岗位页面功能 | Task 5 | ✅ |
| 员工页面功能 | Task 6 | ✅ |
| 字段映射 | Tasks 4-6 | ✅ |
| 权限标识 | Tasks 4-6 | ✅ |

### Placeholder扫描

- 无TBD、TODO等占位符
- 所有代码步骤均有完整代码
- 所有命令步骤均有完整命令

### 类型一致性检查

- 部门页面：`id`、`name`、`sort`、`enable(Boolean)`、`children` 字段一致
- 岗位页面：`id`、`code`、`name`、`sort`、`enable(Boolean)` 字段一致
- 员工页面：`id`、`code`、`name`、`gender(Integer)`、`phone`、`enable(Boolean)` 字段一致
- API返回：`response.data` 取值一致，分页使用 `response.data.rows` 和 `response.data.total`

---

计划完成并保存到 `docs/superpowers/plans/2026-05-15-org-management-pages.md`。

**两种执行方式：**

1. **Subagent-Driven (推荐)** - 每个Task派发独立子代理，Task间review，快速迭代
2. **Inline Execution** - 在当前会话执行，批量执行带检查点

选择哪种方式？