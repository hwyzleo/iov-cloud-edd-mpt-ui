<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="活动名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入活动名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="活动状态" prop="state">
        <el-select
          v-model="queryParams.state"
          placeholder="活动状态"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="activityState in this.activityStateList"
            :key="activityState.value"
            :label="activityState.label"
            :value="activityState.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
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
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['ota:fota:activity:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['ota:fota:activity:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['ota:fota:activity:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['ota:fota:activity:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" fixed="left"/>
      <el-table-column label="活动名称" prop="name" min-width="150" show-overflow-tooltip fixed="left"/>
      <el-table-column label="活动版本" prop="version" width="80" fixed="left"/>
      <el-table-column label="活动开始时间" align="center" prop="startTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="活动结束时间" align="center" prop="endTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="活动发布时间" align="center" prop="releaseTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.releaseTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="活动状态" prop="state" width="80" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.state === 1">待提交</span>
          <span v-else-if="scope.row.state === 2">待审核</span>
          <span v-else-if="scope.row.state === 3">已审核</span>
          <span v-else-if="scope.row.state === 4">未通过</span>
          <span v-else-if="scope.row.state === 5">已发布</span>
          <span v-else-if="scope.row.state === 6">已结束</span>
          <span v-else-if="scope.row.state === 7">已取消</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="是否基线活动" align="center" prop="baseline" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.baseline ? '是' : '否'  }}</span>
        </template>
      </el-table-column>
      <el-table-column label="软件内部版本数" prop="softwareBuildVersionCount" width="120" align="center"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-if="scope.row.state < 2"
            v-hasPermi="['ota:fota:activity:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleActivitySoftwareBuildVersion(scope.row)"
            v-if="scope.row.state < 2"
            v-hasPermi="['ota:fota:activity:edit']"
          >关联版本
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-finished"
            @click="handleAudit(scope.row)"
            v-if="scope.row.state === 2"
            v-hasPermi="['ota:fota:activity:audit']"
          >审核
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-s-flag"
            @click="handleRelease(scope.row)"
            v-if="scope.row.state === 3"
            v-hasPermi="['ota:fota:activity:release']"
          >发布
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-zoom-out"
            @click="handleCancel(scope.row)"
            v-if="scope.row.state === 5"
            v-hasPermi="['ota:fota:activity:cancel']"
          >取消
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-if="scope.row.state <= 1"
            v-hasPermi="['ota:fota:activity:remove']"
          >删除
          </el-button>
          <el-dropdown size="mini" @command="(command) => handleCommand(command, scope.row)" v-hasPermi="['ota:fota:activity:edit']">
            <el-button size="mini" type="text" icon="el-icon-d-arrow-right" v-if="scope.row.state < 2">更多</el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="handleActivityCompatiblePn" icon="el-icon-edit"
                                v-hasPermi="['ota:fota:activity:edit']">关联兼容零件号</el-dropdown-item>
              <el-dropdown-item command="handleActivityFixedConfigWord" icon="el-icon-edit"
                                v-hasPermi="['ota:fota:activity:edit']">关联固定配置字</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
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

    <!-- 添加或修改升级活动对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入活动名称" :disabled="form.state === 2"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动版本" prop="version">
              <el-input v-model="form.version" placeholder="请输入活动版本" :disabled="form.state === 2"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总文件大小(MB)" prop="totalFileSize">
              <el-input-number v-model="form.totalFileSize" controls-position="right" :min="0" :disabled="form.state === 2"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="升级须知" prop="upgradeNoticeArticleTitle">
          <div>
            <el-autocomplete
              v-model="form.upgradeNoticeArticleTitle"
              :fetch-suggestions="queryUpgradeNotice"
              placeholder="请查询升级须知"
              :trigger-on-focus="false"
              clearable
              @select="handleUpgradeNoticeSelect"
              :disabled="form.state === 2"
            >
              <template #default="{ item }">
                <div>{{ item.title }}</div>
              </template>
            </el-autocomplete>
          </div>
        </el-form-item>
        <el-form-item label="活动条款" prop="activityTermArticleTitle">
          <div>
            <el-autocomplete
              v-model="form.activityTermArticleTitle"
              :fetch-suggestions="queryActivityTerm"
              placeholder="请查询活动条款"
              :trigger-on-focus="false"
              clearable
              @select="handleActivityTermSelect"
              :disabled="form.state === 2"
            >
              <template #default="{ item }">
                <div>{{ item.title }}</div>
              </template>
            </el-autocomplete>
          </div>
        </el-form-item>
        <el-form-item label="隐私协议" prop="privacyAgreementArticleTitle">
          <div>
            <el-autocomplete
              v-model="form.privacyAgreementArticleTitle"
              :fetch-suggestions="queryPrivacyAgreement"
              placeholder="请查询隐私协议"
              :trigger-on-focus="false"
              clearable
              @select="handlePrivacyAgreementSelect"
              :disabled="form.state === 2"
            >
              <template #default="{ item }">
                <div>{{ item.title }}</div>
              </template>
            </el-autocomplete>
          </div>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动开始时间" prop="startTime">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="请选择活动开始时间"
                value-format="timestamp"
                :disabled="form.state === 2"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="请选择活动结束时间"
                value-format="timestamp"
                :disabled="form.state === 2"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="升级目的">
          <el-input v-model="form.upgradePurpose" type="textarea" placeholder="请输入升级目的" :disabled="form.state === 2"></el-input>
        </el-form-item>
        <el-form-item label="升级功能项">
          <el-input v-model="form.upgradeFunction" type="textarea" placeholder="请输入升级功能项" :disabled="form.state === 2"></el-input>
        </el-form-item>
        <el-form-item label="活动说明">
          <el-input v-model="form.statement" type="textarea" placeholder="请输入活动说明" :disabled="form.state === 2"></el-input>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="是否基线活动" prop="baseline">
              <el-radio-group v-model="form.baseline" :disabled="form.state === 2">
                <el-radio
                  :label="true"
                >是
                </el-radio>
                <el-radio
                  :label="false"
                >否
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.baseline">
            <el-form-item label="基线代码" prop="baselineCode">
              <el-autocomplete
                v-model="form.baselineCode"
                :fetch-suggestions="queryBaseline"
                placeholder="请查询基线代码"
                :trigger-on-focus="false"
                clearable
                @select="handleBaselineSelect"
                :disabled="form.state === 2"
                style="width: 100%"
              >
                <template #default="{ item }">
                  <div> {{item.name}} - {{item.value}} </div>
                </template>
              </el-autocomplete>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" :disabled="form.state === 2"></el-input>
        </el-form-item>
        <el-form-item label="审核结果" prop="audit" v-if="title === '审核升级活动'">
          <el-radio-group v-model="form.audit">
            <el-radio
              :label="true"
            >通过
            </el-radio>
            <el-radio
              :label="false"
            >拒绝
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="拒绝理由" prop="reason" v-if="title === '审核升级活动' && form.audit === false">
          <el-input v-model="form.reason" type="textarea" placeholder="请输入拒绝理由"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm" v-if="!form.state || form.state === 1">确 定</el-button>
        <el-button type="success" @click="handleSubmit" v-if="form.state === 1">提 交</el-button>
        <el-button type="success" @click="submitAuditForm" v-if="title === '审核升级活动' && form.state === 2">审 核
        </el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  addActivity,
  delActivity,
  getActivity,
  listActivity,
  listAllActivityState,
  updateActivity,
  submitActivity,
  auditActivity,
  releaseActivity,
  cancelActivity
} from "@/api/iov/ota/activity";
import {listArticle,} from "@/api/iov/ota/article";
import {listBaseline} from "@/api/iov/ota/baseline";

