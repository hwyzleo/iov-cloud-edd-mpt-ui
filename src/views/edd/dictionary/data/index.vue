<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="字典名称">
        <el-input v-model="dictionaryInfo.name" :disabled="true" />
      </el-form-item>
      <el-form-item label="字典代码">
        <el-input v-model="dictionaryInfo.code" :disabled="true" />
      </el-form-item>
      <el-form-item label="分类代码">
        <el-input v-model="dictionaryInfo.categoryCode" :disabled="true" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="getList">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="getList">刷新</el-button>
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
          v-hasPermi="['system:dictionaryData:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:dictionaryData:remove']"
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

    <el-table v-loading="loading" :data="dataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column
        v-for="column in tableColumns"
        :key="column.code"
        :label="column.name"
        :prop="column.name"
        align="center"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="操作" align="center" width="150">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:dictionaryData:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:dictionaryData:remove']"
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

    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" label-width="100px">
        <el-form-item
          v-for="column in allColumns"
          :key="column.code"
          :label="column.name"
          :prop="column.code"
          :rules="column.nullable ? [] : [{ required: true, message: column.name + '不能为空', trigger: 'blur' }]"
        >
          <el-input v-model="form[column.code]" :placeholder="'请输入' + column.name" />
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
import { getDictionaryData, getDataInfo, addData, updateData, delData } from "@/api/edd/dictionary/data";
import { getDictionary } from "@/api/edd/dictionary/dictionary";
import { getCategoryByCode } from "@/api/edd/dictionary/category";
import { listColumn } from "@/api/edd/dictionary/column";

export default {
  name: "DictionaryData",
  data() {
    return {
      loading: false,
      showSearch: true,
      dataList: [],
      dictionaryInfo: {},
      categoryInfo: {},
      tableColumns: [],
      allColumns: [],
      ids: [],
      single: true,
      multiple: true,
      title: "",
      open: false,
      form: {},
      queryParams: {
        pageNum: 1,
        pageSize: 10
      }
    };
  },
  created() {
    const dictionaryId = this.$route.params && this.$route.params.dictionaryId;
    if (dictionaryId) {
      this.getDictionaryInfo(dictionaryId);
    } else {
      this.$modal.msgError("缺少字典ID参数");
    }
  },
  methods: {
    getDictionaryInfo(dictionaryId) {
      getDictionary(dictionaryId).then(response => {
        if (response.data) {
          this.dictionaryInfo = response.data;
          this.initTableColumns();
          this.getCategoryInfo(response.data.categoryCode);
        }
      }).catch(() => {
        this.$modal.msgError("获取字典信息失败");
      });
    },
    initTableColumns() {
      if (this.dictionaryInfo.selectColumn) {
        try {
          const selectColumns = JSON.parse(this.dictionaryInfo.selectColumn);
          this.tableColumns = selectColumns.map(item => ({
            code: item.targetColumn,
            name: item.aliasName || item.targetColumn
          }));
        } catch (e) {
          console.error('解析查询列失败', e);
          this.tableColumns = [];
        }
      }
    },
    getCategoryInfo(categoryCode) {
      getCategoryByCode(categoryCode).then(response => {
        if (response.data) {
          this.categoryInfo = response.data;
          this.getAllColumnList(response.data.id);
        }
      });
    },
    getAllColumnList(categoryId) {
      listColumn(categoryId, { pageNum: 1, pageSize: 1000 }).then(response => {
        if (response.data && response.data.items) {
          this.allColumns = response.data.items;
          this.getList();
        } else {
          this.$modal.msgWarning("该分类未定义字段，请先添加字段并生成表结构");
        }
      }).catch(() => {
        this.allColumns = [];
      });
    },
    getList() {
      this.loading = true;
      getDictionaryData(this.dictionaryInfo.id).then(response => {
        if (response.data) {
          this.dataList = response.data;
          this.total = response.data.length;
        } else {
          this.dataList = [];
          this.total = 0;
        }
        this.loading = false;
      }).catch(() => {
        this.dataList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      const formData = {};
      this.allColumns.forEach(col => {
        formData[col.code] = '';
      });
      this.form = formData;
      this.resetForm("form");
    },
    handleClose() {
      const obj = { path: "/edd/dictionary/dictionary" };
      this.$tab.closeOpenPage(obj);
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加字典数据";
    },
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids[0];
      getDataInfo(this.dictionaryInfo.id, id).then(response => {
        if (response.data) {
          const formData = { ...this.form };
          Object.keys(response.data).forEach(key => {
            formData[key] = response.data[key];
          });
          formData.id = id;
          this.form = formData;
          this.open = true;
          this.title = "修改字典数据";
        }
      }).catch(() => {
        const formData = { ...this.form };
        Object.keys(row).forEach(key => {
            formData[key] = row[key];
          });
        this.form = formData;
        this.open = true;
        this.title = "修改字典数据";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          const data = {};
          this.allColumns.forEach(col => {
            data[col.code] = this.form[col.code];
          });

          if (this.form.id) {
            updateData(this.dictionaryInfo.id, this.form.id, data).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            }).catch(() => {
              this.$modal.msgError("修改失败");
            });
          } else {
            addData(this.dictionaryInfo.id, data).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            }).catch(() => {
              this.$modal.msgError("新增失败");
            });
          }
        }
      });
    },
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除数据？').then(() => {
        if (Array.isArray(ids)) {
          // 批量删除
          const deletePromises = ids.map(id => delData(this.dictionaryInfo.id, id));
          return Promise.all(deletePromises);
        } else {
          // 单个删除
          return delData(this.dictionaryInfo.id, ids);
        }
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>
