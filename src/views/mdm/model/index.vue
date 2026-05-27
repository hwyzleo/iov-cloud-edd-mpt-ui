<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="车系" prop="carLineCode">
        <el-select v-model="queryParams.carLineCode" placeholder="请选择车系" clearable filterable style="width: 180px">
          <el-option
            v-for="item in carLineOptions"
            :key="item.code"
            :label="item.name"
            :value="item.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="平台" prop="platformCode">
        <el-select v-model="queryParams.platformCode" placeholder="请选择平台" clearable filterable style="width: 180px">
          <el-option
            v-for="item in platformOptions"
            :key="item.code"
            :label="item.name"
            :value="item.code"
          />
        </el-select>
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
          v-hasPermi="['mdm:model:add']"
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
          v-hasPermi="['mdm:model:edit']"
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
          v-hasPermi="['mdm:model:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="modelList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="车型代码" prop="code" width="140"/>
      <el-table-column label="车型名称" prop="name"/>
      <el-table-column label="本地化名称" prop="nameLocal"/>
      <el-table-column label="车系" prop="carLineCode" width="120"/>
      <el-table-column label="平台" prop="platformCode" width="120"/>
      <el-table-column label="车型年" prop="modelYear" width="80" align="center"/>
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
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['mdm:model:edit']"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
            v-hasPermi="['mdm:model:remove']"
          >停用</el-button>
          <el-button
            v-if="scope.row.status === 'DRAFT'"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['mdm:model:remove']"
          >删除</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleHistory(scope.row)"
            v-hasPermi="['mdm:model:query']"
          >查看历史</el-button>
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

    <!-- 添加或修改车型对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="车型代码" prop="code">
          <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入车型代码"/>
        </el-form-item>
        <el-form-item label="车型名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入车型名称"/>
        </el-form-item>
        <el-form-item label="本地化名称">
          <el-input v-model="form.nameLocal" placeholder="请输入本地化名称"/>
        </el-form-item>
        <el-form-item label="车系" prop="carLineCode">
          <el-select v-model="form.carLineCode" placeholder="请选择车系" clearable filterable style="width: 100%">
            <el-option
              v-for="item in carLineOptions"
              :key="item.code"
              :label="item.name + ' (' + item.code + ')'"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="平台" prop="platformCode">
          <el-select v-model="form.platformCode" placeholder="请选择平台" clearable filterable style="width: 100%">
            <el-option
              v-for="item in platformOptions"
              :key="item.code"
              :label="item.name + ' (' + item.code + ')'"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="车型年">
          <el-input v-model="form.modelYear" placeholder="请输入车型年，如 2025"/>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述"/>
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

    <history-snapshot
      v-model="historyVisible"
      :loading="historyLoading"
      :history-list="historyList"
      :fields="historyFields"
    >
      <template #detail-fields="{ data }">
        <el-form-item label="车型代码">{{ data.code }}</el-form-item>
        <el-form-item label="车型名称">{{ data.name }}</el-form-item>
        <el-form-item label="本地化名称">{{ data.nameLocal }}</el-form-item>
        <el-form-item label="车系代码">{{ data.carLineCode }}</el-form-item>
        <el-form-item label="平台代码">{{ data.platformCode }}</el-form-item>
        <el-form-item label="车型年">{{ data.modelYear }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ data.status === 'ACTIVE' ? '启用' : data.status === 'INACTIVE' ? '停用' : data.status }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
      </template>
    </history-snapshot>
  </div>
</template>

<script>
import {
  listModel,
  getModel,
  addModel,
  updateModel,
  delModel,
  deactivateModel,
  listModelHistory
} from "@/api/mdm/model";
import { listSeries } from "@/api/mdm/carline";
import { listPlatform } from "@/api/mdm/platform";
import HistorySnapshot from "@/components/HistorySnapshot/index.vue";

export default {
  name: "MdmModel",
  components: {
    HistorySnapshot
  },
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
      modelList: [],
      carLineOptions: [],
      platformOptions: [],
      title: "",
      open: false,
      effectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        carLineCode: undefined,
        platformCode: undefined,
        includeInactive: false
      },
      form: {},
      historyVisible: false,
      historyLoading: false,
      historyList: [],
      historyFields: [
        { prop: 'code', label: '车型代码' },
        { prop: 'name', label: '车型名称' },
        { prop: 'nameLocal', label: '本地化名称' },
        { prop: 'carLineCode', label: '车系代码' },
        { prop: 'platformCode', label: '平台代码' },
        { prop: 'modelYear', label: '车型年' },
        { prop: 'description', label: '描述' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' }
      ],
      historyCode: '',
      rules: {
        code: [
          { required: true, message: "车型代码不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "车型名称不能为空", trigger: "blur" }
        ],
        carLineCode: [
          { required: true, message: "车系不能为空", trigger: "change" }
        ],
        platformCode: [
          { required: true, message: "平台不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
    this.getCarLineOptions();
    this.getPlatformOptions();
  },
  methods: {
    getList() {
      this.loading = true;
      listModel(this.queryParams).then(response => {
        this.modelList = response.data.rows;
        this.total = response.data.total;
        this.loading = false;
      });
    },
    getCarLineOptions() {
      listSeries({ page: 1, size: 1000 }).then(response => {
        this.carLineOptions = response.data.rows;
      });
    },
    getPlatformOptions() {
      listPlatform({ page: 1, size: 1000 }).then(response => {
        this.platformOptions = response.data.rows;
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
        carLineCode: undefined,
        platformCode: undefined,
        modelYear: undefined,
        description: undefined,
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
      this.title = "添加车型";
    },
    handleUpdate(row) {
      this.reset();
      const code = row.code || this.codes[0];
      getModel(code).then(response => {
        this.form = response.data;
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo];
        }
        this.open = true;
        this.title = "修改车型";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateModel(this.form.code, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addModel(this.form).then(response => {
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
      this.$modal.confirm('是否确认停用车型"' + code + '"？').then(function() {
        return deactivateModel(code, '');
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("停用成功");
      }).catch(() => {});
    },
    handleDelete(row) {
      const code = row.code || this.codes[0];
      this.$modal.confirm('是否确认删除车型"' + code + '"？').then(function() {
        return delModel(code, '');
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleHistory(row) {
      this.historyCode = row.code;
      this.historyVisible = true;
      this.loadHistory();
    },
    loadHistory() {
      this.historyLoading = true;
      listModelHistory(this.historyCode).then(response => {
        this.historyList = response.data.rows;
        this.historyLoading = false;
      });
    }
  }
};
</script>