export default {
  name: "Activity",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 升级活动表格数据
      list: [],
      activityStateList: [],
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
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        version: [
          {required: true, message: "活动版本不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "活动名称不能为空", trigger: "blur"}
        ],
        totalFileSize: [
          {required: true, message: "总文件大小不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getActivityStateList();
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listActivity(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    getActivityStateList() {
      listAllActivityState().then(response => {
          this.activityStateList = response.data;
        }
      );
    },
    queryUpgradeNotice(queryString, cb) {
      listArticle({
        title: queryString,
        type: 2
      }).then(response => {
        if (response.data && response.data.items && response.data.items.length > 0) {
          const suggestions = response.data.items.map(item => {
            return {
              value: item.title,
              ...item
            };
          });
          cb(suggestions);
        } else {
          cb([]);
        }
      }).catch(() => {
        cb([]);
      });
    },
    queryActivityTerm(queryString, cb) {
      listArticle({
        title: queryString,
        type: 1
      }).then(response => {
        if (response.data && response.data.items && response.data.items.length > 0) {
          const suggestions = response.data.items.map(item => {
            return {
              value: item.title,
              ...item
            };
          });
          cb(suggestions);
        } else {
          cb([]);
        }
      }).catch(() => {
        cb([]);
      });
    },
    queryPrivacyAgreement(queryString, cb) {
      listArticle({
        title: queryString,
        type: 3
      }).then(response => {
        if (response.data && response.data.items && response.data.items.length > 0) {
          const suggestions = response.data.items.map(item => {
            return {
              value: item.title,
              ...item
            };
          });
          cb(suggestions);
        } else {
          cb([]);
        }
      }).catch(() => {
        cb([]);
      });
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        name: undefined,
        version: undefined,
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
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加升级活动";
      this.form = {
        baseline: true
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const activityId = row.id || this.ids
      getActivity(activityId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改升级活动";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateActivity(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addActivity(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const activityIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除升级活动ID为"' + activityIds + '"的数据项？').then(function () {
        return delActivity(activityIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('ota-fota/activity/export', {
        ...this.queryParams
      }, `activity_${new Date().getTime()}.xlsx`)
    },
    handleUpgradeNoticeSelect(item) {
      this.form.upgradeNoticeArticleId = item.id;
    },
    handleActivityTermSelect(item) {
      this.form.activityTermArticleId = item.id;
    },
    handlePrivacyAgreementSelect(item) {
      this.form.privacyAgreementArticleId = item.id;
    },
    handleActivitySoftwareBuildVersion(row) {
      this.$router.push({
        path: "/iov/ota/activitySoftwareBuildVersion",
        query: { id: row.id }
      });
    },
    handleActivityCompatiblePn(row) {
      this.$router.push({
        path: "/iov/ota/activityCompatiblePn",
        query: { id: row.id }
      });
    },
    handleActivityFixedConfigWord(row) {
      this.$router.push({
        path: "/iov/ota/activityFixedConfigWord",
        query: { id: row.id }
      });
    },
    handleSubmit() {
      this.$modal.confirm('是否确认提交该升级活动？').then(() => {
        this.$refs["form"].validate(valid => {
          if (valid && this.form.id !== undefined) {
            submitActivity(this.form.id, this.form).then(response => {
              this.$modal.msgSuccess("提交成功");
              this.open = false;
              this.getList();
            });
          }
        });
      }).catch(() => {
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const activityId = row.id || this.ids
      getActivity(activityId).then(response => {
        this.form = response.data;
        this.$set(this.form, 'audit', true);
        this.open = true;
      });
      this.title = "审核升级活动";
    },
    submitAuditForm() {
      this.$modal.confirm('是否确认提交该升级活动审核结果？').then(() => {
        this.$refs["form"].validate(valid => {
          if (valid && this.form.id !== undefined) {
            auditActivity(this.form.id, this.form).then(response => {
              this.$modal.msgSuccess("提交成功");
              this.open = false;
              this.getList();
            });
          }
        });
      }).catch(() => {
      });
    },
    /** 发布按钮操作 */
    handleRelease(row) {
      const activityId = row.id || this.ids
      this.$modal.confirm('是否确认发布该升级活动？').then(() => {
        if (activityId !== undefined) {
          releaseActivity(activityId).then(response => {
            this.$modal.msgSuccess("发布成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 取消按钮操作 */
    handleCancel(row) {
      const activityId = row.id || this.ids
      this.$modal.confirm('是否确认取消该升级活动？').then(() => {
        if (activityId !== undefined) {
          cancelActivity(activityId).then(response => {
            this.$modal.msgSuccess("取消成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    queryBaseline(queryString, cb) {
      listBaseline({
        key: queryString  // 根据实际接口参数调整
      }).then(response => {
        if (response.data && response.data.items && response.data.items.length > 0) {
          const suggestions = response.data.items.map(item => {
          return {
            value: item.code,  // 基线代码字段名根据实际调整
            ...item
          };
          });
        cb(suggestions);
        } else {
          cb([]);
        }
      }).catch(() => {
        cb([]);
      });
    },
    handleBaselineSelect(item) {
      // 如果需要保存基线ID或其他信息
      this.form.baselineId = item.id;
      this.form.baselineCode = item.code;
    },
    handleCommand(command, row) {
      switch (command) {
        case "handleActivityCompatiblePn":
          this.handleActivityCompatiblePn(row);
          break;
        case "handleActivityFixedConfigWord":
          this.handleActivityFixedConfigWord(row);
          break;
        default:
          break;
      }
    },
  }
};
</script>

<style scoped>
::v-deep .el-table .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
