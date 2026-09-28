<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="接口编码" prop="apiCode">
        <el-input
          v-model="queryParams.apiCode"
          placeholder="请输入接口编码"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="接口名称" prop="apiName">
        <el-input
          v-model="queryParams.apiName"
          placeholder="请输入接口名称"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 160px">
          <el-option label="草稿" value="DRAFT" />
          <el-option label="已发布" value="PUBLISHED" />
          <el-option label="停用" value="DISABLED" />
        </el-select>
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
          v-hasPermi="['edd:opgw:openApi:add']"
        >新增</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="openApiList">
      <el-table-column label="接口编码" prop="apiCode" :show-overflow-tooltip="true" />
      <el-table-column label="接口名称" prop="apiName" :show-overflow-tooltip="true" />
      <el-table-column label="外部路径" prop="externalPath" :show-overflow-tooltip="true" />
      <el-table-column label="外部方法" align="center" prop="httpMethod" width="80" />
      <el-table-column label="目标服务" prop="targetServiceName" :show-overflow-tooltip="true" width="120" align="center" />
      <el-table-column label="目标路径" prop="targetPath" :show-overflow-tooltip="true" />
      <el-table-column label="目标方法" align="center" prop="targetHttpMethod" width="80" />
      <el-table-column label="限流(次/分)" align="center" prop="rateLimitPerMinute" width="100" />
      <el-table-column label="版本" align="center" prop="configVersion" width="70" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.status === 'DRAFT'"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edd:opgw:openApi:edit']"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'DISABLED'"
            size="mini"
            type="text"
            icon="el-icon-open"
            @click="handleEnable(scope.row)"
            v-hasPermi="['edd:opgw:openApi:edit']"
          >启用</el-button>
          <el-button
            v-if="scope.row.status === 'PUBLISHED'"
            size="mini"
            type="text"
            icon="el-icon-turn-off"
            @click="handleDisable(scope.row)"
            v-hasPermi="['edd:opgw:openApi:edit']"
          >停用</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edd:opgw:openApi:remove']"
          >删除</el-button>
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

    <!-- 添加或修改开放接口对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="接口编码" prop="apiCode">
          <el-input v-model="form.apiCode" placeholder="请输入接口编码" :disabled="form.id != undefined" />
        </el-form-item>
        <el-form-item label="接口名称" prop="apiName">
          <el-input v-model="form.apiName" placeholder="请输入接口名称" />
        </el-form-item>
        <el-form-item label="外部路径" prop="externalPath">
          <el-input v-model="form.externalPath" placeholder="例如 /open/xxx/v1" />
        </el-form-item>
        <el-form-item label="外部HTTP方法" prop="httpMethod">
          <el-select v-model="form.httpMethod" placeholder="请选择外部HTTP方法" style="width: 100%">
            <el-option v-for="m in httpMethods" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">目标路由</el-divider>
        <el-form-item label="目标服务名" prop="targetServiceName">
          <el-input v-model="form.targetServiceName" placeholder="例如 edd-vmd" />
        </el-form-item>
        <el-form-item label="目标路径" prop="targetPath">
          <el-input v-model="form.targetPath" placeholder="例如 /api/inner/xxx/v1" />
        </el-form-item>
        <el-form-item label="目标HTTP方法" prop="targetHttpMethod">
          <el-select v-model="form.targetHttpMethod" placeholder="请选择目标HTTP方法" style="width: 100%">
            <el-option v-for="m in httpMethods" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">其他</el-divider>
        <el-form-item label="限流(次/分)" prop="rateLimitPerMinute">
          <el-input-number v-model="form.rateLimitPerMinute" controls-position="right" :min="1" :max="100000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
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
import { listOpenApi, getOpenApi, addOpenApi, updateOpenApi, enableOpenApi, disableOpenApi, delOpenApi } from "@/api/edd/opgw/openApi";

export default {
  name: "OpgwOpenApi",
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      openApiList: [],
      httpMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        apiCode: undefined,
        apiName: undefined,
        status: undefined
      },
      form: {},
      rules: {
        apiCode: [
          { required: true, message: "接口编码不能为空", trigger: "blur" }
        ],
        apiName: [
          { required: true, message: "接口名称不能为空", trigger: "blur" }
        ],
        externalPath: [
          { required: true, message: "外部路径不能为空", trigger: "blur" }
        ],
        httpMethod: [
          { required: true, message: "外部HTTP方法不能为空", trigger: "change" }
        ],
        targetServiceName: [
          { required: true, message: "目标服务名不能为空", trigger: "blur" }
        ],
        targetPath: [
          { required: true, message: "目标路径不能为空", trigger: "blur" }
        ],
        targetHttpMethod: [
          { required: true, message: "目标HTTP方法不能为空", trigger: "change" }
        ],
        rateLimitPerMinute: [
          { required: true, message: "限流值不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    statusLabel(status) {
      return { DRAFT: "草稿", PUBLISHED: "已发布", DISABLED: "停用" }[status] || status;
    },
    statusTagType(status) {
      return { DRAFT: "info", PUBLISHED: "success", DISABLED: "danger" }[status] || "info";
    },
    getList() {
      this.loading = true;
      listOpenApi(this.queryParams).then(response => {
        this.openApiList = response.data.items;
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
        apiCode: undefined,
        apiName: undefined,
        externalPath: undefined,
        httpMethod: "POST",
        targetServiceName: undefined,
        targetPath: undefined,
        targetHttpMethod: "POST",
        rateLimitPerMinute: 60,
        description: undefined
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加开放接口";
    },
    handleUpdate(row) {
      this.reset();
      getOpenApi(row.id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改开放接口";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updateOpenApi(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addOpenApi(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleEnable(row) {
      this.$modal.confirm('启用后接口将回到草稿状态，需重新发布才能生效，是否继续？').then(() => {
        return enableOpenApi(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("操作成功");
      }).catch(() => {});
    },
    handleDisable(row) {
      this.$modal.confirm('是否确认停用开放接口"' + row.apiCode + '"？停用后将停止新的外部调用。').then(() => {
        return disableOpenApi(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("停用成功");
      }).catch(() => {});
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除开放接口"' + row.apiCode + '"？').then(() => {
        return delOpenApi(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>
