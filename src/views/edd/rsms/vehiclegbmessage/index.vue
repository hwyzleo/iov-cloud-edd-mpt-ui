<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="车架号" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入车架号"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="命令标识" prop="commandFlag">
        <el-select
          v-model="queryParams.commandFlag"
          placeholder="命令标识"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="commandFlag in this.commandFlagList"
            :key="commandFlag.code"
            :label="commandFlag.label"
            :value="commandFlag.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="消息时间">
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
          v-hasPermi="['edd:rsms:vehicleGbMessage:add']"
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
          v-hasPermi="['edd:rsms:vehicleGbMessage:edit']"
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
          v-hasPermi="['edd:rsms:vehicleGbMessage:remove']"
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
          v-hasPermi="['edd:rsms:vehicleGbMessage:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="vehicleGbMessageList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="车架号" prop="vin" width="180"/>
      <el-table-column label="解析时间" align="center" prop="parseTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.parseTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="消息时间" align="center" prop="messageTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.messageTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="命令标识" prop="commandFlag" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ getCommandFlagType(scope.row.commandFlag) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="消息数据">
        <template slot-scope="scope">
          <el-tooltip effect="dark" placement="top" :content="scope.row.messageData" popper-class="my-tooltip">
            <div class="message-cell">
              {{ scope.row.messageData }}
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleParse(scope.row)"
            v-hasPermi="['edd:rsms:vehicleGbMessage:query']"
          >解析
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edd:rsms:vehicleGbMessage:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edd:rsms:vehicleGbMessage:remove']"
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

    <!-- 添加或修改国标消息对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="750px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="车架号" prop="vin">
              <el-input v-model="form.vin" :readonly="form.id !== undefined" placeholder="请输入车架号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="命令标识" prop="commandFlag">
              <el-select
                v-model="form.commandFlag"
                placeholder="命令标识"
                clearable
              >
                <el-option
                  v-for="commandFlag in this.commandFlagList"
                  :key="commandFlag.code"
                  :label="commandFlag.label"
                  :value="commandFlag.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="解析时间" prop="parseTime">
              <el-date-picker
                v-model="form.parseTime"
                type="datetime"
                placeholder="请选择解析时间"
                value-format="timestamp"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="消息时间" prop="messageTime">
              <el-date-picker
                v-model="form.messageTime"
                type="datetime"
                placeholder="请选择消息时间"
                value-format="timestamp"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="消息数据" prop="messageData">
          <el-input v-model="form.messageData" type="textarea" placeholder="请输入消息数据"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 国标消息解析层 -->
    <el-drawer title="国标消息详细信息" :visible.sync="openParse" direction="rtl" size="80%" :modal="true"
               :append-to-body="true" @opened="initChart">
      <div class="drawer-content">
        <el-row class="drawer-row">
          <el-col :span="3">消息数据:</el-col>
          <el-col :span="21" style="word-break: break-word">{{ form.messageData }}</el-col>
        </el-row>
        <el-row class="drawer-row">
          <el-col :span="3">消息时间:</el-col>
          <el-col :span="21">{{ parseTime(form.messageTime) }}</el-col>
        </el-row>
        <div v-if="formParse">
          <div v-if="formParse.VEHICLE">
            <el-divider></el-divider>
            <div class="drawer-title">整车数据</div>
            <el-row class="drawer-row">
              <el-col :span="6">车辆状态: {{ formParse.VEHICLE.vehicleState }}</el-col>
              <el-col :span="6">充电状态: {{ formParse.VEHICLE.chargingState }}</el-col>
              <el-col :span="6">运行模式: {{ formParse.VEHICLE.runningMode }}</el-col>
              <el-col :span="6">车速: {{ formParse.VEHICLE.speed }} km/h</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">累计里程: {{ formParse.VEHICLE.totalOdometer }} km</el-col>
              <el-col :span="6">总电压: {{ formParse.VEHICLE.totalVoltage }} V</el-col>
              <el-col :span="6">总电流: {{ formParse.VEHICLE.totalCurrent }} A</el-col>
              <el-col :span="6">SOC: {{ formParse.VEHICLE.soc }} %</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">DC/DC状态: {{ formParse.VEHICLE.dcdcState }}</el-col>
              <el-col :span="6">驱动力: <span v-if="formParse.VEHICLE.driving">有驱动力</span><span
                v-else>无驱动力</span></el-col>
              <el-col :span="6">制动力: <span v-if="formParse.VEHICLE.braking">有制动力</span><span
                v-else>无制动力</span></el-col>
              <el-col :span="6">挡位: {{ formParse.VEHICLE.gear }}</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">绝缘电阻: {{ formParse.VEHICLE.insulationResistance }} kΩ</el-col>
              <el-col :span="6">加速踏板行程值: {{ formParse.VEHICLE.acceleratorPedalPosition }} %</el-col>
              <el-col :span="6">制动踏板状态: {{ formParse.VEHICLE.brakePedalPosition }} %</el-col>
              <el-col :span="6"></el-col>
            </el-row>
          </div>
          <div v-if="formParse.DRIVE_MOTOR">
            <el-divider></el-divider>
            <div class="drawer-title">驱动电机数据</div>
            <div v-for="(item, index) in formParse.DRIVE_MOTOR">
              <el-row class="drawer-row">
                <el-col :span="6">驱动电机序号: {{ item.sn }}</el-col>
                <el-col :span="6">驱动电机状态: {{ item.state }}</el-col>
                <el-col :span="6">驱动电机控制器温度: {{ item.controllerTemperature }} ℃</el-col>
                <el-col :span="6">驱动电机转速: {{ item.speed }} r/min</el-col>
              </el-row>
              <el-row class="drawer-row">
                <el-col :span="6">驱动电机转矩: {{ item.torque }} N·m</el-col>
                <el-col :span="6">驱动电机温度: {{ item.temperature }} ℃</el-col>
                <el-col :span="6">电机控制器输入电压: {{ item.controllerInputVoltage }} V</el-col>
                <el-col :span="6">电机控制器直流母线电流: {{ item.controllerDcBusCurrent }} A</el-col>
              </el-row>
            </div>
          </div>
          <div v-if="formParse.FUEL_CELL">
            <el-divider></el-divider>
            <div class="drawer-title">燃料电池数据</div>
            <el-row class="drawer-row">
              <el-col :span="6">燃料电池电压: {{ item.voltage }} V</el-col>
              <el-col :span="6">燃料电池电流: {{ item.current }} A</el-col>
              <el-col :span="6">燃料消耗率: {{ item.consumptionRate }} kg/100km</el-col>
              <el-col :span="6">燃料电池温度探针总数: {{ item.temperatureProbeCount }}</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">探针温度值: {{ item.probeTemperature }}</el-col>
              <el-col :span="6">氢系统中最高温度: {{ item.hydrogenSystemMaxTemperature }} ℃</el-col>
              <el-col :span="6">氢系统中最高温度探针代号: {{ item.hydrogenSystemMaxTemperatureProbe }}</el-col>
              <el-col :span="6">氢气最高浓度: {{ item.hydrogenMaxConcentration }} mg/kg</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">氢气最高浓度传感器代号: {{ item.hydrogenMaxConcentrationSensor }}</el-col>
              <el-col :span="6">氢气最高压力: {{ item.hydrogenMaxPressure }} MPa</el-col>
              <el-col :span="6">氢气最高压力传感器代号: {{ item.hydrogenMaxPressureSensor }}</el-col>
              <el-col :span="6">高压DC/DC状态: {{ item.highPressureDcdcState }}</el-col>
            </el-row>
          </div>
          <div v-if="formParse.ENGINE">
            <el-divider></el-divider>
            <div class="drawer-title">发动机数据</div>
            <el-row class="drawer-row">
              <el-col :span="6">发动机状态: {{ formParse.ENGINE.state }}</el-col>
              <el-col :span="6">曲轴转速: {{ formParse.ENGINE.crankshaftSpeed }} r/min</el-col>
              <el-col :span="6">燃料消耗率: {{ formParse.ENGINE.consumptionRate }} L/100km</el-col>
              <el-col :span="6"></el-col>
            </el-row>
          </div>
          <div v-if="formParse.POSITION">
            <el-divider></el-divider>
            <div class="drawer-title">车辆位置</div>
            <el-row class="drawer-row">
              <el-col :span="6">定位状态: <span v-if="formParse.POSITION.positionValid">有效定位</span><span
                v-else>无效定位</span></el-col>
              <el-col :span="6"><span v-if="formParse.POSITION.westLongitude">西经</span><span v-else>东经</span>:
                {{ formParse.POSITION.longitude }}
              </el-col>
              <el-col :span="6"><span v-if="formParse.POSITION.southLatitude">南纬</span><span v-else>北纬</span>:
                {{ formParse.POSITION.latitude }}
              </el-col>
              <el-col :span="6"></el-col>
            </el-row>
          </div>
          <div v-if="formParse.EXTREMUM">
            <el-divider></el-divider>
            <div class="drawer-title">极值数据</div>
            <el-row class="drawer-row">
              <el-col :span="6">最高电压电池子系统号: {{ formParse.EXTREMUM.maxVoltageBatteryDeviceNo }}</el-col>
              <el-col :span="6">最低电压电池子系统号: {{ formParse.EXTREMUM.minVoltageBatteryDeviceNo }}</el-col>
              <el-col :span="6">最高温度子系统号: {{ formParse.EXTREMUM.maxTemperatureDeviceNo }}</el-col>
              <el-col :span="6">最低温度子系统号: {{ formParse.EXTREMUM.minTemperatureDeviceNo }}</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">最高电压电池单体代号: {{ formParse.EXTREMUM.maxVoltageCellNo }}</el-col>
              <el-col :span="6">最低电压电池单体代号: {{ formParse.EXTREMUM.minVoltageCellNo }}</el-col>
              <el-col :span="6">最高温度探针序号: {{ formParse.EXTREMUM.maxTemperatureProbeNo }}</el-col>
              <el-col :span="6">最低温度探针序号: {{ formParse.EXTREMUM.minTemperatureProbeNo }}</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">电池单体电压最高值: {{ formParse.EXTREMUM.cellMaxVoltage }} V</el-col>
              <el-col :span="6">电池单体电压最低值: {{ formParse.EXTREMUM.cellMinVoltage }} V</el-col>
              <el-col :span="6">最高温度值: {{ formParse.EXTREMUM.maxTemperature }} ℃</el-col>
              <el-col :span="6">最低温度值: {{ formParse.EXTREMUM.minTemperature }} ℃</el-col>
            </el-row>
          </div>
          <div v-if="formParse.ALARM">
            <el-divider></el-divider>
            <div class="drawer-title">报警数据</div>
            <el-row class="drawer-row">
              <el-col :span="6">最高报警等级: {{ formParse.ALARM.maxAlarmLevel }}</el-col>
              <el-col :span="18">通用报警标志: {{ formParse.ALARM.alarmFlagMap }}</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">可充电储能装置故障总数: {{ formParse.ALARM.batteryFaultCount }}</el-col>
              <el-col :span="18">可充电储能装置故障列表: {{ formParse.ALARM.batteryFaultList }}</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">驱动电机故障总数: {{ formParse.ALARM.driveMotorFaultCount }}</el-col>
              <el-col :span="18">驱动电机故障列表: {{ formParse.ALARM.driveMotorFaultList }}</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">发动机故障总数: {{ formParse.ALARM.engineFaultCount }}</el-col>
              <el-col :span="18">发动机故障列表: {{ formParse.ALARM.engineFaultList }}</el-col>
            </el-row>
            <el-row class="drawer-row">
              <el-col :span="6">其他故障总数: {{ formParse.ALARM.otherFaultCount }}</el-col>
              <el-col :span="18">其他故障列表: {{ formParse.ALARM.otherFaultList }}</el-col>
            </el-row>
          </div>
          <div v-if="formParse.BATTERY_VOLTAGE">
            <el-divider></el-divider>
            <div class="drawer-title">可充电储能装置电压数据</div>
            <div v-for="(item, index) in formParse.BATTERY_VOLTAGE">
              <el-row class="drawer-row">
                <el-col :span="6">可充电储能子系统号: {{ item.sn }}</el-col>
                <el-col :span="6">可充电储能装置电压: {{ item.voltage }} V</el-col>
                <el-col :span="6">可充电储能装置电流: {{ item.current }} A</el-col>
                <el-col :span="6">单体电池总数: {{ item.cellCount }}</el-col>
              </el-row>
              <el-row class="drawer-row">
                <el-col :span="6">本帧起始电池序号: {{ item.frameStartCellSn }}</el-col>
                <el-col :span="6">本帧单体电池总数: {{ item.frameCellCount }}</el-col>
                <el-col :span="12"></el-col>
              </el-row>
              <div :id="'cellVoltageChart' + index" style="width: 100%; height: 300px;"></div>
            </div>
          </div>
          <div v-if="formParse.BATTERY_TEMPERATURE">
            <el-divider></el-divider>
            <div class="drawer-title">可充电储能装置温度数据</div>
            <div v-for="(item, index) in formParse.BATTERY_TEMPERATURE">
              <el-row class="drawer-row">
                <el-col :span="6">可充电储能子系统号: {{ item.sn }}</el-col>
                <el-col :span="6">可充电储能温度探针个数: {{ item.probeCount }}</el-col>
                <el-col :span="12"></el-col>
              </el-row>
              <div :id="'temperaturesChart' + index" style="width: 100%; height: 300px;"></div>
            </div>
          </div>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button @click="closeParse">关 闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  addVehicleGbMessage,
  delVehicleGbMessage,
  getVehicleGbMessage,
  parseVehicleGbMessage,
  listVehicleGbMessage,
  listAllCommandFlag,
  updateVehicleGbMessage
} from "@/api/edd/rsms/vehiclegbmessage";
import * as echarts from 'echarts';

