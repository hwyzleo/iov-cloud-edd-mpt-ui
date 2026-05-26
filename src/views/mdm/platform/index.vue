<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="平台代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入平台代码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="平台名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入平台名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="包含停用">
        <el-checkbox v-model="queryParams.includeInactive">包含停用数据</el-checkbox>
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
          v-hasPermi="['mdm:platform:add']"
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
          v-hasPermi="['mdm:platform:edit']"
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
          v-hasPermi="['mdm:platform:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['mdm:platform:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="platformList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="平台代码" prop="code" width="100"/>
      <el-table-column label="平台名称" prop="name"/>
      <el-table-column label="本地化名称" prop="nameLocal"/>
      <el-table-column label="平台类型" align="center" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.platformType === 'BEV' ? 'success' : scope.row.platformType === 'PHEV' ? 'warning' : scope.row.platformType === 'EREV' ? 'primary' : 'info'">
            {{ scope.row.platformType === 'FUEL' ? '燃油' : scope.row.platformType === 'BEV' ? '纯电' : scope.row.platformType === 'PHEV' ? '插混' : '增程' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="EE架构" prop="architecture" width="120"/>
      <el-table-column label="状态" align="center" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'INACTIVE' ? 'info' : scope.row.status === 'DEPRECATED' ? 'danger' : 'warning'">
            {{ scope.row.status === 'ACTIVE' ? '启用' : scope.row.status === 'INACTIVE' ? '停用' : scope.row.status === 'DEPRECATED' ? '废弃' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center"/>
      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['mdm:platform:edit']"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
            v-hasPermi="['mdm:platform:remove']"
          >停用</el-button>
          <el-button
            v-if="scope.row.status === 'DRAFT'"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['mdm:platform:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.size"
      @pagination="getList"
    />

    <!-- 添加或修改平台对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="平台代码" prop="code">
          <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入平台代码"/>
        </el-form-item>
        <el-form-item label="平台名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入平台名称"/>
        </el-form-item>
        <el-form-item label="本地化名称">
          <el-input v-model="form.nameLocal" placeholder="请输入本地化名称"/>
        </el-form-item>
        <el-form-item label="平台类型" prop="platformType">
          <el-select v-model="form.platformType" placeholder="请选择平台类型">
            <el-option label="燃油" value="FUEL"/>
            <el-option label="纯电" value="BEV"/>
            <el-option label="插混" value="PHEV"/>
            <el-option label="增程" value="EREV"/>
          </el-select>
        </el-form-item>
        <el-form-item label="EE架构">
          <el-input v-model="form.architecture" placeholder="请输入EE架构代号"/>
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="effectiveDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            @change="handleEffectiveDateChange"
          />
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
import {
  listPlatform,
  getPlatform,
  addPlatform,
  updatePlatform,
  delPlatform,
  deactivatePlatform
} from "@/api/mdm/platform";

export default {
  name: "MdmPlatform",
  dicts: [],
  data() {
    return {
      loading: true,
      ids: [],
      codes: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      platformList: [],
      title: "",
      open: false,
      effectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        includeInactive: false
      },
      form: {},
      rules: {
        code: [
          { required: true, message: "平台代码不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "平台名称不能为空", trigger: "blur" }
        ],
        platformType: [
          { required: true, message: "平台类型不能为空", trigger: "change" }
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
      listPlatform(this.queryParams).then(response => {
        this.platformList = response.data.rows;
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
        code: undefined,
        name: undefined,
        nameLocal: undefined,
        platformType: undefined,
        architecture: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined
      };
      this.effectiveDateRange = [];
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.page = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.includeInactive = false;
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.codes = selection.map(item => item.code);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleEffectiveDateChange(val) {
      if (val) {
        this.form.effectiveFrom = val[0];
        this.form.effectiveTo = val[1];
      } else {
        this.form.effectiveFrom = undefined;
        this.form.effectiveTo = undefined;
      }
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加平台";
    },
    handleUpdate(row) {
      this.reset();
      const code = row.code || this.codes[0];
      getPlatform(code).then(response => {
        this.form = response.data;
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo];
        }
        this.open = true;
        this.title = "修改平台";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updatePlatform(this.form.code, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addPlatform(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDeactivate(row) {
      const code = row.code;
      this.$modal.confirm('是否确认停用平台"' + code + '"？').then(function() {
        return deactivatePlatform(code, '');
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("停用成功");
      }).catch(() => {});
    },
    handleDelete(row) {
      const code = row.code || this.codes[0];
      this.$modal.confirm('是否确认删除平台"' + code + '"？').then(function() {
        return delPlatform(code, '');
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download('edd-mdm/api/mpt/platform/v1/export', {
        ...this.queryParams
      }, `platform_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>
