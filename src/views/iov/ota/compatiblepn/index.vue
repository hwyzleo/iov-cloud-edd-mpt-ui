<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="分类" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="分类"
          clearable
          style="width: 140px"
        >
        </el-select>
      </el-form-item>
      <el-form-item label="设备" prop="deviceCode">
        <el-select
          v-model="queryParams.deviceCode"
          placeholder="设备"
          clearable
          style="width: 250px"
        >
          <el-option
            v-for="device in this.deviceList"
            :key="device.code"
            :label="device.code + '(' + device.label + ')'"
            :value="device.code"
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
          v-hasPermi="['ota:baseline:compatiblePn:add']"
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
          v-hasPermi="['ota:baseline:compatiblePn:edit']"
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
          v-hasPermi="['ota:baseline:compatiblePn:remove']"
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
          v-hasPermi="['ota:baseline:compatiblePn:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="设备" prop="deviceCode" width="200"/>
      <el-table-column label="分类" prop="type" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.type === 1 ? '软件零件号' : '硬件零件号' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="零件号" prop="pn" width="150"/>
      <el-table-column label="兼容零件号" prop="compatiblePn">
      </el-table-column>
      <el-table-column label="描述" prop="description" width="150"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
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
            v-hasPermi="['ota:baseline:compatiblePn:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['ota:baseline:compatiblePn:remove']"
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

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="设备" prop="deviceCode">
          <el-select
            v-model="form.deviceCode"
            placeholder="设备"
            style="width: 250px"
            clearable
          >
            <el-option
              v-for="device in this.deviceList"
              :key="device.code"
              :label="device.code + '(' + device.label + ')'"
              :value="device.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类" prop="type">
          <el-select
            v-model="form.type"
            placeholder="分类"
            clearable
          >
            <el-option label="软件零件号" :value="1" />
            <el-option label="硬件零件号" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="零件号" prop="pn">
          <el-input v-model="form.pn" placeholder="请输入零件号"/>
        </el-form-item>
        <el-form-item label="兼容零件号" prop="pn">
          <el-input v-model="form.compatiblePn" placeholder="请输入兼容零件号"/>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述内容"></el-input>
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
  addCompatiblePn,
  delCompatiblePn,
  getCompatiblePn,
  listCompatiblePn,
  updateCompatiblePn,
} from "@/api/iov/ota/compatiblepn";
import {
  listAllVehicleNode
} from "@/api/mdm/vehicleNode";

export default {
  name: "CompatiblePn",
  dicts: [],
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
      list: [],
      deviceList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        deviceCode: [
          {required: true, message: "设备不能为空", trigger: "blur"}
        ],
        type: [
          {required: true, message: "分类不能为空", trigger: "blur"}
        ],
        pn: [
          {required: true, message: "零件号不能为空", trigger: "blur"}
        ],
        compatiblePn: [
          {required: true, message: "兼容零件号不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getAllDeviceList();
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listCompatiblePn(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    getAllDeviceList() {
      listAllVehicleNode().then(response => {
          this.deviceList = response.data.map(item => ({ code: item.nodeCode, label: item.name }));
        }
      );
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        name: undefined
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
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加兼容零件号";
      this.form = {};
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const compatiblePnId = row.id || this.ids
      getCompatiblePn(compatiblePnId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改兼容零件号";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateCompatiblePn(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addCompatiblePn(this.form).then(response => {
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
      const compatiblePnIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除兼容零件号ID为"' + compatiblePnIds + '"的数据项？').then(function () {
        return delCompatiblePn(compatiblePnIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('ota-baseline/compatiblePn/export', {
        ...this.queryParams
      }, `compatible_pn_${new Date().getTime()}.xlsx`)
    },
  }
};
</script>
