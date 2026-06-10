<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAddCompatiblePn"
          v-hasPermi="['ota:fota:activity:edit']"
        >查询并添加兼容零件号
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <el-table v-loading="loading" :data="list"
              @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="分类" prop="type" width="120" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.type === 1 ? '软件零件号' : '硬件零件号' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="设备" prop="deviceCode" width="100" align="center"/>
      <el-table-column label="零件号" prop="pn" width="120"/>
      <el-table-column label="兼容零件号" prop="compatiblePn"/>
      <el-table-column label="描述" prop="description" width="120"/>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleRemoveActivityCompatiblePn(scope.row)"
            v-hasPermi="['ota:fota:activity:edit']"
          >删除关联
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer title="查询并添加兼容零件号" :visible.sync="open" direction="rtl" size="80%"
               :modal="true"
               :append-to-body="true"
               @close="close">
      <div class="drawer-content">
        <el-form :model="queryParamsCompatiblePn" ref="queryFormCompatiblePn" size="small"
                 :inline="true"
                 v-show="showSearchCompatiblePn">
          <el-form-item label="零件号" prop="pn">
            <el-input
              v-model="queryParamsCompatiblePn.pn"
              placeholder="请输入零件号"
              clearable
              style="width: 140px"
              @keyup.enter.native="handleQueryCompatiblePn"
            />
          </el-form-item>
          <el-form-item label="设备" prop="deviceCode">
            <el-select
              v-model="queryParamsCompatiblePn.deviceCode"
              placeholder="设备"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="device in deviceList"
                :key="device.code"
                :label="device.code + '(' + device.label + ')'"
                :value="device.code"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQueryCompatiblePn">搜索
            </el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQueryCompatiblePn">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="mini"
              :disabled="multipleCompatiblePn"
              @click="handleAddActivityCompatiblePn"
              v-hasPermi="['ota:fota:activity:edit']"
            >关联
            </el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getListCompatiblePn"></right-toolbar>
        </el-row>

        <el-table ref="compatiblePnTable" v-loading="loadingCompatiblePn"
                  :data="compatiblePnList"
                  @selection-change="handleSelectionChangeCompatiblePn">
          <el-table-column type="selection" width="55" align="center"/>
          <el-table-column label="类型" prop="type" width="100"/>
          <el-table-column label="设备" prop="deviceCode" width="100"/>
          <el-table-column label="零件号" prop="pn" width="120"/>
          <el-table-column label="兼容零件号" prop="compatiblePn"/>
          <el-table-column label="描述" prop="description" width="150"/>
          <el-table-column label="创建时间" align="center" prop="createTime" width="180">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleAddActivityCompatiblePn(scope.row)"
                v-hasPermi="['ota:fota:activity:edit']"
              >关联
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="totalCompatiblePn>0"
          :total="totalCompatiblePn"
          :page.sync="queryParamsCompatiblePn.pageNum"
          :limit.sync="queryParamsCompatiblePn.pageSize"
          @pagination="getListCompatiblePn"
        />
        <div slot="footer" class="dialog-footer" style="text-align: center">
          <el-button @click="close">关 闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  addActivityCompatiblePn,
  delActivityCompatiblePn,
  listActivityCompatiblePn,
  regroupSoftwareBuildVersion,
} from "@/api/ota/fota/activity";
import {listCompatiblePn} from "@/api/ota/pota/compatiblepn";
import {listAllVehicleNode} from "@/api/mdm/vehicleNode";

