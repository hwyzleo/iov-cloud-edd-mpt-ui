<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="车架号" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入车架号"
          clearable
          style="width: 190px"
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
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['completeVehicle:vehicle:info:add']"
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['completeVehicle:vehicle:info:remove']"
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['completeVehicle:vehicle:info:export']"
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="vehicleList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="车架号" fixed="left" min-width="200" prop="vin">
        <template slot-scope="scope">
          <span>{{ scope.row.vin }}</span>
          <el-tooltip v-if="!isValidVin(scope.row.vin)" content="VIN格式错误" placement="top">
            <i class="el-icon-warning" style="color: #E6A23C; margin-left: 5px;" />
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="工厂代码" prop="plantCode" align="center" width="80" />
      <el-table-column label="品牌代码" prop="brandCode" align="center" width="80" />
      <el-table-column label="平台代码" prop="platformCode" align="center" width="80" />
      <el-table-column label="车系代码" prop="carLineCode" align="center" width="80" />
      <el-table-column label="车型代码" prop="modelCode" align="center" width="80" />
      <el-table-column label="版本代码" prop="variantCode" align="center" width="120" />
      <el-table-column label="配置代码" prop="configurationCode" width="180" />
      <el-table-column label="车辆下线时间" align="center" prop="eolTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.eolTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="380" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['tsp:user-vehicle:query']"
            size="mini"
            type="text"
            icon="el-icon-user"
            @click="handleUserVehicle(scope.row)"
          >绑定/激活
          </el-button>
          <el-button
            v-hasPermi="['completeVehicle:vehicle:info:query']"
            size="mini"
            type="text"
            icon="el-icon-help"
            @click="handleLifecycle(scope.row)"
          >生命周期
          </el-button>
          <el-button
            v-hasPermi="['completeVehicle:vehicle:info:query']"
            size="mini"
            type="text"
            icon="el-icon-setting"
            @click="handlePartManagement(scope.row)"
          >零件管理
          </el-button>
          <el-button
            v-hasPermi="['completeVehicle:vehicle:info:remove']"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
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

    <!-- 添加或修改路由配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="车架号" prop="vin">
          <el-input v-model="form.vin" placeholder="请输入车架号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 车辆生命周期列表对话框 -->
    <el-dialog :title="title" :visible.sync="openLifecycleList" width="800px" append-to-body>
      <div class="dialog-body" style="max-height: 50vh; overflow-y: auto;">
        <el-table v-loading="loadingLifecycle" :data="lifecycleList">
          <el-table-column label="节点" prop="node">
            <template slot-scope="scope">
              <span>{{ getNodeType(scope.row.node) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="节点时间" align="center" prop="reachTime" width="180">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.reachTime) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelLifecycleList">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 用户绑定/激活详情对话框 -->
    <el-dialog :title="title" :visible.sync="openUserVehicle" width="860px" append-to-body @close="closeUserVehicle">
      <div v-loading="loadingUserVehicle">
        <el-alert
          v-if="userVehicle.detailStatus === 'PARTIAL'"
          title="部分数据暂不可用，首次激活状态请以 VMD 恢复后的查询结果为准"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 12px"
        />
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="车架号" :span="2">{{ userVehicle.vin || currentUserVehicleVin }}</el-descriptions-item>
          <el-descriptions-item label="用户绑定状态">
            <el-tag :type="bindingStatusType(userVehicle.bindingStatus)" size="mini">
              {{ bindingStatusText(userVehicle.bindingStatus) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">当前用户绑定</el-divider>
        <el-descriptions v-if="userVehicle.relation" :column="3" border size="small">
          <el-descriptions-item label="主使用人">{{ userVehicle.relation.maskedAccountId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关系角色">{{ userVehicle.relation.role || '-' }}</el-descriptions-item>
          <el-descriptions-item label="绑定时间">{{ formatUserVehicleTime(userVehicle.relation.boundAt) }}</el-descriptions-item>
          <el-descriptions-item label="关系ID" :span="2">{{ userVehicle.relation.relationId }}</el-descriptions-item>
          <el-descriptions-item label="关系版本">{{ userVehicle.relation.rowVersion }}</el-descriptions-item>
        </el-descriptions>
        <el-alert v-else title="当前车辆没有有效的用户绑定关系" type="info" :closable="false" />

        <template v-if="userVehicle.latestReleasedRelation">
          <el-divider content-position="left">最近已解绑关系</el-divider>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="主使用人">{{ userVehicle.latestReleasedRelation.maskedAccountId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="绑定时间">{{ formatUserVehicleTime(userVehicle.latestReleasedRelation.boundAt) }}</el-descriptions-item>
            <el-descriptions-item label="解绑时间">{{ formatUserVehicleTime(userVehicle.latestReleasedRelation.releasedAt) }}</el-descriptions-item>
            <el-descriptions-item label="解绑原因" :span="3">{{ userVehicle.latestReleasedRelation.releaseReason || '-' }}</el-descriptions-item>
          </el-descriptions>
        </template>

        <el-divider content-position="left">车机登录</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="登录状态">
            <el-tag :type="iviLoginType(userVehicle.iviLogin && userVehicle.iviLogin.state)" size="mini">
              {{ iviLoginText(userVehicle.iviLogin && userVehicle.iviLogin.state) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="回执时间">
            {{ userVehicle.iviLogin ? formatUserVehicleTime(userVehicle.iviLogin.reportedAt) : '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">整车首次激活</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="激活状态">
            <el-tag :type="firstActivationType(userVehicle.firstActivation && userVehicle.firstActivation.state)" size="mini">
              {{ firstActivationText(userVehicle.firstActivation && userVehicle.firstActivation.state) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="首次激活时间">
            {{ userVehicle.firstActivation ? formatUserVehicleTime(userVehicle.firstActivation.firstActivatedAt) : '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <template v-if="userVehicle.latestUnbind">
          <el-divider content-position="left">最近解绑与凭证撤销</el-divider>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="解绑操作ID" :span="2">{{ userVehicle.latestUnbind.operationId }}</el-descriptions-item>
            <el-descriptions-item label="撤销状态">
              <el-tag :type="revocationStatusType(userVehicle.latestUnbind.credentialRevocationStatus)" size="mini">
                {{ revocationStatusText(userVehicle.latestUnbind.credentialRevocationStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="解绑时间">{{ formatUserVehicleTime(userVehicle.latestUnbind.releasedAt) }}</el-descriptions-item>
            <el-descriptions-item label="撤销会话数">{{ userVehicle.latestUnbind.revokedSessionCount == null ? '-' : userVehicle.latestUnbind.revokedSessionCount }}</el-descriptions-item>
            <el-descriptions-item label="解绑原因">{{ userVehicle.latestUnbind.releaseReason || '-' }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button
          v-if="userVehicle.relation && userVehicle.relation.state === 'ACTIVE' && userVehicle.relation.rowVersion"
          v-hasPermi="['tsp:user-vehicle:unbind']"
          type="danger"
          icon="el-icon-link"
          @click="handleOpenUnbind"
        >解绑
        </el-button>
        <el-button
          v-if="userVehicle.latestUnbind && ['PENDING', 'FAILED'].includes(userVehicle.latestUnbind.credentialRevocationStatus)"
          v-hasPermi="['tsp:user-vehicle:unbind']"
          type="warning"
          :loading="revocationRetrying"
          @click="handleRevocationRetry"
        >重试凭证撤销
        </el-button>
        <el-button @click="openUserVehicle = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 人工解绑二次确认对话框 -->
    <el-dialog
      title="确认解绑用户车辆关系"
      :visible.sync="openUnbind"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
      @closed="resetUnbindForm"
    >
      <el-alert
        title="解绑仅解除用户与车辆的主使用人关系，不会解除车辆装配绑定，也不会删除首次激活历史。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />
      <el-form ref="unbindForm" :model="unbindForm" :rules="unbindRules" label-width="100px">
        <el-form-item label="车架号">
          <el-input :value="currentUserVehicleVin" readonly />
        </el-form-item>
        <el-form-item label="主使用人">
          <el-input :value="userVehicle.relation && userVehicle.relation.maskedAccountId" readonly />
        </el-form-item>
        <el-form-item label="解绑原因" prop="reason">
          <el-input
            v-model="unbindForm.reason"
            type="textarea"
            maxlength="64"
            show-word-limit
            placeholder="请输入解绑原因（1-64个字符）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="openUnbind = false">取 消</el-button>
        <el-button type="danger" :loading="unbindSubmitting" @click="submitUnbind">确认解绑</el-button>
      </div>
    </el-dialog>

    <!-- 零件管理对话框 -->
    <el-dialog :title="title" :visible.sync="openPartManagement" width="1000px" append-to-body @close="closePartManagement">
      <el-form v-show="showSearch" ref="partQueryForm" :model="partQueryParams" size="small" :inline="true">
        <el-form-item label="零件号" prop="pn">
          <el-input
            v-model="partQueryParams.pn"
            placeholder="请输入零件号"
            clearable
            style="width: 150px"
            @keyup.enter.native="handlePartQuery"
          />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="partDateRange"
            style="width: 240px"
            value-format="yyyy-MM-dd"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="mini" @click="handlePartQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="mini" @click="resetPartQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            v-hasPermi="['completeVehicle:vehicle:info:add']"
            type="primary"
            plain
            icon="el-icon-plus"
            size="mini"
            @click="handlePartAdd"
          >新增
          </el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            v-hasPermi="['completeVehicle:vehicle:info:edit']"
            type="success"
            plain
            icon="el-icon-edit"
            size="mini"
            :disabled="partSingle"
            @click="handlePartUpdate"
          >修改
          </el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            v-hasPermi="['completeVehicle:vehicle:info:remove']"
            type="danger"
            plain
            icon="el-icon-delete"
            size="mini"
            :disabled="partMultiple"
            @click="handlePartDelete"
          >删除
          </el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            v-hasPermi="['completeVehicle:vehicle:info:export']"
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handlePartExport"
          >导出
          </el-button>
        </el-col>
        <right-toolbar :show-search.sync="showSearch" @queryTable="getPartList" />
      </el-row>

      <el-table v-loading="partLoading" :data="partList" @selection-change="handlePartSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="零件号" prop="partCode" width="120" fixed="left" />
        <el-table-column label="序列号" prop="sn" width="180" fixed="left" />
        <el-table-column label="车载节点" prop="vehicleNodeCode" width="150" align="center" />
        <el-table-column label="设备项" prop="deviceItem" width="100" align="center" />
        <el-table-column label="绑定状态" prop="bindState" width="80" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.bindState === 0">已解绑</span>
            <span v-if="scope.row.bindState === 1">绑定中</span>
          </template>
        </el-table-column>
        <el-table-column label="绑定时间" prop="bindTime" width="140" align="center">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.bindTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="解绑时间" prop="unbindTime" width="140" align="center">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.unbindTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" width="150" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              v-hasPermi="['completeVehicle:vehicle:info:edit']"
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handlePartUpdate(scope.row)"
            >修改
            </el-button>
            <el-button
              v-hasPermi="['completeVehicle:vehicle:info:remove']"
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handlePartDelete(scope.row)"
            >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="partTotal>0"
        :total="partTotal"
        :page.sync="partQueryParams.pageNum"
        :limit.sync="partQueryParams.pageSize"
        @pagination="getPartList"
      />

      <!-- 添加或修改零件对话框 -->
      <el-dialog :title="partFormTitle" :visible.sync="openPartForm" width="500px" append-to-body>
        <el-form ref="partForm" :model="partForm" :rules="partRules" label-width="120px">
          <el-form-item label="车架号" prop="vin">
            <el-input v-model="partForm.vin" readonly placeholder="请输入车架号" />
          </el-form-item>
          <el-form-item label="零件号" prop="pn">
            <el-input v-model="partForm.pn" placeholder="请输入零件号" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="partForm.description" type="textarea" placeholder="请输入内容" />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button type="primary" @click="submitPartForm">确 定</el-button>
          <el-button @click="cancelPartForm">取 消</el-button>
        </div>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script>
import {
  listVehicle,
  listVehicleLifecycle,
  addVehicle,
  delVehicle
} from '@/api/vmd/vehicleInfo'
import {
  listVehiclePart,
  getVehiclePart,
  addVehiclePart,
  updateVehiclePart,
  delVehiclePart
} from '@/api/vmd/vehiclePart'
import {
  getUserVehicleRelation,
  unbindUserVehicleRelation,
  retryUserVehicleRevocation
} from '@/api/iov/tsp/userVehicle'
import {
  bindingStatusLabel,
  firstActivationLabel,
  iviLoginLabel,
  revocationStatusLabel,
  formatUserVehicleTime,
  createUnbindIdempotencyKey
} from './userVehicleDisplay'

export default {
  name: 'VehicleInfo',
  data() {
    return {
      // 生命周期节点类型映射
      lifecycleNodeTypes: {
        'PRODUCE': '车辆生产',
        'TOL': '总装上线',
        'EOL': '电检下线',
        'CERTIFICATE': '打印合格证',
        'POWER_DOWN': '车辆下电',
        'VEHICLE_ACTIVE': '车辆激活'
      },
      // 遮罩层
      loading: true,
      // 遮罩层（生命周期列表）
      loadingLifecycle: true,
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
      // 车辆表格数据
      vehicleList: [],
      // 车辆生命周期表格数据
      lifecycleList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 是否显示弹出层（生命周期列表）
      openLifecycleList: false,
      // 用户绑定/激活详情与解绑
      openUserVehicle: false,
      loadingUserVehicle: false,
      currentUserVehicleVin: '',
      userVehicle: {},
      openUnbind: false,
      unbindSubmitting: false,
      revocationRetrying: false,
      unbindForm: {
        relationId: undefined,
        rowVersion: undefined,
        reason: '',
        idempotencyKey: ''
      },
      unbindRules: {
        reason: [{
          validator: (rule, value, callback) => {
            if (!value || !value.trim()) {
              callback(new Error('请输入解绑原因'))
              return
            }
            callback()
          },
          trigger: 'blur'
        }]
      },
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        vin: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        vin: [
          { required: true, message: '车架号不能为空', trigger: 'blur' }
        ]
      },
      // 零件管理相关
      openPartManagement: false,
      partList: [],
      partTotal: 0,
      partLoading: false,
      partDateRange: [],
      partQueryParams: {
        pageNum: 1,
        pageSize: 10,
        vin: ''
      },
      partForm: {},
      partRules: {
        pn: [{ required: true, message: '零件号不能为空', trigger: 'blur' }]
      },
      partIds: [],
      partSingle: true,
      partMultiple: true,
      openPartForm: false,
      partFormTitle: ''
    }
  },
  created() {
    this.applyRouteQuery()
    this.getList()
  },
  watch: {
    // 页面联动：从 TBOX 详情等携带 vin 跳转时，按参数过滤并刷新列表
    '$route.query': {
      handler() {
        this.applyRouteQuery()
        this.getList()
      }
    }
  },
  methods: {
    /** 应用页面联动查询参数（如 TBOX 详情跳转携带的 vin） */
    applyRouteQuery() {
      const vin = this.$route.query.vin
      if (vin) {
        this.queryParams.vin = vin
        this.showSearch = true
      }
    },
    /** 查询车辆列表 */
    getList() {
      this.loading = true
      listVehicle(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.vehicleList = response.data.items
        this.total = response.data.total
        this.loading = false
      }
      )
    },
    /** 验证VIN号格式 */
    isValidVin(vin) {
      if (!vin) return false
      // VIN号必须是17位
      if (vin.length !== 17) return false
      // 只能包含数字和大写字母（I、O、Q不能使用）
      const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/
      if (!vinRegex.test(vin)) return false
      // 校验位验证（第9位）
      const transliterate = {
        A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
        J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
        S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '0': 0
      }
      const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]
      let sum = 0
      for (let i = 0; i < 17; i++) {
        const char = vin[i]
        const value = transliterate[char]
        if (value === undefined) return false
        sum += value * weights[i]
      }
      const remainder = sum % 11
      const checkDigit = remainder === 10 ? 'X' : String(remainder)
      return vin[8] === checkDigit
    },
    /** 用户车辆状态展示辅助 */
    bindingStatusText: bindingStatusLabel,
    firstActivationText: firstActivationLabel,
    iviLoginText: iviLoginLabel,
    revocationStatusText: revocationStatusLabel,
    formatUserVehicleTime,
    bindingStatusType(status) {
      return status === 'BOUND' ? 'success' : 'info'
    },
    firstActivationType(status) {
      if (status === 'RECORDED') return 'success'
      if (status === 'PENDING' || status === 'UNKNOWN') return 'warning'
      return 'info'
    },
    iviLoginType(status) {
      if (status === 'SUCCEEDED') return 'success'
      if (status === 'FAILED') return 'danger'
      if (status === 'PENDING') return 'warning'
      return 'info'
    },
    revocationStatusType(status) {
      if (status === 'SUCCEEDED') return 'success'
      if (status === 'FAILED') return 'danger'
      return 'warning'
    },
    /** 打开用户绑定/激活详情 */
    handleUserVehicle(row) {
      this.currentUserVehicleVin = row.vin
      this.userVehicle = { vin: row.vin }
      this.title = '车辆 ' + row.vin + ' 用户绑定/激活'
      this.openUserVehicle = true
      this.loadUserVehicleRelation()
    },
    /** 查询用户绑定、车机登录与首次激活，不阻塞主车辆列表 */
    loadUserVehicleRelation() {
      const vin = this.currentUserVehicleVin
      if (!vin) return Promise.resolve()
      this.loadingUserVehicle = true
      return getUserVehicleRelation(vin).then(response => {
        if (this.currentUserVehicleVin === vin) {
          this.userVehicle = response.data || { vin }
        }
      }).catch(() => {
        if (this.currentUserVehicleVin === vin) {
          this.userVehicle = { vin, firstActivation: { state: 'UNKNOWN' }}
        }
      }).finally(() => {
        if (this.currentUserVehicleVin === vin) {
          this.loadingUserVehicle = false
        }
      })
    },
    /** 打开解绑二次确认，保留同一幂等键直至成功或取消 */
    handleOpenUnbind() {
      const relation = this.userVehicle.relation
      if (!relation || !relation.rowVersion) {
        this.$modal.msgError('关系版本缺失，请刷新详情后重试')
        return
      }
      this.unbindForm = {
        relationId: relation.relationId,
        rowVersion: relation.rowVersion,
        reason: '',
        idempotencyKey: createUnbindIdempotencyKey()
      }
      this.openUnbind = true
      this.$nextTick(() => {
        if (this.$refs.unbindForm) this.$refs.unbindForm.clearValidate()
      })
    },
    /** 提交解绑；请求失败不关窗、不换幂等键，可直接安全重试 */
    submitUnbind() {
      this.$refs.unbindForm.validate(valid => {
        if (!valid) return
        const relationId = this.unbindForm.relationId
        const request = {
          rowVersion: this.unbindForm.rowVersion,
          reason: this.unbindForm.reason.trim(),
          idempotencyKey: this.unbindForm.idempotencyKey
        }
        this.unbindSubmitting = true
        unbindUserVehicleRelation(relationId, request).then(response => {
          this.openUnbind = false
          this.notifyUnbindResult(response.data)
          this.loadUserVehicleRelation()
        }).catch(() => {
          // 拦截器已展示错误；保留当前表单和幂等键供用户重试
        }).finally(() => {
          this.unbindSubmitting = false
        })
      })
    },
    /** 人工重试最近解绑操作的凭证撤销，不再次迁移关系 */
    handleRevocationRetry() {
      const latestUnbind = this.userVehicle.latestUnbind
      if (!latestUnbind || !latestUnbind.operationId) return
      this.revocationRetrying = true
      retryUserVehicleRevocation(latestUnbind.operationId).then(response => {
        this.notifyUnbindResult(response.data)
        this.loadUserVehicleRelation()
      }).catch(() => {
      }).finally(() => {
        this.revocationRetrying = false
      })
    },
    notifyUnbindResult(result) {
      if (!result) return
      if (result.credentialRevocationStatus === 'SUCCEEDED') {
        this.$modal.msgSuccess('车辆已解绑，相关车机凭证已撤销')
      } else if (result.credentialRevocationStatus === 'FAILED') {
        this.$modal.msgWarning('车辆已解绑，但凭证撤销失败，请重试凭证撤销')
      } else {
        this.$modal.msgWarning('车辆已解绑，凭证撤销处理中')
      }
    },
    resetUnbindForm() {
      this.unbindForm = {
        relationId: undefined,
        rowVersion: undefined,
        reason: '',
        idempotencyKey: ''
      }
      if (this.$refs.unbindForm) this.$refs.unbindForm.clearValidate()
    },
    closeUserVehicle() {
      this.openUnbind = false
      this.openUserVehicle = false
      this.loadingUserVehicle = false
      this.currentUserVehicleVin = ''
      this.userVehicle = {}
    },
    /** 查询车辆列表（生命周期） */
    getListLifecycle(vin) {
      this.loadingLifecycle = true
      listVehicleLifecycle(vin).then(response => {
        this.lifecycleList = response.data
        this.form = {
          vin: vin
        }
        this.loadingLifecycle = false
      }
      )
    },
    // 获取生命周期节点类型
    getNodeType(lifecycleNodeCode) {
      return this.lifecycleNodeTypes[lifecycleNodeCode] || lifecycleNodeCode
    },
    /** 取消按钮 */
    cancel() {
      this.open = false
      this.reset()
    },
    /** 取消按钮（生命周期列表） */
    cancelLifecycleList() {
      this.openLifecycleList = false
    },
    /** 表单重置 */
    reset() {
      this.form = {
        vin: undefined
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加车辆'
      this.form = {}
    },
    /** 生命周期按钮操作 */
    handleLifecycle(row) {
      this.openLifecycleList = true
      this.getListLifecycle(row.vin)
      this.title = '车辆 ' + row.vin + ' 生命周期'
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          addVehicle(this.form).then(response => {
            this.$modal.msgSuccess('新增成功')
            this.open = false
            this.getList()
          })
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const vehicleIds = row.id || this.ids
      this.$modal.confirm('是否确认删除车辆ID为"' + vehicleIds + '"的数据项？').then(function() {
        return delVehicle(vehicleIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {
      })
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edd-vmd/api/mpt/vehicle/v1/export', {
        ...this.queryParams
      }, `vehicle_${new Date().getTime()}.xlsx`)
    },
    /** 零件管理按钮操作 */
    handlePartManagement(row) {
      this.partQueryParams.vin = row.vin
      this.openPartManagement = true
      this.title = '车辆 ' + row.vin + ' 零件管理'
      this.getPartList()
    },
    /** 查询零件列表 */
    getPartList() {
      this.partLoading = true
      listVehiclePart(this.addDateRange(this.partQueryParams, this.partDateRange)).then(response => {
        this.partList = response.data.items
        this.partTotal = response.data.total
        this.partLoading = false
      })
    },
    /** 零件搜索按钮操作 */
    handlePartQuery() {
      this.partQueryParams.pageNum = 1
      this.getPartList()
    },
    /** 零件重置按钮操作 */
    resetPartQuery() {
      this.partDateRange = []
      this.resetForm('partQueryForm')
      this.handlePartQuery()
    },
    /** 零件多选框选中数据 */
    handlePartSelectionChange(selection) {
      this.partIds = selection.map(item => item.id)
      this.partSingle = selection.length !== 1
      this.partMultiple = !selection.length
    },
    /** 零件新增按钮操作 */
    handlePartAdd() {
      this.resetPartForm()
      this.openPartForm = true
      this.partFormTitle = '添加车辆零件'
      this.partForm = { vin: this.partQueryParams.vin }
    },
    /** 零件修改按钮操作 */
    handlePartUpdate(row) {
      this.resetPartForm()
      const id = row.id || this.partIds
      getVehiclePart(id).then(response => {
        this.partForm = response.data
        this.openPartForm = true
      })
      this.partFormTitle = '修改车辆零件'
    },
    /** 零件提交按钮 */
    submitPartForm: function() {
      this.$refs['partForm'].validate(valid => {
        if (valid) {
          if (this.partForm.id !== undefined) {
            updateVehiclePart(this.partForm).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.openPartForm = false
              this.getPartList()
            })
          } else {
            addVehiclePart(this.partForm).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.openPartForm = false
              this.getPartList()
            })
          }
        }
      })
    },
    /** 零件删除按钮操作 */
    handlePartDelete(row) {
      const ids = row.id || this.partIds
      this.$modal.confirm('是否确认删除车辆零件ID为"' + ids + '"的数据项？').then(function() {
        return delVehiclePart(ids)
      }).then(() => {
        this.getPartList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {
      })
    },
    /** 零件导出按钮操作 */
    handlePartExport() {
      this.download('edd-vmd/api/mpt/vehiclePart/v1/export', {
        ...this.partQueryParams
      }, `vehicle_part_${new Date().getTime()}.xlsx`)
    },
    /** 零件表单重置 */
    resetPartForm() {
      this.partForm = {
        vin: undefined,
        pn: undefined
      }
      this.resetForm('partForm')
    },
    /** 零件取消按钮 */
    cancelPartForm() {
      this.openPartForm = false
      this.resetPartForm()
    },
    /** 零件对话框关闭 */
    closePartManagement() {
      this.openPartManagement = false
      this.partList = []
      this.partTotal = 0
    }
  }
}
</script>
