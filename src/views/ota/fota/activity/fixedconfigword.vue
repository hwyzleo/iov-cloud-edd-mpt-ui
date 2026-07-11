<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAddFixedConfigWord"
          v-hasPermi="['ota:fota:activity:edit']"
        >查询并添加固定配置字
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <el-table v-loading="loading" :data="list"
              @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="配置字代码" prop="configWordCode" width="120"/>
      <el-table-column label="配置字名称" prop="configWordName" width="120"/>
      <el-table-column label="设备" prop="deviceCode" width="100" align="center"/>
      <el-table-column label="描述" prop="description"/>
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
            icon="el-icon-delete"
            @click="handleRemoveActivityFixedConfigWord(scope.row)"
            v-hasPermi="['ota:fota:activity:edit']"
          >删除关联
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer title="查询并添加固定配置字" :visible.sync="open" direction="rtl" size="80%"
               :modal="true"
               :append-to-body="true"
               @close="close">
      <div class="drawer-content">
        <el-form :model="queryParamsFixedConfigWord" ref="queryFormFixedConfigWord" size="small"
                 :inline="true"
                 v-show="showSearchFixedConfigWord">
          <el-form-item label="配置字代码" prop="code">
            <el-input
              v-model="queryParamsFixedConfigWord.code"
              placeholder="请输入配置字代码"
              clearable
              style="width: 140px"
              @keyup.enter.native="handleQueryFixedConfigWord"
            />
          </el-form-item>
          <el-form-item label="设备" prop="deviceCode">
            <el-select
              v-model="queryParamsFixedConfigWord.deviceCode"
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
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQueryFixedConfigWord">搜索
            </el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQueryFixedConfigWord">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="mini"
              :disabled="multipleFixedConfigWord"
              @click="handleAddActivityFixedConfigWord"
              v-hasPermi="['ota:fota:activity:edit']"
            >关联
            </el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearchFixedConfigWord"
                         @queryTable="getListFixedConfigWord"></right-toolbar>
        </el-row>

        <el-table ref="fixedConfigWordTable" v-loading="loadingFixedConfigWord"
                  :data="fixedConfigWordList"
                  @selection-change="handleSelectionChangeFixedConfigWord">
          <el-table-column type="selection" width="55" align="center"/>
          <el-table-column label="配置字代码" prop="code" width="120"/>
          <el-table-column label="配置字名称" prop="name" width="120"/>
          <el-table-column label="设备" prop="deviceCode" width="100"/>
          <el-table-column label="数据格式" prop="dataFormat" width="100"/>
          <el-table-column label="数据长度" prop="byteLength" width="100"/>
          <el-table-column label="读写能力" prop="rwCapability" width="100"/>
          <el-table-column label="描述" prop="description"/>
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
                @click="handleAddActivityFixedConfigWord(scope.row)"
                v-hasPermi="['ota:fota:activity:edit']"
              >关联
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="totalFixedConfigWord>0"
          :total="totalFixedConfigWord"
          :page.sync="queryParamsFixedConfigWord.pageNum"
          :limit.sync="queryParamsFixedConfigWord.pageSize"
          @pagination="getListFixedConfigWord"
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
  addActivityFixedConfigWord,
  delActivityFixedConfigWord,
  listActivityFixedConfigWord,
} from "@/api/ota/fota/activity";
import {listConfigWord} from "@/api/ota/dota/configword";
import {listAllVehicleNode} from "@/api/mdm/vehicleNode";

export default {
  name: "ActivityFixedConfigWord",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      loadingFixedConfigWord: true,
      // 选中数组
      ids: [],
      idsFixedConfigWord: [],
      // 非单个禁用
      single: true,
      singleFixedConfigWord: true,
      // 非多个禁用
      multiple: true,
      multipleFixedConfigWord: true,
      // 显示搜索条件
      showSearch: true,
      showSearchFixedConfigWord: true,
      // 总条数
      total: 0,
      totalFixedConfigWord: 0,
      list: [],
      deviceList: [],
      fixedConfigWordList: [],
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
      queryParamsFixedConfigWord: {
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
      listActivityFixedConfigWord(this.activityId).then(response => {
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
    getListFixedConfigWord() {
      this.loadingFixedConfigWord = true;
      listConfigWord(this.queryParamsFixedConfigWord).then(response => {
          this.fixedConfigWordList = response.data.items;
          this.totalFixedConfigWord = response.data.total;
          this.loadingFixedConfigWord = false;
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
    resetQueryFixedConfigWord() {
      this.dateRange = [];
      this.resetForm("queryFormFixedConfigWord");
      this.handleQueryFixedConfigWord();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.fixedConfigWordId)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    handleSelectionChangeFixedConfigWord(selection) {
      this.idsFixedConfigWord = selection.map(item => item.id)
      this.singleFixedConfigWord = selection.length != 1
      this.multipleFixedConfigWord = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
    },
    /** 提交按钮 */
    submitForm: function () {
    },
    /** 删除按钮操作 */
    handleDelete(row) {
    },
    /** 导出按钮操作 */
    handleExport() {
    },
    handleRemoveActivityFixedConfigWord(row) {
      const fixedConfigWordIds = row.fixedConfigWordId || this.ids;
      this.$modal.confirm('是否确认删除升级活动' + this.activityId + '下关联固定配置字ID为"' + fixedConfigWordIds + '"的数据项？').then(() => {
        return delActivityFixedConfigWord(this.activityId, fixedConfigWordIds);
      }).then(() => {
        this.$modal.msgSuccess("删除成功");
        this.getList();
      }).catch(() => {
      });
    },
    handleAddFixedConfigWord() {
      this.open = true;
      this.getListFixedConfigWord();
    },
    handleQueryFixedConfigWord() {
      this.queryParamsFixedConfigWord.pageNum = 1;
      this.getListFixedConfigWord();
    },
    handleAddActivityFixedConfigWord(row) {
      const fixedConfigWordIds = row.id || this.idsFixedConfigWord;
      this.$modal.confirm('是否确认将固定配置字ID为"' + fixedConfigWordIds + '"的数据项关联到升级活动ID' + this.activityId + '？').then(() => {
        return addActivityFixedConfigWord(this.activityId, fixedConfigWordIds);
      }).then(() => {
        this.$modal.msgSuccess("关联成功");
        this.close();
        this.getList();
      }).catch(() => {
      });
    },
    setDefaultSelection() {
      const linkedIds = this.list.map(item => item.fixedConfigWordId);
      const selectedRows = this.fixedConfigWordList.filter(item =>
        linkedIds.includes(item.id)
      );
      this.$refs.fixedConfigWordTable.clearSelection();
      this.$nextTick(() => {
        selectedRows.forEach(row => {
          this.$refs.fixedConfigWordTable.toggleRowSelection(row, true);
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
