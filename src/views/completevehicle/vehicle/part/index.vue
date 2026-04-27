<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="零件号" prop="pn">
        <el-input
          v-model="queryParams.pn"
          placeholder="请输入零件号"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="零件名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入零件名称"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="零件类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择零件类型" style="width: 100%" clearable>
          <el-option label="一般件" value="P01"/>
          <el-option label="标准件" value="P02"/>
          <el-option label="非标件（卡接类）" value="P0201"/>
          <el-option label="非标件（螺接类）" value="P0202"/>
          <el-option label="工艺合件" value="P03"/>
          <el-option label="软件" value="P04"/>
          <el-option label="辅料" value="P05"/>
          <el-option label="板料" value="P06"/>
          <el-option label="卷料" value="P07"/>
          <el-option label="售后专用件" value="P09"/>
          <el-option label="精品附件" value="P11"/>
          <el-option label="专用工具" value="P12"/>
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
          v-hasPermi="['completeVehicle:vehicle:part:add']"
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
          v-hasPermi="['completeVehicle:vehicle:part:edit']"
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
          v-hasPermi="['completeVehicle:vehicle:part:remove']"
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
          v-hasPermi="['completeVehicle:vehicle:part:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="零件号" prop="pn" width="150"/>
      <el-table-column label="零件名称" prop="name"/>
      <el-table-column label="零件英文名称" prop="nameEn"/>
      <el-table-column label="零件类型" prop="type" width="140" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.type==='P01'">一般件</span>
          <span v-if="scope.row.type==='P02'">标准件</span>
          <span v-if="scope.row.type==='P0201'">非标件（卡接类）</span>
          <span v-if="scope.row.type==='P0202'">非标件（螺接类）</span>
          <span v-if="scope.row.type==='P03'">工艺合件</span>
          <span v-if="scope.row.type==='P04'">软件</span>
          <span v-if="scope.row.type==='P05'">辅料</span>
          <span v-if="scope.row.type==='P06'">板料</span>
          <span v-if="scope.row.type==='P07'">卷料</span>
          <span v-if="scope.row.type==='P09'">售后专用件</span>
          <span v-if="scope.row.type==='P11'">精品附件</span>
          <span v-if="scope.row.type==='P12'">专用工具</span>
        </template>
      </el-table-column>
      <el-table-column label="零件分类" prop="ffa" width="100" align="center"/>
      <el-table-column label="设备代码" prop="deviceCode" width="100" align="center"/>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['completeVehicle:vehicle:part:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:vehicle:part:remove']"
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
    <el-dialog :title="title" :visible.sync="open" width="900px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="零件号" prop="pn">
              <el-input v-model="form.pn" :readonly="form.id !== undefined" placeholder="请输入零件号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="零件名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入零件名称"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="零件英文名称" prop="nameEn">
          <el-input v-model="form.nameEn" placeholder="请输入零件英文名称"/>
        </el-form-item>
        <el-row>
          <el-col :span="8">
            <el-form-item label="零件类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择零件类型" style="width: 100%" clearable>
                <el-option label="一般件" value="P01"/>
                <el-option label="标准件" value="P02"/>
                <el-option label="非标件（卡接类）" value="P0201"/>
                <el-option label="非标件（螺接类）" value="P0202"/>
                <el-option label="工艺合件" value="P03"/>
                <el-option label="软件" value="P04"/>
                <el-option label="辅料" value="P05"/>
                <el-option label="板料" value="P06"/>
                <el-option label="卷料" value="P07"/>
                <el-option label="售后专用件" value="P09"/>
                <el-option label="精品附件" value="P11"/>
                <el-option label="专用工具" value="P12"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="零件分类" prop="ffa">
              <el-input v-model="form.ffa" placeholder="请输入零件分类"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="零件状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择零件状态" style="width: 100%" clearable>
                <el-option label="量产" value="P"/>
                <el-option label="试生产" value="T"/>
                <el-option label="停用" value="D"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="设备" prop="deviceCode">
          <el-select
            v-model="form.deviceCode"
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
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"></el-input>
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
import {addPart, delPart, getPart, listPart, updatePart} from "@/api/completevehicle/vehicle/part";
import {listAllDevice} from "@/api/completevehicle/vehicle/device";

export default {
  name: "Part",
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
      // 表格数据
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
        pn: [
          {required: true, message: "零件号不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "零件名称不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getDeviceList();
    this.getList();
  },
  methods: {
    /** 查询零件信息列表 */
    getList() {
      this.loading = true;
      listPart(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    getDeviceList() {
      listAllDevice().then(response => {
          this.deviceList = response.data;
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
        pn: undefined,
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
      this.title = "添加零件信息";
      this.form = {};
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getPart(id).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改零件信息";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updatePart(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addPart(this.form).then(response => {
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
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除零件信息ID为"' + ids + '"的数据项？').then(function () {
        return delPart(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('tsp-vmd/mpt/part/export', {
        ...this.queryParams
      }, `part_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
