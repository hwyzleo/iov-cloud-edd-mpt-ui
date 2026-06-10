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
      <el-table-column label="软件包数" prop="softwarePackageCount" width="80" align="center"/>
      <el-table-column label="依赖数" prop="dependencyCount" width="80" align="center"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="260" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['ota:baseline:softwareBuildVersion:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleSoftwareBuildVersionPackage(scope.row)"
            v-hasPermi="['ota:baseline:softwareBuildVersion:query']"
          >关联
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleSoftwareBuildVersionDependency(scope.row)"
            v-hasPermi="['ota:baseline:softwareBuildVersion:query']"
          >依赖
          </el-button>
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
                    <div>{{ item.pn }} - {{ item.name }}</div>
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
        <el-form-item label="软件测试报告" prop="softwareReport">
          <el-input v-model="form.softwareReport" placeholder="请输入软件测试报告"/>
        </el-form-item>
        <el-form-item label="软件说明" prop="softwareDesc">
          <el-input v-model="form.softwareDesc" type="textarea" placeholder="请输入软件说明"/>
        </el-form-item>
        <el-form-item label="适配的总成零件号" prop="adaptiveAssemblyPn">
          <el-input v-model="form.adaptiveAssemblyPn" placeholder="请输入适配的总成零件号"/>
        </el-form-item>
        <el-form-item label="适配的软件零件号" prop="adaptiveSoftwarePn">
          <el-input v-model="form.adaptiveSoftwarePn" placeholder="请输入适配的总成软件零件号"/>
        </el-form-item>
        <el-form-item label="发布日期" prop="releaseDate">
          <el-date-picker
            v-model="form.releaseDate"
            type="date"
            placeholder="请选择发布日期"
            value-format="timestamp"
          >
          </el-date-picker>
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
  updateSoftwareBuildVersion
} from "@/api/ota/pota/softwarebuildversion";
import {listAllVehicleNode} from "@/api/mdm/vehicleNode";
import {listPart} from "@/api/completevehicle/vehicle/part";

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
        ],
        adaptiveAssemblyPn: [
          {required: true, message: "适配的总成零件号不能为空", trigger: "blur"}
        ],
        releaseDate: [
          {required: true, message: "发布日期不能为空", trigger: "blur"}
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
          this.list = response.rows;
          this.total = response.total;
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
        deviceCode: this.selectDevice,
        key: queryString,
        type: "P04"
      }).then(response => {
        if (response.rows && response.rows.length > 0) {
          const suggestions = response.rows.map(item => {
            return {
              value: item.pn,
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
        softwarePartVer: undefined,
        softwareBuildVer: undefined,
        softwareReport: undefined,
        softwareDesc: undefined,
        softwareSource: undefined,
        adaptiveHardwarePn: undefined,
        adaptiveSoftwarePn: undefined,
        releaseDate: undefined,
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
        softwareSource: "OTA"
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
        path: "/ota/pota/softwareBuildVersionPackage",
        query: { id: row.id }
      });
    },
    handleSoftwareBuildVersionDependency(row) {
      this.$router.push({
        path: "/ota/pota/softwareBuildVersionDependency",
        query: { id: row.id }
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('ota-baseline/softwareBuildVersion/export', {
        ...this.queryParams
      }, `software_build_version_${new Date().getTime()}.xlsx`)
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
