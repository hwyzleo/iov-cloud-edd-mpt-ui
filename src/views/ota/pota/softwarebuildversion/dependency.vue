<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm"
             size="small" :inline="true" v-show="showSearch">
      <el-form-item label="软件包名称" prop="packageName">
        <el-input
          v-model="queryParams.packageName"
          placeholder="请输入软件包名称"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">
          搜索
        </el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAddDependency"
          v-hasPermi="['ota:baseline:softwareBuildVersion:edit']"
        >查询并添加软件零件版本依赖
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <el-table v-loading="loading" :data="list"
              @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="设备" prop="deviceCode" width="100"/>
      <el-table-column label="软件零件号" prop="softwarePn" width="150"/>
      <el-table-column label="软件内部版本" prop="softwareBuildVer" width="120"/>
      <el-table-column label="适配级别" prop="adaptiveLevel" width="150" align="center">
        <template slot-scope="scope">
          <el-select
            v-model="scope.row.adaptiveLevel"
            placeholder="请选择"
            size="mini"
            @change="handleAdaptiveLevelChange(scope.row)"
          >
            <el-option label="版本及以下" :value="1"></el-option>
            <el-option label="版本及以上" :value="2"></el-option>
            <el-option label="与版本一致" :value="3"></el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="适配的总成零件号" prop="adaptiveAssemblyPn" width="200"/>
      <el-table-column label="适配的软件零件号" prop="adaptiveSoftwarePn"/>
      <el-table-column label="发布日期" align="center" prop="releaseDate" width="120">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.releaseDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleRemoveSoftwareBuildVersionDependency(scope.row)"
            v-hasPermi="['ota:baseline:softwareBuildVersion:edit']"
          >删除依赖
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 软件零件版本依赖列表对话框 -->
    <el-drawer title="查询并添加依赖软件零件版本" :visible.sync="open" direction="rtl" size="80%"
               :modal="true"
               :append-to-body="true"
               @close="onClose">
      <div class="drawer-content">
        <el-form :model="queryParamsDependency" ref="queryFormDependency" size="small" :inline="true"
                 v-show="showSearchDependency">
          <el-form-item label="软件包名称" prop="packageName">
            <el-input
              v-model="queryParamsDependency.packageName"
              placeholder="请输入软件包名称"
              clearable
              style="width: 140px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQueryDependency">搜索
            </el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQueryDependency">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="mini"
              :disabled="multipleDependency"
              @click="handleAddSoftwareBuildVersionDependency"
              v-hasPermi="['ota:baseline:softwareBuildVersion:edit']"
            >添加依赖
            </el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearchDependency"
                         @queryTable="getListDependency"></right-toolbar>
        </el-row>

        <el-table ref="dependencyTable" v-loading="loadingDependency" :data="dependencyList"
                  @selection-change="handleSelectionChangeDependency">
          <el-table-column type="selection" width="55" align="center" :selectable="checkSelectable"/>
          <el-table-column label="设备" prop="deviceCode" width="100"/>
          <el-table-column label="软件零件号" prop="softwarePn"/>
          <el-table-column label="软件内部版本" prop="softwareBuildVer" width="120"/>
          <el-table-column label="测试报告" prop="softwareReport" width="80" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.softwareReport && scope.row.softwareReport.trim() ? '已上传' : '未上传' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="软件来源" prop="softwareSource" width="80" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.softwareSource === 1 ? 'BOM' : 'OTA' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="适配的总成零件号" prop="adaptiveAssemblyPn" width="150"/>
          <el-table-column label="适配的软件零件号" prop="adaptiveSoftwarePn" width="150"/>
          <el-table-column label="发布日期" align="center" prop="releaseDate" width="120">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.releaseDate, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleAddSoftwareBuildVersionDependency(scope.row)"
                v-hasPermi="['ota:pota:softwareBuildVersion:edit']"
                v-show="checkSelectable(scope.row)"
              >添加依赖
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="totalDependency>0"
          :total="totalDependency"
          :page.sync="queryParamsDependency.pageNum"
          :limit.sync="queryParamsDependency.pageSize"
          @pagination="getListDependency"
        />
        <div slot="footer" class="dialog-footer" style="text-align: center">
          <el-button @click="onClose">关 闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  addSoftwareBuildVersionDependency,
  delSoftwareBuildVersionDependency,
  listSoftwareBuildVersion,
  listSoftwareBuildVersionDependency,
  updateSoftwareBuildVersionDependency
} from "@/api/ota/pota/softwarebuildversion";

