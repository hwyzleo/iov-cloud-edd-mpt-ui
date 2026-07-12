<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="活动名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入活动名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="活动状态" prop="state">
        <el-select
          v-model="queryParams.state"
          placeholder="活动状态"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="activityState in this.activityStateList"
            :key="activityState.value"
            :label="activityState.label"
            :value="activityState.value"
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
          v-hasPermi="['ota:fota:activity:add']"
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
          v-hasPermi="['ota:fota:activity:edit']"
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
          v-hasPermi="['ota:fota:activity:remove']"
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
          v-hasPermi="['ota:fota:activity:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" fixed="left"/>
      <el-table-column label="活动名称" prop="name" min-width="150" show-overflow-tooltip fixed="left"/>
      <el-table-column label="活动编码" prop="activityCode" width="150" show-overflow-tooltip/>
      <el-table-column label="活动版本" prop="version" width="80" fixed="left"/>
      <el-table-column label="升级目的" prop="upgradePurpose" width="100" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.upgradePurpose === 1">缺陷修复</span>
          <span v-else-if="scope.row.upgradePurpose === 2">功能新增</span>
          <span v-else-if="scope.row.upgradePurpose === 3">安全补丁</span>
          <span v-else-if="scope.row.upgradePurpose === 4">合规整改</span>
          <span v-else-if="scope.row.upgradePurpose === 9">其他</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="活动开始时间" align="center" prop="startTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="活动结束时间" align="center" prop="endTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="活动状态" prop="state" width="80" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.state === 1" type="info" size="small">待提交</el-tag>
          <el-tag v-else-if="scope.row.state === 2" type="warning" size="small">待审核</el-tag>
          <el-tag v-else-if="scope.row.state === 3" type="success" size="small">已审核</el-tag>
          <el-tag v-else-if="scope.row.state === 4" type="danger" size="small">未通过</el-tag>
          <el-tag v-else-if="scope.row.state === 5" type="primary" size="small">已发布</el-tag>
          <el-tag v-else-if="scope.row.state === 6" size="small">已结束</el-tag>
          <el-tag v-else-if="scope.row.state === 7" type="info" size="small">已取消</el-tag>
          <el-tag v-else size="small">未知</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="是否基线" align="center" prop="baseline" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.baseline ? 'success' : 'info'" size="small">{{ scope.row.baseline ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="型批相关" align="center" prop="isTypeApprovalRelevant" width="90">
        <template slot-scope="scope">
          <el-tag :type="scope.row.isTypeApprovalRelevant ? 'warning' : 'info'" size="small">{{ scope.row.isTypeApprovalRelevant ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="型批评估" align="center" prop="typeApprovalAssessmentState" width="90">
        <template slot-scope="scope">
          <span v-if="scope.row.typeApprovalAssessmentState === 0 || scope.row.typeApprovalAssessmentState == null">未评估</span>
          <el-tag v-else-if="scope.row.typeApprovalAssessmentState === 1" type="success" size="small">通过</el-tag>
          <el-tag v-else-if="scope.row.typeApprovalAssessmentState === 2" type="danger" size="small">阻断</el-tag>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="版本数" prop="softwareBuildVersionCount" width="70" align="center"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-if="scope.row.state < 2"
            v-hasPermi="['ota:fota:activity:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleActivitySoftwareBuildVersion(scope.row)"
            v-if="scope.row.state < 2"
            v-hasPermi="['ota:fota:activity:edit']"
          >关联版本
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-finished"
            @click="handleAudit(scope.row)"
            v-if="scope.row.state === 2"
            v-hasPermi="['ota:fota:activity:audit']"
          >审核
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-s-flag"
            @click="handleRelease(scope.row)"
            v-if="scope.row.state === 3"
            v-hasPermi="['ota:fota:activity:release']"
          >发布
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-zoom-out"
            @click="handleCancel(scope.row)"
            v-if="scope.row.state === 5"
            v-hasPermi="['ota:fota:task:cancel']"
          >取消
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-if="scope.row.state <= 1"
            v-hasPermi="['ota:fota:activity:remove']"
          >删除
          </el-button>
          <el-dropdown size="mini" @command="(command) => handleCommand(command, scope.row)">
            <el-button size="mini" type="text" icon="el-icon-d-arrow-right">更多</el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="handleActivityCompatiblePn" icon="el-icon-edit"
                                v-if="scope.row.state < 2"
                                v-hasPermi="['ota:fota:activity:edit']">关联兼容零件号</el-dropdown-item>
              <el-dropdown-item command="handleActivityFixedConfigWord" icon="el-icon-edit"
                                v-if="scope.row.state < 2"
                                v-hasPermi="['ota:fota:activity:edit']">关联固定配置字</el-dropdown-item>
              <el-dropdown-item command="handleActivityTargetVersion" icon="el-icon-aim"
                                v-if="scope.row.state < 2"
                                v-hasPermi="['ota:fota:activity:edit']">目标版本组合</el-dropdown-item>
              <el-dropdown-item command="handleActivityInstallOrder" icon="el-icon-sort"
                                v-if="scope.row.state < 2"
                                v-hasPermi="['ota:fota:activity:edit']">安装顺序</el-dropdown-item>
              <el-dropdown-item command="handleActivityDependencyGroup" icon="el-icon-connection"
                                v-if="scope.row.state < 2"
                                v-hasPermi="['ota:fota:activity:edit']">同升同降依赖组</el-dropdown-item>
              <el-dropdown-item command="handleApprovalRecord" icon="el-icon-document"
                                v-if="scope.row.state >= 2"
                                v-hasPermi="['ota:fota:activity:list']">审批记录</el-dropdown-item>
              <el-dropdown-item command="handleApprove" icon="el-icon-finished"
                                v-if="scope.row.state === 2"
                                v-hasPermi="['ota:fota:activity:audit']">多级审批</el-dropdown-item>
              <el-dropdown-item command="handleImpactAssessment" icon="el-icon-warning-outline"
                                v-if="scope.row.state === 3"
                                v-hasPermi="['ota:fota:activity:audit']">型式批准影响评估</el-dropdown-item>
              <el-dropdown-item command="handleActivityManifest" icon="el-icon-view"
                                v-if="scope.row.state >= 2"
                                v-hasPermi="['ota:fota:activity:list']">型批版本快照</el-dropdown-item>
              <el-dropdown-item command="handleActivityRegulatoryFiling" icon="el-icon-tickets"
                                v-hasPermi="['ota:fota:filing:list']">监管备案</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
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

    <!-- 添加或修改升级活动对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="900px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入活动名称" :disabled="form.state === 2"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动编码" prop="activityCode">
              <el-input v-model="form.activityCode" placeholder="系统自动生成" disabled/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动版本" prop="version">
              <el-input v-model="form.version" placeholder="请输入活动版本" :disabled="form.state === 2"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="升级目的" prop="upgradePurpose">
              <el-select v-model="form.upgradePurpose" placeholder="请选择升级目的" :disabled="form.state === 2" style="width: 100%">
                <el-option label="缺陷修复" :value="1"/>
                <el-option label="功能新增" :value="2"/>
                <el-option label="安全补丁" :value="3"/>
                <el-option label="合规整改" :value="4"/>
                <el-option label="其他" :value="9"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="升级须知" prop="upgradeNoticeArticleTitle">
          <div>
            <el-autocomplete
              v-model="form.upgradeNoticeArticleTitle"
              :fetch-suggestions="queryUpgradeNotice"
              placeholder="请查询升级须知"
              :trigger-on-focus="false"
              clearable
              @select="handleUpgradeNoticeSelect"
              :disabled="form.state === 2"
            >
              <template #default="{ item }">
                <div>{{ item.title }}</div>
              </template>
            </el-autocomplete>
          </div>
        </el-form-item>
        <el-form-item label="活动条款" prop="activityTermArticleTitle">
          <div>
            <el-autocomplete
              v-model="form.activityTermArticleTitle"
              :fetch-suggestions="queryActivityTerm"
              placeholder="请查询活动条款"
              :trigger-on-focus="false"
              clearable
              @select="handleActivityTermSelect"
              :disabled="form.state === 2"
            >
              <template #default="{ item }">
                <div>{{ item.title }}</div>
              </template>
            </el-autocomplete>
          </div>
        </el-form-item>
        <el-form-item label="隐私协议" prop="privacyAgreementArticleTitle">
          <div>
            <el-autocomplete
              v-model="form.privacyAgreementArticleTitle"
              :fetch-suggestions="queryPrivacyAgreement"
              placeholder="请查询隐私协议"
              :trigger-on-focus="false"
              clearable
              @select="handlePrivacyAgreementSelect"
              :disabled="form.state === 2"
            >
              <template #default="{ item }">
                <div>{{ item.title }}</div>
              </template>
            </el-autocomplete>
          </div>
        </el-form-item>
        <el-form-item label="发行说明" prop="releaseNoteArticleTitle">
          <div>
            <el-autocomplete
              v-model="form.releaseNoteArticleTitle"
              :fetch-suggestions="queryReleaseNote"
              placeholder="请查询发行说明"
              :trigger-on-focus="false"
              clearable
              @select="handleReleaseNoteSelect"
              :disabled="form.state === 2"
            >
              <template #default="{ item }">
                <div>{{ item.title }}</div>
              </template>
            </el-autocomplete>
          </div>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动开始时间" prop="startTime">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="请选择活动开始时间"
                value-format="timestamp"
                :disabled="form.state === 2"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="请选择活动结束时间"
                value-format="timestamp"
                :disabled="form.state === 2"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="升级功能项">
          <el-input v-model="form.upgradeFunction" type="textarea" placeholder="请输入升级功能项" :disabled="form.state === 2"></el-input>
        </el-form-item>
        <el-form-item label="活动说明">
          <el-input v-model="form.statement" type="textarea" placeholder="请输入活动说明" :disabled="form.state === 2"></el-input>
        </el-form-item>
        <el-row>
          <el-col :span="8">
            <el-form-item label="是否基线活动" prop="baseline">
              <el-radio-group v-model="form.baseline" :disabled="form.state === 2">
                <el-radio :label="true">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="型批相关" prop="isTypeApprovalRelevant">
              <el-radio-group v-model="form.isTypeApprovalRelevant" :disabled="form.state === 2">
                <el-radio :label="true">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="form.baseline">
            <el-form-item label="基线代码" prop="baselineCode">
              <el-autocomplete
                v-model="form.baselineCode"
                :fetch-suggestions="queryBaseline"
                placeholder="请查询基线代码"
                :trigger-on-focus="false"
                clearable
                @select="handleBaselineSelect"
                :disabled="form.state === 2"
                style="width: 100%"
              >
                <template #default="{ item }">
                  <div> {{item.name}} - {{item.value}} </div>
                </template>
              </el-autocomplete>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">同意选项配置</el-divider>
        <el-row>
          <el-col :span="8">
            <el-form-item label="须知需同意" prop="noticeConsentRequired">
              <el-switch v-model="form.noticeConsentRequired" :disabled="form.state === 2"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="条款需同意" prop="termsConsentRequired">
              <el-switch v-model="form.termsConsentRequired" :disabled="form.state === 2"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="隐私需同意" prop="privacyConsentRequired">
              <el-switch v-model="form.privacyConsentRequired" :disabled="form.state === 2"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" :disabled="form.state === 2"></el-input>
        </el-form-item>
        <el-form-item label="审核结果" prop="audit" v-if="title === '审核升级活动'">
          <el-radio-group v-model="form.audit">
            <el-radio
              :label="true"
            >通过
            </el-radio>
            <el-radio
              :label="false"
            >拒绝
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="拒绝理由" prop="reason" v-if="title === '审核升级活动' && form.audit === false">
          <el-input v-model="form.reason" type="textarea" placeholder="请输入拒绝理由"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm" v-if="!form.state || form.state === 1">确 定</el-button>
        <el-button type="success" @click="handleSubmit" v-if="form.state === 1">提 交</el-button>
        <el-button type="success" @click="submitAuditForm" v-if="title === '审核升级活动' && form.state === 2">审 核
        </el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 审批记录对话框 -->
    <el-dialog title="审批记录" :visible.sync="openApprovalRecord" width="800px" append-to-body>
      <el-table v-loading="loadingApproval" :data="approvalList">
        <el-table-column label="审批阶段" prop="approvalStage" width="120" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.approvalStage === 'QUALITY'">质量审批</span>
            <span v-else-if="scope.row.approvalStage === 'PRODUCT'">产品审批</span>
            <span v-else-if="scope.row.approvalStage === 'SECURITY'">安全审批</span>
            <span v-else>{{ scope.row.approvalStage }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审批结果" prop="result" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.result === 'PASS' ? 'success' : 'danger'" size="small">
              {{ scope.row.result === 'PASS' ? '通过' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批人" prop="approver" width="120" align="center"/>
        <el-table-column label="审批意见" prop="comment" show-overflow-tooltip/>
        <el-table-column label="审批时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="openApprovalRecord = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 多级审批对话框 -->
    <el-dialog title="多级审批" :visible.sync="openApprove" width="500px" append-to-body>
      <el-form ref="approveForm" :model="approveForm" :rules="approveRules" label-width="100px">
        <el-form-item label="审批阶段" prop="approvalStage">
          <el-select v-model="approveForm.approvalStage" placeholder="请选择审批阶段" style="width: 100%">
            <el-option label="质量审批" value="QUALITY"/>
            <el-option label="产品审批" value="PRODUCT"/>
            <el-option label="安全审批" value="SECURITY"/>
          </el-select>
        </el-form-item>
        <el-form-item label="审批结果" prop="result">
          <el-radio-group v-model="approveForm.result">
            <el-radio label="PASS">通过</el-radio>
            <el-radio label="REJECT">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见" prop="comment">
          <el-input v-model="approveForm.comment" type="textarea" placeholder="请输入审批意见"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitApproveForm">确 定</el-button>
        <el-button @click="openApprove = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  addActivity,
  delActivity,
  getActivity,
  listActivity,
  listAllActivityState,
  updateActivity,
  submitActivity,
  auditActivity,
  releaseActivity,
  cancelActivity,
  listActivityApproval,
  approveActivity,
  impactAssessment
} from "@/api/iov/ota/activity";
import {listArticle,} from "@/api/iov/ota/article";
import {listBaseline} from "@/api/iov/ota/baseline";

export default {
  name: "Activity",
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
      // 升级活动表格数据
      list: [],
      activityStateList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 审批记录对话框
      openApprovalRecord: false,
      loadingApproval: false,
      approvalList: [],
      // 多级审批对话框
      openApprove: false,
      approveForm: {
        approvalStage: undefined,
        result: 'PASS',
        comment: undefined
      },
      approveRules: {
        approvalStage: [
          { required: true, message: "审批阶段不能为空", trigger: "change" }
        ],
        result: [
          { required: true, message: "审批结果不能为空", trigger: "change" }
        ]
      },
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
        version: [
          {required: true, message: "活动版本不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "活动名称不能为空", trigger: "blur"}
        ],
        totalFileSize: [
          {required: true, message: "总文件大小不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getActivityStateList();
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listActivity(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    getActivityStateList() {
      listAllActivityState().then(response => {
          this.activityStateList = response.data;
        }
      );
    },
    queryUpgradeNotice(queryString, cb) {
      listArticle({
        title: queryString,
        type: 2
      }).then(response => {
        if (response.data && response.data.items && response.data.items.length > 0) {
          const suggestions = response.data.items.map(item => {
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
    queryActivityTerm(queryString, cb) {
      listArticle({
        title: queryString,
        type: 1
      }).then(response => {
        if (response.data && response.data.items && response.data.items.length > 0) {
          const suggestions = response.data.items.map(item => {
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
    queryPrivacyAgreement(queryString, cb) {
      listArticle({
        title: queryString,
        type: 3
      }).then(response => {
        if (response.data && response.data.items && response.data.items.length > 0) {
          const suggestions = response.data.items.map(item => {
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
        name: undefined,
        version: undefined,
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
      this.title = "添加升级活动";
      this.form = {
        baseline: true
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const activityId = row.id || this.ids
      getActivity(activityId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改升级活动";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateActivity(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addActivity(this.form).then(response => {
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
      const activityIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除升级活动ID为"' + activityIds + '"的数据项？').then(function () {
        return delActivity(activityIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('ota-fota/activity/export', {
        ...this.queryParams
      }, `activity_${new Date().getTime()}.xlsx`)
    },
    handleUpgradeNoticeSelect(item) {
      this.form.upgradeNoticeArticleId = item.id;
    },
    handleActivityTermSelect(item) {
      this.form.activityTermArticleId = item.id;
    },
    handlePrivacyAgreementSelect(item) {
      this.form.privacyAgreementArticleId = item.id;
    },
    queryReleaseNote(queryString, cb) {
      listArticle({
        title: queryString,
        type: 4
      }).then(response => {
        if (response.data && response.data.items && response.data.items.length > 0) {
          const suggestions = response.data.items.map(item => {
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
    handleReleaseNoteSelect(item) {
      this.form.releaseNoteArticleId = item.id;
    },
    handleActivitySoftwareBuildVersion(row) {
      this.$router.push({
        path: "/iov/ota/activitySoftwareBuildVersion",
        query: { id: row.id }
      });
    },
    handleActivityCompatiblePn(row) {
      this.$router.push({
        path: "/iov/ota/activityCompatiblePn",
        query: { id: row.id }
      });
    },
    handleActivityFixedConfigWord(row) {
      this.$router.push({
        path: "/iov/ota/activityFixedConfigWord",
        query: { id: row.id }
      });
    },
    handleSubmit() {
      this.$modal.confirm('是否确认提交该升级活动？').then(() => {
        this.$refs["form"].validate(valid => {
          if (valid && this.form.id !== undefined) {
            submitActivity(this.form.id, this.form).then(response => {
              this.$modal.msgSuccess("提交成功");
              this.open = false;
              this.getList();
            });
          }
        });
      }).catch(() => {
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const activityId = row.id || this.ids
      getActivity(activityId).then(response => {
        this.form = response.data;
        this.$set(this.form, 'audit', true);
        this.open = true;
      });
      this.title = "审核升级活动";
    },
    submitAuditForm() {
      this.$modal.confirm('是否确认提交该升级活动审核结果？').then(() => {
        this.$refs["form"].validate(valid => {
          if (valid && this.form.id !== undefined) {
            auditActivity(this.form.id, this.form).then(response => {
              this.$modal.msgSuccess("提交成功");
              this.open = false;
              this.getList();
            });
          }
        });
      }).catch(() => {
      });
    },
    /** 发布按钮操作 */
    handleRelease(row) {
      const activityId = row.id || this.ids
      this.$modal.confirm('是否确认发布该升级活动？').then(() => {
        if (activityId !== undefined) {
          releaseActivity(activityId).then(response => {
            this.$modal.msgSuccess("发布成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 取消按钮操作 */
    handleCancel(row) {
      const activityId = row.id || this.ids
      this.$modal.confirm('是否确认取消该升级活动？').then(() => {
        if (activityId !== undefined) {
          cancelActivity(activityId).then(response => {
            this.$modal.msgSuccess("取消成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 审批记录按钮操作 */
    handleApprovalRecord(row) {
      this.loadingApproval = true;
      this.openApprovalRecord = true;
      listActivityApproval(row.id).then(response => {
        this.approvalList = response.data;
        this.loadingApproval = false;
      }).catch(() => {
        this.loadingApproval = false;
      });
    },
    /** 多级审批按钮操作 */
    handleApprove(row) {
      this.approveForm = {
        activityId: row.id,
        approvalStage: undefined,
        result: 'PASS',
        comment: undefined
      };
      this.openApprove = true;
    },
    /** 提交多级审批 */
    submitApproveForm() {
      this.$refs["approveForm"].validate(valid => {
        if (valid) {
          approveActivity(
            this.approveForm.activityId,
            this.approveForm.approvalStage,
            this.approveForm.result,
            this.approveForm.comment
          ).then(response => {
            this.$modal.msgSuccess("审批成功");
            this.openApprove = false;
            this.getList();
          });
        }
      });
    },
    /** 型式批准影响评估按钮操作 */
    handleImpactAssessment(row) {
      this.$modal.confirm('是否确认对该升级活动进行型式批准影响评估？').then(() => {
        impactAssessment(row.id).then(response => {
          this.$modal.msgSuccess("评估完成: " + response.data.label);
          this.getList();
        });
      }).catch(() => {
      });
    },
    queryBaseline(queryString, cb) {
      listBaseline({
        key: queryString  // 根据实际接口参数调整
      }).then(response => {
        if (response.data && response.data.items && response.data.items.length > 0) {
          const suggestions = response.data.items.map(item => {
          return {
            value: item.code,  // 基线代码字段名根据实际调整
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
    handleBaselineSelect(item) {
      // 如果需要保存基线ID或其他信息
      this.form.baselineId = item.id;
      this.form.baselineCode = item.code;
    },
    handleCommand(command, row) {
      switch (command) {
        case "handleActivityCompatiblePn":
          this.handleActivityCompatiblePn(row);
          break;
        case "handleActivityFixedConfigWord":
          this.handleActivityFixedConfigWord(row);
          break;
        case "handleActivityTargetVersion":
          this.handleActivityTargetVersion(row);
          break;
        case "handleActivityInstallOrder":
          this.handleActivityInstallOrder(row);
          break;
        case "handleActivityDependencyGroup":
          this.handleActivityDependencyGroup(row);
          break;
        case "handleApprovalRecord":
          this.handleApprovalRecord(row);
          break;
        case "handleApprove":
          this.handleApprove(row);
          break;
        case "handleImpactAssessment":
          this.handleImpactAssessment(row);
          break;
        case "handleActivityManifest":
          this.handleActivityManifest(row);
          break;
        case "handleActivityRegulatoryFiling":
          this.handleActivityRegulatoryFiling(row);
          break;
        default:
          break;
      }
    },
    handleActivityTargetVersion(row) {
      this.$router.push({
        path: "/iov/ota/activityTargetVersion",
        query: { id: row.id }
      });
    },
    handleActivityInstallOrder(row) {
      this.$router.push({
        path: "/iov/ota/activityInstallOrder",
        query: { id: row.id }
      });
    },
    handleActivityDependencyGroup(row) {
      this.$router.push({
        path: "/iov/ota/activityDependencyGroup",
        query: { id: row.id }
      });
    },
    handleActivityManifest(row) {
      this.$router.push({
        path: "/iov/ota/activityManifest",
        query: { id: row.id }
      });
    },
    handleActivityRegulatoryFiling(row) {
      this.$router.push({
        path: "/iov/ota/activityRegulatoryFiling",
        query: { id: row.id }
      });
    },
  }
};
</script>

<style scoped>
::v-deep .el-table .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
