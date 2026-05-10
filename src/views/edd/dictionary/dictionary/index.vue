<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="分类代码" prop="categoryCode">
        <el-select v-model="queryParams.categoryCode" clearable>
          <el-option
            v-for="item in categoryOptions"
            :key="item.id"
            :label="item.name"
            :value="item.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="字典名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入字典名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="字典代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入字典代码"
          clearable
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
          v-hasPermi="['system:dictionary:add']"
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
          v-hasPermi="['system:dictionary:edit']"
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
          v-hasPermi="['system:dictionary:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:dictionary:export']"
        >导出</el-button>
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

    <el-table v-loading="loading" :data="dictionaryList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="字典名称" align="center" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="字典代码" align="center" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <router-link :to="'/edd/dictionary/data/index/' + scope.row.id" class="link-type">
            <span>{{ scope.row.code }}</span>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column label="分类代码" align="center" prop="categoryCode" :show-overflow-tooltip="true" />
      <el-table-column label="启用状态" align="center" prop="enable">
        <template slot-scope="scope">
          <el-tag :type="scope.row.enable ? 'success' : 'danger'">{{ scope.row.enable ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sort" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:dictionary:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:dictionary:remove']"
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

    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类代码" prop="categoryCode">
          <el-select
            v-model="form.categoryCode"
            placeholder="请选择分类代码"
            :disabled="isEdit"
            @change="handleCategoryChange"
            style="width: 100%"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name + ' (' + item.code + ')'"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="字典代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入字典代码" />
        </el-form-item>
        <el-form-item label="查询列" prop="selectColumn">
          <div v-if="columnOptions.length === 0" style="color: #909399; font-size: 12px;">
            请先选择分类代码
          </div>
          <div v-else class="select-column-container">
            <el-checkbox-group v-model="selectedColumns">
              <div v-for="column in columnOptions" :key="column.id" class="column-item">
                <el-checkbox :label="column.code">
                  {{ column.name }} ({{ column.code }})
                </el-checkbox>
                <el-input
                  v-if="selectedColumns.includes(column.code)"
                  v-model="columnAlias[column.code]"
                  placeholder="别名"
                  size="mini"
                  style="width: 150px; margin-left: 10px;"
                />
              </div>
            </el-checkbox-group>
          </div>
        </el-form-item>
        <el-form-item label="查询条件" prop="whereCondition">
          <div v-if="columnOptions.length === 0" style="color: #909399; font-size: 12px;">
            请先选择分类代码
          </div>
          <div v-else class="where-condition-container">
            <div v-for="(condition, index) in whereConditions" :key="index" class="condition-item">
              <el-select
                v-model="condition.connector"
                placeholder="连接符"
                size="mini"
                style="width: 80px"
                v-if="index > 0"
              >
                <el-option label="AND" value="AND" />
                <el-option label="OR" value="OR" />
              </el-select>
              <el-select
                v-model="condition.field"
                placeholder="字段"
                size="mini"
                style="width: 150px"
              >
                <el-option
                  v-for="column in columnOptions"
                  :key="column.id"
                  :label="column.name + ' (' + column.code + ')'"
                  :value="column.code"
                />
              </el-select>
              <el-select
                v-model="condition.operator"
                placeholder="操作符"
                size="mini"
                style="width: 100px"
              >
                <el-option label="等于 (=)" value="=" />
                <el-option label="不等于 (!=)" value="!=" />
                <el-option label="大于 (>)" value=">" />
                <el-option label="小于 (<)" value="<" />
                <el-option label="大于等于 (>=)" value=">=" />
                <el-option label="小于等于 (<=)" value="<=" />
                <el-option label="包含" value="like" />
                <el-option label="不包含" value="not like" />
                <el-option label="为空" value="is null" />
                <el-option label="不为空" value="is not null" />
              </el-select>
              <el-input
                v-model="condition.value"
                placeholder="值"
                size="mini"
                style="width: 150px"
                v-if="condition.operator !== 'is null' && condition.operator !== 'is not null'"
              />
              <el-button
                type="danger"
                icon="el-icon-delete"
                size="mini"
                circle
                @click="removeCondition(index)"
              />
            </div>
            <el-button
              type="primary"
              icon="el-icon-plus"
              size="mini"
              @click="addCondition"
              style="margin-top: 10px"
            >添加条件</el-button>
          </div>
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
import { listDictionary, getDictionary, delDictionary, addDictionary, updateDictionary } from "@/api/edd/dictionary/dictionary";
import { getCategoryByCode, getCategoryById, listCategory } from '@/api/edd/dictionary/category'
import { listColumn } from "@/api/edd/dictionary/column";

export default {
  name: "Dictionary",
  data() {
    return {
      categoryId: this.$route.query.categoryId,
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      dictionaryList: [],
      defaultCategoryCode: "",
      title: "",
      open: false,
      isEdit: false,
      dateRange: [],
      categoryOptions: [],
      columnOptions: [],
      selectedColumns: [],
      columnAlias: {},
      whereConditions: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        categoryCode: undefined,
        name: undefined,
        code: undefined
      },
      form: {},
      rules: {
        categoryCode: [
          { required: true, message: "分类代码不能为空", trigger: "change" }
        ],
        name: [
          { required: true, message: "字典名称不能为空", trigger: "blur" }
        ],
        code: [
          { required: true, message: "字典代码不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getCategoryList();
    if (this.categoryId) {
      this.getCategory(this.categoryId);
    } else {
      this.getList();
    }
  },
  methods: {
    getCategory(categoryId) {
      getCategoryById(categoryId).then(response => {
        if (response.data) {
          this.queryParams.categoryCode = response.data.code;
          this.defaultCategoryCode = response.data.code;
          this.getList();
        }
      });
    },
    getCategoryList() {
      listCategory({ pageNum: 1, pageSize: 1000 }).then(response => {
        this.categoryOptions = response.data.items;
      });
    },
    getList() {
      this.loading = true;
      listDictionary(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.dictionaryList = response.data.items || [];
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
        name: undefined,
        code: undefined,
        categoryCode: undefined,
        selectColumn: undefined,
        whereCondition: undefined,
        enable: true,
        sort: 0
      };
      this.columnOptions = [];
      this.selectedColumns = [];
      this.columnAlias = {};
      this.whereConditions = [];
      this.isEdit = false;
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
      this.dateRange = [];
      this.resetForm("queryForm");
      if (this.defaultCategoryCode) {
        this.queryParams.categoryCode = this.defaultCategoryCode;
      } else {
        this.queryParams.categoryCode = undefined;
      }
      this.handleQuery();
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加字典";
      this.form.categoryCode = this.queryParams.categoryCode;
      if (this.form.categoryCode) {
        this.loadColumnsByCategoryCode(this.form.categoryCode);
      }
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids;
      getDictionary(id).then(response => {
        this.form = response.data;
        this.isEdit = true;
        this.open = true;
        this.title = "修改字典";
        if (this.form.categoryCode) {
          this.loadColumnsByCategoryCode(this.form.categoryCode);
        }
        if (this.form.selectColumn) {
          try {
            const selectColumns = JSON.parse(this.form.selectColumn);
            this.selectedColumns = selectColumns.map(item => item.targetColumn);
            this.columnAlias = {};
            selectColumns.forEach(item => {
              this.columnAlias[item.targetColumn] = item.aliasName || '';
            });
          } catch (e) {
            console.error('解析查询列失败', e);
          }
        }
        if (this.form.whereCondition) {
          try {
            const conditions = JSON.parse(this.form.whereCondition);
            this.whereConditions = conditions.map(item => ({
              connector: item.connector || 'AND',
              field: item.field || '',
              operator: item.operator || '=',
              value: item.value || ''
            }));
          } catch (e) {
            console.error('解析查询条件失败', e);
            this.whereConditions = [];
          }
        }
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          const selectColumnData = this.selectedColumns.map(code => ({
            aliasName: this.columnAlias[code] || '',
            targetColumn: code
          }));
          this.form.selectColumn = JSON.stringify(selectColumnData);

          const whereConditionData = this.whereConditions.map(condition => ({
            connector: condition.connector || 'AND',
            field: condition.field || '',
            operator: condition.operator || '=',
            value: condition.value || ''
          }));
          this.form.whereCondition = JSON.stringify(whereConditionData);

          if (this.form.id != undefined) {
            updateDictionary(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDictionary(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除字典编号为"' + ids + '"的数据项？').then(function() {
        return delDictionary(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download('edd-dictionary/api/mpt/dictionary/v1/export', {
        ...this.queryParams
      }, `dictionary_${new Date().getTime()}.xlsx`);
    },
    handleCategoryChange(categoryCode) {
      if (categoryCode) {
        this.loadColumnsByCategoryCode(categoryCode);
        this.selectedColumns = [];
        this.columnAlias = {};
        this.whereConditions = [];
      } else {
        this.columnOptions = [];
        this.selectedColumns = [];
        this.columnAlias = {};
        this.whereConditions = [];
      }
    },
    loadColumnsByCategoryCode(categoryCode) {
      const category = this.categoryOptions.find(item => item.code === categoryCode);
      if (category && category.id) {
        listColumn(category.id, { pageNum: 1, pageSize: 1000 }).then(response => {
          if (response.data && response.data.items) {
            this.columnOptions = response.data.items;
          } else {
            this.columnOptions = [];
          }
        }).catch(() => {
          this.columnOptions = [];
        });
      }
    },
    addCondition() {
      this.whereConditions.push({
        connector: 'AND',
        field: '',
        operator: '=',
        value: ''
      });
    },
    removeCondition(index) {
      this.whereConditions.splice(index, 1);
    }
  }
};
</script>

<style scoped>
.select-column-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.column-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.column-item:last-child {
  margin-bottom: 0;
}

.where-condition-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.condition-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.condition-item:last-child {
  margin-bottom: 0;
}
</style>
