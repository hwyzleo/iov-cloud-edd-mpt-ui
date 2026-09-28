<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="调用方" prop="clientId">
        <el-select v-model="queryParams.clientId" placeholder="请选择调用方" filterable clearable style="width: 220px">
          <el-option
            v-for="item in clientOptions"
            :key="item.id"
            :label="item.clientName + '（' + item.clientCode + '）'"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="开放接口" prop="openApiId">
        <el-select v-model="queryParams.openApiId" placeholder="请选择开放接口" filterable clearable style="width: 220px">
          <el-option
            v-for="item in openApiOptions"
            :key="item.id"
            :label="item.apiName + '（' + item.apiCode + '）'"
            :value="item.id"
          />
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
          @click="handleGrant"
          v-hasPermi="['edd:opgw:permission:add']"
        >授权</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="permissionList">
      <el-table-column label="调用方编码" prop="clientCode" :show-overflow-tooltip="true" width="150" />
      <el-table-column label="开放接口编码" prop="openApiCode" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'danger'">
            {{ scope.row.status === 'ENABLED' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleRevoke(scope.row)"
            v-hasPermi="['edd:opgw:permission:remove']"
          >撤销</el-button>
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

    <!-- 授权对话框 -->
    <el-dialog title="授予接口权限" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="调用方" prop="clientId">
          <el-select v-model="form.clientId" placeholder="请选择调用方" filterable style="width: 100%">
            <el-option
              v-for="item in clientOptions"
              :key="item.id"
              :label="item.clientName + '（' + item.clientCode + '）'"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开放接口" prop="openApiId">
          <el-select v-model="form.openApiId" placeholder="请选择开放接口" filterable style="width: 100%">
            <el-option
              v-for="item in openApiOptions"
              :key="item.id"
              :label="item.apiName + '（' + item.apiCode + '）'"
              :value="item.id"
            />
          </el-select>
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
import { listPermission, grantPermission, revokePermission } from "@/api/edd/opgw/permission";
import { listClient } from "@/api/edd/opgw/client";
import { listOpenApi } from "@/api/edd/opgw/openApi";

export default {
  name: "OpgwPermission",
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      permissionList: [],
      clientOptions: [],
      openApiOptions: [],
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        clientId: undefined,
        openApiId: undefined
      },
      form: {},
      rules: {
        clientId: [
          { required: true, message: "调用方不能为空", trigger: "change" }
        ],
        openApiId: [
          { required: true, message: "开放接口不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    const clientId = this.$route.query.clientId;
    if (clientId) {
      this.queryParams.clientId = Number(clientId);
    }
    this.loadOptions();
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listPermission(this.queryParams).then(response => {
        this.permissionList = response.data.items;
        this.total = response.data.total;
        this.loading = false;
      });
    },
    loadOptions() {
      listClient({ pageNum: 1, pageSize: 1000 }).then(response => {
        this.clientOptions = response.data.items;
      });
      listOpenApi({ pageNum: 1, pageSize: 1000 }).then(response => {
        this.openApiOptions = response.data.items;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        clientId: undefined,
        openApiId: undefined
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.clientId = undefined;
      this.queryParams.openApiId = undefined;
      this.handleQuery();
    },
    handleGrant() {
      this.reset();
      if (this.queryParams.clientId) {
        this.form.clientId = this.queryParams.clientId;
      }
      this.open = true;
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          grantPermission(this.form).then(() => {
            this.$modal.msgSuccess("授权成功");
            this.open = false;
            this.getList();
          });
        }
      });
    },
    handleRevoke(row) {
      this.$modal.confirm('是否确认撤销调用方"' + row.clientCode + '"对开放接口"' + row.openApiCode + '"的授权？').then(() => {
        return revokePermission(row.clientId, row.openApiId);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("撤销成功");
      }).catch(() => {});
    }
  }
};
</script>
