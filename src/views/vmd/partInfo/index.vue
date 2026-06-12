<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="零件编码" prop="partCode">
        <el-input
          v-model="queryParams.partCode"
          placeholder="请输入零件编码"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="序列号" prop="sn">
        <el-input
          v-model="queryParams.sn"
          placeholder="请输入序列号"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="车辆节点编码" prop="vehicleNodeCode">
        <el-input
          v-model="queryParams.vehicleNodeCode"
          placeholder="请输入车辆节点编码"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="实例状态" prop="instanceState">
        <el-select v-model="queryParams.instanceState" placeholder="请选择实例状态" clearable style="width: 200px">
          <el-option label="正常" :value="0" />
          <el-option label="禁用" :value="1" />
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

    <!-- 操作按钮区域 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['vmd:partInfo:add']"
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
          v-hasPermi="['vmd:partInfo:edit']"
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
          v-hasPermi="['vmd:partInfo:remove']"
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
          v-hasPermi="['vmd:partInfo:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="partInfoList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="零件编码" prop="partCode" width="120" />
      <el-table-column label="零件名称" prop="partName" />
      <el-table-column label="序列号" prop="sn" />
      <el-table-column label="供应商编码" prop="supplierCode" width="120" />
      <el-table-column label="批次号" prop="batchNum" width="130" />
      <el-table-column label="硬件版本" prop="hardwareVer" width="80" />
      <el-table-column label="软件版本" prop="softwareVer" width="80" />
      <el-table-column label="零件状态" prop="instanceState" width="80" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.instanceState === 0">正常</span>
          <span v-if="scope.row.instanceState === 1">禁用</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="140" align="center">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['vmd:partInfo:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['vmd:partInfo:remove']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="零件编码" prop="partCode">
              <el-input v-model="form.partCode" placeholder="请输入零件编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="序列号" prop="sn">
              <el-input v-model="form.sn" placeholder="请输入序列号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="车辆节点编码" prop="vehicleNodeCode">
              <el-input v-model="form.vehicleNodeCode" placeholder="请输入车辆节点编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置字" prop="configWord">
              <el-input v-model="form.configWord" placeholder="请输入配置字" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="供应商编码" prop="supplierCode">
              <el-input v-model="form.supplierCode" placeholder="请输入供应商编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批次号" prop="batchNum">
              <el-input v-model="form.batchNum" placeholder="请输入批次号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="硬件版本" prop="hardwareVer">
              <el-input v-model="form.hardwareVer" placeholder="请输入硬件版本" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="软件版本" prop="softwareVer">
              <el-input v-model="form.softwareVer" placeholder="请输入软件版本" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="硬件料号" prop="hardwarePn">
              <el-input v-model="form.hardwarePn" placeholder="请输入硬件料号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="软件料号" prop="softwarePn">
              <el-input v-model="form.softwarePn" placeholder="请输入软件料号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="扩展信息" prop="extra">
              <el-input v-model="form.extra" type="textarea" placeholder="请输入扩展信息" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="实例状态" prop="instanceState">
              <el-radio-group v-model="form.instanceState">
                <el-radio :label="0">正常</el-radio>
                <el-radio :label="1">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPartInfo, getPartInfo, addPartInfo, updatePartInfo, delPartInfo } from "@/api/vmd/partInfo";

export default {
  name: "PartInfo",
  data() {
    return {
      // 遮罩层
      loading: true,
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
      // 零件表格数据
      partInfoList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        partCode: undefined,
        sn: undefined,
        vehicleNodeCode: undefined,
        instanceState: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        partCode: [
          { required: true, message: "零件编码不能为空", trigger: "blur" }
        ],
        sn: [
          { required: true, message: "序列号不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询零件列表 */
    getList() {
      this.loading = true;
      listPartInfo(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.partInfoList = response.data.items;
        this.total = response.data.total;
        this.loading = false;
      });
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        id: undefined,
        partCode: undefined,
        sn: undefined,
        vehicleNodeCode: undefined,
        configWord: undefined,
        supplierCode: undefined,
        batchNum: undefined,
        hardwareVer: undefined,
        softwareVer: undefined,
        hardwarePn: undefined,
        softwarePn: undefined,
        extra: undefined,
        instanceState: 0
      };
      this.resetForm("form");
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
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加零件";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const partInfoId = row.id || this.ids;
      getPartInfo(partInfoId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改零件";
      });
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updatePartInfo(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addPartInfo(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const partInfoIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除零件ID为"' + partInfoIds + '"的数据项？').then(function() {
        return delPartInfo(partInfoIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('vmd/mpt/partInfo/export', {
        ...this.queryParams
      }, `partInfo_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>
