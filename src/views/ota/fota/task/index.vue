<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="任务名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入任务名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="任务状态" prop="type">
        <el-select
          v-model="queryParams.state"
          placeholder="任务状态"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="taskState in this.taskStateList"
            :key="taskState.value"
            :label="taskState.label"
            :value="taskState.value"
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
          v-hasPermi="['ota:fota:task:add']"
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
          v-hasPermi="['ota:fota:task:edit']"
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
          v-hasPermi="['ota:fota:task:remove']"
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
          v-hasPermi="['ota:fota:task:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="taskList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="任务名称" prop="name"/>
      <el-table-column label="任务类型" prop="type" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.type === 1">普通</span>
          <span v-else-if="scope.row.type === 2">快速</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="任务阶段" prop="phase" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.phase === 1">验证</span>
          <span v-else-if="scope.row.phase === 2">灰度</span>
          <span v-else-if="scope.row.phase === 3">发布</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="任务开始时间" align="center" prop="startTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="任务结束时间" align="center" prop="endTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="任务发布时间" align="center" prop="releaseTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.releaseTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="升级模式" prop="upgradeMode" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.upgradeMode === 1">普通</span>
          <span v-else-if="scope.row.upgradeMode === 2">强制</span>
          <span v-else-if="scope.row.upgradeMode === 3">预约静默</span>
          <span v-else-if="scope.row.upgradeMode === 4">远程静默</span>
          <span v-else-if="scope.row.upgradeMode === 5">工厂</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="任务状态" prop="state" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.state === 1">待提交</span>
          <span v-else-if="scope.row.state === 2">待审核</span>
          <span v-else-if="scope.row.state === 3">已审核</span>
          <span v-else-if="scope.row.state === 4">未通过</span>
          <span v-else-if="scope.row.state === 5">已发布</span>
          <span v-else-if="scope.row.state === 6">已暂停</span>
          <span v-else-if="scope.row.state === 7">已结束</span>
          <span v-else-if="scope.row.state === 8">已取消</span>
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
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['ota:fota:task:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-finished"
            @click="handleAudit(scope.row)"
            v-if="scope.row.state === 2"
            v-hasPermi="['ota:fota:task:audit']"
          >审核
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-document"
            @click="handleApprovalRecord(scope.row)"
            v-if="scope.row.state === 2 || scope.row.state === 3"
            v-hasPermi="['ota:fota:task:list']"
          >审批记录
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-s-flag"
            @click="handleRelease(scope.row)"
            v-if="scope.row.state === 3"
            v-hasPermi="['ota:fota:task:release']"
          >发布
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-video-pause"
            @click="handlePause(scope.row)"
            v-if="scope.row.state === 5"
            v-hasPermi="['ota:fota:task:pause']"
          >暂停
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-video-play"
            @click="handleResume(scope.row)"
            v-if="scope.row.state === 6"
            v-hasPermi="['ota:fota:task:resume']"
          >恢复
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-zoom-out"
            @click="handleCancel(scope.row)"
            v-if="scope.row.state === 5 || scope.row.state === 6"
            v-hasPermi="['ota:fota:task:cancel']"
          >取消
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-if="scope.row.state < 5"
            v-hasPermi="['ota:fota:task:remove']"
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

    <!-- 添加或修改升级任务对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="900px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入任务名称" :disabled="form.state === 2"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="任务类型" prop="type">
              <el-select
                v-model="form.type"
                placeholder="任务类型"
                clearable
                :disabled="form.state === 2"
                style="width: 100%;"
              >
                <el-option :key="1" label="普通" :value="1"/>
                <el-option :key="2" label="快速" :value="2"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务阶段" prop="stage">
              <el-select
                v-model="form.phase"
                placeholder="任务阶段"
                clearable
                :disabled="form.state === 2"
                style="width: 100%;"
              >
                <el-option :key="1" label="验证" :value="1"/>
                <el-option :key="2" label="灰度" :value="2"/>
                <el-option :key="3" label="发布" :value="3"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="任务车辆" prop="target">
          <el-input v-model="form.target" type="textarea" placeholder="请输入任务车辆"
                    :disabled="form.state === 2"></el-input>
        </el-form-item>
        <el-form-item label="升级活动" prop="activityName">
          <div>
            <el-autocomplete
              v-model="form.activityName"
              :fetch-suggestions="queryActivity"
              placeholder="请查询升级活动"
              :trigger-on-focus="false"
              clearable
              @select="handleActivitySelect"
              :disabled="form.state === 2"
              style="width: 100%;"
            >
              <template #default="{ item }">
                <div>{{ item.name }}[{{ item.version }}]</div>
              </template>
            </el-autocomplete>
          </div>
        </el-form-item>
        <el-form-item label="基线拉齐" prop="baselineUnification">
          <el-checkbox v-model="form.baselineUnification" :disabled="form.state === 2">
            未对齐基线的车辆拉齐基线
          </el-checkbox>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="任务开始时间" prop="startTime">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="请选择任务开始时间"
                value-format="timestamp"
                :disabled="form.state === 2"
                style="width: 100%;"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="请选择任务结束时间"
                value-format="timestamp"
                :disabled="form.state === 2"
                style="width: 100%;"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="升级前置条件">
          <el-checkbox v-model="form.keepInPark" :disabled="form.state === 2">
            保持驻车(P档)
          </el-checkbox>
          <el-checkbox v-model="form.notCharging" :disabled="form.state === 2">
            不在充电
          </el-checkbox>
          <el-checkbox v-model="form.noExternalPower" :disabled="form.state === 2">
            不对外供电
          </el-checkbox>
          <el-checkbox v-model="form.allClosed" :disabled="form.state === 2">
            车窗、天窗、车门及尾门关闭
          </el-checkbox>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="高压电量" prop="hvSoc">
              <div style="display: flex; align-items: center;">
                <span style="margin-right: 8px;">最低</span>
                <el-input-number v-model="form.hvSoc" controls-position="right" :min="10" :max="90"/>
                <span style="margin-left: 8px;">%</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="低压电量" prop="lvSoc">
              <div style="display: flex; align-items: center;">
                <span style="margin-right: 8px;">最低</span>
                <el-input-number v-model="form.lvSoc" controls-position="right" :min="50" :max="90"/>
                <span style="margin-left: 8px;">%</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="升级模式" prop="upgradeMode">
              <el-select
                v-model="form.upgradeMode"
                placeholder="升级模式"
                clearable
                :disabled="form.state === 2"
                style="width: 100%;"
              >
                <el-option :key="1" label="普通" :value="1"/>
                <el-option :key="2" label="强制" :value="2"/>
                <el-option :key="3" label="预约静默" :value="3"/>
                <el-option :key="4" label="远程静默" :value="4"/>
                <el-option :key="5" label="工厂" :value="5"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用车影响" prop="impactVehicleOperation">
              <el-checkbox v-model="form.impactVehicleOperation" :disabled="form.state === 2">
                升级时是否影响用车
              </el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="刷写次数" prop="flashCount">
              <el-input-number v-model="form.flashCount" controls-position="right" :min="0" :max="3"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否回滚" prop="rollback">
              <el-checkbox v-model="form.rollback" :disabled="form.state === 2"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="适配主体" prop="adaptationSubject">
              <el-select
                v-model="form.adaptationSubject"
                placeholder="适配主体"
                clearable
                :disabled="form.state === 2"
                style="width: 100%;"
              >
                <el-option :key="1" label="基础软件零件号" :value="1"/>
                <el-option :key="2" label="基础软件内部版本" :value="2"/>
                <el-option :key="3" label="两者均要适配" :value="3"/>
                <el-option :key="4" label="两者均不适配" :value="4"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="比对基准" prop="comparisonCriteria">
              <el-checkbox v-model="form.comparisonCriteria" :disabled="form.state === 2">
                包含兼容零件号
              </el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="排除基线" prop="excludedBaseline">
          <el-input v-model="form.excludedBaseline" placeholder="请输入排除基线" :disabled="form.state === 2"/>
        </el-form-item>
        <el-form-item label="审批级别" prop="approvalLevel" v-if="title === '审核升级任务'">
          <el-select v-model="form.approvalLevel" placeholder="请选择审批级别" style="width: 100%">
            <el-option label="质量审批" value="QUALITY"/>
            <el-option label="产品审批" value="PRODUCT"/>
            <el-option label="安全审批" value="SECURITY"/>
          </el-select>
        </el-form-item>
        <el-form-item label="审批结果" prop="result" v-if="title === '审核升级任务'">
          <el-radio-group v-model="form.result">
            <el-radio label="APPROVED">通过</el-radio>
            <el-radio label="REJECTED">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见" prop="comment" v-if="title === '审核升级任务' && form.result === 'REJECTED'">
          <el-input v-model="form.comment" type="textarea" placeholder="请输入审批意见"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm" v-if="title !== '审核升级任务'">确 定</el-button>
        <el-button type="success" @click="handleSubmit" v-if="form.state === 1">提 交</el-button>
        <el-button type="success" @click="submitAuditForm" v-if="title === '审核升级任务' && form.state === 2">审 核
        </el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 审批记录对话框 -->
    <el-dialog title="审批记录" :visible.sync="openApprovalRecord" width="800px" append-to-body>
      <el-table v-loading="loadingApproval" :data="approvalList">
        <el-table-column label="审批级别" prop="level" width="120" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.level === 'QUALITY'">质量审批</span>
            <span v-else-if="scope.row.level === 'PRODUCT'">产品审批</span>
            <span v-else-if="scope.row.level === 'SECURITY'">安全审批</span>
            <span v-else>{{ scope.row.level }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审批结果" prop="result" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.result === 'APPROVED' ? 'success' : 'danger'" size="small">
              {{ scope.row.result === 'APPROVED' ? '通过' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批人" prop="approver" width="120" align="center"/>
        <el-table-column label="审批意见" prop="comment" show-overflow-tooltip/>
        <el-table-column label="审批时间" align="center" prop="decidedAt" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.decidedAt, '{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="openApprovalRecord = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  addTask,
  delTask,
  getTask,
  listTask,
  listAllTaskState,
  updateTask,
  submitTask,
  auditTask,
  releaseTask,
  pauseTask,
  resumeTask,
  cancelTask,
  listTaskApproval
} from "@/api/ota/fota/task";
import {
  listActivity,
  getActivity
} from "@/api/iov/ota/activity";

export default {
  name: "Task",
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
      // 升级任务表格数据
      taskList: [],
      taskStateList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 审批记录对话框
      openApprovalRecord: false,
      loadingApproval: false,
      approvalList: [],
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
        name: [
          {required: true, message: "任务名称不能为空", trigger: "blur"}
        ],
        type: [
          {required: true, message: "任务类型不能为空", trigger: "blur"}
        ],
        phase: [
          {required: true, message: "任务阶段不能为空", trigger: "blur"}
        ],
        activityName: [
          {required: true, message: "升级活动不能为空", trigger: "blur"}
        ],
        startTime: [
          {required: true, message: "任务开始时间不能为空", trigger: "blur"}
        ],
        endTime: [
          {required: true, message: "任务结束时间不能为空", trigger: "blur"}
        ],
        upgradeMode: [
          {required: true, message: "升级模式不能为空", trigger: "blur"}
        ],
        adaptationSubject: [
          {required: true, message: "适配主体不能为空", trigger: "blur"}
        ],
        hvSoc: [
          {required: true, message: "高压电量不能为空", trigger: "blur"}
        ],
        lvSoc: [
          {required: true, message: "低压电量不能为空", trigger: "blur"}
        ],
        approvalLevel: [{
          validator: (rule, value, callback) => {
            if (this.form.state === 2) {
              if (!value) {
                callback(new Error('审批级别不能为空'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          },
          trigger: "change"
        }],
        result: [{
          validator: (rule, value, callback) => {
            if (this.form.state === 2) {
              if (!value) {
                callback(new Error('审批结果不能为空'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          },
          trigger: "change"
        }],
        comment: [{
          validator: (rule, value, callback) => {
            if (this.form.state === 2 && this.form.result === 'REJECTED') {
              if (!value || value.trim() === '') {
                callback(new Error('审批意见不能为空'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          },
          trigger: ["blur", "change"]
        }]
      },
    };
  },
  created() {
    this.getTaskStateList();
    this.getList();
  },
  methods: {
    /** 查询升级任务列表 */
    getList() {
      this.loading = true;
      listTask(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.taskList = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    getTaskStateList() {
      listAllTaskState().then(response => {
          this.taskStateList = response.data;
        }
      );
    },
    queryActivity(queryString, cb) {
      listActivity({
        name: queryString,
        state: 5
      }).then(response => {
        if (response.rows && response.rows.length > 0) {
          const suggestions = response.rows.map(item => {
            return {
              value: item.title,
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
      this.reset();
      this.open = true;
      this.title = "添加升级任务";
      this.form = {
        flashCount: 3
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const taskId = row.id || this.ids
      getTask(taskId).then(response => {
        this.form = response.data;
        getActivity(this.form.activityId).then(response2 => {
          this.form.activityName = response2.data.name;
          this.open = true;
        });
      });
      this.title = "修改升级任务";
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const taskId = row.id || this.ids
      getTask(taskId).then(response => {
        this.form = response.data;
        this.$set(this.form, 'approvalLevel', 'QUALITY');
        this.$set(this.form, 'result', 'APPROVED');
        getActivity(this.form.activityId).then(response2 => {
          this.form.activityName = response2.data.name;
          this.open = true;
        });
      });
      this.title = "审核升级任务";
    },
    /** 发布按钮操作 */
    handleRelease(row) {
      const taskId = row.id || this.ids
      this.$modal.confirm('是否确认发布该升级任务？').then(() => {
        if (taskId !== undefined) {
          releaseTask(taskId).then(response => {
            this.$modal.msgSuccess("发布成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 暂停按钮操作 */
    handlePause(row) {
      const taskId = row.id || this.ids
      this.$modal.confirm('是否确认暂停该升级任务？').then(() => {
        if (taskId !== undefined) {
          pauseTask(taskId).then(response => {
            this.$modal.msgSuccess("暂停成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 恢复按钮操作 */
    handleResume(row) {
      const taskId = row.id || this.ids
      this.$modal.confirm('是否确认恢复该升级任务？').then(() => {
        if (taskId !== undefined) {
          resumeTask(taskId).then(response => {
            this.$modal.msgSuccess("恢复成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 取消按钮操作 */
    handleCancel(row) {
      const taskId = row.id || this.ids
      this.$modal.confirm('是否确认取消该升级任务？').then(() => {
        if (taskId !== undefined) {
          cancelTask(taskId).then(response => {
            this.$modal.msgSuccess("取消成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateTask(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addTask(this.form).then(response => {
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
      const taskIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除升级任务ID为"' + taskIds + '"的数据项？').then(function () {
        return delTask(taskIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('ota-fota/task/export', {
        ...this.queryParams
      }, `task_${new Date().getTime()}.xlsx`)
    },
    handleActivitySelect(item) {
      this.form.activityName = item.name + "[" + item.version + "]";
      this.form.activityId = item.id;
    },
    handleSubmit() {
      this.$modal.confirm('是否确认提交该升级任务？').then(() => {
        this.$refs["form"].validate(valid => {
          if (valid && this.form.id !== undefined) {
            submitTask(this.form.id, this.form).then(response => {
              this.$modal.msgSuccess("提交成功");
              this.open = false;
              this.getList();
            });
          }
        });
      }).catch(() => {
      });
    },
    submitAuditForm() {
      this.$modal.confirm('是否确认提交该升级任务审核结果？').then(() => {
        this.$refs["form"].validate(valid => {
          if (valid && this.form.id !== undefined) {
            auditTask(this.form.id, {
              id: this.form.id,
              approvalLevel: this.form.approvalLevel,
              result: this.form.result,
              comment: this.form.comment
            }).then(response => {
              this.$modal.msgSuccess("提交成功");
              this.open = false;
              this.getList();
            });
          }
        });
      }).catch(() => {
      });
    },
    /** 审批记录按钮操作 */
    handleApprovalRecord(row) {
      this.loadingApproval = true;
      this.openApprovalRecord = true;
      listTaskApproval(row.id).then(response => {
        this.approvalList = response.data;
        this.loadingApproval = false;
      }).catch(() => {
        this.loadingApproval = false;
      });
    },
  }
};
</script>
