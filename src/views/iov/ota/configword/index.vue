<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
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
          v-hasPermi="['ota:dota:configWord:add']"
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
          v-hasPermi="['ota:dota:configWord:edit']"
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
          v-hasPermi="['ota:dota:configWord:remove']"
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
          v-hasPermi="['ota:dota:configWord:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="配置字代码" prop="code" />
      <el-table-column label="配置字名称" prop="name" />
      <el-table-column label="设备" prop="deviceCode" width="100" align="center"/>
      <el-table-column label="数据格式" prop="dataFormat" width="100" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.dataFormat === 'HEX'">HEX</span>
        </template>
      </el-table-column>
      <el-table-column label="数据长度" prop="byteLength" width="100" align="center"/>
      <el-table-column label="读写能力" prop="rwCapability" width="100" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.rwCapability === 'READ'">只读</span>
          <span v-if="scope.row.rwCapability === 'WRITE'">读写</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['ota:dota:configWord:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleProfile(scope.row)"
            v-hasPermi="['ota:dota:configWord:query']"
          >配置文件
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['ota:dota:configWord:remove']"
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

    <!-- 添加或修改升级任务对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="配置字代码" prop="code">
          <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入配置字代码"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="配置字名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入配置字名称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备" prop="deviceCode">
              <el-select
                v-model="form.deviceCode"
                placeholder="设备"
                style="width: 100%"
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
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="8">
            <el-form-item label="数据格式" prop="dataFormat">
              <el-select
                v-model="form.dataFormat"
                placeholder="数据格式"
                clearable
              >
                <el-option key="HEX" label="HEX" value="HEX"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数据长度" prop="byteLength">
              <el-input v-model="form.byteLength" placeholder="请输入数据长度"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="读写能力" prop="rwCapability">
              <el-select
                v-model="form.rwCapability"
                placeholder="读写能力"
                clearable
              >
                <el-option key="READ" label="只读" value="READ"/>
                <el-option key="WRITE" label="读写" value="WRITE"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
  addConfigWord,
  delConfigWord,
  getConfigWord,
  listConfigWord,
  updateConfigWord,
} from "@/api/iov/ota/configword";
import {
  listAllVehicleNode
} from "@/api/mdm/vehicleNode";

export default {
  name: "ConfigWord",
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
        code: [
          {required: true, message: "配置字代码不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "配置字名称不能为空", trigger: "blur"}
        ],
        deviceCode: [
          {required: true, message: "设备不能为空", trigger: "blur"}
        ],
        dataFormat: [
          {required: true, message: "数据格式不能为空", trigger: "blur"}
        ],
        rwCapability: [
          {required: true, message: "读写能力不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getAllDeviceList();
    this.getList();
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      listConfigWord(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
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
      this.title = "添加配置字";
      this.form = {};
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getConfigWord(id).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改配置字";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateConfigWord(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addConfigWord(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除配置字ID为"' + ids + '"的数据项？').then(function () {
        return delConfigWord(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('ota-dota/mpt/configWord/export', {
        ...this.queryParams
      }, `config_word_${new Date().getTime()}.xlsx`)
    },
    handleProfile(row) {
      this.$router.push({
        path: "/iov/ota/configWordProfile",
        query: { code: row.code }
      });
    },
  }
};
</script>
