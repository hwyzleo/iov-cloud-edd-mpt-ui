<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="设备ID" prop="deviceId">
        <el-input
          v-model="queryParams.deviceId"
          placeholder="请输入设备ID"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="客户端ID" prop="clientId">
        <el-input
          v-model="queryParams.clientId"
          placeholder="请输入客户端ID"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备名称" prop="deviceName">
        <el-input
          v-model="queryParams.deviceName"
          placeholder="请输入设备名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备系统" prop="deviceOs">
        <el-input
          v-model="queryParams.deviceOs"
          placeholder="请输入设备系统"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备状态" prop="deviceStatus">
        <el-select
          v-model="queryParams.deviceStatus"
          placeholder="请选择"
          clearable
          style="width: 120px"
        >
          <el-option
            v-for="dict in dict.type.device_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否可信" prop="trustedFlag">
        <el-select
          v-model="queryParams.trustedFlag"
          placeholder="请选择"
          clearable
          style="width: 120px"
        >
          <el-option label="是" :value="true"/>
          <el-option label="否" :value="false"/>
        </el-select>
      </el-form-item>
      <el-form-item label="语言" prop="language">
        <el-select
          v-model="queryParams.language"
          placeholder="请选择语言"
          clearable
          style="width: 150px"
        >
          <el-option label="简体中文" value="zh"/>
          <el-option label="英语" value="en"/>
        </el-select>
      </el-form-item>
      <el-form-item label="首次登录时间">
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

    <el-table v-loading="loading" :data="deviceList">
      <el-table-column label="设备ID" prop="deviceId"  width="150" show-overflow-tooltip/>
      <el-table-column label="用户ID" prop="userId"  width="150" show-overflow-tooltip/>
      <el-table-column label="客户端ID" prop="clientId"  width="150" show-overflow-tooltip/>
      <el-table-column label="设备名称" prop="deviceName"/>
      <el-table-column label="设备系统" prop="deviceOs" width="80" align="center"/>
      <el-table-column label="设备状态" prop="deviceStatus" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.deviceStatus === 1 ? 'success' : 'info'">
            {{ scope.row.deviceStatus === 1 ? '正常' : '异常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="是否可信" prop="trustedFlag" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.trustedFlag === 1 ? 'success' : 'info'">
            {{ scope.row.trustedFlag === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="语言" prop="language" width="100" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.language === 'zh' ? '简体中文' : scope.row.language === 'en' ? '英语' : scope.row.language }}</span>
        </template>
      </el-table-column>
      <el-table-column label="首次登录时间" align="center" prop="firstLoginTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.firstLoginTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后登录时间" align="center" prop="lastLoginTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.lastLoginTime) }}</span>
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
import { listDevice, getDevice, getUserDevices } from "@/api/customer/account/device";

export default {
  name: "Device",
  dicts: [],
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      deviceList: [],
      dateRange: [],
      queryParams: {
        pageNum: 1,
        pageSize: 20,
        deviceId: undefined,
        userId: undefined,
        clientId: undefined,
        deviceName: undefined,
        deviceOs: undefined,
        deviceStatus: undefined,
        trustedFlag: undefined,
        language: undefined
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
      // 时间范围参数转换
      if (params.startTime) {
        params.startTime = params.startTime + ' 00:00:00';
      }
      if (params.endTime) {
        params.endTime = params.endTime + ' 23:59:59';
      }
      // 数值参数转换
      if (params.deviceStatus !== undefined && params.deviceStatus !== '') {
        params.deviceStatus = Number(params.deviceStatus);
      }
      if (params.trustedFlag !== undefined && params.trustedFlag !== '') {
        params.trustedFlag = Number(params.trustedFlag);
      }
      listDevice(params).then(response => {
        this.deviceList = response.data?.items || [];
        this.total = response.data?.total || 0;
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
    }
  }
};
</script>
