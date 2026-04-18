<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="刷新令牌 ID" prop="refreshTokenId">
        <el-input
          v-model="queryParams.refreshTokenId"
          placeholder="请输入刷新令牌 ID"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户 ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户 ID"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="会话 ID" prop="sessionId">
        <el-input
          v-model="queryParams.sessionId"
          placeholder="请输入会话 ID"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="客户端 ID" prop="clientId">
        <el-input
          v-model="queryParams.clientId"
          placeholder="请输入客户端 ID"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="令牌状态" prop="tokenStatus">
        <el-select
          v-model="queryParams.tokenStatus"
          placeholder="请选择"
          clearable
          style="width: 120px"
        >
          <el-option label="有效" :value="1"/>
          <el-option label="已轮换" :value="2"/>
          <el-option label="已撤销" :value="3"/>
          <el-option label="已过期" :value="4"/>
        </el-select>
      </el-form-item>
      <el-form-item label="签发时间">
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
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="tokenList">
      <el-table-column label="刷新令牌 ID" prop="refreshTokenId" width="120" show-overflow-tooltip/>
      <el-table-column label="用户 ID" prop="userId" width="120" show-overflow-tooltip/>
      <el-table-column label="会话 ID" prop="sessionId" width="120" show-overflow-tooltip/>
      <el-table-column label="客户端 ID" prop="clientId" width="120" show-overflow-tooltip/>
      <el-table-column label="令牌指纹" prop="tokenFingerprint" />
      <el-table-column label="令牌状态" prop="tokenStatus" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="getTokenStatusType(scope.row.tokenStatus)">
            {{ getTokenStatusLabel(scope.row.tokenStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="签发时间" align="center" prop="issueTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.issueTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="使用时间" align="center" prop="usedTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.usedTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
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
  </div>
</template>

<script>
import { listToken, getToken, getUserTokens, getSessionTokens } from "@/api/customer/account/token";

export default {
  name: "Token",
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      tokenList: [],
      dateRange: [],
      queryParams: {
        pageNum: 1,
        pageSize: 20,
        refreshTokenId: undefined,
        userId: undefined,
        sessionId: undefined,
        clientId: undefined,
        tokenStatus: undefined
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      const params = this.addDateRange(this.queryParams, this.dateRange);
      if (params.startTime) {
        params.startTime = params.startTime + ' 00:00:00';
      }
      if (params.endTime) {
        params.endTime = params.endTime + ' 23:59:59';
      }
      listToken(params).then(response => {
        this.tokenList = response.data?.items || [];
        this.total = response.data?.total || 0;
        this.loading = false;
      });
    },
    getTokenStatusLabel(tokenStatus) {
      const statusMap = {
        1: '有效',
        2: '已轮换',
        3: '已撤销',
        4: '已过期'
      };
      return statusMap[tokenStatus] || tokenStatus;
    },
    getTokenStatusType(tokenStatus) {
      const typeMap = {
        1: 'success',
        2: 'warning',
        3: 'danger',
        4: 'info'
      };
      return typeMap[tokenStatus] || 'info';
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    }
  }
};
</script>