export default {
  name: "SoftwareBuildVersionDependency",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      loadingDependency: true,
      // 选中数组
      ids: [],
      idsDependency: [],
      // 非单个禁用
      single: true,
      singleDependency: true,
      // 非多个禁用
      multiple: true,
      multipleDependency: true,
      // 显示搜索条件
      showSearch: true,
      showSearchDependency: true,
      // 总条数
      total: 0,
      totalDependency: 0,
      // 软件零件表格数据
      list: [],
      dependencyList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      queryParamsDependency: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {},
      softwareBuildVersionId: undefined
    };
  },
  created() {
    this.softwareBuildVersionId = this.$route.query.id;
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listSoftwareBuildVersionDependency(this.softwareBuildVersionId, this.queryParams).then(response => {
          this.list = response.data;
          this.loading = false;
        }
      );
    },
    getListDependency() {
      this.loadingDependency = true;
      listSoftwareBuildVersion(this.queryParamsDependency).then(response => {
          this.dependencyList = response.data.items;
          this.totalDependency = response.data.total;
          this.loadingDependency = false;
          this.$nextTick(() => {
            this.setDependencySelection();
          });
        }
      );
    },
    setDependencySelection() {
      const linkedIds = this.list.map(item => item.id);
      const selectedRows = this.dependencyList.filter(item =>
        linkedIds.includes(item.id)
      );
      this.$refs.dependencyTable.clearSelection();
      this.$nextTick(() => {
        selectedRows.forEach(row => {
          this.$refs.dependencyTable.toggleRowSelection(row, true);
        });
      });
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {};
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleQueryDependency() {
      this.queryParamsDependency.pageNum = 1;
      this.getListDependency();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    resetQueryDependency() {
      this.resetForm("queryFormDependency");
      this.handleQueryDependency();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    handleSelectionChangeDependency(selection) {
      this.idsDependency = selection.map(item => item.id)
      this.singleDependency = selection.length != 1
      this.multipleDependency = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
    },
    /** 提交按钮 */
    submitForm: function () {
    },
    /** 删除按钮操作 */
    handleDelete(row) {
    },
    handleAddDependency() {
      this.open = true;
      this.getListDependency();
    },
    handleAddSoftwareBuildVersionDependency(row) {
      const dependencyIds = row.id || this.idsDependency;
      this.$modal.confirm('是否确认将软件内部版本ID为"' + dependencyIds + '"的数据项依赖到软件内部版本ID' + this.softwareBuildVersionId + '？').then(() => {
        return addSoftwareBuildVersionDependency(this.softwareBuildVersionId, dependencyIds, 1);
      }).then(() => {
        this.$modal.msgSuccess("添加依赖成功");
        this.onClose();
        this.getList();
      }).catch(() => {
      });
    },
    handleRemoveSoftwareBuildVersionDependency(row) {
      const softwareBuildVersionIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除软件内部版本' + this.softwareBuildVersionId + '下依赖软件内部版本ID为"' + softwareBuildVersionIds + '"的数据项？').then(() => {
        return delSoftwareBuildVersionDependency(this.softwareBuildVersionId, softwareBuildVersionIds);
      }).then(() => {
        this.$modal.msgSuccess("删除成功");
        this.getList();
      }).catch(() => {
      });
    },
    onClose() {
      this.open = false;
      this.getList();
    },
    checkSelectable(row) {
      return row.id != this.softwareBuildVersionId;
    },
    handleAdaptiveLevelChange(row) {
      const dependencyIds = row.id || this.idsDependency;
      updateSoftwareBuildVersionDependency(this.softwareBuildVersionId, dependencyIds, row.adaptiveLevel).then(response => {
        console.log(response);
      })
    }
  }
};
</script>
<style>
.message-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.message-cell:hover {
  cursor: pointer;
}

.my-tooltip {
  max-width: 400px !important;
  white-space: normal !important;
  word-break: break-word !important;
}

.drawer-content {
  padding: 20px;
  font-size: 14px;
  color: #606266;
}

.drawer-title {
  font-size: 16px;
  font-weight: bolder;
  margin-top: 20px;
  margin-bottom: 20px;
}

.drawer-row {
  margin-bottom: 15px;
}
</style>
