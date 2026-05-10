<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="字段名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入字段名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="字段代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入字段代码"
          clearable
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['system:dictionaryColumn:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-s-grid"
          size="mini"
          @click="handleGenerateTable"
          v-hasPermi="['system:dictionaryColumn:generate']"
        >生成表结构</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:dictionaryColumn:edit']"
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
          v-hasPermi="['system:dictionaryColumn:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-close"
          size="mini"
          @click="handleClose"
        >关闭</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="columnList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="字段名称" align="center" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="字段代码" align="center" prop="code" :show-overflow-tooltip="true" />
      <el-table-column label="字段类型" align="center" prop="type" :show-overflow-tooltip="true" />
      <el-table-column label="长度" align="center" prop="len" />
      <el-table-column label="可空" align="center" prop="nullable">
        <template slot-scope="scope">
          <el-tag :type="scope.row.nullable ? 'success' : 'danger'">{{ scope.row.nullable ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="唯一" align="center" prop="uniq">
        <template slot-scope="scope">
          <el-tag :type="scope.row.uniq ? 'success' : 'danger'">{{ scope.row.uniq ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="值类型" align="center" prop="valueType">
        <template slot-scope="scope">
          <span>{{ scope.row.valueType === 0 ? '无限制' : '表关联' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="值范围" align="center" prop="valueRange" :show-overflow-tooltip="true" />
      <el-table-column label="排序" align="center" prop="sort" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:dictionaryColumn:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:dictionaryColumn:remove']"
          >删除</el-button>
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
        <el-form-item label="分类名称">
          <el-input v-model="categoryInfo.name" :disabled="true" />
        </el-form-item>
        <el-form-item label="字段名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入字段名称" />
        </el-form-item>
        <el-form-item label="字段代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入字段代码" />
        </el-form-item>
        <el-form-item label="字段类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择字段类型">
            <el-option label="VARCHAR" value="VARCHAR" />
            <el-option label="INT" value="INT" />
            <el-option label="BIGINT" value="BIGINT" />
            <el-option label="DATETIME" value="DATETIME" />
            <el-option label="TEXT" value="TEXT" />
            <el-option label="JSON" value="JSON" />
          </el-select>
        </el-form-item>
        <el-form-item label="字段长度" prop="len">
          <el-input-number v-model="form.len" controls-position="right" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="是否可空" prop="nullable">
          <el-switch v-model="form.nullable" />
        </el-form-item>
        <el-form-item label="是否唯一" prop="uniq">
          <el-switch v-model="form.uniq" />
        </el-form-item>
        <el-form-item label="值类型" prop="valueType">
          <el-select v-model="form.valueType" placeholder="请选择值类型">
            <el-option label="无限制" :value="0" />
            <el-option label="表关联" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="值范围" prop="valueRange">
          <el-input v-model="form.valueRange" placeholder="请输入值范围，如关联表名" />
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
import { listColumn, getColumn, delColumn, addColumn, updateColumn, generateTable } from "@/api/edd/dictionary/column";
import { getCategory, getCategoryById } from '@/api/edd/dictionary/category'

export default {
  name: "DictionaryColumn",
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      columnList: [],
      categoryInfo: {},
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: undefined,
        code: undefined
      },
      form: {},
      rules: {
        name: [
          { required: true, message: "字段名称不能为空", trigger: "blur" }
        ],
        code: [
          { required: true, message: "字段代码不能为空", trigger: "blur" }
        ],
        type: [
          { required: true, message: "字段类型不能为空", trigger: "blur" }
        ],
        len: [
          { required: true, message: "字段长度不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    const categoryId = this.$route.params && this.$route.params.categoryId;
    this.getCategoryInfo(categoryId);
  },
  methods: {
    getCategoryInfo(categoryId) {
      getCategoryById(categoryId).then(response => {
        this.categoryInfo = response.data;
        this.getList();
      });
    },
    getList() {
      this.loading = true;
      listColumn(this.categoryInfo.id, this.queryParams).then(response => {
        this.columnList = response.data.items || [];
        this.total = response.data.total || 0;
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
        categoryId: this.categoryInfo.id,
        name: undefined,
        code: undefined,
        type: "VARCHAR",
        len: 255,
        nullable: true,
        uniq: false,
        valueType: 0,
        valueRange: undefined,
        sort: 99
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleClose() {
      const obj = { path: "/edd/dictionary/category" };
      this.$tab.closeOpenPage(obj);
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加字段";
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids;
      getColumn(this.categoryInfo.id, id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改字段";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updateColumn(this.categoryInfo.id, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addColumn(this.categoryInfo.id, this.form).then(response => {
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
      this.$modal.confirm('是否确认删除字段编号为"' + ids + '"的数据项？').then(function() {
        return delColumn(this.categoryInfo.id, ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleGenerateTable() {
      this.$modal.confirm('是否确认为字典分类"' + this.categoryInfo.name + '"生成数据表？生成后将创建表名为 tb_' + this.categoryInfo.code + ' 的数据表。').then(function() {
        return generateTable(this.categoryInfo.id);
      }).then(() => {
        this.$modal.msgSuccess("表结构生成成功");
      }).catch(() => {});
    }
  }
};
</script>
