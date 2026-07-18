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
          v-hasPermi="['completeVehicle:vehicle:info:edit']"
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
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
      <el-table-column label="操作" align="center" fixed="right" width="280" class-name="small-padding fixed-width">
        <template slot-scope="scope">
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
            v-hasPermi="['completeVehicle:vehicle:info:edit']"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
          >修改
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
          <el-table-column label="排序" prop="sort" width="60" />
          <el-table-column label="创建时间" align="center" prop="createTime" width="180">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                v-hasPermi="['vehicle:vehicle:vehicle:edit']"
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdateLifecycle(scope.row)"
              >修改
              </el-button>
              <el-button
                v-hasPermi="['vehicle:vehicle:vehicle:edit']"
                size="mini"
                type="text"
                icon="el-icon-delete"
                @click="handleDeleteLifecycle(scope.row)"
              >删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleAddLifecycle(form.vin)">新 增</el-button>
        <el-button @click="cancelLifecycleList">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 添加或修改生命周期对话框 -->
    <el-dialog :title="title2" :visible.sync="openLifecycle" width="500px" append-to-body>
      <el-form ref="formLifecycle" :model="formLifecycle" :rules="rulesLifecycle" label-width="120px">
        <el-form-item label="车架号" prop="vin">
          <el-input v-model="formLifecycle.vin" readonly placeholder="请输入车架号" />
        </el-form-item>
        <el-form-item label="节点类型" prop="node">
          <el-select
            v-model="formLifecycle.node"
            placeholder="节点类型"
            clearable
          >
            <el-option
              v-for="dict in dict.type.iov_vehicle_lifecycle"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="触达时间" prop="reachTime">
          <el-date-picker
            v-model="formLifecycle.reachTime"
            type="datetime"
            placeholder="选择日期时间"
            value-format="timestamp"
            format="yyyy-MM-dd HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formLifecycle.sort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formLifecycle.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFormLifecycle">确 定</el-button>
        <el-button @click="cancelLifecycle">取 消</el-button>
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
  getVehicle,
  addVehicle,
  addVehicleLifecycle,
  updateVehicle,
  updateVehicleLifecycle,
  delVehicle,
  delVehicleLifecycle
} from '@/api/vmd/vehicleInfo'
import {
  listVehiclePart,
  getVehiclePart,
  addVehiclePart,
  updateVehiclePart,
  delVehiclePart
} from '@/api/vmd/vehiclePart'

export default {
  name: 'VehicleInfo',
  dicts: ['iov_vehicle_lifecycle'],
  data() {
    return {
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
      title2: '',
      // 是否显示弹出层
      open: false,
      // 是否显示弹出层（生命周期列表）
      openLifecycleList: false,
      // 是否显示弹出层（生命周期）
      openLifecycle: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单参数（生命周期）
      formLifecycle: {},
      // 表单校验
      rules: {
        vin: [
          { required: true, message: '车架号不能为空', trigger: 'blur' }
        ]
      },
      // 表单校验（生命周期）
      rulesLifecycle: {
        vin: [
          { required: true, message: '车架号不能为空', trigger: 'blur' }
        ],
        node: [
          { required: true, message: '节点类型不能为空', trigger: 'blur' }
        ],
        reachTime: [
          { required: true, message: '触达时间不能为空', trigger: 'blur' }
        ],
        sort: [
          { required: true, message: '排序不能为空', trigger: 'blur' }
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
    this.getList()
  },
  methods: {
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
    /** 查询车辆列表（生命周期） */
    getListLifecycle(vin) {
      this.loadingLifecycle = true
      listVehicleLifecycle(vin).then(response => {
        this.lifecycleList = response
        this.form = {
          vin: vin
        }
        this.loadingLifecycle = false
      }
      )
    },
    // 获取生命周期节点类型
    getNodeType(lifecycleNodeCode) {
      if (!this.dict || !this.dict.type || !this.dict.type.iov_vehicle_lifecycle) {
        return lifecycleNodeCode
      }
      const item = this.dict.type.iov_vehicle_lifecycle.find(
        dict => dict.value === lifecycleNodeCode
      )
      return item ? item.label : lifecycleNodeCode
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
    /** 取消按钮（生命周期） */
    cancelLifecycle() {
      this.openLifecycle = false
    },
    /** 表单重置 */
    reset() {
      this.form = {
        vin: undefined
      }
      this.resetForm('form')
    },
    /** 表单重置（生命周期） */
    resetLifecycle() {
      this.formLifecycle = {
        vin: undefined,
        node: undefined,
        reachTime: undefined,
        sort: 0
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
    /** 新增按钮操作（生命周期） */
    handleAddLifecycle() {
      this.resetLifecycle()
      this.openLifecycle = true
      this.title2 = '添加车辆生命周期'
      this.formLifecycle = {
        vin: this.form.vin,
        sort: 0
      }
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const vehicleId = row.id || this.ids
      getVehicle(vehicleId).then(response => {
        this.form = response.data
        this.open = true
      })
      this.title = '修改车辆'
    },
    /** 修改按钮操作（生命周期） */
    handleUpdateLifecycle(row) {
      this.resetLifecycle()
      this.formLifecycle = row
      this.openLifecycle = true
      this.title2 = '修改车辆生命周期'
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
          if (this.form.id !== undefined) {
            updateVehicle(this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addVehicle(this.form).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 提交按钮（生命周期） */
    submitFormLifecycle: function() {
      this.$refs['formLifecycle'].validate(valid => {
        if (valid) {
          if (this.formLifecycle.id !== undefined) {
            updateVehicleLifecycle(this.formLifecycle).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.openLifecycle = false
              this.getListLifecycle(this.formLifecycle.vin)
            })
          } else {
            addVehicleLifecycle(this.formLifecycle).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.openLifecycle = false
              this.getListLifecycle(this.formLifecycle.vin)
            })
          }
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
    /** 删除按钮操作（生命周期） */
    handleDeleteLifecycle(row) {
      this.$modal.confirm('是否确认删除车辆生命周期ID为"' + row.id + '"的数据项？').then(function() {
        return delVehicleLifecycle(row.vin, row.id)
      }).then(() => {
        this.getListLifecycle(row.vin)
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
