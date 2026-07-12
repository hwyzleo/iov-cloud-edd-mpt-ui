<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['ota:pota:softwareBuildVersion:edit']"
        >新增适配关系
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-check"
          size="mini"
          @click="handleSave"
          v-hasPermi="['ota:pota:softwareBuildVersion:edit']"
        >保存
        </el-button>
      </el-col>
    </el-row>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="总成零件号" prop="hardwareAssemblyPn" min-width="150">
        <template slot-scope="scope">
          <el-input v-model="scope.row.hardwareAssemblyPn" size="mini" placeholder="请输入总成零件号"/>
        </template>
      </el-table-column>
      <el-table-column label="硬件版本" prop="hardwareVer" width="150">
        <template slot-scope="scope">
          <el-input v-model="scope.row.hardwareVer" size="mini" placeholder="请输入硬件版本"/>
        </template>
      </el-table-column>
      <el-table-column label="适配级别" prop="adaptiveLevel" width="150" align="center">
        <template slot-scope="scope">
          <el-select v-model="scope.row.adaptiveLevel" size="mini" placeholder="请选择">
            <el-option label="版本及以下" :value="1"/>
            <el-option label="版本及以上" :value="2"/>
            <el-option label="与版本一致" :value="3"/>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" width="100">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.sort" size="mini" :min="0" controls-position="right" style="width: 80px"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleRemove(scope.$index)"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import {
  listAdaptation,
  saveAdaptation
} from "@/api/iov/ota/softwarebuildversion";

export default {
  name: "SoftwareBuildVersionAdaptation",
  dicts: [],
  data() {
    return {
      loading: true,
      list: [],
      softwareBuildVersionId: undefined
    };
  },
  created() {
    this.softwareBuildVersionId = this.$route.query.id;
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listAdaptation(this.softwareBuildVersionId).then(response => {
        this.list = response.data || [];
        this.loading = false;
      });
    },
    handleAdd() {
      this.list.push({
        hardwareAssemblyPn: undefined,
        hardwareVer: undefined,
        adaptiveLevel: 3,
        sort: this.list.length
      });
    },
    handleRemove(index) {
      this.list.splice(index, 1);
    },
    handleSave() {
      const validItems = this.list.filter(item => item.hardwareAssemblyPn);
      if (validItems.length === 0) {
        this.$modal.msgWarning("请至少添加一条适配关系");
        return;
      }
      saveAdaptation(this.softwareBuildVersionId, validItems).then(response => {
        this.$modal.msgSuccess("保存成功");
        this.getList();
      });
    }
  }
};
</script>
