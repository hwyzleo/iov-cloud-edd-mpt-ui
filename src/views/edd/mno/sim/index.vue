<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="ICCID" prop="iccid">
        <el-input
          v-model="queryParams.iccid"
          placeholder="请输入ICCID"
          clearable
          style="width: 140px"
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
          v-hasPermi="['edd:mno:sim:add']"
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
          v-hasPermi="['edd:mno:sim:edit']"
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
          v-hasPermi="['edd:mno:sim:remove']"
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
          v-hasPermi="['edd:mno:sim:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="ICCID" prop="iccid"/>
      <el-table-column label="IMSI" prop="imsi"/>
      <el-table-column label="手机号" prop="msisdn"/>
      <el-table-column label="短信能力" prop="smsAbility" width="100" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.smsAbility ? '启用' : '未启用' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数据能力" prop="dataAbility" width="100" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.dataAbility ? '启用' : '未启用' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="语音能力" prop="voiceAbility" width="100" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.voiceAbility ? '启用' : '未启用' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="运营商" prop="mnoCode" width="120" align="center"/>
      <el-table-column label="状态" prop="simState" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.simState===1">测试</span>
          <span v-if="scope.row.simState===2">库存</span>
          <span v-if="scope.row.simState===3">激活</span>
        </template>
      </el-table-column>
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
            v-hasPermi="['edd:mno:sim:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edd:mno:sim:remove']"
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

    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="ICCID" prop="iccid">
          <el-input v-model="form.iccid" :disabled="true" placeholder="请输入ICCID"/>
        </el-form-item>
        <el-form-item label="IMSI" prop="imsi">
          <el-input v-model="form.imsi" :disabled="true" placeholder="请输入IMSI"/>
        </el-form-item>
        <el-form-item label="手机号" prop="msisdn">
          <el-input v-model="form.msisdn" :disabled="true" placeholder="请输入手机号"/>
        </el-form-item>
        <el-form-item label="短信能力">
          <el-radio-group v-model="form.smsAbility" :disabled="true">
            <el-radio
              :label="true"
            >启用
            </el-radio>
            <el-radio
              :label="false"
            >未启用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数据能力">
          <el-radio-group v-model="form.dataAbility" :disabled="true">
            <el-radio
              :label="true"
            >启用
            </el-radio>
            <el-radio
              :label="false"
            >未启用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="语音能力">
          <el-radio-group v-model="form.voiceAbility" :disabled="true">
            <el-radio
              :label="true"
            >启用
            </el-radio>
            <el-radio
              :label="false"
            >未启用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="运营商" prop="mnoCode">
          <el-input v-model="form.mnoCode" :disabled="true" placeholder="请输入运营商"/>
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
import {addSim, delSim, getSim, listSim, updateSim} from "@/api/edd/mno/sim";

export default {
  name: "Sim",
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
        iccid: [
          {required: true, message: "ICCID不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      listSim(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.rows;
          this.total = response.total;
          this.loading = false;
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
        iccid: undefined
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
      this.title = "添加SIM卡";
      this.form = {};
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getSim(id).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改SIM卡";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateSim(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addSim(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除SIM卡ID为"' + ids + '"的数据项？').then(function () {
        return delSim(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('tsp-mno/mpt/sim/export', {
        ...this.queryParams
      }, `sim_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
