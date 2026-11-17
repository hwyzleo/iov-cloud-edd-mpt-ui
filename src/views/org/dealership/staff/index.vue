<template>
  <div class="app-container">
    <el-row :gutter="20">
      <splitpanes :horizontal="this.$store.getters.device === 'mobile'" class="default-theme">
        <!--组织架构数据-->
        <pane size="16">
          <el-col>
            <div class="head-container">
              <el-input v-model="orgKey" placeholder="请输入组织名称" clearable size="small" prefix-icon="el-icon-search" style="margin-bottom: 20px" />
            </div>
            <div class="head-container">
              <el-tree :data="orgOptions" :props="defaultProps" :expand-on-click-node="false" :filter-node-method="filterNode" ref="tree" node-key="id" default-expand-all highlight-current @node-click="handleNodeClick" />
            </div>
          </el-col>
        </pane>
        <!--门店员工数据-->
        <pane size="84">
          <el-col>
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
              <el-form-item label="工号" prop="employeeCode">
                <el-input v-model="queryParams.employeeCode" placeholder="请输入工号" clearable style="width: 150px" @keyup.enter.native="handleQuery" />
              </el-form-item>
              <el-form-item label="姓名" prop="employeeName">
                <el-input v-model="queryParams.employeeName" placeholder="请输入姓名" clearable style="width: 150px" @keyup.enter.native="handleQuery" />
              </el-form-item>
              <el-form-item label="手机号码" prop="phone">
                <el-input v-model="queryParams.phone" placeholder="请输入手机号码" clearable style="width: 140px" @keyup.enter.native="handleQuery" />
              </el-form-item>
              <el-form-item label="门店名称" prop="dealershipName">
                <el-input v-model="queryParams.dealershipName" placeholder="请输入门店名称" clearable style="width: 200px" @keyup.enter.native="handleQuery" />
              </el-form-item>
              <el-form-item label="创建时间">
                <el-date-picker v-model="dateRange" style="width: 240px" value-format="yyyy-MM-dd" type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-form>

            <el-row :gutter="10" class="mb8">
              <el-col :span="1.5">
                <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd" v-hasPermi="['org:dealership:staff:add']">新增</el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate" v-hasPermi="['org:dealership:staff:edit']">修改</el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete" v-hasPermi="['org:dealership:staff:remove']">删除</el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button type="info" plain icon="el-icon-upload2" size="mini" @click="handleImport" v-hasPermi="['org:dealership:staff:import']">导入</el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport" v-hasPermi="['org:dealership:staff:export']">导出</el-button>
              </el-col>
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
            </el-row>

            <el-table v-loading="loading" :data="dealershipStaffList" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="50" align="center" />
              <el-table-column label="工号" align="center" key="employeeCode" prop="employeeCode" v-if="columns[0].visible" />
              <el-table-column label="姓名" align="center" key="employeeName" prop="employeeName" v-if="columns[1].visible" :show-overflow-tooltip="true" />
              <el-table-column label="门店" align="center" key="dealershipName" prop="dealershipName" v-if="columns[2].visible" :show-overflow-tooltip="true" />
              <el-table-column label="手机号码" align="center" key="phone" prop="phone" v-if="columns[3].visible" width="120" />
              <el-table-column label="创建时间" align="center" key="createTime" prop="createTime" v-if="columns[4].visible" width="160" />
              <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
                <template slot-scope="scope">
                  <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['org:dealership:staff:edit']">修改</el-button>
                  <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['org:dealership:staff:remove']">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />
          </el-col>
        </pane>
      </splitpanes>
    </el-row>

    <!-- 添加或修改门店员工配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="所选员工" prop="employeeName">
              <el-autocomplete
                v-model="form.employeeName"
                style="width: 100%;"
                :fetch-suggestions="searchEmployee"
                placeholder="输入工号/姓名/手机号查询员工"
                @select="selectEmployee"
              ></el-autocomplete>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="所选门店" prop="dealershipName">
              <el-autocomplete
                v-model="form.dealershipName"
                style="width: 100%;"
                :fetch-suggestions="searchDealership"
                placeholder="请输入关键词查询门店"
                @select="selectDealership"
              ></el-autocomplete>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
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
import {
  listDealershipStaff,
  getDealershipStaff,
  delDealershipStaff,
  addDealershipStaff,
  updateDealershipStaff,
  orgTreeSelect,
  searchEmployeeList,
  searchDealershipList
} from "@/api/org/dealership/staff";
import { getToken } from "@/utils/auth";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";

