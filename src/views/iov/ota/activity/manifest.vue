<template>
  <div class="app-container">
    <el-page-header @back="goBack" content="型批版本组合快照"/>
    <el-divider/>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="快照编码" prop="manifestCode" width="180"/>
      <el-table-column label="SWIN编码" prop="swinCode" width="150"/>
      <el-table-column label="RXSWIN值" prop="rxswinValue" min-width="170"/>
      <el-table-column label="快照状态" prop="manifestStatus" width="120" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.manifestStatus === 'APPROVED' ? 'success' : 'info'" size="small">
            {{ scope.row.manifestStatus === 'APPROVED' ? '已批准' : scope.row.manifestStatus }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="批准时间" align="center" prop="approveTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.approveTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
          >查看明细
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="快照明细" :visible.sync="open" width="700px" append-to-body>
      <el-table v-loading="loadingDetail" :data="detailList">
        <el-table-column label="车辆节点编码" prop="vehicleNodeCode" width="200"/>
        <el-table-column label="零件编码" prop="partCode" width="200"/>
        <el-table-column label="批准版本" prop="approvedVersion"/>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="open = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listManifest,
  getManifest
} from "@/api/iov/ota/activity";

export default {
  name: "ActivityManifest",
  data() {
    return {
      loading: true,
      loadingDetail: false,
      list: [],
      detailList: [],
      open: false,
      activityId: undefined
    };
  },
  created() {
    this.activityId = this.$route.query.id;
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listManifest(this.activityId).then(response => {
        this.list = response.data;
        this.loading = false;
      });
    },
    goBack() {
      this.$router.back();
    },
    handleDetail(row) {
      this.loadingDetail = true;
      this.open = true;
      getManifest(this.activityId, row.id).then(response => {
        this.detailList = response.data.items || [];
        this.loadingDetail = false;
      }).catch(() => {
        this.loadingDetail = false;
      });
    }
  }
};
</script>
