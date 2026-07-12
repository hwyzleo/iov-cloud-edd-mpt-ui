<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="软件零件号" prop="softwarePn">
        <el-input
          v-model="queryParams.softwarePn"
          placeholder="请输入软件零件号"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备" prop="deviceCode">
        <el-select
          v-model="queryParams.deviceCode"
          placeholder="设备"
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="device in deviceList"
            :key="device.code"
            :label="device.code + '(' + device.label + ')'"
            :value="device.code"
          />
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
          v-hasPermi="['ota:baseline:softwareBuildVersion:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['ota:baseline:softwareBuildVersion:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['ota:baseline:softwareBuildVersion:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['ota:baseline:softwareBuildVersion:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="设备" prop="deviceCode" width="100" fixed="left"/>
      <el-table-column label="软件零件号" prop="softwarePn" min-width="120" fixed="left"/>
      <el-table-column label="软件内部版本" prop="softwareBuildVer" width="100" fixed="left"/>
      <el-table-column label="发布状态" prop="buildState" width="90" align="center" fixed="left">
        <template slot-scope="scope">
          <el-tag :type="getBuildStateTagType(scope.row.buildState)">{{ getBuildStateLabel(scope.row.buildState) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" align="center" prop="releaseTime" width="120">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.releaseTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="软件包数" prop="softwarePackageCount" width="80" align="center"/>
      <el-table-column label="依赖数" prop="dependencyCount" width="80" align="center"/>
      <el-table-column label="测试报告数" prop="testReportCount" width="90" align="center"/>
      <el-table-column label="适配矩阵数" prop="adaptationCount" width="90" align="center"/>
      <el-table-column label="软件来源" prop="softwareSource" width="80" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.softwareSource === 1 ? 'BOM' : 'OTA' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['ota:baseline:softwareBuildVersion:edit']"
          >修改
          </el-button>
          <el-dropdown @command="(command) => handleMoreCommand(command, scope.row)">
            <el-button size="mini" type="text" icon="el-icon-d-arrow-right">更多</el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="package" icon="el-icon-document" v-hasPermi="['ota:baseline:softwareBuildVersion:query']">关联</el-dropdown-item>
              <el-dropdown-item command="dependency" icon="el-icon-connection" v-hasPermi="['ota:baseline:softwareBuildVersion:query']">依赖</el-dropdown-item>
              <el-dropdown-item command="testReport" icon="el-icon-tickets" v-hasPermi="['ota:pota:softwareBuildVersion:list']">测试报告</el-dropdown-item>
              <el-dropdown-item command="adaptation" icon="el-icon-s-grid" v-hasPermi="['ota:pota:softwareBuildVersion:list']">适配矩阵</el-dropdown-item>
              <el-dropdown-item divided v-if="scope.row.buildState === 'DRAFT' || scope.row.buildState === 'TESTING'" command="release" icon="el-icon-upload2" v-hasPermi="['ota:pota:softwareBuildVersion:edit']">发布</el-dropdown-item>
              <el-dropdown-item v-if="scope.row.buildState === 'RELEASED'" command="deprecate" icon="el-icon-warning" v-hasPermi="['ota:pota:softwareBuildVersion:edit']">停用</el-dropdown-item>
              <el-dropdown-item v-if="scope.row.buildState === 'DEPRECATED'" command="retire" icon="el-icon-circle-close" v-hasPermi="['ota:pota:softwareBuildVersion:edit']">退役</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['ota:baseline:softwareBuildVersion:remove']"
          >删除
          </el-button>
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

    <!-- 添加或修改信息对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="900px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="140px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="设备" prop="deviceCode">
              <el-select
                v-model="form.deviceCode"
                placeholder="设备"
                clearable
                @change="handleDeviceChange"
                style="width: 100%"
              >
                <el-option
                  v-for="device in deviceList"
                  :key="device.code"
                  :label="device.code + '(' + device.label + ')'"
                  :value="device.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="软件零件号" prop="softwarePn">
              <div style="display: flex; width: 100%;">
                <el-autocomplete
                  v-model="form.softwarePn"
                  :fetch-suggestions="querySoftwarePart"
                  placeholder="请输入软件零件号"
                  :disabled="form.deviceCode === undefined || form.deviceCode === ''"
                  :readonly="softwarePnSelected"
                  :trigger-on-focus="false"
                  clearable
                  style="flex: 1;"
                >
                  <template #default="{ item }">
                    <div>{{ item.code }} - {{ item.name }}</div>
                  </template>
                </el-autocomplete>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="软件内部版本" prop="softwareBuildVer">
              <el-input v-model="form.softwareBuildVer" placeholder="请输入软件内部版本"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="软件来源" prop="softwareSource">
              <el-select
                v-model="form.softwareSource"
                placeholder="软件来源"
                disabled
              >
                <el-option key="BOM" label="BOM" value="BOM"/>
                <el-option key="OTA" label="OTA" value="OTA"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="技术变更说明" prop="changeNote">
          <el-input v-model="form.changeNote" type="textarea" placeholder="请输入技术变更说明"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"></el-input>
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
  addSoftwareBuildVersion,
  delSoftwareBuildVersion,
  getSoftwareBuildVersion,
  listSoftwareBuildVersion,
  updateSoftwareBuildVersion,
  releaseSoftwareBuildVersion,
  deprecateSoftwareBuildVersion,
  retireSoftwareBuildVersion
} from "@/api/iov/ota/softwarebuildversion";
import {listAllVehicleNode} from "@/api/mdm/vehicleNode";
import {listPart} from "@/api/mdm/part";

export default {
  name: "SoftwareBuildVersion",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 软件零件表格数据
      list: [],
      softwarePartVerRange: [],
      deviceList: [],
      selectDevice: "",
      selectSoftwarePn: "",
      selectKey: 0,
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
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        deviceCode: [
          {required: true, message: "设备不能为空", trigger: "blur"}
        ],
        softwarePn: [
          {required: true, message: "软件零件号不能为空", trigger: "blur"}
        ],
        softwareBuildVer: [
          {required: true, message: "软件内部版本不能为空", trigger: "blur"}
        ],
        softwareSource: [
          {required: true, message: "软件来源不能为空", trigger: "blur"}
        ]
      },
      softwarePnSelected: false,
    };
  },
  created() {
    this.getDeviceList();
    this.getList();
  },
  activated() {
    this.getDeviceList();
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listSoftwareBuildVersion(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    getDeviceList() {
      listAllVehicleNode().then(response => {
          this.deviceList = response.data.map(item => ({ code: item.nodeCode, label: item.name }));
        }
      );
    },
    querySoftwarePart(queryString, cb) {
      if (!this.selectDevice || !queryString) {
        cb([]);
        return;
      }
      this.softwarePartVerRange = [];
      listPart({
        vehicleNodeCode: this.selectDevice,
        keyword: queryString,
        isSoftware: true
      }).then(response => {
        if (response.data && response.data.rows && response.data.rows.length > 0) {
          const suggestions = response.data.rows.map(item => {
            return {
              value: item.code,
              ...item
            };
          });
          cb(suggestions);
        } else {
          cb([]);
        }
      }).catch(() => {
        cb([]);
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
        deviceCode: undefined,
        softwarePn: undefined,
        softwareBuildVer: undefined,
        softwareSource: undefined,
        changeNote: undefined,
        description: undefined
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加软件内部版本信息";
      this.form = {
        softwareSource: "OTA",
        buildState: "DRAFT"
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const softwareBuildVersionId = row.id || this.ids
      getSoftwareBuildVersion(softwareBuildVersionId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改软件内部版本信息";
    },
    handleDeviceChange(value) {
      if (value) {
        const selectedDevice = this.deviceList.find(device => device.code === value);
        if (selectedDevice) {
          this.selectDevice = selectedDevice.code
        }
      } else {
        this.selectDevice = '';
      }
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateSoftwareBuildVersion(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addSoftwareBuildVersion(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const softwareBuildVersionIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除软件内部版本ID为"' + softwareBuildVersionIds + '"的数据项？').then(function () {
        return delSoftwareBuildVersion(softwareBuildVersionIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    handleSoftwareBuildVersionPackage(row) {
      this.$router.push({
        path: "/iov/ota/softwareBuildVersionPackage",
        query: { id: row.id }
      });
    },
    handleSoftwareBuildVersionDependency(row) {
      this.$router.push({
        path: "/iov/ota/softwareBuildVersionDependency",
        query: { id: row.id }
      });
    },
    handleTestReport(row) {
      this.$router.push({
        path: "/iov/ota/softwareBuildVersionTestReport",
        query: { id: row.id }
      });
    },
    handleAdaptation(row) {
      this.$router.push({
        path: "/iov/ota/softwareBuildVersionAdaptation",
        query: { id: row.id }
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('ota-baseline/softwareBuildVersion/export', {
        ...this.queryParams
      }, `software_build_version_${new Date().getTime()}.xlsx`)
    },
    /** 获取发布状态标签类型 */
    getBuildStateTagType(buildState) {
      const stateMap = {
        'DRAFT': 'info',
        'TESTING': 'warning',
        'RELEASED': 'success',
        'DEPRECATED': 'danger',
        'RETIRED': ''
      };
      return stateMap[buildState] || 'info';
    },
    /** 获取发布状态文本 */
    getBuildStateLabel(buildState) {
      const stateMap = {
        'DRAFT': '草稿',
        'TESTING': '测试中',
        'RELEASED': '已发布',
        'DEPRECATED': '已停用',
        'RETIRED': '已退役'
      };
      return stateMap[buildState] || buildState;
    },
    /** 更多命令处理 */
    handleMoreCommand(command, row) {
      const actions = {
        package: () => this.handleSoftwareBuildVersionPackage(row),
        dependency: () => this.handleSoftwareBuildVersionDependency(row),
        testReport: () => this.handleTestReport(row),
        adaptation: () => this.handleAdaptation(row),
        release: () => this.handleStatusCommand('release', row),
        deprecate: () => this.handleStatusCommand('deprecate', row),
        retire: () => this.handleStatusCommand('retire', row)
      };
      const action = actions[command];
      if (action) action();
    },
    /** 状态流转命令处理 */
    handleStatusCommand(command, row) {
      const softwareBuildVersionId = row.id;
      const actions = {
        release: { api: releaseSoftwareBuildVersion, msg: '发布' },
        deprecate: { api: deprecateSoftwareBuildVersion, msg: '停用' },
        retire: { api: retireSoftwareBuildVersion, msg: '退役' }
      };
      const action = actions[command];
      if (!action) return;
      this.$modal.confirm('是否确认' + action.msg + '软件内部版本ID为"' + softwareBuildVersionId + '"的数据项？').then(function () {
        return action.api(softwareBuildVersionId);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess(action.msg + "成功");
      }).catch(() => {});
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
