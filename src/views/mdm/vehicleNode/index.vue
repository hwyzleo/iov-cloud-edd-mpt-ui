<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="节点类型" prop="nodeType">
        <el-select v-model="queryParams.nodeType" placeholder="请选择节点类型" clearable style="width: 140px">
          <el-option v-for="item in nodeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="功能域" prop="functionalDomain">
        <el-select v-model="queryParams.functionalDomain" placeholder="请选择功能域" clearable style="width: 140px">
          <el-option v-for="item in functionalDomainOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="OTA支持类型" prop="otaSupportType">
        <el-select v-model="queryParams.otaSupportType" placeholder="请选择OTA支持类型" clearable style="width: 140px">
          <el-option v-for="item in otaSupportTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否核心节点" prop="isCoreNode">
        <el-select v-model="queryParams.isCoreNode" placeholder="请选择" clearable style="width: 100px">
          <el-option label="是" :value="true" />
          <el-option label="否" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 100px">
          <el-option label="启用" value="ACTIVE" />
          <el-option label="停用" value="INACTIVE" />
          <el-option label="废弃" value="DEPRECATED" />
          <el-option label="草稿" value="DRAFT" />
        </el-select>
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
          v-hasPermi="['mdm:vehicleNode:add']"
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
          v-hasPermi="['mdm:vehicleNode:edit']"
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
          v-hasPermi="['mdm:vehicleNode:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['mdm:vehicleNode:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="vehicleNodeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="节点编码" prop="nodeCode" width="150" fixed="left" />
      <el-table-column label="节点名称" prop="name" min-width="200" fixed="left" />
      <el-table-column label="本地化名称" prop="nameLocal" min-width="200" />
      <el-table-column label="节点类型" prop="nodeType" width="120" align="center">
        <template slot-scope="scope">
          <el-tag>{{ nodeTypeMap[scope.row.nodeType] || scope.row.nodeType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="功能域" prop="functionalDomain" width="120" align="center">
        <template slot-scope="scope">
          <el-tag type="warning">{{ functionalDomainMap[scope.row.functionalDomain] || scope.row.functionalDomain }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="核心节点" prop="isCoreNode" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.isCoreNode ? 'danger' : 'info'">{{ scope.row.isCoreNode ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="OTA支持类型" prop="otaSupportType" width="120" align="center">
        <template slot-scope="scope">
          <span>{{ otaSupportTypeMap[scope.row.otaSupportType] || scope.row.otaSupportType }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'INACTIVE' ? 'info' : scope.row.status === 'DEPRECATED' ? 'danger' : 'warning'">
            {{ statusMap[scope.row.status] || scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center" />
      <el-table-column label="创建时间" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="250" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['mdm:vehicleNode:edit']"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
            v-hasPermi="['mdm:vehicleNode:edit']"
          >停用</el-button>
          <el-button
            v-if="scope.row.status === 'DRAFT'"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['mdm:vehicleNode:remove']"
          >删除</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleHistory(scope.row)"
            v-hasPermi="['mdm:vehicleNode:query']"
          >查看历史</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.size"
      @pagination="getList"
    />

    <!-- 添加或修改车载节点对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="节点编码" prop="nodeCode">
          <el-input v-model="form.nodeCode" :readonly="form.nodeCode !== undefined && form.id !== undefined" placeholder="请输入节点编码" />
        </el-form-item>
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="本地化名称" prop="nameLocal">
          <el-input v-model="form.nameLocal" placeholder="请输入本地化名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="节点类型" prop="nodeType">
          <el-select v-model="form.nodeType" placeholder="请选择节点类型" style="width: 100%">
            <el-option v-for="item in nodeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="功能域" prop="functionalDomain">
          <el-select v-model="form.functionalDomain" placeholder="请选择功能域" style="width: 100%">
            <el-option v-for="item in functionalDomainOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类别" prop="deviceCategory">
          <el-select v-model="form.deviceCategory" placeholder="请选择设备类别" clearable filterable style="width: 100%">
            <el-option v-for="item in deviceCategoryOptions" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="核心节点" prop="isCoreNode">
          <el-switch v-model="form.isCoreNode" />
        </el-form-item>
        <el-form-item label="OTA支持类型" prop="otaSupportType">
          <el-select v-model="form.otaSupportType" placeholder="请选择OTA支持类型" style="width: 100%">
            <el-option v-for="item in otaSupportTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="HSM能力" prop="hsmCapability">
          <el-input v-model="form.hsmCapability" placeholder="请输入HSM能力" />
        </el-form-item>
        <el-form-item label="安全等级" prop="securityLevel">
          <el-input v-model="form.securityLevel" placeholder="请输入安全等级" />
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

    <history-snapshot
      v-model="historyVisible"
      :loading="historyLoading"
      :history-list="historyList"
      :fields="historyFields"
    >
      <template #detail-fields="{ data }">
        <el-form-item label="节点编码">{{ data.nodeCode }}</el-form-item>
        <el-form-item label="节点名称">{{ data.name }}</el-form-item>
        <el-form-item label="本地化名称">{{ data.nameLocal }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="节点类型">{{ nodeTypeMap[data.nodeType] || data.nodeType }}</el-form-item>
        <el-form-item label="功能域">{{ functionalDomainMap[data.functionalDomain] || data.functionalDomain }}</el-form-item>
        <el-form-item label="设备类别">{{ data.deviceCategory }}</el-form-item>
        <el-form-item label="核心节点">{{ data.isCoreNode ? '是' : '否' }}</el-form-item>
        <el-form-item label="OTA支持类型">{{ otaSupportTypeMap[data.otaSupportType] || data.otaSupportType }}</el-form-item>
        <el-form-item label="HSM能力">{{ data.hsmCapability }}</el-form-item>
        <el-form-item label="安全等级">{{ data.securityLevel }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ statusMap[data.status] || data.status }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
      </template>
    </history-snapshot>
  </div>
</template>

<script>
import {
  listVehicleNode,
  getVehicleNode,
  addVehicleNode,
  updateVehicleNode,
  delVehicleNode,
  deactivateVehicleNode,
  listVehicleNodeHistory
} from "@/api/mdm/vehicleNode";
import { listAllDeviceCategory } from "@/api/mdm/deviceCategory";
import HistorySnapshot from "@/components/HistorySnapshot/index.vue";

export default {
  name: "MdmVehicleNode",
  components: {
    HistorySnapshot
  },
  dicts: [],
  data() {
    return {
      loading: true,
      ids: [],
      nodeCodes: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      vehicleNodeList: [],
      title: "",
      open: false,
      effectiveDateRange: [],
      isEdit: false,
      deviceCategoryOptions: [],
      nodeTypeOptions: [
        { value: 'DCU', label: '域控制器' },
        { value: 'ECU', label: '电控单元' },
        { value: 'MCU', label: '微控制器单元' },
        { value: 'SENSOR', label: '传感器' },
        { value: 'ACTUATOR', label: '执行器' },
        { value: 'GATEWAY', label: '网关' },
        { value: 'TELEMATICS', label: '通讯终端' },
        { value: 'HMI', label: '人机交互节点' },
        { value: 'CHARGER', label: '充电节点' },
        { value: 'SWITCH', label: '车载交换机' },
        { value: 'OTHER', label: '其他' }
      ],
      nodeTypeMap: {
        DCU: '域控制器',
        ECU: '电控单元',
        MCU: '微控制器单元',
        SENSOR: '传感器',
        ACTUATOR: '执行器',
        GATEWAY: '网关',
        TELEMATICS: '通讯终端',
        HMI: '人机交互节点',
        CHARGER: '充电节点',
        SWITCH: '车载交换机',
        OTHER: '其他'
      },
      functionalDomainOptions: [
        { value: 'POWERTRAIN', label: '动力域' },
        { value: 'CHASSIS', label: '底盘域' },
        { value: 'BODY', label: '车身域' },
        { value: 'ADAS', label: '智能驾驶域' },
        { value: 'COCKPIT', label: '智能座舱域' },
        { value: 'CONNECTIVITY', label: '车联域' },
        { value: 'ENERGY', label: '能源域' },
        { value: 'CROSS_DOMAIN', label: '跨域' },
        { value: 'OTHER', label: '其他' }
      ],
      functionalDomainMap: {
        POWERTRAIN: '动力域',
        CHASSIS: '底盘域',
        BODY: '车身域',
        ADAS: '智能驾驶域',
        COCKPIT: '智能座舱域',
        CONNECTIVITY: '车联域',
        ENERGY: '能源域',
        CROSS_DOMAIN: '跨域',
        OTHER: '其他'
      },
      otaSupportTypeOptions: [
        { value: 'FOTA', label: '固件OTA' },
        { value: 'SOTA', label: '软件OTA' },
        { value: 'BOTH', label: '同时支持' },
        { value: 'NOT_SUPPORTED', label: '不支持' }
      ],
      otaSupportTypeMap: {
        FOTA: '固件OTA',
        SOTA: '软件OTA',
        BOTH: '同时支持',
        NOT_SUPPORTED: '不支持'
      },
      statusMap: {
        ACTIVE: '启用',
        INACTIVE: '停用',
        DEPRECATED: '废弃',
        DRAFT: '草稿'
      },
      queryParams: {
        page: 1,
        size: 10,
        nodeType: undefined,
        functionalDomain: undefined,
        otaSupportType: undefined,
        isCoreNode: undefined,
        status: undefined,
        includeInactive: false
      },
      form: {},
      historyVisible: false,
      historyLoading: false,
      historyList: [],
      historyFields: [
        { prop: 'nodeCode', label: '节点编码' },
        { prop: 'name', label: '节点名称' },
        { prop: 'nameLocal', label: '本地化名称' },
        { prop: 'description', label: '描述' },
        { prop: 'nodeType', label: '节点类型', type: 'nodeType' },
        { prop: 'functionalDomain', label: '功能域', type: 'functionalDomain' },
        { prop: 'deviceCategory', label: '设备类别' },
        { prop: 'isCoreNode', label: '核心节点', type: 'boolean' },
        { prop: 'otaSupportType', label: 'OTA支持类型', type: 'otaSupportType' },
        { prop: 'hsmCapability', label: 'HSM能力' },
        { prop: 'securityLevel', label: '安全等级' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' }
      ],
      historyNodeCode: '',
      rules: {
        nodeCode: [
          { required: true, message: "节点编码不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "节点名称不能为空", trigger: "blur" }
        ],
        nodeType: [
          { required: true, message: "节点类型不能为空", trigger: "change" }
        ],
        functionalDomain: [
          { required: true, message: "功能域不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
    this.loadDeviceCategories();
  },
  methods: {
    loadDeviceCategories() {
      listAllDeviceCategory().then(response => {
        this.deviceCategoryOptions = response.data || [];
      });
    },
    getList() {
      this.loading = true;
      listVehicleNode(this.queryParams).then(response => {
        this.vehicleNodeList = response.data.rows;
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
        id: undefined,
        nodeCode: undefined,
        name: undefined,
        nameLocal: undefined,
        description: undefined,
        nodeType: undefined,
        functionalDomain: undefined,
        deviceCategory: undefined,
        isCoreNode: false,
        otaSupportType: undefined,
        hsmCapability: undefined,
        securityLevel: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined
      };
      this.effectiveDateRange = [];
      this.isEdit = false;
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.page = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.nodeType = undefined;
      this.queryParams.functionalDomain = undefined;
      this.queryParams.otaSupportType = undefined;
      this.queryParams.isCoreNode = undefined;
      this.queryParams.status = undefined;
      this.queryParams.includeInactive = false;
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.nodeCodes = selection.map(item => item.nodeCode);
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
      this.title = "添加车载节点";
    },
    handleUpdate(row) {
      this.reset();
      const nodeCode = row.nodeCode || this.nodeCodes[0];
      getVehicleNode(nodeCode).then(response => {
        this.form = response.data;
        this.isEdit = true;
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo];
        }
        this.open = true;
        this.title = "修改车载节点";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.isEdit) {
            updateVehicleNode(this.form.nodeCode, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addVehicleNode(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDeactivate(row) {
      const nodeCode = row.nodeCode;
      this.$modal.confirm('是否确认停用车载节点"' + nodeCode + '"？').then(function() {
        return deactivateVehicleNode(nodeCode, '');
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("停用成功");
      }).catch(() => {});
    },
    handleDelete(row) {
      const nodeCode = row.nodeCode || this.nodeCodes[0];
      this.$modal.confirm('是否确认删除车载节点"' + nodeCode + '"？').then(function() {
        return delVehicleNode(nodeCode, '');
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download('edd-mdm/api/mpt/vehicleNode/v1/export', {
        ...this.queryParams
      }, `vehicleNode_${new Date().getTime()}.xlsx`);
    },
    handleHistory(row) {
      this.historyNodeCode = row.nodeCode;
      this.historyVisible = true;
      this.loadHistory();
    },
    loadHistory() {
      this.historyLoading = true;
      listVehicleNodeHistory(this.historyNodeCode).then(response => {
        this.historyList = response.data;
        this.historyLoading = false;
      });
    }
  }
};
</script>
