<template>
  <div class="app-container">
    <!-- ========== 选项族（主表）查询表单 ========== -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="商品分类" prop="category">
        <el-select v-model="queryParams.category" placeholder="请选择商品分类" clearable>
          <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value"/>
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
          @click="handleFamilyAdd"
          v-hasPermi="['mdm:optionFamily:add']"
        >新增选项族</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleFamilyUpdate"
          v-hasPermi="['mdm:optionFamily:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleFamilyDelete"
          v-hasPermi="['mdm:optionFamily:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getFamilyList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="familyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="选项族代码" prop="code" width="160"/>
      <el-table-column label="选项族名称" prop="name"/>
      <el-table-column label="本地化名称" prop="nameLocal"/>
      <el-table-column label="商品分类" align="center" width="100">
        <template slot-scope="scope">
          {{ categoryLabel(scope.row.category) }}
        </template>
      </el-table-column>
      <el-table-column label="描述" prop="description" show-overflow-tooltip/>
      <el-table-column label="状态" align="center" width="80">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center"/>
      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="280" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-s-grid"
            @click="handleManageCodes(scope.row)"
            v-hasPermi="['mdm:optionFamily:edit']"
          >管理选项码</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleFamilyUpdate(scope.row)"
            v-hasPermi="['mdm:optionFamily:edit']"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleFamilyDeactivate(scope.row)"
            v-hasPermi="['mdm:optionFamily:remove']"
          >停用</el-button>
          <el-button
            v-if="scope.row.status === 'DRAFT'"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleFamilyDelete(scope.row)"
            v-hasPermi="['mdm:optionFamily:remove']"
          >删除</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleFamilyHistory(scope.row)"
            v-hasPermi="['mdm:optionFamily:query']"
          >历史</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.size"
      @pagination="getFamilyList"
    />

    <!-- ========== 选项族 新增/修改 对话框 ========== -->
    <el-dialog :title="familyTitle" :visible.sync="familyOpen" width="600px" append-to-body>
      <el-form ref="familyForm" :model="familyForm" :rules="familyRules" label-width="120px">
        <el-form-item label="选项族代码" prop="code">
          <el-input v-model="familyForm.code" :readonly="familyForm.id !== undefined" placeholder="请输入选项族代码"/>
        </el-form-item>
        <el-form-item label="选项族名称" prop="name">
          <el-input v-model="familyForm.name" placeholder="请输入选项族名称"/>
        </el-form-item>
        <el-form-item label="本地化名称">
          <el-input v-model="familyForm.nameLocal" placeholder="请输入本地化名称"/>
        </el-form-item>
        <el-form-item label="商品分类" prop="category">
          <el-select v-model="familyForm.category" placeholder="请选择商品分类">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="familyForm.description" type="textarea" placeholder="请输入描述"/>
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="familyEffectiveDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            @change="handleFamilyEffectiveDateChange"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFamilyForm">确 定</el-button>
        <el-button @click="cancelFamily">取 消</el-button>
      </div>
    </el-dialog>

    <!-- ========== 选项族 历史 ========== -->
    <history-snapshot
      v-model="familyHistoryVisible"
      :loading="familyHistoryLoading"
      :history-list="familyHistoryList"
      :fields="familyHistoryFields"
    >
      <template #detail-fields="{ data }">
        <el-form-item label="选项族代码">{{ data.code }}</el-form-item>
        <el-form-item label="选项族名称">{{ data.name }}</el-form-item>
        <el-form-item label="本地化名称">{{ data.nameLocal }}</el-form-item>
        <el-form-item label="商品分类">{{ categoryLabel(data.category) }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ statusLabel(data.status) }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
      </template>
    </history-snapshot>

    <!-- ========== 选项码管理 抽屉 ========== -->
    <el-drawer
      :title="codeDrawerTitle"
      :visible.sync="codeDrawerOpen"
      direction="rtl"
      size="70%"
      append-to-body
    >
      <div class="option-code-drawer">
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="mini"
              @click="handleCodeAdd"
              v-hasPermi="['mdm:optionCode:add']"
            >新增选项码</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-checkbox v-model="codeQueryParams.includeInactive" @change="getCodeList">包含停用数据</el-checkbox>
          </el-col>
          <el-col :span="1.5">
            <el-button
              icon="el-icon-refresh"
              size="mini"
              @click="getCodeList"
            >刷新</el-button>
          </el-col>
        </el-row>

        <el-table v-loading="codeLoading" :data="codeList" size="small">
          <el-table-column label="选项码代码" prop="code" width="160"/>
          <el-table-column label="选项码名称" prop="name"/>
          <el-table-column label="本地化名称" prop="nameLocal"/>
          <el-table-column label="描述" prop="description" show-overflow-tooltip/>
          <el-table-column label="状态" align="center" width="80">
            <template slot-scope="scope">
              <el-tag :type="statusTagType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="版本" prop="version" width="60" align="center"/>
          <el-table-column label="创建时间" align="center" width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleCodeUpdate(scope.row)"
                v-hasPermi="['mdm:optionCode:edit']"
              >修改</el-button>
              <el-button
                v-if="scope.row.status === 'ACTIVE'"
                size="mini"
                type="text"
                icon="el-icon-close"
                @click="handleCodeDeactivate(scope.row)"
                v-hasPermi="['mdm:optionCode:remove']"
              >停用</el-button>
              <el-button
                v-if="scope.row.status === 'DRAFT'"
                size="mini"
                type="text"
                icon="el-icon-delete"
                @click="handleCodeDelete(scope.row)"
                v-hasPermi="['mdm:optionCode:remove']"
              >删除</el-button>
              <el-button
                size="mini"
                type="text"
                icon="el-icon-time"
                @click="handleCodeHistory(scope.row)"
                v-hasPermi="['mdm:optionCode:query']"
              >历史</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="codeTotal>0"
          :total="codeTotal"
          :page.sync="codeQueryParams.page"
          :limit.sync="codeQueryParams.size"
          @pagination="getCodeList"
        />
      </div>
    </el-drawer>

    <!-- ========== 选项码 新增/修改 对话框 ========== -->
    <el-dialog :title="codeTitle" :visible.sync="codeFormOpen" width="600px" append-to-body>
      <el-form ref="codeForm" :model="codeForm" :rules="codeRules" label-width="120px">
        <el-form-item label="所属选项族">
          <el-input v-model="codeForm.optionFamilyCode" disabled/>
        </el-form-item>
        <el-form-item label="选项码代码" prop="code">
          <el-input v-model="codeForm.code" :readonly="codeForm.id !== undefined" placeholder="请输入选项码代码"/>
        </el-form-item>
        <el-form-item label="选项码名称" prop="name">
          <el-input v-model="codeForm.name" placeholder="请输入选项码名称"/>
        </el-form-item>
        <el-form-item label="本地化名称">
          <el-input v-model="codeForm.nameLocal" placeholder="请输入本地化名称"/>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="codeForm.description" type="textarea" placeholder="请输入描述"/>
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="codeEffectiveDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            @change="handleCodeEffectiveDateChange"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitCodeForm">确 定</el-button>
        <el-button @click="cancelCodeForm">取 消</el-button>
      </div>
    </el-dialog>

    <!-- ========== 选项码 历史 ========== -->
    <history-snapshot
      v-model="codeHistoryVisible"
      :loading="codeHistoryLoading"
      :history-list="codeHistoryList"
      :fields="codeHistoryFields"
    >
      <template #detail-fields="{ data }">
        <el-form-item label="选项码代码">{{ data.code }}</el-form-item>
        <el-form-item label="选项码名称">{{ data.name }}</el-form-item>
        <el-form-item label="本地化名称">{{ data.nameLocal }}</el-form-item>
        <el-form-item label="所属选项族">{{ data.optionFamilyCode }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ statusLabel(data.status) }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
      </template>
    </history-snapshot>
  </div>
