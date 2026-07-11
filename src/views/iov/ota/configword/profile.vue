<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="配置文件代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入配置文件代码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="配置文件名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入配置文件名称"
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
      <el-table-column label="配置文件代码" prop="code"/>
      <el-table-column label="配置文件名称" prop="name"/>
      <el-table-column label="读取类型" prop="readType" width="100" align="center"/>
      <el-table-column label="读取ID" prop="readId" width="100" align="center"/>
      <el-table-column label="写入类型" prop="writeType" width="100" align="center"/>
      <el-table-column label="写入ID" prop="writeId" width="100" align="center"/>
      <el-table-column label="软件零件号" prop="softwarePn" width="100" align="center"/>
      <el-table-column label="软件内部版本" prop="softwareBuildVer" width="100" align="center"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
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
            icon="el-icon-edit"
            @click="handleField(scope.row)"
            v-hasPermi="['ota:dota:configWord:query']"
          >字段
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
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="配置文件代码" prop="code">
          <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入配置文件代码"/>
        </el-form-item>
        <el-form-item label="配置文件名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入配置文件名称"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="读取类型" prop="readType">
              <el-select v-model="form.readType" placeholder="读取类型" clearable>
                <el-option label="DID" value="DID"/>
                <el-option label="ROUTINE" value="ROUTINE"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="读取ID" prop="readId">
              <el-input v-model="form.readId" placeholder="请输入读取ID"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="写入类型" prop="writeType">
              <el-select v-model="form.writeType" placeholder="写入类型" clearable>
                <el-option label="DID" value="DID"/>
                <el-option label="ROUTINE" value="ROUTINE"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="写入ID" prop="writeId">
              <el-input v-model="form.writeId" placeholder="请输入写入ID"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="会话类型" prop="sessionType">
              <el-select v-model="form.sessionType" placeholder="会话类型" clearable>
                <el-option label="DEFAULT" value="DEFAULT"/>
                <el-option label="EXTENDED" value="EXTENDED"/>
                <el-option label="PROGRAMMING" value="PROGRAMMING"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="安全策略" prop="securityLevel">
              <el-input v-model="form.securityLevel" placeholder="请输入安全策略"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="超时时间" prop="timeoutMs">
              <el-input v-model="form.timeoutMs" placeholder="请输入超时时间"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重试次数" prop="retryTimes">
              <el-input v-model="form.retryTimes" placeholder="请输入重试次数"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="软件零件号范围" prop="softwarePn">
              <el-input v-model="form.softwarePn" placeholder="请输入软件零件号范围"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="软件内部版本范围" prop="softwareBuildVer">
              <el-input v-model="form.softwareBuildVer" placeholder="请输入软件内部版本范围"/>
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
  addConfigWordProfile,
  delConfigWordProfile,
  getConfigWordProfile,
  listConfigWordProfile,
  updateConfigWordProfile,
} from "@/api/iov/ota/configword";

export default {
  name: "ConfigWordProfile",
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
          {required: true, message: "配置文件代码不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "配置文件名称不能为空", trigger: "blur"}
        ],
        readType: [
          {required: true, message: "读取类型不能为空", trigger: "blur"}
        ],
        readId: [
          {required: true, message: "读取ID不能为空", trigger: "blur"}
        ]
      },
      configWordCode: undefined
    };
  },
  created() {
    this.configWordCode = this.$route.query.code;
    this.getList();
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      listConfigWordProfile(this.configWordCode, this.addDateRange(this.queryParams, this.dateRange)).then(response => {
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
        readType: undefined,
        readId: undefined,
        writeType: undefined,
        writeId: undefined,
        sessionType: undefined,
        securityLevel: undefined,
        timeoutMs: undefined,
        retryTimes: undefined,
        softwarePn: undefined,
        softwareBuildVer: undefined,
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
      this.title = "添加配置字配置文件";
      this.form = {
        configWordCode: this.configWordCode
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getConfigWordProfile(this.configWordCode, id).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改配置字配置文件";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateConfigWordProfile(this.configWordCode, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addConfigWordProfile(this.configWordCode, this.form).then(response => {
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
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除配置字配置文件ID为"' + ids + '"的数据项？').then(function () {
        return delConfigWordProfile(configWordCode, ids);
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
    handleField(row) {
      this.$router.push({
        path: "/iov/ota/dota/configWordField",
        query: { configWordCode: this.configWordCode, configWordProfileCode: row.code }
      });
    },
  }
};
</script>