export default {
  name: "ActivityCompatiblePn",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      loadingCompatiblePn: true,
      // 选中数组
      ids: [],
      idsCompatiblePn: [],
      // 非单个禁用
      single: true,
      singleCompatiblePn: true,
      // 非多个禁用
      multiple: true,
      multipleCompatiblePn: true,
      // 显示搜索条件
      showSearch: true,
      showSearchCompatiblePn: true,
      // 总条数
      total: 0,
      totalCompatiblePn: 0,
      list: [],
      deviceList: [],
      compatiblePnList: [],
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
      queryParamsCompatiblePn: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {},
      activityId: undefined
    };
  },
  created() {
    this.activityId = this.$route.query.id;
    this.getDeviceList();
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listActivityCompatiblePn(this.activityId).then(response => {
        this.list = response.data;
        this.loading = false;
      });
    },
    getDeviceList() {
      listAllVehicleNode().then(response => {
          this.deviceList = response.data.map(item => ({ code: item.nodeCode, label: item.name }));
        }
      );
    },
    getListCompatiblePn() {
      this.loadingCompatiblePn = true;
      listCompatiblePn(this.queryParamsCompatiblePn).then(response => {
          this.compatiblePnList = response.rows;
          this.totalCompatiblePn = response.total;
          this.loadingCompatiblePn = false;
          this.$nextTick(() => {
            this.setDefaultSelection();
          });
        }
      );
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    close() {
      this.open = false;
    },
    /** 表单重置 */
    reset() {
      this.form = {
        versionGroup: 0,
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
    resetQueryCompatiblePn() {
      this.dateRange = [];
      this.resetForm("queryFormCompatiblePn");
      this.handleQueryCompatiblePn();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.compatiblePnId)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    handleSelectionChangeCompatiblePn(selection) {
      this.idsCompatiblePn = selection.map(item => item.id)
      this.singleCompatiblePn = selection.length != 1
      this.multipleCompatiblePn = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
    },
    /** 提交按钮 */
    submitForm: function () {
      const data = [];
      this.ids.forEach(id => {
        data.push({
          id: id,
          versionGroup: this.form.versionGroup
        })
      })
      regroupSoftwareBuildVersion(this.activityId, data).then(response => {
        this.$modal.msgSuccess("修改成功");
        this.resetQuery();
        this.getList();
        this.openChangeGroup = false;
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
    },
    /** 导出按钮操作 */
    handleExport() {
    },
    handleRemoveActivityCompatiblePn(row) {
      const compatiblePnIds = row.compatiblePnId || this.ids;
      this.$modal.confirm('是否确认删除升级活动' + this.activityId + '下关联兼容零件号ID为"' + compatiblePnIds + '"的数据项？').then(() => {
        return delActivityCompatiblePn(this.activityId, compatiblePnIds);
      }).then(() => {
        this.$modal.msgSuccess("删除成功");
        this.getList();
      }).catch(() => {
      });
    },
    handleAddCompatiblePn() {
      this.open = true;
      this.getListCompatiblePn();
    },
    handleQueryCompatiblePn() {
      this.queryParamsCompatiblePn.pageNum = 1;
      this.getListCompatiblePn();
    },
    handleAddActivityCompatiblePn(row) {
      const compatiblePnIds = row.id || this.idsCompatiblePn;
      this.$modal.confirm('是否确认将兼容零件号ID为"' + compatiblePnIds + '"的数据项关联到升级活动ID' + this.activityId + '？').then(() => {
        return addActivityCompatiblePn(this.activityId, compatiblePnIds);
      }).then(() => {
        this.$modal.msgSuccess("关联成功");
        this.close();
        this.getList();
      }).catch(() => {
      });
    },
    setDefaultSelection() {
      const linkedIds = this.list.map(item => item.compatiblePnId);
      const selectedRows = this.compatiblePnList.filter(item =>
        linkedIds.includes(item.id)
      );
      this.$refs.compatiblePnTable.clearSelection();
      this.$nextTick(() => {
        selectedRows.forEach(row => {
          this.$refs.compatiblePnTable.toggleRowSelection(row, true);
        });
      });
    },
  }
};
</script>
<style>
.message-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.message-cell:hover {
  cursor: pointer;
}

.my-tooltip {
  max-width: 400px !important;
  white-space: normal !important;
  word-break: break-word !important;
}

.drawer-content {
  padding: 20px;
  font-size: 14px;
  color: #606266;
}

.drawer-title {
  font-size: 16px;
  font-weight: bolder;
  margin-top: 20px;
  margin-bottom: 20px;
}

.drawer-row {
  margin-bottom: 15px;
}
</style>