</template>

<script>
import {
  listOptionFamily,
  getOptionFamily,
  addOptionFamily,
  updateOptionFamily,
  delOptionFamily,
  deactivateOptionFamily,
  listOptionFamilyHistory
} from "@/api/mdm/optionFamily";
import {
  listOptionCode,
  getOptionCode,
  addOptionCode,
  updateOptionCode,
  delOptionCode,
  deactivateOptionCode,
  listOptionCodeHistory
} from "@/api/mdm/optionCode";
import HistorySnapshot from "@/components/HistorySnapshot/index.vue";

export default {
  name: "MdmOption",
  components: {
    HistorySnapshot
  },
  dicts: [],
  data() {
    return {
      categoryOptions: [
        { value: 'EXTERIOR', label: '外饰' },
        { value: 'INTERIOR', label: '内饰' },
        { value: 'POWERTRAIN', label: '动力总成' },
        { value: 'INTELLIGENT', label: '智能化' },
        { value: 'COMFORT', label: '舒适便利' },
        { value: 'SAFETY', label: '安全' },
        { value: 'ACCESSORY', label: '选装附件' },
        { value: 'OTHER', label: '其他' }
      ],
      // ===== 选项族 主表 =====
      loading: true,
      ids: [],
      codes: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      familyList: [],
      familyTitle: "",
      familyOpen: false,
      familyEffectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        includeInactive: false
      },
      familyForm: {},
      familyRules: {
        code: [{ required: true, message: "选项族代码不能为空", trigger: "blur" }],
        name: [{ required: true, message: "选项族名称不能为空", trigger: "blur" }],
        category: [{ required: true, message: "请选择商品分类", trigger: "change" }]
      },
      // ===== 选项族 历史 =====
      familyHistoryVisible: false,
      familyHistoryLoading: false,
      familyHistoryList: [],
      familyHistoryCode: '',
      familyHistoryFields: [
        { prop: 'code', label: '选项族代码' },
        { prop: 'name', label: '选项族名称' },
        { prop: 'nameLocal', label: '本地化名称' },
        { prop: 'category', label: '商品分类', type: 'category' },
        { prop: 'description', label: '描述' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' }
      ],

      // ===== 选项码 抽屉 + 列表 =====
      codeDrawerOpen: false,
      codeDrawerTitle: '',
      currentFamily: {},
      codeLoading: false,
      codeList: [],
      codeTotal: 0,
      codeQueryParams: {
        page: 1,
        size: 10,
        optionFamilyCode: undefined,
        includeInactive: false
      },
      // ===== 选项码 新增/修改 =====
      codeFormOpen: false,
      codeTitle: '',
      codeForm: {},
      codeEffectiveDateRange: [],
      codeRules: {
        code: [{ required: true, message: "选项码代码不能为空", trigger: "blur" }],
        name: [{ required: true, message: "选项码名称不能为空", trigger: "blur" }]
      },
      // ===== 选项码 历史 =====
      codeHistoryVisible: false,
      codeHistoryLoading: false,
      codeHistoryList: [],
      codeHistoryCode: '',
      codeHistoryFields: [
        { prop: 'code', label: '选项码代码' },
        { prop: 'name', label: '选项码名称' },
        { prop: 'nameLocal', label: '本地化名称' },
        { prop: 'optionFamilyCode', label: '所属选项族' },
        { prop: 'description', label: '描述' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' }
      ]
    };
  },
  created() {
    this.getFamilyList();
  },
  methods: {
    // ====== 公共 ======
    categoryLabel(category) {
      const found = this.categoryOptions.find(item => item.value === category);
      return found ? found.label : category;
    },
    statusLabel(status) {
      switch (status) {
        case 'ACTIVE': return '启用';
        case 'INACTIVE': return '停用';
        case 'DEPRECATED': return '废弃';
        case 'DRAFT': return '草稿';
        default: return status;
      }
    },
    statusTagType(status) {
      switch (status) {
        case 'ACTIVE': return 'success';
        case 'INACTIVE': return 'info';
        case 'DEPRECATED': return 'danger';
        default: return 'warning';
      }
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.codes = selection.map(item => item.code);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },

    // ====== 选项族 ======
    getFamilyList() {
      this.loading = true;
      listOptionFamily(this.queryParams).then(response => {
        this.familyList = response.data.rows;
        this.total = response.data.total;
        this.loading = false;
      });
    },
    handleQuery() {
      this.queryParams.page = 1;
      this.getFamilyList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.includeInactive = false;
      this.queryParams.category = undefined;
      this.handleQuery();
    },
    cancelFamily() {
      this.familyOpen = false;
      this.resetFamilyForm();
    },
    resetFamilyForm() {
      this.familyForm = {
        code: undefined,
        name: undefined,
        nameLocal: undefined,
        category: undefined,
        description: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined
      };
      this.familyEffectiveDateRange = [];
      this.resetForm("familyForm");
    },
    handleFamilyEffectiveDateChange(val) {
      if (val) {
        this.familyForm.effectiveFrom = val[0];
        this.familyForm.effectiveTo = val[1];
      } else {
        this.familyForm.effectiveFrom = undefined;
        this.familyForm.effectiveTo = undefined;
      }
    },
    handleFamilyAdd() {
      this.resetFamilyForm();
      this.familyOpen = true;
      this.familyTitle = "添加选项族";
    },
    handleFamilyUpdate(row) {
      this.resetFamilyForm();
      const code = (row && row.code) || this.codes[0];
      getOptionFamily(code).then(response => {
        this.familyForm = response.data;
        if (this.familyForm.effectiveFrom && this.familyForm.effectiveTo) {
          this.familyEffectiveDateRange = [this.familyForm.effectiveFrom, this.familyForm.effectiveTo];
        }
        this.familyOpen = true;
        this.familyTitle = "修改选项族";
      });
    },
    submitFamilyForm() {
      this.$refs["familyForm"].validate(valid => {
        if (!valid) return;
        if (this.familyForm.id !== undefined) {
          updateOptionFamily(this.familyForm.code, this.familyForm).then(() => {
            this.$modal.msgSuccess("修改成功");
            this.familyOpen = false;
            this.getFamilyList();
          });
        } else {
          addOptionFamily(this.familyForm).then(() => {
            this.$modal.msgSuccess("新增成功");
            this.familyOpen = false;
            this.getFamilyList();
          });
        }
      });
    },
    handleFamilyDeactivate(row) {
      const code = row.code;
      this.$modal.confirm('是否确认停用选项族"' + code + '"？').then(function() {
        return deactivateOptionFamily(code, '');
      }).then(() => {
        this.getFamilyList();
        this.$modal.msgSuccess("停用成功");
      }).catch(() => {});
    },
    handleFamilyDelete(row) {
      const code = (row && row.code) || this.codes[0];
      this.$modal.confirm('是否确认删除选项族"' + code + '"？').then(function() {
        return delOptionFamily(code, '');
      }).then(() => {
        this.getFamilyList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleFamilyHistory(row) {
      this.familyHistoryCode = row.code;
      this.familyHistoryVisible = true;
      this.familyHistoryLoading = true;
      listOptionFamilyHistory(this.familyHistoryCode).then(response => {
        this.familyHistoryList = response.data.rows;
        this.familyHistoryLoading = false;
      });
    },

    // ====== 选项码 抽屉 + 列表 ======
    handleManageCodes(row) {
      this.currentFamily = row;
      this.codeDrawerTitle = `选项码管理 - ${row.name}（${row.code}）`;
      this.codeQueryParams = {
        page: 1,
        size: 10,
        optionFamilyCode: row.code,
        includeInactive: false
      };
      this.codeDrawerOpen = true;
      this.getCodeList();
    },
    getCodeList() {
      this.codeLoading = true;
      listOptionCode(this.codeQueryParams).then(response => {
        this.codeList = response.data.rows;
        this.codeTotal = response.data.total;
        this.codeLoading = false;
      });
    },
    cancelCodeForm() {
      this.codeFormOpen = false;
      this.resetCodeForm();
    },
    resetCodeForm() {
      this.codeForm = {
        code: undefined,
        name: undefined,
        nameLocal: undefined,
        optionFamilyCode: this.currentFamily.code,
        description: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined
      };
      this.codeEffectiveDateRange = [];
      this.resetForm("codeForm");
    },
    handleCodeEffectiveDateChange(val) {
      if (val) {
        this.codeForm.effectiveFrom = val[0];
        this.codeForm.effectiveTo = val[1];
      } else {
        this.codeForm.effectiveFrom = undefined;
        this.codeForm.effectiveTo = undefined;
      }
    },
    handleCodeAdd() {
      this.resetCodeForm();
      this.codeFormOpen = true;
      this.codeTitle = "添加选项码";
    },
    handleCodeUpdate(row) {
      this.resetCodeForm();
      getOptionCode(row.code).then(response => {
        this.codeForm = response.data;
        if (this.codeForm.effectiveFrom && this.codeForm.effectiveTo) {
          this.codeEffectiveDateRange = [this.codeForm.effectiveFrom, this.codeForm.effectiveTo];
        }
        this.codeFormOpen = true;
        this.codeTitle = "修改选项码";
      });
    },
    submitCodeForm() {
      this.$refs["codeForm"].validate(valid => {
        if (!valid) return;
        // 强制选项码归属当前选项族
        this.codeForm.optionFamilyCode = this.currentFamily.code;
        if (this.codeForm.id !== undefined) {
          updateOptionCode(this.codeForm.code, this.codeForm).then(() => {
            this.$modal.msgSuccess("修改成功");
            this.codeFormOpen = false;
            this.getCodeList();
          });
        } else {
          addOptionCode(this.codeForm).then(() => {
            this.$modal.msgSuccess("新增成功");
            this.codeFormOpen = false;
            this.getCodeList();
          });
        }
      });
    },
    handleCodeDeactivate(row) {
      const code = row.code;
      this.$modal.confirm('是否确认停用选项码"' + code + '"？').then(function() {
        return deactivateOptionCode(code, '');
      }).then(() => {
        this.getCodeList();
        this.$modal.msgSuccess("停用成功");
      }).catch(() => {});
    },
    handleCodeDelete(row) {
      const code = row.code;
      this.$modal.confirm('是否确认删除选项码"' + code + '"？').then(function() {
        return delOptionCode(code, '');
      }).then(() => {
        this.getCodeList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleCodeHistory(row) {
      this.codeHistoryCode = row.code;
      this.codeHistoryVisible = true;
      this.codeHistoryLoading = true;
      listOptionCodeHistory(this.codeHistoryCode).then(response => {
        this.codeHistoryList = response.data.rows;
        this.codeHistoryLoading = false;
      });
    }
  }
};
</script>

<style scoped>
.option-code-drawer {
  padding: 0 20px 20px 20px;
}
</style>
