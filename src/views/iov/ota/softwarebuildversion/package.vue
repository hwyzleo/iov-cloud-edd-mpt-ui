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
          @click="handleAdd"
          v-hasPermi="['ota:baseline:softwareBuildVersion:edit']"
        >查询并添加软件包
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="软件包名称" prop="packageName"/>
      <el-table-column label="软件包类型" prop="packageType" width="100" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.packageType==='FULL'">全量</span>
          <span v-if="scope.row.packageType==='DELTA'">差分</span>
        </template>
      </el-table-column>
      <el-table-column label="软件包来源" prop="packageSource" width="100" align="center" />
      <el-table-column label="基础软件零件号" prop="baseSoftwarePn" width="150"/>
      <el-table-column label="基础软件版本" prop="baseSoftwareVer" width="150"/>
      <el-table-column label="适配级别" prop="packageAdaptiveLevel" width="150" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.packageAdaptiveLevel === 1">基础版本及以下</span>
          <span v-else-if="scope.row.packageAdaptiveLevel === 2">基础版本及以上</span>
          <span v-else-if="scope.row.packageAdaptiveLevel === 3">与基础版本一致</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="是否OTA包" prop="ota" width="120" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.ota ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleRemoveSoftwareBuildVersionPackage(scope.row)"
            v-hasPermi="['ota:baseline:softwareBuildVersion:edit']"
          >删除关联
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer title="查询并添加软件包" :visible.sync="open" direction="rtl" size="80%"
               :modal="true"
               :append-to-body="true"
               @close="onClose">
      <div class="drawer-content">
        <el-form :model="queryParamsSoftwarePackage" ref="queryFormSoftwarePackage" size="small" :inline="true"
                 v-show="showSearchSoftwarePackage">
          <el-form-item label="软件包名称" prop="packageName">
            <el-input
              v-model="queryParamsSoftwarePackage.packageName"
              placeholder="请输入软件包名称"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuerySoftwarePackage">搜索
            </el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuerySoftwarePackage">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="mini"
              :disabled="multipleSoftwarePackage"
              @click="handleAddSoftwareBuildVersionPackage"
              v-hasPermi="['ota:baseline:softwareBuildVersion:edit']"
            >关联
            </el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearchSoftwarePackage"
                         @queryTable="getListSoftwarePackage"></right-toolbar>
        </el-row>

        <el-table ref="softwarePackageTable" v-loading="loadingSoftwarePackage" :data="softwarePackageList"
                  @selection-change="handleSelectionChangeSoftwarePackage">
          <el-table-column type="selection" width="55" align="center"/>
          <el-table-column label="软件包名称" prop="packageName"/>
          <el-table-column label="软件包类型" prop="packageType" width="100" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.packageType==='FULL'">全量</span>
              <span v-if="scope.row.packageType==='DELTA'">差分</span>
            </template>
          </el-table-column>
          <el-table-column label="软件包来源" prop="packageSource" width="100" align="center" />
          <el-table-column label="基础软件零件号" prop="baseSoftwarePn" width="150"/>
          <el-table-column label="适配级别" prop="packageAdaptiveLevel" width="150" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.packageAdaptiveLevel === 1">基础版本及以下</span>
              <span v-else-if="scope.row.packageAdaptiveLevel === 2">基础版本及以上</span>
              <span v-else-if="scope.row.packageAdaptiveLevel === 3">与基础版本一致</span>
              <span v-else>未知</span>
            </template>
          </el-table-column>
          <el-table-column label="是否OTA包" prop="ota" width="120" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.ota ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleAddSoftwareBuildVersionPackage(scope.row)"
                v-hasPermi="['ota:pota:softwareBuildVersion:edit']"
              >关联
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="totalSoftwarePackage>0"
          :total="totalSoftwarePackage"
          :page.sync="queryParamsSoftwarePackage.pageNum"
          :limit.sync="queryParamsSoftwarePackage.pageSize"
          @pagination="getListSoftwarePackage"
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
  addSoftwareBuildVersionPackage,
  delSoftwareBuildVersionPackage,
  getSoftwareBuildVersion,
  listSoftwareBuildVersionPackage,
} from "@/api/iov/ota/softwarebuildversion";
import {listSoftwarePackage} from "@/api/iov/ota/softwarepackage";

