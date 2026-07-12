<template>
  <div class="app-container">
    <el-page-header @back="goBack" content="同升同降依赖组管理"/>
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
      <el-table-column label="组编码" prop="groupCode" width="150"/>
      <el-table-column label="成员节点编码" prop="memberNodeCode" width="200"/>
      <el-table-column label="是否回滚" prop="rollbackTogether" width="120" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.rollbackTogether ? 'success' : 'info'" size="small">
            {{ scope.row.rollbackTogether ? '是' : '否' }}
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
        <el-form-item label="组编码" prop="groupCode">
          <el-input v-model="form.groupCode" placeholder="请输入组编码"/>
        </el-form-item>
        <el-form-item label="成员节点编码" prop="memberNodeCode">
          <el-input v-model="form.memberNodeCode" placeholder="请输入成员节点编码"/>
        </el-form-item>
        <el-form-item label="是否回滚" prop="rollbackTogether">
          <el-switch v-model="form.rollbackTogether"/>
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
  listDependencyGroup,
  saveDependencyGroup,
  deleteDependencyGroup
} from "@/api/iov/ota/activity";

export default {
  name: "ActivityDependencyGroup",
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
        groupCode: [
          { required: true, message: "组编码不能为空", trigger: "blur" }
        ],
        memberNodeCode: [
          { required: true, message: "成员节点编码不能为空", trigger: "blur" }
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
      listDependencyGroup(this.activityId).then(response => {
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
        groupCode: undefined,
        memberNodeCode: undefined,
        rollbackTogether: false
      };
      this.resetForm("form");
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "新增同升同降依赖组";
    },
    handleUpdate(row) {
      this.reset();
      this.form = { ...row };
      this.open = true;
      this.title = "修改同升同降依赖组";
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除该依赖组？').then(() => {
        return deleteDependencyGroup(this.activityId, row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          saveDependencyGroup(this.activityId, this.form).then(response => {
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