export default {
  name: "VehicleGbMessage",
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
      // 车辆国标消息表格数据
      vehicleGbMessageList: [],
      // 命令标识列表
      commandFlagList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否显示解析层
      openParse: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 解析表单参数
      formParse: {},
      // 表单校验
      rules: {
        vin: [
          {required: true, message: "车架号不能为空", trigger: "blur"}
        ],
        commandFlag: [
          {required: true, message: "命令标识不能为空", trigger: "blur"}
        ],
        parseTime: [
          {required: true, message: "解析时间不能为空", trigger: "blur"}
        ],
        messageTime: [
          {required: true, message: "消息时间不能为空", trigger: "blur"}
        ],
        messageData: [
          {required: true, message: "消息数据不能为空", trigger: "blur"}
        ]
      },
      cellVoltageChartInstances: {},
      temperaturesChartInstances: {}
    };
  },
  created() {
    this.getCommandFlagList();
    this.getList();
  },
  methods: {
    /** 查询车辆国标消息列表 */
    getList() {
      this.loading = true;
      listVehicleGbMessage(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.vehicleGbMessageList = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    /** 获取所有命令标识列表 */
    getCommandFlagList() {
      listAllCommandFlag().then(response => {
        this.commandFlagList = response.data;
      });
    },
    /** 获取命令标识类型 */
    getCommandFlagType(commandFlag) {
      if (!this.commandFlagList) {
        return commandFlag;
      }
      const item = this.commandFlagList.find(
        dict => dict.code === commandFlag
      )
      return item ? item.label : commandFlag
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 关闭解析按钮 */
    closeParse() {
      this.openParse = false;
    },
    /** 表单重置 */
    reset() {
      this.form = {
        vin: undefined,
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
      this.title = "添加车辆国标消息";
      this.form = {};
    },
    /** 解析按钮操作 */
    handleParse(row) {
      this.reset();
      const vehicleGbMessageId = row.id || this.ids
      this.form = row;
      parseVehicleGbMessage(vehicleGbMessageId).then(response => {
        this.formParse = response.data;
        this.openParse = true;
      });
    },
    initChart() {
      this.initCellVoltageChart();
      this.initTemperaturesChart();
    },
    initCellVoltageChart() {
      // 检查数据
      if (!this.formParse || !this.formParse.BATTERY_VOLTAGE || !Array.isArray(this.formParse.BATTERY_VOLTAGE)) {
        console.warn('无效的电池电压数据');
        return;
      }

      this.$nextTick(() => {
        this.formParse.BATTERY_VOLTAGE.forEach((item, index) => {
          const chartId = 'cellVoltageChart' + index;
          // 获取对应的DOM元素
          const chartDom = document.getElementById(chartId);
          if (!chartDom) return;

          // 如果已有实例则销毁
          if (this.cellVoltageChartInstances[index]) {
            this.cellVoltageChartInstances[index].dispose();
          }

          // 创建新图表
          const chart = echarts.init(chartDom);
          this.cellVoltageChartInstances[index] = chart;

          // 设置图表配置
          const option = {
            title: {
              text: `可充电储能子系统 ${item.sn} 单体电池电压`,
              left: 'center'
            },
            tooltip: {
              trigger: 'axis',
              formatter: '{b}: {c} V'
            },
            xAxis: {
              type: 'category',
              data: item.cellVoltageList.map((_, i) => `${item.frameStartCellSn + i}`)
            },
            yAxis: {
              type: 'value',
              name: '电压(V)',
              min: function (value) {
                return Math.floor(value.min * 1000 - 1) / 1000;
              },
              max: function (value) {
                return Math.ceil(value.max * 1000 + 1) / 1000;
              }
            },
            series: [{
              data: item.cellVoltageList,
              type: 'bar',
              name: '电压',
              itemStyle: {
                color: function (params) {
                  // 找出最大值和最小值
                  const max = Math.max(...item.cellVoltageList);
                  const min = Math.min(...item.cellVoltageList);
                  if (params.value === max) return '#ff4d4f'; // 最高值 - 红色
                  if (params.value === min) return '#52c41a'; // 最低值 - 绿色
                  return '#1890ff'; // 其他值使用蓝色
                }
              },
              markPoint: {
                data: [
                  {type: 'max', name: '最高值', itemStyle: {color: '#ff4d4f'}},
                  {type: 'min', name: '最低值', itemStyle: {color: '#52c41a'}}
                ]
              }
            }]
          };

          // 设置图表选项并捕获可能的错误
          try {
            chart.setOption(option);
            console.log('图表初始化成功:', chartId);
          } catch (error) {
            console.error('图表初始化失败:', error);
          }
        });
      });
    },
    initTemperaturesChart() {
      // 检查数据
      if (!this.formParse || !this.formParse.BATTERY_TEMPERATURE || !Array.isArray(this.formParse.BATTERY_TEMPERATURE)) {
        console.warn('无效的电池温度数据');
        return;
      }

      this.$nextTick(() => {
        this.formParse.BATTERY_TEMPERATURE.forEach((item, index) => {
          const chartId = 'temperaturesChart' + index;
          // 获取对应的DOM元素
          const chartDom = document.getElementById(chartId);
          if (!chartDom) return;

          // 如果已有实例则销毁
          if (this.temperaturesChartInstances[index]) {
            this.temperaturesChartInstances[index].dispose();
          }

          // 创建新图表
          const chart = echarts.init(chartDom);
          this.temperaturesChartInstances[index] = chart;

          // 设置图表配置
          const option = {
            title: {
              text: `可充电储能子系统 ${item.sn} 各温度探针检测到的温度值`,
              left: 'center'
            },
            tooltip: {
              trigger: 'axis',
              formatter: '{b}: {c} ℃'
            },
            xAxis: {
              type: 'category',
              data: item.temperatures.map((_, i) => `${i + 1}`)
            },
            yAxis: {
              type: 'value',
              name: '温度(℃)',
              min: function (value) {
                return value.min - 1;
              },
              max: function (value) {
                return value.max + 1;
              }
            },
            series: [{
              data: item.temperatures,
              type: 'bar',
              name: '温度',
              itemStyle: {
                color: function (params) {
                  // 找出最大值和最小值
                  const max = Math.max(...item.temperatures);
                  const min = Math.min(...item.temperatures);
                  if (params.value === max) return '#ff4d4f'; // 最高值 - 红色
                  if (params.value === min) return '#52c41a'; // 最低值 - 绿色
                  return '#1890ff'; // 其他值使用蓝色
                }
              },
              markPoint: {
                data: [
                  {type: 'max', name: '最高值', itemStyle: {color: '#ff4d4f'}},
                  {type: 'min', name: '最低值', itemStyle: {color: '#52c41a'}}
                ]
              }
            }]
          };

          // 设置图表选项并捕获可能的错误
          try {
            chart.setOption(option);
            console.log('图表初始化成功:', chartId);
          } catch (error) {
            console.error('图表初始化失败:', error);
          }
        });
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const vehicleGbMessageId = row.id || this.ids
      getVehicleGbMessage(vehicleGbMessageId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改车辆国标消息";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateVehicleGbMessage(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addVehicleGbMessage(this.form).then(response => {
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
      const vehicleGbMessageIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除车辆国标消息ID为"' + vehicleGbMessageIds + '"的数据项？').then(function () {
        return delVehicleGbMessage(vehicleGbMessageIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('tsp-rsms/mpt/vehicleGbMessage/export', {
        ...this.queryParams
      }, `vehicle_gb_message_${new Date().getTime()}.xlsx`)
    }
  },
  beforeDestroy() {
    // 清理所有图表实例
    Object.values(this.cellVoltageChartInstances).forEach(chart => {
      chart && chart.dispose();
    });
    Object.values(this.temperaturesChartInstances).forEach(chart => {
      chart && chart.dispose();
    });
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
