<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="设备代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入设备代码"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入设备名称"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="功能域" prop="funcDomain">
        <el-select v-model="queryParams.funcDomain" placeholder="功能域" clearable>
          <el-option key="CONNECT" label="网联域" value="CONNECT"/>
          <el-option key="IVI" label="信息娱乐座舱域" value="IVI"/>
          <el-option key="ADAS" label="自动驾驶域" value="ADAS"/>
          <el-option key="POWER" label="动力域" value="POWER"/>
          <el-option key="CHASSIS" label="底盘安全域" value="CHASSIS"/>
          <el-option key="BODY" label="车身域" value="BODY"/>
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
          v-hasPermi="['completeVehicle:vehicle:device:add']"
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
          v-hasPermi="['completeVehicle:vehicle:device:edit']"
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
          v-hasPermi="['completeVehicle:vehicle:device:remove']"
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
          v-hasPermi="['completeVehicle:vehicle:device:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="设备代码" prop="code" width="120"/>
      <el-table-column label="设备名称" prop="name"/>
      <el-table-column label="英文名称" prop="nameEn"/>
      <el-table-column label="功能域" prop="funcDomain" align="center" width="80">
        <template slot-scope="scope">
          <span v-if="scope.row.funcDomain==='CONNECT'">网联</span>
          <span v-if="scope.row.funcDomain==='BODY'">车身</span>
          <span v-if="scope.row.funcDomain==='CHASSIS'">底盘</span>
          <span v-if="scope.row.funcDomain==='ADAS'">智驾</span>
          <span v-if="scope.row.funcDomain==='IVI'">座舱</span>
          <span v-if="scope.row.funcDomain==='POWER'">动力</span>
        </template>
      </el-table-column>
      <el-table-column label="设备类型" prop="type" align="center" width="80">
        <template slot-scope="scope">
          <span v-if="scope.row.type==='DOMAIN'">域控</span>
          <span v-if="scope.row.type==='ECU'">电控单元</span>
          <span v-if="scope.row.type==='SENSOR'">传感器</span>
          <span v-if="scope.row.type==='ACTUATOR'">执行器</span>
        </template>
      </el-table-column>
      <el-table-column label="设备项" prop="deviceItem" align="center" width="80"/>
      <el-table-column label="核心设备" prop="core" align="center" width="80">
        <template slot-scope="scope">
          <span>{{ scope.row.core ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" align="center" width="80"/>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['completeVehicle:vehicle:device:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:vehicle:device:remove']"
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

    <!-- 添加或修改设备信息对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="900px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="设备代码" prop="code">
              <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入设备代码"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入设备名称"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="设备英文名称" prop="nameEn">
          <el-input v-model="form.nameEn" placeholder="请输入设备英文名称"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="功能域" prop="funcDomain">
              <el-select v-model="form.funcDomain" placeholder="功能域" style="width: 100%" clearable>
                <el-option key="CONNECT" label="网联域" value="CONNECT"/>
                <el-option key="IVI" label="信息娱乐座舱域" value="IVI"/>
                <el-option key="ADAS" label="自动驾驶域" value="ADAS"/>
                <el-option key="POWER" label="动力域" value="POWER"/>
                <el-option key="CHASSIS" label="底盘安全域" value="CHASSIS"/>
                <el-option key="BODY" label="车身域" value="BODY"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="type">
              <el-select v-model="form.type" placeholder="设备类型" style="width: 100%" clearable>
                <el-option key="DOMAIN" label="域控" value="DOMAIN"/>
                <el-option key="ECU" label="电控单元" value="ECU"/>
                <el-option key="SENSOR" label="传感器" value="SENSOR"/>
                <el-option key="ACTUATOR" label="执行器" value="ACTUATOR"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="8">
            <el-form-item label="OTA支持类型" prop="otaSupport">
              <el-select v-model="form.otaSupport" placeholder="OTA支持类型" style="width: 100%" clearable @change="handleOtaSupportChange">
                <el-option key="NO_OTA" label="不支持" value="NO_OTA"/>
                <el-option key="FOTA" label="固件升级" value="FOTA"/>
                <el-option key="SOTA" label="软件升级" value="SOTA"/>
                <el-option key="FOTA_SOTA" label="固件+软件升级" value="FOTA_SOTA"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="form.otaSupport && form.otaSupport !== 'NO_OTA'">
            <el-form-item label="分区类型" prop="partitionType">
              <el-select v-model="form.partitionType" placeholder="分区类型" style="width: 100%" clearable>
                <el-option key="SINGLE" label="单分区" value="SINGLE"/>
                <el-option key="AB" label="AB分区" value="AB"/>
                <el-option key="MULTI" label="多分区" value="MULTI"/>
                <el-option key="DELTA" label="差分分区" value="DELTA"/>
                <el-option key="VIRTUAL" label="虚拟分区" value="VIRTUAL"/>
                <el-option key="BOOT_APP" label="引导应用分离分区" value="BOOT_APP"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="form.otaSupport && form.otaSupport !== 'NO_OTA'">
            <el-form-item label="解闭锁安全件" prop="lockUnlockSecurityComponent">
              <el-select v-model="form.lockUnlockSecurityComponent" placeholder="解闭锁安全件" style="width: 100%" clearable>
                <el-option :key="0" label="无" :value="0"/>
                <el-option :key="1" label="包含解锁安全件" :value="1"/>
                <el-option :key="2" label="包含闭锁安全件" :value="2"/>
                <el-option :key="3" label="包含解/闭锁安全件" :value="3"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="设备项" prop="deviceItem">
              <el-select v-model="form.deviceItem" placeholder="设备项" style="width: 100%" clearable>
                <el-option
                  v-for="deviceItem in this.deviceItemList"
                  :key="deviceItem.code"
                  :label="deviceItem.code + '(' + deviceItem.label + ')'"
                  :value="deviceItem.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否核心设备" prop="core">
              <el-checkbox v-model="form.core"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="节点类型" prop="nodeType">
          <el-select v-model="form.nodeType" placeholder="节点类型" style="width: 100%" multiple clearable>
            <el-option key="CAN" label="CAN" value="CAN"/>
            <el-option key="CANFD" label="CANFD" value="CANFD"/>
            <el-option key="LIN" label="LIN" value="LIN"/>
            <el-option key="DoIP" label="DoIP" value="DoIP"/>
            <el-option key="MQTT" label="MQTT" value="MQTT"/>
            <el-option key="ETHERNET" label="ETHERNET" value="ETHERNET"/>
            <el-option key="LVDS" label="LVDS" value="LVDS"/>
            <el-option key="Fakra" label="Fakra" value="Fakra"/>
            <el-option key="A2B" label="A2B" value="A2B"/>
          </el-select>
        </el-form-item>
        <el-form-item label="通信协议" prop="commProtocol">
          <el-select v-model="form.commProtocol" placeholder="通信协议" style="width: 100%" multiple clearable>
            <el-option key="UDS" label="UDS" value="UDS"/>
            <el-option key="CANoe" label="CANoe" value="CANoe"/>
            <el-option key="DoIP" label="DoIP" value="DoIP"/>
            <el-option key="LIN" label="LIN" value="LIN"/>
            <el-option key="MQTT" label="MQTT" value="MQTT"/>
            <el-option key="HTTPS" label="HTTPS" value="HTTPS"/>
            <el-option key="ADB" label="ADB" value="ADB"/>
          </el-select>
        </el-form-item>
        <el-form-item label="刷写协议" prop="flashProtocol">
          <el-select v-model="form.flashProtocol" placeholder="刷写协议" style="width: 100%" multiple clearable>
            <el-option key="UDS" label="UDS" value="UDS"/>
            <el-option key="CAN" label="CAN" value="CAN"/>
            <el-option key="DoIP" label="DoIP" value="DoIP"/>
            <el-option key="FOTA_MQTT" label="FOTA_MQTT" value="FOTA_MQTT"/>
            <el-option key="SOTA_HTTP" label="SOTA_HTTP" value="SOTA_HTTP"/>
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="8">
            <el-form-item label="链路配置源" prop="linkConfigSource">
              <el-input v-model="form.linkConfigSource" placeholder="链路配置源"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="CAN发送标识" prop="canTxId">
              <el-input v-model="form.canTxId" placeholder="CAN/CANFD总线发送标识"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="DoIP网关标识" prop="doipGatewayId">
              <el-input v-model="form.doipGatewayId" placeholder="DoIP网关标识"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="8">
            <el-form-item label="链路生效目标" prop="linkFlashTarget">
              <el-input v-model="form.linkFlashTarget" placeholder="链路生效目标"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="CAN接收标识" prop="canRxId">
              <el-input v-model="form.canRxId" placeholder="CAN/CANFD总线接收标识"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="DoIP设备标识" prop="doipEntityId">
              <el-input v-model="form.doipEntityId" placeholder="DoIP设备标识"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="以太网IP" prop="ethernetIp">
              <el-input v-model="form.ethernetIp" placeholder="以太网IP"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" controls-position="right" :min="0"/>
            </el-form-item>
          </el-col>
        </el-row>
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
import {addDevice, delDevice, getDevice, listDevice, listAllDeviceItem, updateDevice} from "@/api/completevehicle/vehicle/device";

export default {
  name: "Device",
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
      deviceItemList: [],
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
        code: [
          {required: true, message: "设备代码不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "设备名称不能为空", trigger: "blur"}
        ],
        type: [
          {required: true, message: "设备类型不能为空", trigger: "blur"}
        ],
        deviceItem: [
          {required: true, message: "设备项不能为空", trigger: "blur"}
        ],
        funcDomain: [
          {required: true, message: "功能域不能为空", trigger: "blur"}
        ],
        nodeType: [
          {required: true, message: "节点类型不能为空", trigger: "blur"}
        ],
        otaSupport: [
          {required: true, message: "OTA支持类型不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getDeviceItemList();
    this.getList();
  },
  methods: {
    /** 查询设备信息列表 */
    getList() {
      this.loading = true;
      listDevice(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    getDeviceItemList() {
      listAllDeviceItem().then(response => {
        this.deviceItemList = response.data;
      })
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        code: undefined,
        name: undefined,
        sort: 99
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
      this.title = "添加车载设备";
      this.form = {
        sort: 99
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getDevice(id).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改车载设备";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateDevice(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDevice(this.form).then(response => {
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
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除车载域ID为"' + ids + '"的数据项？').then(function () {
        return delDevice(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('tsp-vmd/device/export', {
        ...this.queryParams
      }, `device_${new Date().getTime()}.xlsx`)
    },
    handleOtaSupportChange(val) {
      if(val === 'NO_OTA') {
        this.form.partitionType = undefined;
        this.form.lockUnlockSecurityComponent = undefined;
      }
    }
  }
};
</script>
