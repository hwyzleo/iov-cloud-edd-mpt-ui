<template>
  <div class="app-container">
    <el-card shadow="never" style="margin-bottom: 16px">
      <div slot="header" class="clearfix">
        <span>当前生效版本</span>
        <el-button
          style="float: right; padding: 3px 0"
          type="text"
          icon="el-icon-refresh"
          @click="loadData"
        >刷新</el-button>
      </div>
      <el-descriptions v-if="current" :column="3" border>
        <el-descriptions-item label="版本号">{{ current.version }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(current.status)">{{ statusLabel(current.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布人">{{ current.publishedBy }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ parseTime(current.publishedAt) }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ current.description }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无生效版本" :image-size="80" />
    </el-card>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-upload2"
          size="mini"
          @click="handlePublish"
          v-hasPermi="['edd:opgw:publish:publish']"
        >发布新版本</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="versionList">
      <el-table-column label="版本号" align="center" prop="version" width="100" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布人" align="center" prop="publishedBy" width="140" />
      <el-table-column label="发布时间" align="center" prop="publishedAt" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.publishedAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="失败原因" prop="failureReason" :show-overflow-tooltip="true" />
      <el-table-column label="描述" prop="description" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            v-if="current && scope.row.version !== current.version"
            size="mini"
            type="text"
            icon="el-icon-refresh-left"
            @click="handleRollback(scope.row)"
            v-hasPermi="['edd:opgw:publish:rollback']"
          >回滚</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { publishConfig, getCurrentVersion, listVersion, rollbackConfig } from "@/api/edd/opgw/publish";

export default {
  name: "OpgwPublish",
  data() {
    return {
      loading: true,
      versionList: [],
      current: null
    };
  },
  created() {
    this.loadData();
  },
  methods: {
    statusLabel(status) {
      return { PUBLISHED: "已发布", ROLLED_BACK: "已回滚" }[status] || status;
    },
    statusTagType(status) {
      return { PUBLISHED: "success", ROLLED_BACK: "info" }[status] || "info";
    },
    loadData() {
      this.loading = true;
      getCurrentVersion().then(response => {
        this.current = response.data;
      });
      listVersion().then(response => {
        this.versionList = response.data;
        this.loading = false;
      });
    },
    handlePublish() {
      this.$modal.confirm('是否确认发布新版本？发布后将根据当前配置生成新的运行时版本并生效。').then(() => {
        return publishConfig();
      }).then(response => {
        this.$modal.msgSuccess("发布成功，版本号：" + response.data);
        this.loadData();
      }).catch(() => {});
    },
    handleRollback(row) {
      this.$modal.confirm('是否确认回滚到版本"' + row.version + '"？').then(() => {
        return rollbackConfig(row.version);
      }).then(response => {
        this.$modal.msgSuccess("回滚成功，当前版本号：" + response.data);
        this.loadData();
      }).catch(() => {});
    }
  }
};
</script>
