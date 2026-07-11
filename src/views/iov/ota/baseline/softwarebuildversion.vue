<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm"
             size="small" :inline="true" v-show="showSearch">
      <el-form-item label="软件零件号" prop="softwarePn">
        <el-input
          v-model="queryParams.softwarePn"
          placeholder="请输入软件零件号"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备" prop="deviceCode">
        <el-select
          v-model="queryParams.deviceCode"
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
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">
          搜索
        </el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAddSoftwareBuildVersion"
          v-hasPermi="['ota:baseline:baseline:edit']"
        >查询并添加软件内部版本
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleRemoveBaselineSoftwareBuildVersion"
          v-hasPermi="['ota:baseline:baseline:remove']"
        >删除关联
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <el-table v-loading="loading" :data="list" :key="tableKey" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="排序" prop="sort" width="60" align="center">
        <template slot-scope="scope">
          <i class="el-icon-rank" style="cursor: move; margin-right: 5px;"></i>
        </template>
      </el-table-column>
      <el-table-column label="软件零件号" prop="softwarePn" width="120">
        <template slot-scope="scope">
          <span>{{ scope.row.softwarePn + scope.row.softwarePartVer }}</span>
        </template>
      </el-table-column>
      <el-table-column label="软件内部版本" prop="softwareBuildVer" width="120"/>
      <el-table-column label="设备" prop="deviceCode" width="80"/>
      <el-table-column label="是否关键" prop="critical" width="100" align="center">
        <template slot-scope="scope">
          <el-select
            v-model="scope.row.critical"
            placeholder="请选择"
            size="mini"
            @change="handleCriticalChange(scope.row)"
          >
            <el-option label="是" :value="true"></el-option>
            <el-option label="否" :value="false"></el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="是否支持OTA" prop="ota" width="110" align="center">
        <template slot-scope="scope">
          <el-select
            v-model="scope.row.ota"
            placeholder="请选择"
            size="mini"
            @change="handleOtaChange(scope.row)"
          >
            <el-option label="支持" :value="true"></el-option>
            <el-option label="不支持" :value="false"></el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="软件零件名称" prop="softwarePartName"/>
      <el-table-column label="测试报告" prop="softwareReport" width="80" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.softwareReport && scope.row.softwareReport.trim() ? '已上传' : '未上传' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="软件来源" prop="softwareSource" width="80" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.softwareSource === 1 ? 'BOM' : 'OTA' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="适配的总成硬件零件号" prop="adaptiveHardwarePn" width="150"/>
      <el-table-column label="适配的总成软件零件号" prop="adaptiveSoftwarePn" width="150"/>
      <el-table-column label="发布日期" align="center" prop="releaseDate" width="120">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.releaseDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleRemoveBaselineSoftwareBuildVersion(scope.row)"
            v-hasPermi="['ota:baseline:baseline:edit']"
          >删除关联
          </el-button>
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

    <!-- 软件零件版本列表对话框 -->
    <el-drawer title="关联软件零件版本信息" :visible.sync="open" direction="rtl" size="80%"
               :modal="true"
               :append-to-body="true"
               @close="onClose">
      <div class="drawer-content">
        <el-form :model="queryParamsSoftwareBuildVersion" ref="queryFormSoftwareBuildVersion" size="small"
                 :inline="true"
                 v-show="showSearchSoftwareBuildVersion">
          <el-form-item label="软件零件号" prop="softwarePn">
            <el-input
              v-model="queryParamsSoftwareBuildVersion.softwarePn"
              placeholder="请输入软件零件号"
              clearable
              style="width: 140px"
              @keyup.enter.native="handleQuerySoftwareBuildVersion"
            />
          </el-form-item>
          <el-form-item label="设备" prop="deviceCode">
            <el-select
              v-model="queryParamsSoftwareBuildVersion.deviceCode"
              placeholder="设备"
              clearable
              style="width: 140px"
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

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="mini"
              :disabled="multipleSoftwareBuildVersion"
              @click="handleAddBaselineSoftwareBuildVersion"
              v-hasPermi="['ota:baseline:baseline:edit']"
            >关联
            </el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearchSoftwareBuildVersion"
                         @queryTable="getListSoftwareBuildVersion"></right-toolbar>
        </el-row>

        <el-table ref="SoftwareBuildVersionTable" v-loading="loadingSoftwareBuildVersion"
                  :data="SoftwareBuildVersionList"
                  @selection-change="handleSelectionChangeSoftwareBuildVersion">
          <el-table-column type="selection" width="55" align="center"/>
          <el-table-column label="设备" prop="deviceCode" width="100"/>
          <el-table-column label="软件零件号" prop="softwarePn"/>
          <el-table-column label="软件零件版本" prop="softwarePartVer" width="120"/>
          <el-table-column label="测试报告" prop="softwareReport" width="80" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.softwareReport && scope.row.softwareReport.trim() ? '已上传' : '未上传' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="软件来源" prop="softwareSource" width="80" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.softwareSource === 1 ? 'BOM' : 'OTA' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="适配的总成硬件零件号" prop="adaptiveHardwarePn" width="150"/>
          <el-table-column label="适配的总成软件零件号" prop="adaptiveSoftwarePn" width="150"/>
          <el-table-column label="发布日期" align="center" prop="releaseTime" width="120">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.releaseDate, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
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
                @click="handleAddBaselineSoftwareBuildVersion(scope.row)"
                v-hasPermi="['ota:baseline:baseline:edit']"
              >关联
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="totalSoftwareBuildVersion>0"
          :total="totalSoftwareBuildVersion"
          :page.sync="queryParamsSoftwareBuildVersion.pageNum"
          :limit.sync="queryParamsSoftwareBuildVersion.pageSize"
          @pagination="getListSoftwareBuildVersion"
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
  addBaselineSoftwareBuildVersion,
  delBaselineSoftwareBuildVersion,
  listBaselineSoftwareBuildVersion,
  resortBaselineSoftwareBuildVersion,
  updateBaselineSoftwareBuildVersionCritical,
  updateBaselineSoftwareBuildVersionOta
} from "@/api/iov/ota/baseline";
import {listSoftwareBuildVersion} from "@/api/iov/ota/softwarebuildversion"
import {listAllVehicleNode} from "@/api/mdm/vehicleNode";
import Sortable from 'sortablejs'

