<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="资源类型" prop="resourceType">
        <el-select v-model="queryParams.resourceType" placeholder="请选择资源类型" clearable style="width: 160px">
          <el-option label="调用方" value="CLIENT" />
          <el-option label="调用凭证" value="CREDENTIAL" />
          <el-option label="内部接口" value="INTERNAL_API" />
          <el-option label="开放接口" value="OPEN_API" />
          <el-option label="接口授权" value="PERMISSION" />
          <el-option label="配置版本" value="CONFIG_VERSION" />
        </el-select>
      </el-form-item>
      <el-form-item label="资源ID" prop="resourceId">
        <el-input
          v-model="queryParams.resourceId"
          placeholder="请输入资源ID"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="操作人" prop="operator">
        <el-input
          v-model="queryParams.operator"
          placeholder="请输入操作人"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="操作时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 260px"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :default-time="['00:00:00', '23:59:59']"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="auditList">
      <el-table-column label="资源类型" align="center" prop="resourceType" width="120">
        <template slot-scope="scope">
          <span>{{ resourceTypeLabel(scope.row.resourceType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="资源ID" align="center" prop="resourceId" width="100" />
      <el-table-column label="操作" align="center" prop="operation" width="90">
        <template slot-scope="scope">
          <span>{{ operationLabel(scope.row.operation) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="变更前" prop="beforeValue" :show-overflow-tooltip="true" />
      <el-table-column label="变更后" prop="afterValue" :show-overflow-tooltip="true" />
      <el-table-column label="操作人" align="center" prop="operator" width="120" />
      <el-table-column label="操作时间" align="center" prop="operatedAt" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.operatedAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="详情" align="center" width="80">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog title="审计详情" :visible.sync="open" width="700px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="资源类型">{{ resourceTypeLabel(detail.resourceType) }}</el-descriptions-item>
        <el-descriptions-item label="资源ID">{{ detail.resourceId }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ operationLabel(detail.operation) }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detail.operator }}</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">{{ parseTime(detail.operatedAt) }}</el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 16px">
        <div style="margin-bottom: 6px; font-weight: bold">变更前</div>
        <el-input type="textarea" :rows="5" :value="detail.beforeValue" readonly />
      </div>
      <div style="margin-top: 16px">
        <div style="margin-bottom: 6px; font-weight: bold">变更后</div>
        <el-input type="textarea" :rows="5" :value="detail.afterValue" readonly />
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="open = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listAudit } from "@/api/edd/opgw/audit";

export default {
  name: "OpgwAudit",
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      auditList: [],
      dateRange: [],
      open: false,
      detail: {},
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        resourceType: undefined,
        resourceId: undefined,
        operator: undefined
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    resourceTypeLabel(type) {
      return {
        CLIENT: "调用方",
        CREDENTIAL: "调用凭证",
        INTERNAL_API: "内部接口",
        OPEN_API: "开放接口",
        PERMISSION: "接口授权",
        CONFIG_VERSION: "配置版本"
      }[type] || type;
    },
    operationLabel(op) {
      return {
        INSERT: "新增",
        UPDATE: "修改",
        DELETE: "删除",
        ENABLE: "启用",
        DISABLE: "停用",
        RESET: "重置",
        PUBLISH: "发布",
        ROLLBACK: "回滚"
      }[op] || op;
    },
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      if (this.dateRange && this.dateRange.length === 2) {
        params.beginTime = this.dateRange[0];
        params.endTime = this.dateRange[1];
      }
      listAudit(params).then(response => {
        this.auditList = response.data.items;
        this.total = response.data.total;
        this.loading = false;
      });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleView(row) {
      this.detail = row;
      this.open = true;
    }
  }
};
</script>
