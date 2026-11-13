<template>
  <div>
    <div class="user-info-head" @click="editCropper()"><img v-bind:src="options.img" title="点击上传头像" class="img-circle img-lg" /></div>
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body @opened="modalOpened"  @close="closeDialog">
      <el-row>
        <el-col :xs="24" :md="12" :style="{height: '350px'}">
          <vue-cropper
            ref="cropper"
            :img="options.img"
            :info="true"
            :autoCrop="options.autoCrop"
            :autoCropWidth="options.autoCropWidth"
            :autoCropHeight="options.autoCropHeight"
            :fixedBox="options.fixedBox"
            :outputType="options.outputType"
            @realTime="realTime"
            v-if="visible"
          />
        </el-col>
        <el-col :xs="24" :md="12" :style="{height: '350px'}">
          <div class="avatar-upload-preview">
            <img :src="previews.url" :style="previews.img" />
          </div>
        </el-col>
      </el-row>
      <br />
      <el-row>
        <el-col :lg="2" :sm="3" :xs="3">
          <el-upload action="#" :http-request="requestUpload" :show-file-list="false" :before-upload="beforeUpload">
            <el-button size="small">
              选择
              <i class="el-icon-upload el-icon--right"></i>
            </el-button>
          </el-upload>
        </el-col>
        <el-col :lg="{span: 1, offset: 2}" :sm="2" :xs="2">
          <el-button icon="el-icon-plus" size="small" @click="changeScale(1)"></el-button>
        </el-col>
        <el-col :lg="{span: 1, offset: 1}" :sm="2" :xs="2">
          <el-button icon="el-icon-minus" size="small" @click="changeScale(-1)"></el-button>
        </el-col>
        <el-col :lg="{span: 1, offset: 1}" :sm="2" :xs="2">
          <el-button icon="el-icon-refresh-left" size="small" @click="rotateLeft()"></el-button>
        </el-col>
        <el-col :lg="{span: 1, offset: 1}" :sm="2" :xs="2">
          <el-button icon="el-icon-refresh-right" size="small" @click="rotateRight()"></el-button>
        </el-col>
        <el-col :lg="{span: 2, offset: 6}" :sm="2" :xs="2">
          <el-button type="primary" size="small" :loading="uploading" :disabled="uploading" @click="uploadImg()">提 交</el-button>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script>
import store from "@/store";
import { VueCropper } from "vue-cropper";
import { createAvatarUploadTicket, completeAvatarUpload } from "@/api/system/user";
import { debounce } from '@/utils'
import {
  AVATAR_FILENAME,
  AVATAR_CONTENT_TYPE,
  UPLOAD_STAGE,
  putAvatarToCos,
  stageFailureMessage,
  validateAvatarFile
} from './avatarUpload'

export default {
  components: { VueCropper },
  data() {
    return {
      // 是否显示弹出层
      open: false,
      // 是否显示cropper
      visible: false,
      // 弹出层标题
      title: "修改头像",
      options: {
        img: store.getters.avatar,  //裁剪图片的地址
        autoCrop: true,             // 是否默认生成截图框
        autoCropWidth: 200,         // 默认生成截图框宽度
        autoCropHeight: 200,        // 默认生成截图框高度
        fixedBox: true,             // 固定截图框大小 不允许改变
        outputType:"png",           // 默认生成截图为PNG格式
        filename: AVATAR_FILENAME    // 上传文件名与 PNG 输出保持一致
      },
      previews: {},
      resizeHandler: null,
      // 上传中标志：禁止重复提交，保存动作等待上传完成（US-004）
      uploading: false
    };
  },
  methods: {
    // 编辑头像
    editCropper() {
      this.open = true;
    },
    // 打开弹出层结束时的回调
    modalOpened() {
      this.visible = true;
      if (!this.resizeHandler) {
        this.resizeHandler = debounce(() => {
          this.refresh()
        }, 100)
      }
      window.addEventListener("resize", this.resizeHandler)
    },
    // 刷新组件
    refresh() {
      this.$refs.cropper.refresh();
    },
    // 覆盖默认的上传行为
    requestUpload() {
    },
    // 向左旋转
    rotateLeft() {
      this.$refs.cropper.rotateLeft();
    },
    // 向右旋转
    rotateRight() {
      this.$refs.cropper.rotateRight();
    },
    // 图片缩放
    changeScale(num) {
      num = num || 1;
      this.$refs.cropper.changeScale(num);
    },
    // 上传预处理：image/* 且不超过 10 MiB
    beforeUpload(file) {
      const check = validateAvatarFile(file);
      if (!check.ok) {
        this.$modal.msgError(check.message);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.options.img = reader.result;
        this.options.filename = AVATAR_FILENAME;
      };
    },
    // 上传头像：申请凭证 → 浏览器直传 COS → 完成确认（EDD-MPT-DSN-CR-001 §4.3）
    uploadImg() {
      if (this.uploading) return;
      this.$refs.cropper.getCropBlob(blob => {
        if (!blob || !blob.size) {
          this.$modal.msgError('裁剪结果为空，请重新选择图片');
          return;
        }
        this.uploading = true;
        let stage = UPLOAD_STAGE.TICKET;
        createAvatarUploadTicket({
          originalFilename: AVATAR_FILENAME,
          contentType: AVATAR_CONTENT_TYPE,
          size: blob.size
        }).then(response => {
          const ticket = response.data || {};
          // 直传不经过平台 axios 拦截器，失败必须在下方显式提示
          stage = UPLOAD_STAGE.COS;
          return putAvatarToCos(ticket.uploadUrl, blob, ticket.contentType || AVATAR_CONTENT_TYPE)
            .then(() => {
              stage = UPLOAD_STAGE.COMPLETE;
              return completeAvatarUpload(ticket.objectId, { uploadToken: ticket.uploadToken });
            });
        }).then(response => {
          const data = response.data || {};
          this.uploading = false;
          this.open = false;
          this.visible = false;
          this.options.img = data.imgUrl;
          store.commit('SET_AVATAR', data.imgUrl);
          this.$modal.msgSuccess("修改成功");
        }).catch(error => {
          // 任一阶段失败：保留原头像、保持弹窗打开，允许直接重试
          this.uploading = false;
          const failure = stageFailureMessage(stage, error);
          if (!failure.alreadyNotified) {
            this.$modal.msgError(failure.message);
          }
        });
      });
    },
    // 实时预览
    realTime(data) {
      this.previews = data;
    },
    // 关闭窗口
    closeDialog() {
      this.options.img = store.getters.avatar
      this.visible = false;
      window.removeEventListener("resize", this.resizeHandler)
    }
  }
};
</script>
<style scoped lang="scss">
.user-info-head {
  position: relative;
  display: inline-block;
  height: 120px;
}

.user-info-head:hover:after {
  content: '+';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  color: #eee;
  background: rgba(0, 0, 0, 0.5);
  font-size: 24px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  cursor: pointer;
  line-height: 110px;
  border-radius: 50%;
}
</style>
