<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="字段代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入字段代码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="字段名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入字段名称"
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
          v-hasPermi="['ota:dota:configWord:add']"
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
          v-hasPermi="['ota:dota:configWord:edit']"
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
          v-hasPermi="['ota:dota:configWord:remove']"
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
          v-hasPermi="['ota:dota:configWord:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="字段代码" prop="code"/>
      <el-table-column label="字段名称" prop="name"/>
      <el-table-column label="字节偏移量" prop="byteOffset" width="100" align="center"/>
      <el-table-column label="位偏移量" prop="bitOffset" width="100" align="center"/>
      <el-table-column label="位长度" prop="bitLength" width="100" align="center"/>
      <el-table-column label="值类型" prop="valueType" width="100" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.valueType==='BOOL'">布尔型</span>
        </template>
      </el-table-column>
      <el-table-column label="字节序" prop="endianness" width="100" align="center"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['ota:dota:configWord:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['ota:dota:configWord:remove']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="字段代码" prop="code">
          <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入字段代码"/>
        </el-form-item>
        <el-form-item label="字段名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入字段名称"/>
        </el-form-item>
        <el-row>
          <el-col :span="8">
            <el-form-item label="字节偏移量" prop="byteOffset">
              <el-input v-model="form.byteOffset" placeholder="请输入字节偏移量"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="位偏移量" prop="bitOffset">
              <el-input v-model="form.bitOffset" placeholder="请输入位偏移量"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="位长度" prop="bitLength">
              <el-input v-model="form.bitLength" placeholder="请输入位长度"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="值类型" prop="valueType">
              <el-select v-model="form.valueType" placeholder="值类型" clearable>
                <el-option label="布尔型" value="BOOL"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字节序" prop="endianness">
              <el-select v-model="form.endianness" placeholder="字节序" clearable>
                <el-option label="大端" value="BIG_ENDIAN"/>
                <el-option label="小端" value="LITTLE_ENDIAN"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述内容"></el-input>
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
  addConfigWordField,
  delConfigWordField,
  getConfigWordField,
  listConfigWordField,
  updateConfigWordField,
} from "@/api/iov/ota/configword";

export default {
  name: "ConfigWordProfileField",
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
          {required: true, message: "字段代码不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "字段名称不能为空", trigger: "blur"}
        ],
        byteOffset: [
          {required: true, message: "字节偏移量不能为空", trigger: "blur"}
        ],
        bitOffset: [
          {required: true, message: "位偏移量不能为空", trigger: "blur"}
        ],
        bitLength: [
          {required: true, message: "位长度不能为空", trigger: "blur"}
        ],
        valueType: [
          {required: true, message: "值类型不能为空", trigger: "blur"}
        ]
      },
      configWordCode: undefined,
      configWordProfileCode: undefined
    };
  },
  created() {
    this.configWordCode = this.$route.query.configWordCode;
    this.configWordProfileCode = this.$route.query.configWordProfileCode;
    this.getList();
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      listConfigWordField(this.configWordCode, this.configWordProfileCode, this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.list = response.data.items;
        this.total = response.data.total;
        this.loading = false;
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
        code: undefined,
        name: undefined,
        byteOffset: undefined,
        bitOffset: undefined,
        bitLength: undefined,
        valueType: undefined,
        endianness: undefined,
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
      this.title = "添加配置字字段";
      this.form = {
        configWordCode: this.configWordCode,
        configWordProfileCode: this.configWordProfileCode
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getConfigWordField(this.configWordCode, this.configWordProfileCode, id).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改配置字字段";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateConfigWordField(this.configWordCode, this.configWordProfileCode, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addConfigWordField(this.configWordCode, this.configWordProfileCode, this.form).then(response => {
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
      const configWordCode = this.configWordCode;
      const configWordProfileCode = this.configWordProfileCode;
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除配置字字段ID为"' + ids + '"的数据项？').then(function () {
        return delConfigWordField(configWordCode, configWordProfileCode, ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch((error) => {
        console.error("删除失败，错误信息：", error);
        this.$modal.msgError("删除失败");
      });
    },
    /** 导出按钮操作 */
    handleExport() {
    },
  }
};
</script>
