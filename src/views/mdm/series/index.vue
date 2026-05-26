<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="品牌" prop="brandCode">
        <el-select v-model="queryParams.brandCode" placeholder="请选择品牌" clearable style="width: 150px">
          <el-option
            v-for="brand in brandOptions"
            :key="brand.code"
            :label="brand.name"
            :value="brand.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="车系代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入车系代码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="车系名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入车系名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="包含停用">
        <el-checkbox v-model="queryParams.includeInactive">包含停用数据</el-checkbox>
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
          v-hasPermi="['mdm:series:add']"
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
          v-hasPermi="['mdm:series:edit']"
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
          v-hasPermi="['mdm:series:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['mdm:series:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="seriesList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="品牌代码" prop="brandCode" width="100"/>
      <el-table-column label="车系代码" prop="code" width="100"/>
      <el-table-column label="车系名称" prop="name"/>
      <el-table-column label="本地化名称" prop="nameLocal"/>
      <el-table-column label="车系类型" align="center" width="100">
        <template slot-scope="scope">
          <el-tag>{{ scope.row.seriesType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="生命周期" align="center" width="120">
        <template slot-scope="scope">
          <el-tag :type="scope.row.lifecycleStatus === 'ON_SALE' ? 'success' : scope.row.lifecycleStatus === 'IN_DEVELOPMENT' ? 'warning' : 'info'">
            {{ scope.row.lifecycleStatus === 'IN_DEVELOPMENT' ? '开发中' : scope.row.lifecycleStatus === 'ON_SALE' ? '在售' : '已停产' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="目标市场" align="center" width="80">
        <template slot-scope="scope">
          {{ scope.row.targetMarket === 'DOMESTIC' ? '国内' : scope.row.targetMarket === 'OVERSEAS' ? '海外' : scope.row.targetMarket === 'GLOBAL' ? '全球' : scope.row.targetMarket }}
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'INACTIVE' ? 'info' : scope.row.status === 'DEPRECATED' ? 'danger' : 'warning'">
            {{ scope.row.status === 'ACTIVE' ? '启用' : scope.row.status === 'INACTIVE' ? '停用' : scope.row.status === 'DEPRECATED' ? '废弃' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center"/>
      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['mdm:series:edit']"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
            v-hasPermi="['mdm:series:remove']"
          >停用</el-button>
          <el-button
            v-if="scope.row.status === 'DRAFT'"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['mdm:series:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.size"
      @pagination="getList"
    />

    <!-- 添加或修改车系对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="品牌" prop="brandCode">
          <el-select v-model="form.brandCode" placeholder="请选择品牌" clearable>
            <el-option
              v-for="brand in brandOptions"
              :key="brand.code"
              :label="brand.name"
              :value="brand.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="车系代码" prop="code">
          <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入车系代码"/>
        </el-form-item>
        <el-form-item label="车系名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入车系名称"/>
        </el-form-item>
        <el-form-item label="本地化名称">
          <el-input v-model="form.nameLocal" placeholder="请输入本地化名称"/>
        </el-form-item>
        <el-form-item label="车系类型" prop="seriesType">
          <el-select v-model="form.seriesType" placeholder="请选择车系类型">
            <el-option label="轿车" value="SEDAN"/>
            <el-option label="SUV" value="SUV"/>
            <el-option label="MPV" value="MPV"/>
            <el-option label="皮卡" value="PICKUP"/>
            <el-option label="商用车" value="COMMERCIAL"/>
          </el-select>
        </el-form-item>
        <el-form-item label="生命周期状态">
          <el-select v-model="form.lifecycleStatus" placeholder="请选择生命周期状态">
            <el-option label="开发中" value="IN_DEVELOPMENT"/>
            <el-option label="在售" value="ON_SALE"/>
            <el-option label="已停产" value="DISCONTINUED"/>
          </el-select>
        </el-form-item>
        <el-form-item label="目标市场">
          <el-select v-model="form.targetMarket" placeholder="请选择目标市场">
            <el-option label="国内" value="DOMESTIC"/>
            <el-option label="海外" value="OVERSEAS"/>
            <el-option label="全球" value="GLOBAL"/>
          </el-select>
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="effectiveDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            @change="handleEffectiveDateChange"
          />
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
  listSeries,
  getSeries,
  addSeries,
  updateSeries,
  delSeries,
  deactivateSeries
} from "@/api/mdm/series";
import { listBrand } from "@/api/mdm/brand";

export default {
  name: "MdmSeries",
  dicts: [],
  data() {
    return {
      loading: true,
      ids: [],
      codes: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      seriesList: [],
      brandOptions: [],
      title: "",
      open: false,
      effectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        brandCode: undefined,
        includeInactive: false
      },
      form: {},
      rules: {
        brandCode: [
          { required: true, message: "品牌不能为空", trigger: "change" }
        ],
        code: [
          { required: true, message: "车系代码不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "车系名称不能为空", trigger: "blur" }
        ],
        seriesType: [
          { required: true, message: "车系类型不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
    this.getBrandOptions();
  },
  methods: {
    getList() {
      this.loading = true;
      listSeries(this.queryParams).then(response => {
        this.seriesList = response.data.rows;
        this.total = response.data.total;
        this.loading = false;
      });
    },
    getBrandOptions() {
      listBrand({ page: 1, size: 1000 }).then(response => {
        this.brandOptions = response.data.rows;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        code: undefined,
        name: undefined,
        nameLocal: undefined,
        brandCode: undefined,
        seriesType: undefined,
        lifecycleStatus: undefined,
        targetMarket: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined
      };
      this.effectiveDateRange = [];
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.page = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.includeInactive = false;
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.codes = selection.map(item => item.code);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleEffectiveDateChange(val) {
      if (val) {
        this.form.effectiveFrom = val[0];
        this.form.effectiveTo = val[1];
      } else {
        this.form.effectiveFrom = undefined;
        this.form.effectiveTo = undefined;
      }
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加车系";
    },
    handleUpdate(row) {
      this.reset();
      const code = row.code || this.codes[0];
      getSeries(code).then(response => {
        this.form = response.data;
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo];
        }
        this.open = true;
        this.title = "修改车系";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateSeries(this.form.code, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addSeries(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDeactivate(row) {
      const code = row.code;
      this.$modal.confirm('是否确认停用车系"' + code + '"？').then(function() {
        return deactivateSeries(code, '');
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("停用成功");
      }).catch(() => {});
    },
    handleDelete(row) {
      const code = row.code || this.codes[0];
      this.$modal.confirm('是否确认删除车系"' + code + '"？').then(function() {
        return delSeries(code, '');
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download('edd-mdm/api/mpt/series/v1/export', {
        ...this.queryParams
      }, `series_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>
