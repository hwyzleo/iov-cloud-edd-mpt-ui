<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="仓库代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入仓库代码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="仓库名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入仓库名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="仓库体系层级" prop="warehouseLevel">
        <el-select
          v-model="queryParams.warehouseLevel"
          placeholder="仓库体系层级"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="dict in dict.type.iov_warehouse_level"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
          v-hasPermi="['completeVehicle:warehouse:info:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['completeVehicle:warehouse:info:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['completeVehicle:warehouse:info:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['completeVehicle:warehouse:info:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="仓库代码" prop="code" width="100"/>
      <el-table-column label="仓库名称" prop="name" width="150"/>
      <el-table-column label="仓库管理员" prop="manager" width="100"/>
      <el-table-column label="仓库类型" prop="warehouseLevel" align="center" width="100">
        <template slot-scope="scope">
          <span>{{ getWarehouseLevelLabel(scope.row.warehouseLevel) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="所在省" prop="provinceCode" width="100"/>
      <el-table-column label="所在市" prop="cityCode" width="100"/>
      <el-table-column label="所在区" prop="countyCode" width="100"/>
      <el-table-column label="仓库地址" prop="address" width="300"/>
      <el-table-column label="是否启用" align="center" width="100">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.enable"
            :active-value="true"
            :inactive-value="false"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" align="center" width="60"/>
      <el-table-column label="操作" align="center" width="200" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:info:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleStorageAreaList(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:info:edit']"
          >储区管理
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:info:remove']"
          >删除
          </el-button>
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

    <!-- 添加或修改仓库配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="760px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仓库代码" prop="code">
              <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入仓库代码"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入仓库名称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库体系层级" prop="warehouseLevel">
              <el-select
                v-model="form.warehouseLevel"
                placeholder="请选择仓库体系层级"
                style="width: 100%"
              >
                <el-option
                  v-for="dict in dict.type.iov_warehouse_level"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库管理员" prop="manager">
              <el-input v-model="form.manager" placeholder="请输入仓库管理员"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所在省" prop="provinceCode">
              <el-input v-model="form.provinceCode" placeholder="请输入所在省"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所在市" prop="cityCode">
              <el-input v-model="form.cityCode" placeholder="请输入所在市"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所在区" prop="countyCode">
              <el-input v-model="form.countyCode" placeholder="请输入所在区"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮编" prop="zipcode">
              <el-input v-model="form.zipcode" placeholder="请输入邮编"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话" prop="tel">
              <el-input v-model="form.tel" placeholder="请输入电话"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机" prop="mobile">
              <el-input v-model="form.mobile" placeholder="请输入手机"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="传真" prop="fax">
              <el-input v-model="form.fax" placeholder="请输入传真"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" controls-position="right" :min="0" style="width: 100%"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.enable">
                <el-radio :label="true">启用</el-radio>
                <el-radio :label="false">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="仓库地址" prop="address">
              <el-input v-model="form.address" placeholder="请输入仓库地址"/>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入内容"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 储区管理列表对话框 -->
    <el-dialog :title="title" :visible.sync="openStorageAreaList" width="800px" append-to-body>
      <el-table v-loading="loading" :data="storageAreaList">
        <el-table-column label="储区代码" prop="code" width="150"/>
        <el-table-column label="储区名称" prop="name"/>
        <el-table-column label="储区管理员" prop="manager" width="100"/>
        <el-table-column label="是否启用" align="center" width="100">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.enable"
              :active-value="true"
              :inactive-value="false"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sort" align="center" width="60"/>
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdateStorageArea(scope.row)"
              v-hasPermi="['completeVehicle:warehouse:info:edit']"
            >修改
            </el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleStorageLocationList(scope.row)"
              v-hasPermi="['completeVehicle:warehouse:info:edit']"
            >储位管理
            </el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDeleteStorageArea(form.id, scope.row)"
              v-hasPermi="['completeVehicle:warehouse:info:remove']"
            >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleAddStorageArea">新 增</el-button>
        <el-button @click="cancelStorageAreaList">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 添加或修改仓库储区配置对话框 -->
    <el-dialog :title="title2" :visible.sync="openStorageArea" width="500px" append-to-body>
      <el-form ref="formStorageArea" :model="formStorageArea" :rules="rulesStorageArea" label-width="100px">
        <el-form-item label="储区代码" prop="code">
          <el-input v-model="formStorageArea.code" :readonly="formStorageArea.id !== undefined"
                    placeholder="请输入储区代码"/>
        </el-form-item>
        <el-form-item label="储区名称" prop="name">
          <el-input v-model="formStorageArea.name" placeholder="请输入储区名称"/>
        </el-form-item>
        <el-form-item label="储区管理员" prop="manager">
          <el-input v-model="formStorageArea.manager" placeholder="请输入储区管理员"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formStorageArea.enable">
            <el-radio
              :label="true"
            >启用
            </el-radio>
            <el-radio
              :label="false"
            >停用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formStorageArea.sort" controls-position="right" :min="0"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formStorageArea.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFormStorageArea">确 定</el-button>
        <el-button @click="cancelStorageArea">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 储位管理列表对话框 -->
    <el-dialog :title="title2" :visible.sync="openStorageLocationList" width="800px" append-to-body>
      <el-table v-loading="loading" :data="storageLocationList">
        <el-table-column label="储位代码" prop="code" width="180"/>
        <el-table-column label="储位名称" prop="name"/>
        <el-table-column label="储位管理员" prop="manager" width="100"/>
        <el-table-column label="是否启用" align="center" width="100">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.enable"
              :active-value="true"
              :inactive-value="false"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sort" align="center" width="60"/>
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdateStorageLocation(scope.row)"
              v-hasPermi="['completeVehicle:warehouse:info:edit']"
            >修改
            </el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDeleteStorageLocation(form.id, formStorageArea.id, scope.row)"
              v-hasPermi="['completeVehicle:warehouse:info:remove']"
            >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleAddStorageLocation">新 增</el-button>
        <el-button @click="cancelStorageLocationList">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 添加或修改仓库储位配置对话框 -->
    <el-dialog :title="title3" :visible.sync="openStorageLocation" width="500px" append-to-body>
      <el-form ref="formStorageLocation" :model="formStorageLocation" :rules="formStorageLocation" label-width="100px">
        <el-form-item label="储位代码" prop="code">
          <el-input v-model="formStorageLocation.code" :readonly="formStorageLocation.id !== undefined"
                    placeholder="请输入储位代码"/>
        </el-form-item>
        <el-form-item label="储位名称" prop="name">
          <el-input v-model="formStorageLocation.name" placeholder="请输入储位名称"/>
        </el-form-item>
        <el-form-item label="储位管理员" prop="manager">
          <el-input v-model="formStorageLocation.manager" placeholder="请输入储位管理员"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formStorageLocation.enable">
            <el-radio
              :label="true"
            >启用
            </el-radio>
            <el-radio
              :label="false"
            >停用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formStorageLocation.sort" controls-position="right" :min="0"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formStorageLocation.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFormStorageLocation">确 定</el-button>
        <el-button @click="cancelStorageLocation">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  addWarehouse,
  addWarehouseStorageArea,
  addWarehouseStorageAreaStorageLocation,
  delWarehouse,
  delWarehouseStorageArea,
  delWarehouseStorageAreaStorageLocation,
  getWarehouse,
  listWarehouse,
  listWarehouseStorageArea,
  listWarehouseStorageAreaStorageLocation,
  updateWarehouse,
  updateWarehouseStorageArea,
  updateWarehouseStorageAreaStorageLocation,
} from "@/api/completevehicle/warehouse/info";

export default {
  name: "Warehouse",
  dicts: ['iov_warehouse_level'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 遮罩层库区
      loadingStorageArea: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 仓库表格数据
      warehouseList: [],
      // 储区表格数据
      storageAreaList: [],
      // 储位表格数据
      storageLocationList: [],
      // 弹出层标题
      title: "",
      title2: "",
      title3: "",
      // 是否显示弹出层
      open: false,
      // 是否显示储区列表
      openStorageAreaList: false,
      // 是否显示储区弹出层
      openStorageArea: false,
      // 是否显示储位列表
      openStorageLocationList: false,
      // 是否显示储位
      openStorageLocation: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      formStorageArea: {},
      formStorageLocation: {},
      // 表单校验
      rules: {
        code: [
          {required: true, message: "仓库代码不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "仓库名称不能为空", trigger: "blur"}
        ],
        warehouseLevel: [
          {required: true, message: "仓库体系层级不能为空", trigger: "change"}
        ]
      },
      rulesStorageArea: {
        code: [
          {required: true, message: "储区代码不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "储区名称不能为空", trigger: "blur"}
        ]
      },
      rulesStorageLocation: {
        code: [
          {required: true, message: "储位代码不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "储位名称不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询仓库列表 */
    getList() {
      this.loading = true;
      listWarehouse(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.warehouseList = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    // 获取仓库系统层级
    getWarehouseLevelLabel(warehouseLevel) {
      if (!this.dict || !this.dict.type || !this.dict.type.iov_warehouse_level) {
        return warehouseLevel;
      }
      const item = this.dict.type.iov_warehouse_level.find(
        dict => dict.value === warehouseLevel
      )
      return item ? item.label : warehouseLevel
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 取消按钮 */
    cancelStorageAreaList() {
      this.openStorageAreaList = false;
    },
    /** 取消按钮 */
    cancelStorageLocationList() {
      this.openStorageLocationList = false;
    },
    /** 取消按钮 */
    cancelStorageArea() {
      this.openStorageArea = false;
    },
    /** 取消按钮 */
    cancelStorageLocation() {
      this.openStorageLocation = false;
    },
    /** 表单重置 */
    reset() {
      this.form = {
        code: undefined,
        name: undefined,
        manager: undefined,
        enable: true,
        sort: 99
      };
      this.resetForm("form");
    },
    /** 储区表单重置 */
    resetStorageArea() {
      this.formStorageArea = {
        code: undefined,
        warehouseCode: undefined,
        name: undefined,
        manager: undefined,
        enable: true,
        sort: 99
      };
      this.resetForm("formStorageArea");
    },
    /** 储位表单重置 */
    resetStorageLocation() {
      this.formStorageLocation = {
        code: undefined,
        warehouseCode: undefined,
        storageAreaCode: undefined,
        name: undefined,
        manager: undefined,
        enable: true,
        sort: 99
      };
      this.resetForm("formStorageLocation");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加仓库";
      this.form = {
        enable: true,
        sort: 0
      };
    },
    /** 新增储区按钮操作 */
    handleAddStorageArea() {
      this.resetStorageArea();
      this.openStorageArea = true;
      this.title2 = "添加仓库储区";
      this.formStorageArea = {
        warehouseCode: this.form.warehouseCode,
        enable: true,
        sort: 0
      };
    },
    /** 新增储位按钮操作 */
    handleAddStorageLocation() {
      this.resetStorageLocation();
      this.openStorageLocation = true;
      this.title3 = "添加仓库储位";
      this.formStorageLocation = {
        warehouseCode: this.form.warehouseCode,
        storageAreaCode: this.formStorageArea.code,
        enable: true,
        sort: 0
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const warehouseId = row.id || this.ids
      getWarehouse(warehouseId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改仓库";
    },
    /** 修改按钮操作 */
    handleUpdateStorageArea(row) {
      this.resetStorageArea();
      this.formStorageArea = row;
      this.openStorageArea = true;
      this.title = "修改仓库储区";
    },
    /** 修改按钮操作 */
    handleUpdateStorageLocation(row) {
      this.resetStorageLocation();
      this.formStorageLocation = row;
      this.openStorageLocation = true;
      this.title = "修改仓库储位";
    },
    /** 储区管理按钮操作 */
    handleStorageAreaList(row) {
      this.form = {
        id: row.id,
        warehouseCode: row.code
      }
      listWarehouseStorageArea(row.id).then(response => {
        this.storageAreaList = response;
        this.openStorageAreaList = true;
      });
      this.title = "储区管理";
    },
    /** 储位管理按钮操作 */
    handleStorageLocationList(row) {
      this.formStorageArea = {
        id: row.id,
        warehouseCode: row.warehouseCode,
        code: row.code
      }
      listWarehouseStorageAreaStorageLocation(this.form.id, row.id).then(response => {
        this.storageLocationList = response;
        this.openStorageLocationList = true;
      });
      this.title2 = "储位管理";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateWarehouse(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addWarehouse(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 储区提交按钮 */
    submitFormStorageArea: function () {
      this.$refs["formStorageArea"].validate(valid => {
        if (valid) {
          if (this.formStorageArea.id !== undefined) {
            updateWarehouseStorageArea(this.form.id, this.formStorageArea).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.openStorageArea = false;
              listWarehouseStorageArea(this.form.id).then(response => {
                this.storageAreaList = response;
              });
            });
          } else {
            addWarehouseStorageArea(this.form.id, this.formStorageArea).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.openStorageArea = false;
              listWarehouseStorageArea(this.form.id).then(response => {
                this.storageAreaList = response;
              });
            });
          }
        }
      });
    },
    /** 储位提交按钮 */
    submitFormStorageLocation: function () {
      this.$refs["formStorageLocation"].validate(valid => {
        if (valid) {
          if (this.formStorageLocation.id !== undefined) {
            updateWarehouseStorageAreaStorageLocation(this.form.id, this.formStorageArea.id, this.formStorageLocation).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.openStorageLocation = false;
              listWarehouseStorageAreaStorageLocation(this.form.id, this.formStorageArea.id).then(response => {
                this.storageLocationList = response;
              });
            });
          } else {
            addWarehouseStorageAreaStorageLocation(this.form.id, this.formStorageArea.id, this.formStorageLocation).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.openStorageLocation = false;
              listWarehouseStorageAreaStorageLocation(this.form.id, this.formStorageArea.id).then(response => {
                this.storageLocationList = response;
              });
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const warehouseIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除仓库ID为"' + warehouseIds + '"的数据项？').then(function () {
        return delWarehouse(warehouseIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 删除按钮操作 */
    handleDeleteStorageArea(warehouseId, row) {
      this.$modal.confirm('是否确认删除仓库储区ID为"' + row.id + '"的数据项？').then(function () {
        return delWarehouseStorageArea(warehouseId, row.id);
      }).then(() => {
        listWarehouseStorageArea(warehouseId).then(response => {
          this.storageAreaList = response;
        });
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 删除按钮操作 */
    handleDeleteStorageLocation(warehouseId, storageAreaId, row) {
      this.$modal.confirm('是否确认删除仓库储位ID为"' + row.id + '"的数据项？').then(function () {
        return delWarehouseStorageAreaStorageLocation(warehouseId, storageAreaId, row.id);
      }).then(() => {
        listWarehouseStorageAreaStorageLocation(warehouseId, storageAreaId).then(response => {
          this.storageLocationList = response;
        });
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('otd-wms/mpt/warehouse/export', {
        ...this.queryParams
      }, `warehouse_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
