<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="车辆" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入车辆"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
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
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['ota:fota:task:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="车辆" prop="vin" width="180"/>
      <el-table-column label="任务名称" prop="taskName"/>
      <el-table-column label="活动名称" prop="activityName"/>
      <el-table-column label="任务状态" prop="state" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.state === 0">等待下载</span>
          <span v-else-if="scope.row.state === 1">开始下载</span>
          <span v-else-if="scope.row.state === 3">继续下载</span>
          <span v-else-if="scope.row.state === 5">结束下载</span>
          <span v-else-if="scope.row.state === 7">预约升级</span>
          <span v-else-if="scope.row.state === 9">自动升级</span>
          <span v-else-if="scope.row.state === 10">安装检测</span>
          <span v-else-if="scope.row.state === 11">开始安装</span>
          <span v-else-if="scope.row.state === 15">结束安装</span>
          <span v-else-if="scope.row.state === 17">开始回滚</span>
          <span v-else-if="scope.row.state === 19">结束回滚</span>
          <span v-else-if="scope.row.state === 21">升级立即重启</span>
          <span v-else-if="scope.row.state === 22">升级用户重启</span>
          <span v-else-if="scope.row.state === 23">回滚立即重启</span>
          <span v-else-if="scope.row.state === 24">回滚用户重启</span>
          <span v-else-if="scope.row.state === 25">写配置字</span>
          <span v-else-if="scope.row.state === 26">回滚配置字</span>
          <span v-else-if="scope.row.state === 90">升级失败</span>
          <span v-else-if="scope.row.state === 91">升级超时</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-tickets"
            @click="handleProcess(scope.row)"
            v-hasPermi="['ota:fota:task:edit']"
          >升级过程
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

    <!-- 添加或修改对话框 -->
    <el-drawer title="升级过程" :visible.sync="open" direction="rtl" size="700px"
               :modal="true"
               :append-to-body="true"
               @close="cancel">
      <div class="drawer-content">
        <el-table v-loading="loading" :data="processList" @selection-change="handleSelectionChange">
          <el-table-column label="设备" prop="device"/>
          <el-table-column label="执行操作" prop="operation" width="120" align="center"/>
          <el-table-column label="操作时间" align="center" prop="operationTime" width="180">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.operationTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作结果" prop="operationResult" width="120" align="center"/>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  getTaskVehicle,
  listTaskVehicle,
  listTaskVehicleProcess
} from "@/api/iov/ota/taskvehicle";

export default {
  name: "TaskVehicle",
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
      // 表格数据
      list: [],
      processList: [],
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
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询升级任务列表 */
    getList() {
      this.loading = true;
      listTaskVehicle(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
    },
    /** 表单重置 */
    reset() {
      this.form = {
        name: undefined
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
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
    },
    handleProcess(row) {
      const id = row.id || this.ids
      listTaskVehicleProcess(id).then(response => {
        this.processList = response.data;
        this.open = true;
      });
    },
    /** 提交按钮 */
    submitForm: function () {
    },
    /** 删除按钮操作 */
    handleDelete(row) {
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('ota-fota/mpt/taskVehicle/export', {
        ...this.queryParams
      }, `task_vehicle_${new Date().getTime()}.xlsx`)
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
