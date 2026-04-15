<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="配置项代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入配置项代码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="配置项名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入配置项名称"
          clearable
          style="width: 150px"
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
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['edd:configCenter:configItem:add']"
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
          v-hasPermi="['edd:configCenter:configItem:edit']"
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
          v-hasPermi="['edd:configCenter:configItem:remove']"
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
          v-hasPermi="['edd:configCenter:configItem:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="配置项代码" prop="code"/>
      <el-table-column label="配置项名称" prop="name"/>
      <el-table-column label="配置项类型" prop="type" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.type==='BOOL'">布尔型</span>
          <span v-if="scope.row.type==='INT'">数值型</span>
          <span v-if="scope.row.type==='STRING'">字符型</span>
          <span v-if="scope.row.type==='ENUM'">枚举型</span>
        </template>
      </el-table-column>
      <el-table-column label="配置项单位" prop="unit" width="120" align="center"/>
      <el-table-column label="车辆能力" width="80" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.capability ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="端上展示" width="80" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.display ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="端上缓存" width="80" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.cache ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edd:configCenter:configItem:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-notebook-2"
            @click="handleOption(scope.row)"
            v-if="scope.row.type==='ENUM'"
            v-hasPermi="['edd:configCenter:configItem:edit']"
          >枚举值
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-c-scale-to-original"
            @click="handleMapping(scope.row)"
            v-hasPermi="['edd:configCenter:configItem:edit']"
          >映射
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edd:configCenter:configItem:remove']"
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

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="配置项代码" prop="code">
          <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入配置项代码"/>
        </el-form-item>
        <el-form-item label="配置项大类" prop="family">
          <el-select v-model="form.family" placeholder="配置项大类" clearable>
            <el-option key="BODY_COMFORT" label="车身&舒适" value="BODY_COMFORT"/>
            <el-option key="COCKPIT" label="座舱&车机" value="COCKPIT"/>
            <el-option key="CONN" label="网联&通信" value="CONN"/>
            <el-option key="POWERTRAIN_ENERGY" label="动力&能量" value="POWERTRAIN_ENERGY"/>
            <el-option key="CHASSIS_DRIVING" label="底盘&驾驶" value="CHASSIS_DRIVING"/>
            <el-option key="ADAS" label="智能驾驶" value="ADAS"/>
            <el-option key="SAFETY_SECURITY" label="安全&防盗" value="SAFETY_SECURITY"/>
            <el-option key="DIAGNOSTICS_SERVICE" label="诊断&售后" value="DIAGNOSTICS_SERVICE"/>
            <el-option key="OTA" label="软件&升级" value="OTA"/>
            <el-option key="COMPLIANCE_MARKET" label="法规&市场" value="COMPLIANCE_MARKET"/>
          </el-select>
        </el-form-item>
        <el-form-item label="配置项名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入配置项名称"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="配置项类型" prop="type">
              <el-select v-model="form.type" placeholder="配置项类型" clearable style="width: 100%">
                <el-option key="BOOL" label="布尔型" value="BOOL"/>
                <el-option key="INT" label="数值型" value="INT"/>
                <el-option key="STRING" label="字符型" value="STRING"/>
                <el-option key="ENUM" label="枚举型" value="ENUM"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.type === 'INT'" label="配置项单位" prop="unit">
              <el-input v-model="form.unit" placeholder="请输入配置项单位"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="8">
            <el-form-item label="车辆能力" prop="capability">
              <el-checkbox v-model="form.capability" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="端上展示" prop="display">
              <el-checkbox v-model="form.display" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="端上缓存" prop="cache">
              <el-checkbox v-model="form.cache" />
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
import {addConfigItem, delConfigItem, getConfigItem, listConfigItem, updateConfigItem} from "@/api/edd/configcenter/configitem";

export default {
  name: "ConfigItem",
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
          {required: true, message: "配置项代码不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "配置项名称不能为空", trigger: "blur"}
        ],
        family: [
          {required: true, message: "配置项大类不能为空", trigger: "blur"}
        ],
        type: [
          {required: true, message: "配置项类型不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      listConfigItem(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        family: undefined,
        code: undefined,
        name: undefined,
        type: undefined,
        unit: undefined,
        capability: undefined,
        display: undefined,
        cache: undefined
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
      this.title = "添加配置项";
      this.form = {
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getConfigItem(id).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改配置项";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateConfigItem(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addConfigItem(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除配置项ID为"' + ids + '"的数据项？').then(function () {
        return delConfigItem(brandIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('tsp-vmd/mpt/configItem/export', {
        ...this.queryParams
      }, `config_item_${new Date().getTime()}.xlsx`)
    },
    handleOption(row) {
      this.$router.push({
        path: "/edd/configCenter/configItemOption",
        query: { code: row.code }
      });
    },
    handleMapping(row) {
      this.$router.push({
        path: "/edd/configCenter/configItemMapping",
        query: { code: row.code, type: row.type }
      });
    },
  }
};
</script>