export default {
  name: "BaselineSoftwareBuildVersion",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      loadingSoftwareBuildVersion: true,
      // 选中数组
      ids: [],
      idsSoftwareBuildVersion: [],
      // 非单个禁用
      single: true,
      singleSoftwareBuildVersion: true,
      // 非多个禁用
      multiple: true,
      multipleSoftwareBuildVersion: true,
      // 显示搜索条件
      showSearch: true,
      showSearchSoftwareBuildVersion: true,
      // 总条数
      total: 0,
      totalSoftwareBuildVersion: 0,
      list: [],
      SoftwareBuildVersionList: [],
      deviceList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 50
      },
      queryParamsSoftwareBuildVersion: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {},
      baselineId: undefined,
      tableKey: 0,
      sortable: null,
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initSort()
    })
  },
  created() {
    this.baselineId = this.$route.query.id;
    this.getDeviceList();
    this.getList();
  },
  beforeDestroy() {
    // 清理sortable
    if (this.sortable) {
      this.sortable.destroy()
      this.sortable = null
    }
  },
  methods: {
    getList() {
      this.loading = true;
      listBaselineSoftwareBuildVersion(this.baselineId, this.queryParams).then(response => {
          this.list = response.rows;
          this.total = response.total;
          this.loading = false;
          this.$nextTick(() => {
            if (!this.sortable) {
              this.initSort()
            }
          })
        }
      );
    },
    getDeviceList() {
      listAllVehicleNode().then(response => {
          this.deviceList = response.data.map(item => ({ code: item.nodeCode, label: item.name }));
        }
      );
    },
    getListSoftwareBuildVersion() {
      this.loadingSoftwareBuildVersion = true;
      listSoftwareBuildVersion(this.queryParamsSoftwareBuildVersion).then(response => {
          this.SoftwareBuildVersionList = response.rows;
          this.totalSoftwareBuildVersion = response.total;
          this.loadingSoftwareBuildVersion = false;
          this.$nextTick(() => {
            this.setDefaultSelection();
          });
        }
      );
    },
    setDefaultSelection() {
      const linkedIds = this.list.map(item => item.softwareBuildVersionId);
      const selectedRows = this.SoftwareBuildVersionList.filter(item =>
        linkedIds.includes(item.id)
      );
      this.$refs.SoftwareBuildVersionTable.clearSelection();
      this.$nextTick(() => {
        selectedRows.forEach(row => {
          this.$refs.SoftwareBuildVersionTable.toggleRowSelection(row, true);
        });
      });
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
      this.form = {};
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleQuerySoftwareBuildVersion() {
      this.queryParamsSoftwareBuildVersion.pageNum = 1;
      this.getListSoftwareBuildVersion();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    resetQuerySoftwareBuildVersion() {
      this.resetForm("queryFormSoftwareBuildVersion");
      this.handleQuerySoftwareBuildVersion();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.softwareBuildVersionId)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    handleSelectionChangeSoftwareBuildVersion(selection) {
      this.idsSoftwareBuildVersion = selection.map(item => item.id)
      this.singleSoftwareBuildVersion = selection.length != 1
      this.multipleSoftwareBuildVersion = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
    },
    handleAddSoftwareBuildVersion() {
      this.open = true;
      this.getListSoftwareBuildVersion();
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
    },
    handleRemoveBaselineSoftwareBuildVersion(row) {
      const softwareBuildVersionIds = row.softwareBuildVersionId || this.ids;
      this.$modal.confirm('是否确认删除基线' + this.baselineId + '下关联软件内部版本ID为"' + softwareBuildVersionIds + '"的数据项？').then(() => {
        return delBaselineSoftwareBuildVersion(this.baselineId, softwareBuildVersionIds);
      }).then(() => {
        this.$modal.msgSuccess("删除成功");
        this.getList();
      }).catch(() => {
      });
    },
    /** 提交按钮 */
    submitForm: function () {
    },
    /** 删除按钮操作 */
    handleDelete(row) {
    },
    handleAddBaselineSoftwareBuildVersion(row) {
      const softwareBuildVersionIds = row.id || this.idsSoftwareBuildVersion;
      this.$modal.confirm('是否确认将软件零件版本ID为"' + softwareBuildVersionIds + '"的数据项关联到基线ID' + this.baselineId + '？').then(() => {
        return addBaselineSoftwareBuildVersion(this.baselineId, softwareBuildVersionIds);
      }).then(() => {
        this.$modal.msgSuccess("关联成功");
        this.close();
        this.getList();
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
    },
    onClose() {
      this.getList();
    },
    initSort() {
      if (this.sortable) {
        this.sortable.destroy()
        this.sortable = null
      }

      this.$nextTick(() => {
        const el = document.querySelector('.el-table__body-wrapper tbody')
        if (!el) return

        let oldIndex, newIndex

        this.sortable = Sortable.create(el, {
          animation: 150,
          handle: '.el-icon-rank',
          ghostClass: 'sortable-ghost',

          // 记录原始索引
          onStart: (evt) => {
            oldIndex = evt.oldIndex
          },

          // 在排序结束时处理
          onEnd: (evt) => {
            newIndex = evt.newIndex

            if (newIndex === oldIndex) return

            // 重要：阻止默认行为并手动恢复DOM
            const tr = evt.item
            const parent = tr.parentNode
            const children = Array.from(parent.children)

            // 移除当前行
            parent.removeChild(tr)

            // 恢复到原始位置（这样Vue可以正确更新）
            if (oldIndex >= children.length) {
              parent.appendChild(tr)
            } else {
              parent.insertBefore(tr, children[oldIndex])
            }

            // 然后让Vue处理数据更新
            const newList = [...this.list]
            const movedItem = newList.splice(oldIndex, 1)[0]
            newList.splice(newIndex, 0, movedItem)

            const startIndex = (this.queryParams.pageNum - 1) * this.queryParams.pageSize
            newList.forEach((item, index) => {
              item.sort = startIndex + index + 1
            })

            this.list = newList

            this.$nextTick(() => {
              this.saveSortOrder()
            })
          }
        })
      })
    },
    saveSortOrder() {
      // 调用后端API保存排序
      const sortData = this.list.map(item => ({
        softwareBuildVersionId: item.softwareBuildVersionId,
        sort: item.sort
      }))
      resortBaselineSoftwareBuildVersion(this.baselineId, sortData).then(response => {
        console.log(response)
      })
    },
    handleCriticalChange(row) {
      const softwareBuildVersionIds = row.softwareBuildVersionId || this.ids;
      updateBaselineSoftwareBuildVersionCritical(this.baselineId, softwareBuildVersionIds, row.critical).then(response => {
        console.log(response);
      })
    },
    handleOtaChange(row) {
      const softwareBuildVersionIds = row.softwareBuildVersionId || this.ids;
      updateBaselineSoftwareBuildVersionOta(this.baselineId, softwareBuildVersionIds, row.ota).then(response => {
        console.log(response);
      })
    }
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

.sortable-ghost {
  opacity: 0.4;
  background: #f0f9ff;
}

.el-icon-rank {
  cursor: move;
  color: #909399;
}

.el-icon-rank:hover {
  color: #409eff;
}
</style>
