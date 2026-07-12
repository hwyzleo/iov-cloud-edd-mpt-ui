<template>
  <div class="app-container">
    <el-page-header @back="goBack" content="监管备案管理"/>
    <el-divider/>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['ota:fota:filing:add']"
        >新增
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="备案类型" prop="filingType" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.filingType === 'TYPE_APPROVAL'">型式批准</span>
          <span v-else-if="scope.row.filingType === 'REGULATORY'">监管备案</span>
          <span v-else>{{ scope.row.filingType }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备案编号" prop="filingNo" width="150"/>
      <el-table-column label="软件内容引用" prop="swContentRef" show-overflow-tooltip/>
      <el-table-column label="ReleaseNote引用" prop="releaseNoteRef" show-overflow-tooltip/>
      <el-table-column label="备案状态" prop="filingStatus" width="120" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.filingStatus === 'APPROVED' ? 'success' : (scope.row.filingStatus === 'PENDING' ? 'warning' : 'info')" size="small">
            {{ scope.row.filingStatus === 'APPROVED' ? '已批准' : (scope.row.filingStatus === 'PENDING' ? '待审批' : scope.row.filingStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['ota:fota:filing:add']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['ota:fota:filing:remove']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="备案类型" prop="filingType">
          <el-select v-model="form.filingType" placeholder="请选择备案类型" style="width: 100%">
            <el-option label="型式批准" value="TYPE_APPROVAL"/>
            <el-option label="监管备案" value="REGULATORY"/>
          </el-select>
        </el-form-item>
        <el-form-item label="备案编号" prop="filingNo">
          <el-input v-model="form.filingNo" placeholder="请输入备案编号"/>
        </el-form-item>
        <el-form-item label="软件内容引用" prop="swContentRef">
          <el-input v-model="form.swContentRef" type="textarea" placeholder="请输入软件内容引用"/>
        </el-form-item>
        <el-form-item label="ReleaseNote引用" prop="releaseNoteRef">
          <el-input v-model="form.releaseNoteRef" type="textarea" placeholder="请输入ReleaseNote引用"/>
        </el-form-item>
        <el-form-item label="备案状态" prop="filingStatus">
          <el-select v-model="form.filingStatus" placeholder="请选择备案状态" style="width: 100%">
            <el-option label="待审批" value="PENDING"/>
            <el-option label="已批准" value="APPROVED"/>
            <el-option label="已拒绝" value="REJECTED"/>
          </el-select>
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
  listRegulatoryFiling,
  saveRegulatoryFiling,
  deleteRegulatoryFiling
} from "@/api/iov/ota/activity";

export default {
  name: "ActivityRegulatoryFiling",
  data() {
    return {
      loading: true,
      list: [],
      showSearch: true,
      title: "",
      open: false,
      activityId: undefined,
      form: {},
      rules: {
        filingType: [
          { required: true, message: "备案类型不能为空", trigger: "change" }
        ],
        filingNo: [
          { required: true, message: "备案编号不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.activityId = this.$route.query.id;
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listRegulatoryFiling(this.activityId).then(response => {
        this.list = response.data;
        this.loading = false;
      });
    },
    goBack() {
      this.$router.back();
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: undefined,
        filingType: undefined,
        filingNo: undefined,
        swContentRef: undefined,
        releaseNoteRef: undefined,
        filingStatus: 'PENDING'
      };
      this.resetForm("form");
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "新增监管备案";
    },
    handleUpdate(row) {
      this.reset();
      this.form = { ...row };
      this.open = true;
      this.title = "修改监管备案";
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除该监管备案？').then(() => {
        return deleteRegulatoryFiling(this.activityId, row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          saveRegulatoryFiling(this.activityId, this.form).then(response => {
            this.$modal.msgSuccess(this.form.id ? "修改成功" : "新增成功");
            this.open = false;
            this.getList();
          });
        }
      });
    }
  }
};
</script>