export default {
  name: "SoftwareBuildVersionPackage",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      loadingSoftwarePackage: true,
      // 选中数组
      ids: [],
      idsSoftwarePackage: [],
      // 非单个禁用
      single: true,
      singleSoftwarePackage: true,
      // 非多个禁用
      multiple: true,
      multipleSoftwarePackage: true,
      // 显示搜索条件
      showSearch: true,
      showSearchSoftwarePackage: true,
      // 总条数
      total: 0,
      totalSoftwarePackage: 0,
      list: [],
      softwarePackageList: [],
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
      queryParamsSoftwarePackage: {
        pageNum: 1,
        pageSize: 10,
        deviceCode: undefined,
        softwarePn: undefined
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
    getSoftwareBuildVersion(this.softwareBuildVersionId).then(response => {
      this.queryParamsSoftwarePackage.deviceCode = response.data.deviceCode;
      this.queryParamsSoftwarePackage.softwarePn = response.data.softwarePn;
    });
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listSoftwareBuildVersionPackage(this.softwareBuildVersionId, this.queryParams).then(response => {
          this.list = response.data;
          this.loading = false;
        }
      );
    },
    getListSoftwarePackage() {
      this.loadingSoftwarePackage = true;
      listSoftwarePackage(this.queryParamsSoftwarePackage).then(response => {
          this.softwarePackageList = response.rows;
          this.totalSoftwarePackage = response.total;
          this.loadingSoftwarePackage = false;
          this.$nextTick(() => {
            this.setSoftwarePackageSelection();
          });
        }
      );
    },
    setSoftwarePackageSelection() {
      const linkedIds = this.list.map(item => item.id);
      const selectedRows = this.softwarePackageList.filter(item =>
        linkedIds.includes(item.id)
      );
      this.$refs.softwarePackageTable.clearSelection();
      this.$nextTick(() => {
        selectedRows.forEach(row => {
          this.$refs.softwarePackageTable.toggleRowSelection(row, true);
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
      this.form = {
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleQuerySoftwarePackage() {
      this.queryParamsSoftwarePackage.pageNum = 1;
      this.getListSoftwarePackage();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    resetQuerySoftwarePackage() {
      this.resetForm("queryFormSoftwarePackage");
      this.handleQuerySoftwarePackage();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    handleSelectionChangeSoftwarePackage(selection) {
      this.idsSoftwarePackage = selection.map(item => item.id)
      this.singleSoftwarePackage = selection.length != 1
      this.multipleSoftwarePackage = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.open = true;
      this.getListSoftwarePackage();
    },
    handleAddSoftwareBuildVersionPackage(row) {
      const softwarePackageIds = row.id || this.idsSoftwarePackage;
      this.$modal.confirm('是否确认将软件包ID为"' + softwarePackageIds + '"的数据项关联到软件内部版本ID' + this.softwareBuildVersionId + '？').then(() => {
        return addSoftwareBuildVersionPackage(this.softwareBuildVersionId, softwarePackageIds);
      }).then(() => {
        this.$modal.msgSuccess("关联成功");
        this.onClose();
        this.getList();
      }).catch(() => {
      });
    },
    handleRemoveSoftwareBuildVersionPackage(row) {
      const softwareBuildVersionId = this.softwareBuildVersionId;
      const softwarePackageIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除软件内部版本' + softwareBuildVersionId + '下关联软件包ID为"' + softwarePackageIds + '"的数据项？').then(() => {
        return delSoftwareBuildVersionPackage(softwareBuildVersionId, softwarePackageIds);
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
