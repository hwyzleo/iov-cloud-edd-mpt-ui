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
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-refresh"
          size="mini"
          @click="handleCatalogBootstrap"
          v-hasPermi="['mdm:optionFamily:add']"
        >标准目录初始化</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getFamilyList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="familyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" fixed="left"/>
      <el-table-column label="选项族代码" prop="code" width="280" fixed="left"/>
      <el-table-column label="选项族名称" prop="name" min-width="180"/>
      <el-table-column label="本地化名称" prop="nameLocal" min-width="150"/>
      <el-table-column label="商品分类" align="center" width="150">
        <template slot-scope="scope">
          {{ categoryLabel(scope.row.category) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="80">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center"/>
      <el-table-column label="创建时间" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="320" class-name="small-padding fixed-width" fixed="right">
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
          <el-input v-model="familyForm.code" :readonly="familyForm.id !== undefined" placeholder="请输入选项族代码（OF_分类前缀_语义，企业扩展 OF_前缀_X_语义）" @blur="handleFamilyCodeBlur"/>
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
          <el-table-column label="选项码代码" prop="code" width="220" fixed="left"/>
          <el-table-column label="选项码名称" prop="name" min-width="120"/>
          <el-table-column label="本地化名称" prop="nameLocal" min-width="120"/>
          <el-table-column label="状态" align="center" width="80">
            <template slot-scope="scope">
              <el-tag :type="statusTagType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="版本" prop="version" width="60" align="center"/>
          <el-table-column label="创建时间" align="center" width="140">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width" fixed="right">
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
        <!-- CR-040：展示所属族派生主干，引导新建规范编码 -->
        <el-form-item label="期望主干" v-if="codeStemHint">
          <el-alert :title="codeStemHintText" type="info" :closable="false" show-icon/>
        </el-form-item>
        <el-form-item label="选项码代码" prop="code">
          <el-input v-model="codeForm.code" :readonly="codeForm.id !== undefined" :placeholder="codePlaceholder" @blur="handleCodeCodeBlur"/>
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
  listOptionFamilyHistory,
  bootstrapOptionFamily
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

// CR-035：分类前缀与商品分类固定映射（与后端 OptionFamilyCodePolicy 一致）
const PREFIX_CATEGORY_MAP = {
  EXT: 'EXTERIOR',
  INT: 'INTERIOR',
  PWR: 'POWERTRAIN',
  CHS: 'CHASSIS',
  SMART: 'INTELLIGENT',
  COMF: 'COMFORT',
  SAFE: 'SAFETY',
  ACC: 'ACCESSORY',
  OTH: 'OTHER'
};
// CR-035：标准/扩展 code 格式（全大写字母/数字/下划线）
const FAMILY_CODE_PATTERN = /^OF_(EXT|INT|PWR|SMART|COMF|SAFE|ACC|OTH|CHS)_(?:X_)?[A-Z0-9]+(?:_[A-Z0-9]+)*$/;
// CR-040：选项码统一编码格式（OC_<分类前缀>_<族语义>_<VALUE>，与后端 OptionCodeCodePolicy 一致）
const OPTION_CODE_PATTERN = /^OC_(EXT|INT|PWR|CHS|SMART|COMF|SAFE|ACC|OTH)_[A-Z0-9]+(?:_[A-Z0-9]+)*$/;

export default {
  name: "MdmOption",
  components: {
    HistorySnapshot
  },
  dicts: [],
  data() {
    return {
      categoryOptions: [
        { value: 'EXTERIOR', label: '外观(EXTERIOR)' },
        { value: 'INTERIOR', label: '内饰(INTERIOR)' },
        { value: 'POWERTRAIN', label: '动力(POWERTRAIN)' },
        { value: 'CHASSIS', label: '底盘(CHASSIS)' },
        { value: 'INTELLIGENT', label: '智能(INTELLIGENT)' },
        { value: 'COMFORT', label: '舒适(COMFORT)' },
        { value: 'SAFETY', label: '安全(SAFETY)' },
        { value: 'ACCESSORY', label: '附件(ACCESSORY)' },
        { value: 'OTHER', label: '其他(OTHER)' }
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
        code: [
          { required: true, message: "选项族代码不能为空", trigger: "blur" },
          {
            validator: (rule, value, callback) => {
              if (!value) return callback();
              const upper = value.toUpperCase();
              if (value !== upper) {
                return callback(new Error("选项族代码需全大写字母/数字/下划线，请使用：" + upper));
              }
              if (value.length > 64) {
                return callback(new Error("选项族代码长度不能超过64位"));
              }
              if (!FAMILY_CODE_PATTERN.test(value)) {
                return callback(new Error("格式应为 OF_分类前缀_语义（企业扩展 OF_前缀_X_语义），仅大写字母/数字/下划线"));
              }
              const prefix = value.split("_")[1];
              if (prefix && this.familyForm.category && PREFIX_CATEGORY_MAP[prefix] && PREFIX_CATEGORY_MAP[prefix] !== this.familyForm.category) {
                return callback(new Error("分类前缀 " + prefix + " 与所选商品分类不一致，应选「" + this.categoryLabel(PREFIX_CATEGORY_MAP[prefix]) + "」"));
              }
              callback();
            },
            trigger: "blur"
          }
        ],
        name: [{ required: true, message: "选项族名称不能为空", trigger: "blur" }],
        category: [
          { required: true, message: "请选择商品分类", trigger: "change" },
          {
            validator: (rule, value, callback) => {
              if (!value) return callback();
              const code = this.familyForm.code;
              if (code) {
                const prefix = code.split("_")[1];
                if (prefix && PREFIX_CATEGORY_MAP[prefix] && PREFIX_CATEGORY_MAP[prefix] !== value) {
                  return callback(new Error("所选分类与选项族代码前缀 " + prefix + " 不一致，应选「" + this.categoryLabel(PREFIX_CATEGORY_MAP[prefix]) + "」"));
                }
              }
              callback();
            },
            trigger: "change"
          }
        ]
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
        code: [
          { required: true, message: "选项码代码不能为空", trigger: "blur" },
          {
            validator: (rule, value, callback) => {
              // 修改路径：code 不可变（readonly），不追溯校验 legacy 格式（CR-040 §4）
              if (this.codeForm.id !== undefined) return callback();
              if (!value) return callback();
              // CR-040 §2.2：长度上限 64，超过直接拒绝
              if (value.length > 64) {
                return callback(new Error("选项码代码长度不能超过64位"));
              }
              // CR-040 §2.2：接口不自动转大写或改写输入，小写输入直接判定格式非法
              if (value !== value.toUpperCase()) {
                return callback(new Error("选项码代码需全大写字母/数字/下划线（系统不自动改写输入，请手动改为大写）"));
              }
              if (!OPTION_CODE_PATTERN.test(value)) {
                return callback(new Error("格式应为 OC_分类前缀_族语义_取值（如 OC_EXT_BODY_COLOR_BLACK），仅大写字母/数字/下划线，禁止连续/首尾下划线、空格、连字符、中文"));
              }
              // CR-040 §2.2：必须以所属选项族派生主干开头且 VALUE 非空
              const stem = this.deriveOptionCodeStem(this.currentFamily && this.currentFamily.code);
              if (stem) {
                if (value.indexOf(stem) !== 0) {
                  return callback(new Error("选项码必须以上所属选项族派生主干「" + stem + "」开头"));
                }
                if (value.length <= stem.length) {
                  return callback(new Error("VALUE 不能为空，格式为 " + stem + "<VALUE>"));
                }
              }
              callback();
            },
            trigger: "blur"
          }
        ],
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
  computed: {
    // CR-040：选项码输入框 placeholder（展示所属族派生主干格式）
    codePlaceholder() {
      const stem = this.deriveOptionCodeStem(this.currentFamily && this.currentFamily.code);
      return stem ? "请输入选项码代码（" + stem + "<VALUE>，如 " + stem + "BLACK）" : "请输入选项码代码";
    },
    // CR-040：期望主干（非 OF_* legacy 族返回 null，不展示提示）
    codeStemHint() {
      return this.deriveOptionCodeStem(this.currentFamily && this.currentFamily.code);
    },
    // CR-040：期望主干提示文案
    codeStemHintText() {
      const stem = this.deriveOptionCodeStem(this.currentFamily && this.currentFamily.code);
      return stem ? "新建选项码必须以所属选项族派生主干开头：" + stem + "<VALUE>（如 " + stem + "BLACK）" : "";
    }
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
    handleFamilyCodeBlur() {
      if (this.familyForm.code && this.familyForm.code !== this.familyForm.code.toUpperCase()) {
        this.familyForm.code = this.familyForm.code.toUpperCase();
        this.$modal.msgWarning("选项族代码已转为大写");
      }
      if (this.$refs["familyForm"]) {
        this.$refs["familyForm"].validateField("code");
      }
    },
    handleCatalogBootstrap() {
      this.$modal.confirm('是否执行选项族标准目录初始化？仅导入 Core 核心标准族（幂等，不覆盖已有业务数据），Conditional 不初始化。').then(() => {
        return bootstrapOptionFamily();
      }).then((response) => {
        const r = response.data;
        this.$modal.msgSuccess("标准目录初始化完成：新建 " + r.created + "，跳过 " + r.skipped + "，冲突 " + r.conflicted + "，失败 " + r.failed);
        this.getFamilyList();
      }).catch(() => {});
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
      // 行内删除：单条；工具栏批量删除：遍历所有勾选项
      const codes = (row && row.code) ? [row.code] : (this.codes || []);
      if (!codes.length) return;
      this.$modal.confirm('是否确认删除选项族"' + codes.join('、') + '"？').then(() => {
        return Promise.all(codes.map(code => delOptionFamily(code, '')));
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
    // CR-040：根据所属选项族派生期望主干（OF_ → OC_，追加尾部分隔下划线；非 OF_ 开头返回 null）
    deriveOptionCodeStem(familyCode) {
      if (familyCode && familyCode.indexOf('OF_') === 0 && familyCode.length > 3) {
        return 'OC_' + familyCode.substring(3) + '_';
      }
      return null;
    },
    handleCodeCodeBlur() {
      // CR-040 §2.2：不自动转大写或改写输入，仅触发校验提示
      if (this.$refs["codeForm"]) {
        this.$refs["codeForm"].validateField("code");
      }
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
