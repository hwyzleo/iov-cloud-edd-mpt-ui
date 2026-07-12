<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['ota:pota:softwareBuildVersion:edit']"
        >新增测试报告
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
          v-hasPermi="['ota:pota:softwareBuildVersion:edit']"
        >删除
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="报告类型" prop="reportType" width="120" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.reportType === 'FUNCTIONAL'">功能测试</el-tag>
          <el-tag v-else-if="scope.row.reportType === 'PERFORMANCE'" type="warning">性能测试</el-tag>
          <el-tag v-else-if="scope.row.reportType === 'SECURITY'" type="danger">安全测试</el-tag>
          <el-tag v-else>{{ scope.row.reportType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="测试状态" prop="testState" width="100" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.testState === 'PASSED'" type="success">通过</el-tag>
          <el-tag v-else-if="scope.row.testState === 'FAILED'" type="danger">失败</el-tag>
          <el-tag v-else-if="scope.row.testState === 'PENDING'" type="info">待测试</el-tag>
          <el-tag v-else>{{ scope.row.testState }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="测试结论" prop="verdict" min-width="200" show-overflow-tooltip/>
      <el-table-column label="测试人员" prop="testedBy" width="120"/>
      <el-table-column label="测试时间" align="center" prop="testedAt" width="120">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.testedAt, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="报告URL" prop="reportUrl" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-link v-if="scope.row.reportUrl" :href="scope.row.reportUrl" type="primary" target="_blank">查看报告</el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['ota:pota:softwareBuildVersion:edit']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增测试报告对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="报告类型" prop="reportType">
          <el-select v-model="form.reportType" placeholder="请选择报告类型" style="width: 100%">
            <el-option label="功能测试" value="FUNCTIONAL"/>
            <el-option label="性能测试" value="PERFORMANCE"/>
            <el-option label="安全测试" value="SECURITY"/>
          </el-select>
        </el-form-item>
        <el-form-item label="测试状态" prop="testState">
          <el-select v-model="form.testState" placeholder="请选择测试状态" style="width: 100%">
            <el-option label="通过" value="PASSED"/>
            <el-option label="失败" value="FAILED"/>
            <el-option label="待测试" value="PENDING"/>
          </el-select>
        </el-form-item>
        <el-form-item label="测试结论" prop="verdict">
          <el-input v-model="form.verdict" type="textarea" placeholder="请输入测试结论"/>
        </el-form-item>
        <el-form-item label="测试人员" prop="testedBy">
          <el-input v-model="form.testedBy" placeholder="请输入测试人员"/>
        </el-form-item>
        <el-form-item label="测试时间" prop="testedAt">
          <el-date-picker
            v-model="form.testedAt"
            type="date"
            placeholder="请选择测试时间"
            value-format="timestamp"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="报告URL" prop="reportUrl">
          <el-input v-model="form.reportUrl" placeholder="请输入报告URL"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listTestReport,
  addTestReport,
  delTestReport,
  getSoftwareBuildVersion
} from "@/api/iov/ota/softwarebuildversion";

export default {
  name: "SoftwareBuildVersionTestReport",
  dicts: [],
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      list: [],
      title: "",
      open: false,
      softwareBuildVersionId: undefined,
      form: {},
      rules: {
        reportType: [
          {required: true, message: "报告类型不能为空", trigger: "change"}
        ],
        testState: [
          {required: true, message: "测试状态不能为空", trigger: "change"}
        ],
        reportUrl: [
          {required: true, message: "报告URL不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {
    this.softwareBuildVersionId = this.$route.query.id;
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listTestReport(this.softwareBuildVersionId).then(response => {
        this.list = response.data;
        this.loading = false;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        reportType: undefined,
        testState: undefined,
        verdict: undefined,
        testedBy: undefined,
        testedAt: undefined,
        reportUrl: undefined
      };
      this.resetForm("form");
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "新增测试报告";
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          addTestReport(this.softwareBuildVersionId, this.form).then(response => {
            this.$modal.msgSuccess("新增成功");
            this.open = false;
            this.getList();
          });
        }
      });
    },
    handleDelete(row) {
      const testReportIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除测试报告ID为"' + testReportIds + '"的数据项？').then(function () {
        return delTestReport(this.softwareBuildVersionId, testReportIds);
      }.bind(this)).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>
