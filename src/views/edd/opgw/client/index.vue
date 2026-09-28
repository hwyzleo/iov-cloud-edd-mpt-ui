<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="调用方编码" prop="clientCode">
        <el-input
          v-model="queryParams.clientCode"
          placeholder="请输入调用方编码"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="调用方名称" prop="clientName">
        <el-input
          v-model="queryParams.clientName"
          placeholder="请输入调用方名称"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 160px">
          <el-option label="启用" value="ENABLED" />
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
          v-hasPermi="['edd:opgw:client:add']"
        >新增</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="clientList">
      <el-table-column label="调用方编码" prop="clientCode" :show-overflow-tooltip="true" width="150" />
      <el-table-column label="调用方名称" prop="clientName" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'danger'">
            {{ scope.row.status === 'ENABLED' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="描述" prop="description" :show-overflow-tooltip="true" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="320">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edd:opgw:client:edit']"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'DISABLED'"
            size="mini"
            type="text"
            icon="el-icon-open"
            @click="handleEnable(scope.row)"
            v-hasPermi="['edd:opgw:client:edit']"
          >启用</el-button>
          <el-button
            v-if="scope.row.status === 'ENABLED'"
            size="mini"
            type="text"
            icon="el-icon-turn-off"
            @click="handleDisable(scope.row)"
            v-hasPermi="['edd:opgw:client:edit']"
          >停用</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-key"
            @click="handleCredential(scope.row)"
            v-hasPermi="['edd:opgw:credential:list']"
          >凭证</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-s-check"
            @click="handlePermission(scope.row)"
            v-hasPermi="['edd:opgw:permission:list']"
          >授权</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edd:opgw:client:remove']"
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

    <!-- 添加或修改调用方对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="调用方编码" prop="clientCode">
          <el-input v-model="form.clientCode" placeholder="请输入调用方编码" :disabled="form.id != undefined" />
        </el-form-item>
        <el-form-item label="调用方名称" prop="clientName">
          <el-input v-model="form.clientName" placeholder="请输入调用方名称" />
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

    <!-- 凭证管理对话框 -->
    <el-dialog :title="'调用方[' + currentClientCode + ']凭证管理'" :visible.sync="credentialOpen" width="900px" append-to-body>
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="el-icon-plus"
            size="mini"
            @click="handleAddCredential"
            v-hasPermi="['edd:opgw:credential:add']"
          >创建凭证</el-button>
        </el-col>
      </el-row>
      <el-table v-loading="credentialLoading" :data="credentialList">
        <el-table-column label="AccessKey" prop="accessKey" :show-overflow-tooltip="true" />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'danger'">
              {{ scope.row.status === 'ENABLED' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" align="center" prop="expireAt" width="160">
          <template slot-scope="scope">
            <span>{{ scope.row.expireAt ? parseTime(scope.row.expireAt) : '永不过期' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最近使用" align="center" prop="lastUsedAt" width="160">
          <template slot-scope="scope">
            <span>{{ scope.row.lastUsedAt ? parseTime(scope.row.lastUsedAt) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="160">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.status === 'ENABLED'"
              size="mini"
              type="text"
              icon="el-icon-refresh"
              @click="handleResetCredential(scope.row)"
              v-hasPermi="['edd:opgw:credential:reset']"
            >重置</el-button>
            <el-button
              v-if="scope.row.status === 'ENABLED'"
              size="mini"
              type="text"
              icon="el-icon-turn-off"
              @click="handleDisableCredential(scope.row)"
              v-hasPermi="['edd:opgw:credential:remove']"
            >停用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 凭证密钥展示对话框（仅展示一次） -->
    <el-dialog title="凭证密钥（仅展示一次，请立即安全保存）" :visible.sync="secretOpen" width="560px" append-to-body :close-on-click-modal="false">
      <el-alert
        title="密钥仅在此展示一次，关闭后将无法再次查看，请务必立即复制保存。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />
      <el-form label-width="100px">
        <el-form-item label="AccessKey">
          <el-input v-model="secretResult.accessKey" readonly />
        </el-form-item>
        <el-form-item label="Secret">
          <el-input v-model="secretResult.secret" type="textarea" :rows="3" readonly />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="secretOpen = false">我已保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listClient, getClient, addClient, updateClient, enableClient, disableClient, delClient } from "@/api/edd/opgw/client";
import { listCredential, addCredential, resetCredential, disableCredential } from "@/api/edd/opgw/credential";

export default {
  name: "OpgwClient",
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      clientList: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        clientCode: undefined,
        clientName: undefined,
        status: undefined
      },
      form: {},
      rules: {
        clientCode: [
          { required: true, message: "调用方编码不能为空", trigger: "blur" }
        ],
        clientName: [
          { required: true, message: "调用方名称不能为空", trigger: "blur" }
        ]
      },
      // 凭证管理
      credentialOpen: false,
      credentialLoading: false,
      credentialList: [],
      currentClientId: undefined,
      currentClientCode: "",
      // 密钥展示
      secretOpen: false,
      secretResult: {}
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listClient(this.queryParams).then(response => {
        this.clientList = response.data.items;
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
        clientCode: undefined,
        clientName: undefined,
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
      this.title = "添加调用方";
    },
    handleUpdate(row) {
      this.reset();
      getClient(row.id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改调用方";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updateClient(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addClient(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleEnable(row) {
      this.$modal.confirm('是否确认启用调用方"' + row.clientName + '"？').then(() => {
        return enableClient(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("启用成功");
      }).catch(() => {});
    },
    handleDisable(row) {
      this.$modal.confirm('是否确认停用调用方"' + row.clientName + '"？').then(() => {
        return disableClient(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("停用成功");
      }).catch(() => {});
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除调用方"' + row.clientName + '"？').then(() => {
        return delClient(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handlePermission(row) {
      this.$router.push({
        path: "/edd/opgw/permission/index",
        query: { clientId: row.id }
      });
    },
    // 凭证管理
    handleCredential(row) {
      this.currentClientId = row.id;
      this.currentClientCode = row.clientCode;
      this.credentialOpen = true;
      this.getCredentialList();
    },
    getCredentialList() {
      this.credentialLoading = true;
      listCredential(this.currentClientId).then(response => {
        this.credentialList = response.data;
        this.credentialLoading = false;
      });
    },
    handleAddCredential() {
      addCredential({ clientId: this.currentClientId }).then(response => {
        this.secretResult = response.data;
        this.secretOpen = true;
        this.getCredentialList();
      });
    },
    handleResetCredential(row) {
      this.$modal.confirm('重置后旧密钥将立即失效，是否确认重置该凭证？').then(() => {
        return resetCredential(row.id);
      }).then(response => {
        this.secretResult = response.data;
        this.secretOpen = true;
        this.getCredentialList();
      }).catch(() => {});
    },
    handleDisableCredential(row) {
      this.$modal.confirm('是否确认停用该凭证？停用后将无法用于调用。').then(() => {
        return disableCredential(row.id);
      }).then(() => {
        this.getCredentialList();
        this.$modal.msgSuccess("停用成功");
      }).catch(() => {});
    }
  }
};
</script>
