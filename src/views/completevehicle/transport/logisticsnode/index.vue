<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="物流据点代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入物流据点代码"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="物流据点名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入物流据点名称"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="物流据点类型" prop="typeCode">
        <el-select
          v-model="queryParams.typeCode"
          placeholder="物流据点类型"
          clearable
          style="width: 120px"
        >
          <el-option
            v-for="logisticsNodeType in logisticsNodeTypeList"
            :key="logisticsNodeType.code"
            :label="logisticsNodeType.name"
            :value="logisticsNodeType.code"
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
          v-hasPermi="['completeVehicle:transport:logisticsNode:add']"
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
          v-hasPermi="['completeVehicle:transport:logisticsNode:edit']"
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
          v-hasPermi="['completeVehicle:transport:logisticsNode:remove']"
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
          v-hasPermi="['completeVehicle:transport:logisticsNode:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="logisticsNodeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="物流据点代码" prop="code"  width="150"/>
      <el-table-column label="物流据点名称" prop="name"/>
      <el-table-column label="物流据点类型" align="center" width="120">
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.typeCode" placement="top">
            <span>{{ getLogisticsNodeTypeLabel(scope.row.typeCode) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="是否启用" align="center" width="100">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.enable"
            :active-value="true"
            :inactive-value="false"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" align="center" width="60"/>
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
            v-hasPermi="['completeVehicle:transport:logisticsNode:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:transport:logisticsNode:remove']"
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

    <!-- 添加或修改物流据点对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="物流据点代码" prop="code">
          <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入物流据点代码"/>
        </el-form-item>
        <el-form-item label="物流据点名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入物流据点名称"/>
        </el-form-item>
        <el-form-item label="物流据点类型" prop="typeCode">
          <el-select
            v-model="form.typeCode"
            placeholder="物流据点类型"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="logisticsNodeType in logisticsNodeTypeList"
              :key="logisticsNodeType.code"
              :label="logisticsNodeType.name"
              :value="logisticsNodeType.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物流据点地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入物流据点地址"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactPerson">
              <el-input v-model="form.contactPerson" placeholder="请输入联系人"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactNumber">
              <el-input v-model="form.contactNumber" placeholder="请输入联系电话"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态">
          <el-radio-group v-model="form.enable">
            <el-radio
              :label="true"
            >启用
            </el-radio>
            <el-radio
              :label="false"
            >停用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" controls-position="right" :min="0"/>
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
  listLogisticsNode,
  getLogisticsNode,
  addLogisticsNode,
  updateLogisticsNode,
  delLogisticsNode
} from "@/api/completevehicle/transport/logisticsnode";
import { listAllLogisticsNodeType } from "@/api/completevehicle/transport/logisticsnodetype";

export default {
  name: "LogisticsNode",
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
      // 物流据点类型列表
      logisticsNodeTypeList: [],
      // 物流据点表格数据
      logisticsNodeList: [],
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
          {required: true, message: "物流据点代码不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "物流据点名称不能为空", trigger: "blur"}
        ],
        typeCode: [
          {required: true, message: "物流据点类型不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getLogisticsNodeTypeList();
    this.getList();
  },
  methods: {
    /** 查询物流据点类型列表 */
    getLogisticsNodeTypeList() {
      listAllLogisticsNodeType().then(response => {
        this.logisticsNodeTypeList = response;
      });
    },
    /** 查询物流据点列表 */
    getList() {
      this.loading = true;
      listLogisticsNode(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.logisticsNodeList = response.data.items || [];
          this.total = response.data.total;
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
        code: undefined,
        name: undefined,
        enable: true,
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
      this.title = "添加物流据点";
      this.form = {
        enable: true,
        sort: 99
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const logisticsNodeTypeId = row.id || this.ids
      getLogisticsNode(logisticsNodeTypeId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改物流据点";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateLogisticsNode(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addLogisticsNode(this.form).then(response => {
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
      const logisticsNodeIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除物流据点ID为"' + logisticsNodeIds + '"的数据项？').then(function () {
        return delLogisticsNode(logisticsNodeIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('otd-tms/mpt/logisticsNode/export', {
        ...this.queryParams
      }, `logistics_node_${new Date().getTime()}.xlsx`)
    },
    /** 获取物流据点类型标签 */
    getLogisticsNodeTypeLabel(typeCode) {
      const item = this.logisticsNodeTypeList.find(
        type => type.code == typeCode
      )
      return item ? item.name : typeCode
    },
  }
};
</script>
