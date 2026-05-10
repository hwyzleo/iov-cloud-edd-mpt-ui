<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="分类名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入分类名称"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="分类代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入分类代码"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="分类类型" prop="type">
        <el-input
          v-model="queryParams.type"
          placeholder="请输入分类类型"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['system:dictionaryCategory:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:dictionaryCategory:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:dictionaryCategory:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:dictionaryCategory:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="categoryList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="分类名称" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="分类代码" align="center" :show-overflow-tooltip="true">
        <template slot-scope="scope">
            <span>{{ scope.row.code }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分类类型" align="center" prop="type" :show-overflow-tooltip="true" width="120" />
      <el-table-column label="启用状态" align="center" prop="enable" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.enable ? 'success' : 'danger'">{{ scope.row.enable ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sort" width="80" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-s-grid"
            @click="handleColumn(scope.row)"
            v-hasPermi="['system:dictionaryColumn:list']"
          >字段</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:dictionaryCategory:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:dictionaryCategory:remove']"
          >删除</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-s-grid"
            @click="handleCategory(scope.row)"
            v-hasPermi="['system:dictionaryColumn:list']"
          >字典</el-button>
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

    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="父级ID" prop="pid">
          <el-input v-model="form.pid" placeholder="请输入父级ID" type="number" />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入分类代码" />
        </el-form-item>
        <el-form-item label="分类类型" prop="type">
          <el-input v-model="form.type" placeholder="请输入分类类型" />
        </el-form-item>
        <el-form-item label="启用状态" prop="enable">
          <el-switch v-model="form.enable" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" controls-position="right" :min="0" />
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
import { listCategory, getCategoryById, delCategory, addCategory, updateCategory } from "@/api/edd/dictionary/category";

export default {
  name: "DictionaryCategory",
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      categoryList: [],
      title: "",
      open: false,
      dateRange: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: undefined,
        code: undefined,
        type: undefined
      },
      form: {},
      rules: {
        name: [
          { required: true, message: "分类名称不能为空", trigger: "blur" }
        ],
        code: [
          { required: true, message: "分类代码不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listCategory(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.categoryList = response.data.items;
        this.total = response.data.total;
        this.loading = false;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: undefined,
        pid: 0,
        name: undefined,
        code: undefined,
        type: undefined,
        enable: true,
        sort: 0
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加字典分类";
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleUpdate(row) {
      this.reset();
      const id = row ? row.id : this.ids[0];
      getCategoryById(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改字典分类";
      }).catch(() => {
        this.$modal.msgError("获取分类信息失败");
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updateCategory(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addCategory(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除字典分类编号为"' + ids + '"的数据项？').then(function() {
        return delCategory(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleColumn(row) {
      this.$router.push('/edd/dictionary/column/index/' + row.id);
    },
    handleExport() {
      this.download('edd-dictionary/api/mpt/dictionaryCategory/v1/export', {
        ...this.queryParams
      }, `category_${new Date().getTime()}.xlsx`);
    },
    handleCategory(row) {
      this.$router.push({
        path: "/edd/dictionary/dictionary/index",
        query: { categoryId: row.id }
      });
    }
  }
};
</script>