export default {
  name: "DealershipStaff",
  dicts: [],
  components: { Treeselect, Splitpanes, Pane },
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
      // 门店员工表格数据
      dealershipStaffList: null,
      // 弹出层标题
      title: "",
      // 组织树选项
      orgOptions: undefined,
      // 是否显示弹出层
      open: false,
      // 组织关键词
      orgKey: undefined,
      // 日期范围
      dateRange: [],
      // 表单参数
      form: {},
      defaultProps: {
        children: "children",
        label: "label"
      },
      // 用户导入参数
      upload: {
        // 是否显示弹出层（用户导入）
        open: false,
        // 弹出层标题（用户导入）
        title: "",
        // 是否禁用上传
        isUploading: false,
        // 是否更新已经存在的用户数据
        updateSupport: 0,
        // 设置上传的请求头部
        headers: { Authorization: "Bearer " + getToken() },
        // 上传的地址
        url: process.env.VUE_APP_BASE_API + "/system/user/importData"
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        employeeCode: undefined,
        employeeName: undefined,
        phone: undefined,
        status: undefined,
        deptId: undefined
      },
      // 列信息
      columns: [
        { key: 0, label: `工号`, visible: true },
        { key: 1, label: `姓名`, visible: true },
        { key: 2, label: `门店`, visible: true },
        { key: 3, label: `手机号码`, visible: true },
        { key: 4, label: `创建时间`, visible: true }
      ],
      // 表单校验
      rules: {
        employeeName: [
          { required: true, message: "员工不能为空", trigger: "blur" }
        ],
        dealershipName: [
          { required: true, message: "门店不能为空", trigger: "blur" }
        ]
      }
    };
  },
  watch: {
    // 根据名称筛选部门树
    deptName(val) {
      this.$refs.tree.filter(val);
    }
  },
  created() {
    this.getList();
    this.getOrgTree();
  },
  methods: {
    /** 查询门店员工列表（响应为 ApiResponse<PageResult>：data.items / data.total） */
    getList() {
      this.loading = true;
      listDealershipStaff(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.dealershipStaffList = (response.data && response.data.items) || [];
          this.total = (response.data && response.data.total) || 0;
          this.loading = false;
        }
      ).catch(() => {
        this.dealershipStaffList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    /** 查询组织下拉树结构 */
    getOrgTree() {
      orgTreeSelect().then(response => {
        this.orgOptions = response.data;
      });
    },
    // 查询候选员工（EDD-ORG 员工主数据）
    searchEmployee(key, cb) {
      searchEmployeeList(key).then(response => {
        let options = [];
        for (var i = 0; i < response.data.length; i++) {
          options.push({
            value: response.data[i].label,
            label: response.data[i].id,
            type: response.data[i].type
          });
        }
        cb(options);
      });
    },
    // 选中员工
    selectEmployee(item) {
      this.form.employeeName = item.type
      this.form.employeeId = item.label
      this.$nextTick(() => {
        this.$refs.form.validateField('employeeName');
      });
    },
    // 查询门店
    searchDealership(key, cb) {
      searchDealershipList(key).then(response => {
        let options = [];
        for (var i = 0; i < response.data.length; i++) {
          options.push({
            value: response.data[i].label,
            label: response.data[i].id,
            type: response.data[i].type
          });
        }
        cb(options);
      });
    },
    // 选中门店
    selectDealership(item) {
      this.form.dealershipName = item.type
      this.form.dealershipCode = item.label
      this.$nextTick(() => {
        this.$refs.form.validateField('dealershipName');
      });
    },
    // 筛选节点
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    // 节点单击事件
    handleNodeClick(data) {
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        regionCode: undefined,
        areaCode: undefined
      };
      if(data.type === 'REGION') {
        this.queryParams.regionCode = data.id;
      }
      if(data.type === 'AREA') {
        this.queryParams.areaCode = data.id;
      }
      this.handleQuery();
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        employeeId: undefined,
        employeeName: undefined,
        dealershipCode: undefined,
        dealershipName: undefined
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
      this.queryParams.deptId = undefined;
      this.$refs.tree.setCurrentKey(null);
      this.handleQuery();
    },
    // 多选框选中数据（门店员工主键，用于修改/删除）
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length != 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加门店员工";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const dealershipStaffId = row.id || this.ids;
      getDealershipStaff(dealershipStaffId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改门店员工";
      });
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updateDealershipStaff(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDealershipStaff(this.form).then(response => {
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
      const dealershipStaffIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除编号为"' + dealershipStaffIds + '"的数据项？').then(function() {
        return delDealershipStaff(dealershipStaffIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/user/export', {
        ...this.queryParams
      }, `user_${new Date().getTime()}.xlsx`)
    },
    /** 导入按钮操作 */
    handleImport() {
      this.upload.title = "用户导入";
      this.upload.open = true;
    },
    /** 下载模板操作 */
    importTemplate() {
      this.download('system/user/importTemplate', {
      }, `user_template_${new Date().getTime()}.xlsx`)
    },
    // 文件上传中处理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true;
    },
    // 文件上传成功处理
    handleFileSuccess(response, file, fileList) {
      this.upload.open = false;
      this.upload.isUploading = false;
      this.$refs.upload.clearFiles();
      this.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
      this.getList();
    },
    // 提交上传文件
    submitFileForm() {
      this.$refs.upload.submit();
    }
  }
};
</script>
