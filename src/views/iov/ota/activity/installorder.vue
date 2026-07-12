<template>
  <div class="app-container">
    <el-page-header @back="goBack" content="安装顺序管理"/>
    <el-divider/>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['ota:fota:activity:edit']"
        >新增
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="车辆节点编码" prop="vehicleNodeCode" width="200"/>
      <el-table-column label="安装序号" prop="seqNo" width="120" align="center"/>
      <el-table-column label="并行组" prop="parallelGroup" width="120" align="center"/>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['ota:fota:activity:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['ota:fota:activity:edit']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="车辆节点编码" prop="vehicleNodeCode">
          <el-input v-model="form.vehicleNodeCode" placeholder="请输入车辆节点编码"/>
        </el-form-item>
        <el-form-item label="安装序号" prop="seqNo">
          <el-input-number v-model="form.seqNo" :min="1" controls-position="right"/>
        </el-form-item>
        <el-form-item label="并行组" prop="parallelGroup">
          <el-input-number v-model="form.parallelGroup" :min="0" controls-position="right"/>
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
  listInstallOrder,
  saveInstallOrder,
  deleteInstallOrder
} from "@/api/iov/ota/activity";

export default {
  name: "ActivityInstallOrder",
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
        vehicleNodeCode: [
          { required: true, message: "车辆节点编码不能为空", trigger: "blur" }
        ],
        seqNo: [
          { required: true, message: "安装序号不能为空", trigger: "blur" }
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
      listInstallOrder(this.activityId).then(response => {
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
        vehicleNodeCode: undefined,
        seqNo: 1,
        parallelGroup: 0
      };
      this.resetForm("form");
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "新增安装顺序";
    },
    handleUpdate(row) {
      this.reset();
      this.form = { ...row };
      this.open = true;
      this.title = "修改安装顺序";
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除该安装顺序？').then(() => {
        return deleteInstallOrder(this.activityId, row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          saveInstallOrder(this.activityId, this.form).then(response => {
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
