<template>
  <div class="app-container">
    <el-page-header @back="goBack" content="升级对象管理"/>
    <el-divider/>

    <!-- 操作栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5" v-if="!isBaseline">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['ota:fota:activity:edit']"
        >新增升级对象
        </el-button>
      </el-col>
      <el-col :span="3">
        <el-select
          v-model="currentGroup"
          placeholder="选择分组"
          size="mini"
          @change="handleGroupChange"
          style="width: 130px"
        >
          <el-option
            v-for="g in groups"
            :key="g"
            :label="'分组 ' + g"
            :value="g"
          />
        </el-select>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="multiple"
          @click="handleBatchGroup"
          v-hasPermi="['ota:fota:activity:edit']"
        >批量设置分组
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-setting"
          size="mini"
          :disabled="currentGroup == null"
          @click="handleOpenGroupPolicyDrawer"
          v-hasPermi="['ota:fota:activity:edit']"
        >组策略维护
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 升级对象表格 -->
    <el-table
      ref="upgradeTargetTable"
      v-loading="loading"
      :data="list"
      @selection-change="handleSelectionChange"
      border
      size="small"
      row-key="id"
    >
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="序号" type="index" width="60" align="center"/>
      <el-table-column label="车辆节点/ECU" prop="vehicleNodeCode" width="130" align="center"/>
      <el-table-column label="软件零件号" prop="partCode" width="130" align="center"/>
      <el-table-column label="目标软件版本" prop="softwareBuildVersionId" min-width="180">
        <template slot-scope="scope">
          <el-select
            v-model="scope.row.softwareBuildVersionId"
            placeholder="请选择目标版本"
            filterable
            clearable
            size="mini"
            @change="handleVersionChange(scope.row)"
            :disabled="!canEditVersion(scope.row)"
            style="width: 100%"
          >
            <el-option
              v-for="item in getVersionOptions(scope.row)"
              :key="item.id"
              :label="item.softwarePn + ' - ' + item.softwareBuildVer"
              :value="item.id"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="关键版本" prop="critical" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.critical ? 'danger' : 'info'" size="small">
            {{ scope.row.critical ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="强制升级" prop="forceUpgrade" width="80" align="center">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.forceUpgrade"
            @change="handleForceUpgradeChange(scope.row)"
            size="mini"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['ota:fota:activity:edit']"
            v-if="!isBaseline"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增升级对象对话框（非基线活动） -->
    <el-dialog title="新增升级对象" :visible.sync="openAddDialog" width="800px" append-to-body>
      <el-form :model="addQueryParams" ref="addQueryForm" size="small" :inline="true">
        <el-form-item label="软件零件号" prop="softwarePn">
          <el-input
            v-model="addQueryParams.softwarePn"
            placeholder="请输入软件零件号"
            clearable
            style="width: 150px"
            @keyup.enter.native="handleQuerySoftwareBuildVersion"
          />
        </el-form-item>
        <el-form-item label="设备" prop="deviceCode">
          <el-select
            v-model="addQueryParams.deviceCode"
            placeholder="设备"
            clearable
            style="width: 150px"
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
          <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuerySoftwareBuildVersion">搜索
          </el-button>
          <el-button icon="el-icon-refresh" size="mini" @click="resetQuerySoftwareBuildVersion">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        ref="softwareBuildVersionTable"
        v-loading="loadingSoftwareBuildVersion"
        :data="softwareBuildVersionList"
        @selection-change="handleSelectionChangeSoftwareBuildVersion"
        size="small"
      >
        <el-table-column type="selection" width="55" align="center"/>
        <el-table-column label="设备" prop="deviceCode" width="80"/>
        <el-table-column label="软件零件号" prop="softwarePn" min-width="120"/>
        <el-table-column label="软件内部版本" prop="softwareBuildVer" width="110"/>
        <el-table-column label="软件来源" prop="softwareSource" width="80" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.softwareSource === 1 ? 'BOM' : 'OTA' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="totalSoftwareBuildVersion > 0"
        :total="totalSoftwareBuildVersion"
        :page.sync="addQueryParams.pageNum"
        :limit.sync="addQueryParams.pageSize"
        @pagination="getListSoftwareBuildVersion"
      />

      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleConfirmAdd">确 定</el-button>
        <el-button @click="openAddDialog = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 批量设置分组对话框 -->
    <el-dialog title="批量设置分组" :visible.sync="openBatchGroupDialog" width="400px" append-to-body>
      <el-form ref="batchGroupForm" :model="batchGroupForm" label-width="80px">
        <el-form-item label="分组号" prop="groupNo">
          <el-input-number v-model="batchGroupForm.groupNo" :min="0" controls-position="right"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleConfirmBatchGroup">确 定</el-button>
        <el-button @click="openBatchGroupDialog = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 组策略维护抽屉 -->
    <el-drawer
      title="组策略维护"
      :visible.sync="openGroupPolicyDrawer"
      direction="rtl"
      size="50%"
      :modal="true"
      :append-to-body="true"
    >
      <div class="drawer-content">
        <el-alert
          :title="'当前分组: ' + currentGroup"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 15px"
        />

        <el-form ref="groupPolicyForm" :model="groupPolicyForm" :rules="groupPolicyRules" label-width="120px">
          <el-form-item label="同升同降" prop="rollbackTogether">
            <el-switch v-model="groupPolicyForm.rollbackTogether"/>
            <span class="form-item-tip">组内成员一起回滚</span>
          </el-form-item>
          <el-form-item label="原子激活" prop="atomicActivation">
            <el-switch v-model="groupPolicyForm.atomicActivation"/>
            <span class="form-item-tip">全组下载完统一激活</span>
          </el-form-item>
          <el-form-item label="统一重启" prop="unifiedReboot">
            <el-switch v-model="groupPolicyForm.unifiedReboot"/>
            <span class="form-item-tip">共享一次整车重启生效</span>
          </el-form-item>
          <el-form-item label="失败处理" prop="failurePolicy">
            <el-select v-model="groupPolicyForm.failurePolicy" style="width: 100%">
              <el-option label="全组回滚" :value="0"/>
              <el-option label="保持旧版" :value="1"/>
              <el-option label="重试后回滚" :value="2"/>
            </el-select>
          </el-form-item>
          <el-form-item
            label="失败阈值"
            prop="failThreshold"
            v-if="groupPolicyForm.failurePolicy === 2"
          >
            <el-input-number v-model="groupPolicyForm.failThreshold" :min="1" :max="10" controls-position="right"/>
            <span class="form-item-tip">重试次数</span>
          </el-form-item>
          <el-form-item label="备注" prop="description">
            <el-input v-model="groupPolicyForm.description" type="textarea" placeholder="请输入备注"/>
          </el-form-item>
        </el-form>

        <div class="drawer-footer">
          <el-button type="primary" @click="handleSaveGroupPolicy">保 存</el-button>
          <el-button type="danger" @click="handleDeleteGroupPolicy" v-if="groupPolicyForm.id">删 除</el-button>
          <el-button @click="openGroupPolicyDrawer = false">关 闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  getActivity,
  listUpgradeTarget,
  addUpgradeTarget,
  removeUpgradeTarget,
  regroupUpgradeTarget,
  resortUpgradeTarget,
  editUpgradeTarget,
  listGroupPolicy,
  saveGroupPolicy,
  deleteGroupPolicy
} from "@/api/iov/ota/activity";
import {listSoftwareBuildVersion} from "@/api/iov/ota/softwarebuildversion";
import {listAllVehicleNode} from "@/api/mdm/vehicleNode";
import Sortable from 'sortablejs';

export default {
  name: "ActivityUpgradeTarget",
  data() {
    return {
      loading: true,
      loadingSoftwareBuildVersion: true,
      list: [],
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      activityId: undefined,
      isBaseline: false,

      // 新增对话框
      openAddDialog: false,
      addQueryParams: {
        pageNum: 1,
        pageSize: 10,
        softwarePn: undefined,
        deviceCode: undefined
      },
      softwareBuildVersionList: [],
      totalSoftwareBuildVersion: 0,
      selectedSoftwareBuildVersionIds: [],
      deviceList: [],
      allSoftwareBuildVersions: [],

      // 批量设置分组
      openBatchGroupDialog: false,
      batchGroupForm: {
        groupNo: 0
      },

      // 组策略
      openGroupPolicyDrawer: false,
      groupPolicyForm: {
        id: undefined,
        activityId: undefined,
        groupNo: 0,
        rollbackTogether: true,
        atomicActivation: false,
        unifiedReboot: false,
        failurePolicy: 0,
        failThreshold: undefined,
        description: undefined
      },
      groupPolicyRules: {
        failurePolicy: [
          {required: true, message: "请选择失败处理策略", trigger: "change"}
        ]
      },

      // 版本选项缓存
      versionOptionsCache: {}
    };
  },
  created() {
    this.activityId = this.$route.query.id;
    this.getActivityInfo();
    this.getList();
    this.loadDeviceList();
    this.loadAllSoftwareBuildVersions();
  },
  mounted() {
    this.$nextTick(() => {
      this.initSortable();
    });
  },
  methods: {
    // 初始化拖拽排序
    initSortable() {
      const el = this.$refs.upgradeTargetTable.$el.querySelector('.el-table__body-wrapper tbody');
      if (!el) return;
      
      Sortable.create(el, {
        animation: 150,
        handle: '.el-table__row',
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex === newIndex) return;
          
          // 更新数组顺序
          const movedItem = this.list.splice(oldIndex, 1)[0];
          this.list.splice(newIndex, 0, movedItem);
          
          // 构建排序数据
          const data = this.list.map((item, index) => ({
            id: item.id,
            installSeq: index + 1
          }));
          
          // 调用重排序接口
          resortUpgradeTarget(this.activityId, data).then(response => {
            this.$modal.msgSuccess("排序成功");
          });
        }
      });
    },
    // 获取活动信息
    getActivityInfo() {
      getActivity(this.activityId).then(response => {
        this.isBaseline = response.data.baseline;
      });
    },

    // 获取升级对象列表
    getList() {
      this.loading = true;
      listUpgradeTarget(this.activityId, this.currentGroup).then(response => {
        this.list = response.data.list || [];
        this.groups = response.data.groups || [];
        // 如果没有设置当前组，使用后端返回的组
        if (this.currentGroup == null) {
          this.currentGroup = response.data.group;
        }
        this.loading = false;
      });
    },

    // 获取设备列表
    loadDeviceList() {
      listAllVehicleNode().then(response => {
        this.deviceList = response.data.map(item => ({ code: item.nodeCode, label: item.name }));
      });
    },

    // 加载所有软件版本（用于主表格下拉框）
    loadAllSoftwareBuildVersions() {
      listSoftwareBuildVersion({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.allSoftwareBuildVersions = response.data.items || [];
      });
    },

    // 获取版本选项（按车辆节点过滤）
    getVersionOptions(row) {
      if (row.vehicleNodeCode) {
        return this.allSoftwareBuildVersions.filter(item => item.deviceCode === row.vehicleNodeCode);
      }
      return this.allSoftwareBuildVersions;
    },

    // 返回
    goBack() {
      this.$router.back();
    },

    // 切换分组
    handleGroupChange(group) {
      this.currentGroup = group;
      this.getList();
    },

    // 选择变更
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },

    // 版本变更
    handleVersionChange(row) {
      const data = [{
        id: row.id,
        softwareBuildVersionId: row.softwareBuildVersionId
      }];
      editUpgradeTarget(this.activityId, data).then(response => {
        this.$modal.msgSuccess("版本更新成功");
      });
    },

    // 强制升级变更
    handleForceUpgradeChange(row) {
      const data = [{
        id: row.id,
        forceUpgrade: row.forceUpgrade
      }];
      editUpgradeTarget(this.activityId, data).then(response => {
        this.$modal.msgSuccess("更新成功");
      });
    },

    // 是否可编辑版本
    canEditVersion(row) {
      // 基线活动需要有vehicleNodeCode才能选版本
      if (this.isBaseline) {
        return !!row.vehicleNodeCode;
      }
      return true;
    },

    // 新增（非基线活动）
    handleAdd() {
      this.openAddDialog = true;
      this.getListSoftwareBuildVersion();
    },

    // 查询软件版本
    handleQuerySoftwareBuildVersion() {
      this.addQueryParams.pageNum = 1;
      this.getListSoftwareBuildVersion();
    },

    resetQuerySoftwareBuildVersion() {
      this.addQueryParams = {
        pageNum: 1,
        pageSize: 10,
        softwarePn: undefined,
        deviceCode: undefined
      };
      this.handleQuerySoftwareBuildVersion();
    },

    getListSoftwareBuildVersion() {
      this.loadingSoftwareBuildVersion = true;
      listSoftwareBuildVersion(this.addQueryParams).then(response => {
        this.softwareBuildVersionList = response.data.items;
        this.totalSoftwareBuildVersion = response.data.total;
        this.loadingSoftwareBuildVersion = false;
      });
    },

    handleSelectionChangeSoftwareBuildVersion(selection) {
      this.selectedSoftwareBuildVersionIds = selection.map(item => item.id);
    },

    // 确认新增
    handleConfirmAdd() {
      if (this.selectedSoftwareBuildVersionIds.length === 0) {
        this.$modal.msgWarning("请选择要关联的软件版本");
        return;
      }

      addUpgradeTarget(this.activityId, this.selectedSoftwareBuildVersionIds).then(response => {
        this.$modal.msgSuccess("新增成功");
        this.openAddDialog = false;
        this.getList();
      });
    },

    // 删除
    handleDelete(row) {
      this.$modal.confirm('是否确认删除该升级对象？').then(() => {
        return removeUpgradeTarget(this.activityId, row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },

    // 批量设置分组
    handleBatchGroup() {
      this.batchGroupForm.groupNo = 0;
      this.openBatchGroupDialog = true;
    },

    handleConfirmBatchGroup() {
      const data = this.ids.map(id => ({
        id: id,
        groupNo: this.batchGroupForm.groupNo
      }));

      regroupUpgradeTarget(this.activityId, data).then(response => {
        this.$modal.msgSuccess("分组设置成功");
        this.openBatchGroupDialog = false;
        this.getList();
      });
    },

    // 组策略维护
    handleOpenGroupPolicyDrawer() {
      if (this.currentGroup == null) {
        this.$modal.msgWarning("请先选择一个分组");
        return;
      }

      this.loadGroupPolicy();
      this.openGroupPolicyDrawer = true;
    },

    loadGroupPolicy() {
      listGroupPolicy(this.activityId).then(response => {
        const policies = response.data || [];
        const policy = policies.find(p => p.groupNo === this.currentGroup);
        if (policy) {
          this.groupPolicyForm = policy;
        } else {
          this.resetGroupPolicyForm();
        }
      });
    },

    resetGroupPolicyForm() {
      this.groupPolicyForm = {
        id: undefined,
        activityId: this.activityId,
        groupNo: this.currentGroup,
        rollbackTogether: true,
        atomicActivation: false,
        unifiedReboot: false,
        failurePolicy: 0,
        failThreshold: undefined,
        description: undefined
      };
    },

    handleSaveGroupPolicy() {
      this.$refs["groupPolicyForm"].validate(valid => {
        if (valid) {
          saveGroupPolicy(this.activityId, this.groupPolicyForm).then(response => {
            this.$modal.msgSuccess("保存成功");
            this.loadGroupPolicy();
          });
        }
      });
    },

    handleDeleteGroupPolicy() {
      this.$modal.confirm('是否确认删除该组策略？').then(() => {
        return deleteGroupPolicy(this.activityId, this.groupPolicyForm.id);
      }).then(() => {
        this.$modal.msgSuccess("删除成功");
        this.resetGroupPolicyForm();
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.drawer-content {
  padding: 20px;
}

.drawer-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e8e8e8;
}

.form-item-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>
