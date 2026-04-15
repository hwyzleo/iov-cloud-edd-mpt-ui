<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="源系统" prop="sourceSystem">
        <el-select v-model="queryParams.sourceSystem" placeholder="源系统" clearable>
          <el-option key="MES" label="MES" value="MES"/>
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
      <el-table-column label="源系统" prop="sourceSystem"/>
      <el-table-column label="源系统代码" prop="sourceCode"/>
      <el-table-column label="源系统值" prop="sourceValue"/>
      <el-table-column label="映射的枚举值编码" prop="targetOptionCode"/>
      <el-table-column label="映射值" prop="targetValue"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
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
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edd:configCenter:configItem:edit']"
          >修改
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

    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="源系统" prop="sourceSystem">
          <el-select v-model="form.sourceSystem" placeholder="源系统" :readonly="form.id !== undefined" clearable>
            <el-option key="MES" label="MES" value="MES"/>
          </el-select>
        </el-form-item>
        <el-form-item label="源系统代码" prop="sourceCode">
          <el-input v-model="form.sourceCode" placeholder="请输入源系统代码"/>
        </el-form-item>
        <el-form-item label="源系统值" prop="sourceValue">
          <el-input v-model="form.sourceValue" placeholder="请输入源系统值"/>
        </el-form-item>
        <el-form-item v-if="configItemType==='ENUM'" label="映射的枚举值" prop="targetOptionCode">
          <el-select v-model="form.targetOptionCode" placeholder="映射的枚举值" clearable>
            <el-option
              v-for="option in optionList"
              :key="option.code"
              :label="option.name + ':' + option.code"
              :value="option.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="configItemType!=='ENUM'" label="映射值" prop="targetValue">
          <el-input v-model="form.targetValue" placeholder="请输入映射值"/>
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
  listConfigItemOption,
  listConfigItemMapping,
  getConfigItemMapping,
  addConfigItemMapping,
  updateConfigItemMapping,
  delConfigItemMapping
} from "@/api/edd/configcenter/configitem";

export default {
  name: "ConfigItemMapping",
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
      optionList: [],
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
        sourceSystem: [
          {required: true, message: "源系统不能为空", trigger: "blur"}
        ],
        sourceCode: [
          {required: true, message: "源系统代码不能为空", trigger: "blur"}
        ]
      },
      configItemCode: undefined,
      configItemType: undefined
    };
  },
  created() {
    this.configItemCode = this.$route.query.code;
    this.configItemType = this.$route.query.type;
    if(this.configItemType === "ENUM") {
      this.getOptionList();
    }
    this.getList();
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      listConfigItemMapping(this.configItemCode, this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.data;
          this.loading = false;
        }
      );
    },
    getOptionList() {
      listConfigItemOption(this.configItemCode, this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.optionList = response.data;
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
        sourceSystem: undefined,
        sourceCode: undefined,
        sourceValue: undefined,
        targetOptionCode: undefined,
        targetValue: undefined
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
      this.title = "添加配置项映射";
      this.form = {
        configItemCode: this.configItemCode
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getConfigItemMapping(this.configItemCode, id).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改配置项映射";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateConfigItemMapping(this.configItemCode, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addConfigItemMapping(this.configItemCode, this.form).then(response => {
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
      const configItemCode = this.configItemCode;
      this.$modal.confirm('是否确认删除枚举值ID为"' + ids + '"的数据项？').then(function () {
        return delConfigItemMapping(configItemCode, ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
    }
  }
};
</script>
